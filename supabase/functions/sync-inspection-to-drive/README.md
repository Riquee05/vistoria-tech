# Envio de vistorias para o Google Drive

Ao enviar fotos ou concluir uma vistoria, a função cria uma pasta `Ativo NÚMERO - OS NÚMERO` (ou `Ativo NÚMERO - Sem OS`) dentro da pasta configurada e copia as fotos ainda não sincronizadas. Ao substituir uma foto já sincronizada, a função atualiza o arquivo existente no Drive.

## Configuração

1. Habilite a Google Drive API no projeto Google Cloud e crie um cliente OAuth para uma conta Google que tenha acesso à pasta de destino.
2. Autorize o cliente com o escopo `https://www.googleapis.com/auth/drive` e gere um refresh token. A conta Google autorizada precisa ter permissão de edição na pasta de destino.
3. Cadastre estes segredos no projeto Supabase:

   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REFRESH_TOKEN`
   - `GOOGLE_DRIVE_PARENT_FOLDER_ID`

   Nunca coloque esses valores no frontend, em `.env` versionado ou no Git.

4. Publique a Edge Function `sync-inspection-to-drive`.

A função valida a sessão e só sincroniza vistorias pertencentes ao usuário autenticado. Os IDs de arquivo já sincronizados são reaproveitados para evitar duplicar fotos em novas tentativas.
