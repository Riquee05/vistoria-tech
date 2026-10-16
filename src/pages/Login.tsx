import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, ShieldCheck, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { signIn, signInDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn(email, password);

    if (result.error) {
      const msg = result.error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        setError('O e-mail foi cadastrado, mas a confirmação de e-mail ainda está pendente no Supabase. Você pode confirmar no seu e-mail ou clicar no botão "Entrar Direto como Admin" abaixo para acessar agora.');
      } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setError('E-mail ou senha incorretos. Se você acabou de se cadastrar com confirmação pendente, use o botão "Entrar Direto" abaixo.');
      } else {
        setError(result.error.message || 'Erro ao realizar login.');
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    navigate('/');
  };

  const handleDemoAccess = () => {
    signInDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
            <Laptop className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VistoriaTech</h1>
          <p className="text-sm text-slate-400">
            Vistoria padronizada de notebooks em bancada
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 text-slate-100 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-white">Acessar Painel</CardTitle>
              <span className="inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Acesso Total Admin
              </span>
            </div>
            <CardDescription className="text-slate-400">
              Digite suas credenciais cadastradas no Supabase
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">E-mail corporativo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tecnico@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-200">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-950/60 border border-red-800/60 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 shadow-md shadow-sky-600/25 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Autenticando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar com E-mail
                  </span>
                )}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 text-slate-400 font-medium">ou na bancada</span>
              </div>
            </div>

            {/* Quick direct admin access */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoAccess}
              className="w-full border-slate-700 hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-center gap-2 py-2.5"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
              Entrar Direto como Administrador
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-0 border-t border-slate-900 mt-4 text-center">
            <p className="text-xs text-slate-400 pt-3">
              Primeiro acesso?{' '}
              <Link to="/register" className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4">
                Criar nova conta de Admin
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-slate-500">
          VistoriaTech &bull; Bancada de Notebooks com Fotos &bull; Todos os usuários são Admins
        </p>
      </div>
    </div>
  );
}