import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowRight, ClipboardCheck, Laptop, ShieldCheck, Sparkles } from 'lucide-react';

export default function Login() {
  const { signIn, signInDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email.trim(), password);

      if (result.error) {
        const message = result.error.message.toLowerCase();
        if (message.includes('email not confirmed')) {
          setError('Seu cadastro aguarda a confirmação do e-mail. Confirme a mensagem enviada para continuar.');
        } else if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
          setError('E-mail ou senha incorretos. Confira seus dados ou crie uma conta pessoal.');
        } else {
          setError(result.error.message || 'Não foi possível entrar. Tente novamente.');
        }
        return;
      }

      navigate('/');
    } catch {
      setError('Não foi possível conectar agora. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    signInDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden bg-slate-950 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-sky-500/15 blur-3xl" />
          <div className="absolute -bottom-48 -right-24 h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)] [background-size:28px_28px]" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-950/50">
            <Laptop className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight">VistoriaTech</span>
        </div>

        <div className="relative max-w-xl py-16">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-sm font-medium text-sky-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Gestão de inspeções técnicas
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Inspeções mais rápidas e consistentes.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Organize vistorias de notebooks, acompanhe cada etapa e mantenha as informações da bancada em um só lugar.
          </p>

          <div className="mt-10 space-y-4 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sky-300">
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              Histórico de inspeções em um só painel
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sky-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              Acesso protegido pela sua conta
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">VistoriaTech · Inspeção de notebooks em bancada</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center justify-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <Laptop className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">VistoriaTech</span>
          </div>

          <Card className="border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <CardHeader className="space-y-3 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                  Acesse sua conta
                </CardTitle>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Seguro
                </span>
              </div>
              <CardDescription className="text-sm leading-6 text-slate-500">
                Entre com o e-mail e a senha cadastrados para continuar.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 sm:px-8">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500"
                    aria-invalid={Boolean(error)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500"
                    aria-invalid={Boolean(error)}
                    required
                  />
                </div>

                {error && (
                  <div role="alert" aria-live="polite" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                    <span className="leading-5">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full bg-sky-600 font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>

              {import.meta.env.DEV && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-500">ou</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDemoAccess}
                    className="h-11 w-full border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Sparkles className="h-4 w-4 text-sky-600" aria-hidden="true" />
                    Acessar demonstração
                  </Button>
                </>
              )}
            </CardContent>

            <CardFooter className="mt-6 flex-col border-t border-slate-100 px-6 pb-6 pt-5 text-center sm:px-8">
              <p className="text-sm text-slate-500">
                Primeiro acesso?{' '}
                <Link to="/register" className="font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
                  Criar conta
                </Link>
              </p>
            </CardFooter>
          </Card>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500 lg:hidden">
            Inspeção de notebooks em bancada
          </p>
        </div>
      </main>
    </div>
  );
}
