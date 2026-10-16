# Envio de vistorias para o Google Drive

Esta função é chamada ao finalizar uma vistoria. Ela cria uma pasta com o nome `Ativo ATIVO - OS NÚMERO` e envia todas as fotos dessa vistoria para ela.

## Configuração única

1. No Google Cloud, crie uma conta de serviço e habilite a Google Drive API.
2. Crie ou escolha a pasta do Google Drive que receberá as vistorias e compartilhe-a com o e-mail da conta de serviço como **Editor**.
3. No projeto Supabase, registre os segredos abaixo. A chave privada deve manter as quebras de linha como `\n`:

```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="conta@projeto.iam.gserviceaccount.com"
supabase secrets set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
supabase secrets set GOOGLE_DRIVE_PARENT_FOLDER_ID="id-da-pasta-principal"
```

4. Publique a função:

```bash
supabase functions deploy sync-inspection-to-drive
```

As credenciais ficam apenas nos segredos do Supabase; nunca devem ser adicionadas ao arquivo `.env` do front-end.

