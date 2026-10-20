import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Laptop, ShieldCheck, UserPlus, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLocal(true);
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoadingLocal(false);
      return;
    }

    let signUpResult: Awaited<ReturnType<typeof signUp>>;
    try {
      signUpResult = await signUp(email, password, fullName);
    } catch {
      setError('Não foi possível conectar ao serviço de cadastro. Verifique sua conexão e tente novamente.');
      setIsLoadingLocal(false);
      return;
    }

    const { data, error: signUpError } = signUpResult;

    if (signUpError) {
      setError(signUpError.message);
      setIsLoadingLocal(false);
      return;
    }

    // If confirmation is disabled, the authenticated account can enter directly.
    if (data?.session) {
      navigate('/');
      return;
    }

    setSuccess('Cadastro registrado. Se a confirmação por e-mail estiver ativada, confirme o endereço antes de entrar.');
    setIsLoadingLocal(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <Header />
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
            <Laptop className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VistoriaTech</h1>
          <p className="text-sm text-slate-400">
            Cadastro de Administrador Técnico
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 text-slate-100 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-white">Novo Cadastro</CardTitle>
              <span className="inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Perfil: Admin
              </span>
            </div>
            <CardDescription className="text-slate-400">
              Todos os membros cadastrados possuem permissão de Administrador
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/60 p-4 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    Conta registrada!
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-300/90">
                    O cadastro de <strong>{email}</strong> foi enviado ao Supabase.
                    Se a confirmação por e-mail estiver ativada, confira sua caixa de entrada e spam antes de entrar.
                  </p>
                </div>

                <Button asChild className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5">
                  <Link to="/login" className="flex items-center justify-center gap-2">
                    Ir para o login
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-xs text-slate-400 hover:text-white underline">
                    Ir para tela de login com senha
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-200">Nome completo do Técnico</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ex: João Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Senha (mínimo 6 caracteres)</Label>
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
                  disabled={isLoadingLocal}
                >
                  {isLoadingLocal ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando conta Admin...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Cadastrar Administrador
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-900 pt-3">
            <p className="text-xs text-slate-400">
              Já tem conta?{' '}
              <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4">
                Acessar Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
