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

const getGoogleAccessToken = async (clientId: string, clientSecret: string, refreshToken: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', client_id: clientId,
      client_secret: clientSecret, refresh_token: refreshToken,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) {
    throw new Error('Google authorization failed. Reconnect the Google account.');
  }
  return result.access_token as string;
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

const replaceDriveFile = async (accessToken: string, fileId: string, file: Blob) => {
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) throw new Error(`Could not replace Google Drive photo: ${await response.text()}`);
  return fileId;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleClientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');
    const parentFolderId = Deno.env.get('GOOGLE_DRIVE_PARENT_FOLDER_ID');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!supabaseUrl || !serviceRoleKey || !googleClientId || !googleClientSecret || !googleRefreshToken) {
      return json({ error: 'Google Drive integration is not configured' }, 500);
    }
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

    const { inspectionId, photoId } = await request.json();
    if (!inspectionId) return json({ error: 'inspectionId is required' }, 400);

    const { data: inspection, error: inspectionError } = await admin
      .from('inspections')
      .select('id, asset_number, os_number')
      .eq('id', inspectionId)
      .single();
    if (inspectionError || !inspection) return json({ error: 'Inspection not found' }, 404);

    let photosQuery = admin
      .from('inspection_photos')
      .select('id, file_path, file_name, google_drive_file_id, google_drive_folder_id')
      .eq('inspection_id', inspectionId);
    if (photoId) photosQuery = photosQuery.eq('id', photoId);
    const { data: photos, error: photosError } = await photosQuery;
    if (photosError) throw photosError;
    if (photoId && !photos?.length) return json({ error: 'Photo not found' }, 404);

    const accessToken = await getGoogleAccessToken(googleClientId, googleClientSecret, googleRefreshToken);
    const existingFolderId = photos?.find((photo) => photo.google_drive_folder_id)?.google_drive_folder_id;
    const osNumber = inspection.os_number?.trim() || null;
    const osLabel = osNumber
      ? `OS ${safeFolderName(osNumber)}`
      : 'Sem OS';
    const folderName = `Ativo ${safeFolderName(inspection.asset_number)} - ${osLabel}`;
    const folderId = existingFolderId || await createDriveFolder(accessToken, folderName, parentFolderId);
    let syncedFiles = 0;

    for (const photo of photos || []) {
      if (photo.google_drive_file_id && !photoId) continue;

      const { data: file, error: downloadError } = await admin.storage
        .from('inspection-photos')
        .download(photo.file_path);
      if (downloadError || !file) throw downloadError || new Error('Photo download failed');

      const driveFileId = photo.google_drive_file_id
        ? await replaceDriveFile(accessToken, photo.google_drive_file_id, file)
        : await uploadDriveFile(accessToken, folderId, photo.file_name, file);
      const { error: updateError } = await admin
        .from('inspection_photos')
        .update({
          processed_at: new Date().toISOString(),
          google_drive_file_id: driveFileId,
          google_drive_folder_id: folderId,
        })
        .eq('id', photo.id);
      if (updateError) throw updateError;
      syncedFiles += 1;
    }

    return json({
      folderId,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      uploadedFiles: syncedFiles,
      syncedFiles,
    });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

