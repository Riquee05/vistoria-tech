import { LogOut, User, Menu, X, Pencil } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HeaderProps {
  osNumber?: string;
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">VT</span>
          </div>
          <span className="hidden font-semibold sm:inline-block">VistoriaTech</span>
        </div>

        {/* OS e Ativo fixos no topo */}
        {showOsAsset && osNumber && assetNumber && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="rounded-md bg-muted px-2 py-1">
              OS: <span className="font-medium">{osNumber}</span>
            </span>
            <span className="rounded-md bg-muted px-2 py-1">
              Ativo: <span className="font-medium">{assetNumber}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
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
            onClick={signOut}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile OS/Ativo bar */}
      {showOsAsset && osNumber && assetNumber && (
        <div className="md:hidden border-t bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-background px-2 py-1">
              OS: <span className="font-medium">{osNumber}</span>
            </span>
            <span className="rounded-md bg-background px-2 py-1">
              Ativo: <span className="font-medium">{assetNumber}</span>
            </span>
          </div>
        </div>
      )}

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar nome do perfil</DialogTitle>
            <DialogDescription>
              Esse nome será exibido no cabeçalho do VistoriaTech.
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
    </header>
  );
}
