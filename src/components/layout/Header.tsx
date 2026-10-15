import { LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  osNumber?: string;
  assetNumber?: string;
  showOsAsset?: boolean;
}

export function Header({ osNumber, assetNumber, showOsAsset = false }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    </header>
  );
}