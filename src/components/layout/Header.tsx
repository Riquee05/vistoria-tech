import { ClipboardList, LogOut, User, Menu, X, Pencil, Plus, Smartphone } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PWA_INSTALL_PROMPT_CHANGED } from '@/lib/pwa-install';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HeaderProps {
  osNumber?: string | null;
  assetNumber?: string;
  showOsAsset?: boolean;
}

export function Header({ osNumber, assetNumber, showOsAsset = false }: HeaderProps) {
  const { profile, signOut, updateProfileName } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [canInstallApp, setCanInstallApp] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [qrCodeFailed, setQrCodeFailed] = useState(false);
  const installUrl = 'https://vistoria-tech.vercel.app/';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(installUrl)}`;

  useEffect(() => {
    const syncInstallState = () => {
      setCanInstallApp(Boolean(window.vtDeferredInstallPrompt));
      setIsAppInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    };

    syncInstallState();
    window.addEventListener(PWA_INSTALL_PROMPT_CHANGED, syncInstallState);
    return () => window.removeEventListener(PWA_INSTALL_PROMPT_CHANGED, syncInstallState);
  }, []);

  const handleInstallApp = async () => {
    const installPrompt = window.vtDeferredInstallPrompt;
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    window.vtDeferredInstallPrompt = null;
    setCanInstallApp(false);
    setIsAppInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    window.dispatchEvent(new Event(PWA_INSTALL_PROMPT_CHANGED));
  };

  const openInstallHelp = () => {
    setIsMenuOpen(false);
    setQrCodeFailed(false);
    setIsInstallDialogOpen(true);
  };

  const openProfileDialog = () => {
    setNameDraft(profile?.full_name || '');
    setProfileError('');
    setIsProfileDialogOpen(true);
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingName(true);
    setProfileError('');
    try {
      const { error } = await updateProfileName(nameDraft);
      if (error) {
        setProfileError(error.message || 'Não foi possível atualizar o nome.');
        return;
      }

      setIsProfileDialogOpen(false);
    } catch {
      setProfileError('Não foi possível atualizar o nome. Tente novamente.');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/icons/webancada-mark.svg" alt="" className="h-9 w-9 rounded-lg" />
          <span className="hidden font-semibold sm:inline-block">WeBancada</span>
        </div>

        {/* OS e Ativo fixos no topo */}
        {showOsAsset && assetNumber && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="rounded-md bg-muted px-2 py-1">
              Ativo: <span className="font-medium">{assetNumber}</span>
            </span>
            <span className="rounded-md bg-muted px-2 py-1">
              OS: <span className="font-medium">{osNumber || 'Não informada'}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={openInstallHelp}
          >
            <Smartphone className="h-4 w-4" />
            Instalar no celular
          </Button>
          {profile && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{profile.full_name || profile.email}</span>
            </div>
          )}
          {profile && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={openProfileDialog}
              title="Alterar nome do perfil"
              aria-label="Alterar nome do perfil"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={signOut}
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-navigation" className="md:hidden border-t bg-background px-4 py-3 shadow-lg">
          {profile && (
            <div className="mb-3 flex items-center gap-2 border-b pb-3 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate">{profile.full_name || profile.email}</span>
            </div>
          )}
          <div className="grid gap-1">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent"
            >
              <ClipboardList className="h-4 w-4" />
              Vistorias
            </Link>
            <Link
              to="/nova-vistoria"
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              Nova vistoria
            </Link>
            <button
              type="button"
              onClick={openInstallHelp}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium hover:bg-accent"
            >
              <Smartphone className="h-4 w-4" />
              Instalar no celular
            </button>
            {profile && (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openProfileDialog();
                }}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
                Alterar nome do perfil
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                void signOut();
              }}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </nav>
      )}

      {/* Mobile OS/Ativo bar */}
      {showOsAsset && assetNumber && (
        <div className="md:hidden border-t bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-background px-2 py-1">
              Ativo: <span className="font-medium">{assetNumber}</span>
            </span>
            <span className="rounded-md bg-background px-2 py-1">
              OS: <span className="font-medium">{osNumber || 'Não informada'}</span>
            </span>
          </div>
        </div>
      )}

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar nome do perfil</DialogTitle>
            <DialogDescription>
              Esse nome será exibido no cabeçalho do WeBancada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="profile-name" className="text-sm font-medium">Nome</label>
              <Input
                id="profile-name"
                autoFocus
                maxLength={80}
                value={nameDraft}
                onChange={event => setNameDraft(event.target.value)}
                placeholder="Seu nome"
              />
              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingName || !nameDraft.trim()}>
                {isSavingName ? 'Salvando…' : 'Salvar nome'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAppInstalled ? 'WeBancada instalado' : 'Instale o WeBancada'}</DialogTitle>
            <DialogDescription>
              {isAppInstalled
                ? 'O aplicativo já está instalado neste dispositivo.'
                : 'Adicione o app à tela inicial do celular para acessá-lo como um aplicativo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {!isAppInstalled && canInstallApp && (
              <Button className="w-full" onClick={() => void handleInstallApp()}>
                <Smartphone className="h-4 w-4" />
                Instalar aplicativo
              </Button>
            )}
            {!isAppInstalled && !canInstallApp && (
              <div className="w-full space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Android:</span> no Chrome, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.</p>
                <p><span className="font-medium text-foreground">iPhone:</span> no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>
              </div>
            )}
            {!isAppInstalled && (
              <div className="hidden w-full flex-col items-center gap-2 border-t pt-4 md:flex">
                {qrCodeFailed ? (
                  <p className="text-center text-sm text-muted-foreground">Não foi possível carregar o QR Code.</p>
                ) : (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code para abrir o WeBancada no celular"
                    width={200}
                    height={200}
                    className="rounded-lg border bg-white p-2"
                    onError={() => setQrCodeFailed(true)}
                  />
                )}
                <p className="text-center text-xs text-muted-foreground">No computador? Escaneie para abrir o app no celular.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
