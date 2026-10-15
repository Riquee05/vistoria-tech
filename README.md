# VistoriaTech - App de Vistoria de Notebooks com Fotos

Sistema de inspeção de notebooks com checklist guiado, captura de fotos com compressão automática no cliente, backup no Google Drive e geração de laudos técnicos.

## Características Principais

- **Checklist Guiado por Etapas**: 6 etapas de inspeção (Ativo, Tela, Carcaça, Bateria, Placa Mãe, Conectores)
- **Captura de Fotos**: Com câmera nativa e compressão automática no cliente
- **Backup no Google Drive**: Envio automático organizado por pasta de Ativo e OS
- **Geração de Laudo**: PDF e link compartilhável ao concluir a inspeção
- **Modo Demo/Offline**: Funcionamento sem Supabase para testes rápidos
- **Configurações de Segredos**: Interface para configurar credenciais do Google Drive

## Estrutura do Projeto

```
src/
├── components/
│   └── ui/          # Componentes shadcn/ui
├── lib/
│   ├── google-drive.ts     # Integração com Google Drive API
│   ├── photo-compression.ts # Compressor de imagens no cliente
│   └── supabase.ts         # Integração com Supabase
├── pages/
│   ├── Index.tsx            # Página principal (checklist de inspeção)
│   └── Settings.tsx         # Configurações de API do Google
└── globals.css              # Estilos globais com tema VistoriaTech
```

## Configuração

### 1. Banco de Dados (Supabase)

Execute o script SQL no Supabase para criar as tabelas:

```sql
-- Execute em db/schemas.sql no Supabase
```

### 2. Google Drive API

Configure as credenciais no Google Cloud Console:
1. Crie um projeto
2. Ative a Google Drive API
3. Crie uma Chave de API
4. Cole a API Key na página de Configurações

### 3. Variáveis de Ambiente

Crie um arquivo `.env` com:

```env
VITE_GOOGLE_DRIVE_API_KEY=sua_api_key
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## Modo de Uso

1. Acesse a página inicial
2. Preencha as informações do ativo (Número do Ativo, OS, Inspetor)
3. Siga o checklist de 6 etapas
4. Capture fotos em cada etapa (mínimo 3)
5. Conclua a inspeção para gerar o laudo

## Modo Demo/Offline

Se não houver Supabase conectado, o app funciona em modo demo com dados locais para testes.

## Dependências Principais

- React 19
- TypeScript
- React Router
- shadcn/ui
- Tailwind CSS
- Lucide Icons
- Sonner (Toasts)
- TanStack Query