import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const encodeBase64Url = (value: string | Uint8Array) => {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const privateKeyToCryptoKey = async (privateKey: string) => {
  const pem = privateKey.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  const body = pem.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/)?.[1];
  if (!body) throw new Error('Invalid Google service account private key');
  const base64 = body.replace(/[^A-Za-z0-9+/=]/g, '');
  const binary = atob(base64);
  const keyData = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
};

const getGoogleAccessToken = async (clientEmail: string, privateKey: string) => {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = encodeBase64Url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const key = await privateKeyToCryptoKey(privateKey);
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsignedToken)),
  );
  const assertion = `${unsignedToken}.${encodeBase64Url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google authentication failed: ${await response.text()}`);
  const { access_token } = await response.json();
  return access_token as string;
};

const safeFolderName = (value: string) => value.replace(/[\\/:*?"<>|]/g, '-').trim();

const createDriveFolder = async (accessToken: string, name: string, parentId?: string) => {
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });

  if (!response.ok) throw new Error(`Could not create Google Drive folder: ${await response.text()}`);
  return (await response.json()).id as string;
};

const uploadDriveFile = async (accessToken: string, folderId: string, name: string, file: Blob) => {
  const boundary = `drive-upload-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name, parents: [folderId] });
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) throw new Error(`Could not upload photo to Google Drive: ${await response.text()}`);
  return (await response.json()).id as string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleClientEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    const parentFolderId = Deno.env.get('GOOGLE_DRIVE_PARENT_FOLDER_ID');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!supabaseUrl || !serviceRoleKey || !googleClientEmail || !googlePrivateKey) {
      return json({ error: 'Google Drive integration is not configured' }, 500);
    }
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

    const { inspectionId } = await request.json();
    if (!inspectionId) return json({ error: 'inspectionId is required' }, 400);

    const { data: inspection, error: inspectionError } = await admin
      .from('inspections')
      .select('id, asset_number, os_number')
      .eq('id', inspectionId)
      .eq('profile_id', authData.user.id)
      .single();
    if (inspectionError || !inspection) return json({ error: 'Inspection not found' }, 404);

    const { data: photos, error: photosError } = await admin
      .from('inspection_photos')
      .select('id, file_path, file_name, google_drive_file_id, google_drive_folder_id')
      .eq('inspection_id', inspectionId);
    if (photosError) throw photosError;

    const accessToken = await getGoogleAccessToken(googleClientEmail, googlePrivateKey);
    const existingFolderId = photos?.find((photo) => photo.google_drive_folder_id)?.google_drive_folder_id;
    const folderName = `Ativo ${safeFolderName(inspection.asset_number)} - OS ${safeFolderName(inspection.os_number)}`;
    const folderId = existingFolderId || await createDriveFolder(accessToken, folderName, parentFolderId);
    let uploadedFiles = 0;

    for (const photo of photos || []) {
      if (photo.google_drive_file_id) continue;

      const { data: file, error: downloadError } = await admin.storage
        .from('inspection-photos')
        .download(photo.file_path);
      if (downloadError || !file) throw downloadError || new Error('Photo download failed');

      const driveFileId = await uploadDriveFile(accessToken, folderId, photo.file_name, file);
      const { error: updateError } = await admin
        .from('inspection_photos')
        .update({
          processed_at: new Date().toISOString(),
          google_drive_file_id: driveFileId,
          google_drive_folder_id: folderId,
        })
        .eq('id', photo.id);
      if (updateError) throw updateError;
      uploadedFiles += 1;
    }

    return json({
      folderId,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      uploadedFiles,
    });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
