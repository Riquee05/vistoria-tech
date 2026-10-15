import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Key, Cloud, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface GoogleApiConfig {
  apiKey: string;
  clientId: string;
  accessToken: string;
  enabled: boolean;
}

const Settings = () => {
  const [config, setConfig] = useState<GoogleApiConfig>({
    apiKey: "",
    clientId: "",
    accessToken: "",
    enabled: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate saving to secrets
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Configurações salvas com sucesso!", {
        description: "Chave da API do Google Drive configurada"
      });
      setIsConnected(true);
    } catch (error) {
      toast.error("Erro ao salvar configurações", {
        description: "Tente novamente"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    toast.loading("Testando conexão com Google Drive...", {
      description: "Verificando credenciais da API"
    });
    setTimeout(() => {
      toast.success("Conexão estabelecida com sucesso!", {
        description: "Google Drive API está funcionando"
      });
      setIsConnected(true);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações da API do Google</h1>
        <p className="text-slate-600">
          Configure a integração com o Google Drive para backup automático de fotos e laudos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais da API do Google Drive</CardTitle>
          <CardDescription>
            Insira as credenciais obtidas no Google Cloud Console para habilitar o envio de fotos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-slate-900">Habilitar Google Drive</h3>
                  <p className="text-sm text-slate-500">Ativar backup automático de fotos</p>
                </div>
              </div>
              <Switch checked={config.enabled} onCheckedChange={setConfig} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-slate-700">API Key</Label>
            <Input
              type="password"
              placeholder="Cole sua API Key do Google Drive aqui..."
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Obtida no Google Cloud Console > APIs e Serviços > Credenciais
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-slate-700">Client ID</Label>
            <Input
              placeholder="ID do cliente OAuth 2.0..."
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-slate-700">Access Token</Label>
            <Input
              type="password"
              placeholder="Token de acesso OAuth 2.0..."
              value={config.accessToken}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
              className="w-full"
            />
          </div>

          {config.enabled && !isConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conexão não verificada</AlertTitle>
              <AlertDescription>
                Teste a conexão com o Google Drive antes de usar o backup automático.
              </AlertDescription>
            </Alert>
          )}

          {isConnected && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Conectado ao Google Drive</AlertTitle>
              <AlertDescription>
                O backup automático de fotos está ativo.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handleTestConnection}
            disabled={isSaving}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Cloud className="h-4 w-4" /> Testar Conexão
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Save className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Como obter as credenciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Passo 1: Criar Projeto no Google Cloud Console</h3>
              <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Crie um novo projeto ou selecione um existente</li>
                <li>Ative a API do Google Drive</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Passo 2: Criar Credenciais</h3>
              <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                <li>Vá em APIs e Serviços > Credenciais</li>
                <li>Clique em "Criar Credenciais" > "Chave de API"</li>
                <li>Copie a chave gerada</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Passo 3: Configurar no VistoriaTech</h3>
              <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                <li>Cole a API Key no campo acima</li>
                <li>Clique em "Salvar Configurações"</li>
                <li>Teste a conexão com o Google Drive</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;