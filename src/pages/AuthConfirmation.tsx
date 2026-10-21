import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleAlert, Laptop, LoaderCircle, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

type ConfirmationState = 'loading' | 'success' | 'error';

export default function AuthConfirmation() {
  const [state, setState] = useState<ConfirmationState>('loading');
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;

    const confirmAccount = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const authError = params.get('error_description') || params.get('error') || hashParams.get('error_description') || hashParams.get('error');

      if (authError) {
        if (active) setState('error');
        return;
      }

      try {
        // Supabase processes the confirmation code or tokens from the URL during initialization.
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error || !data.session?.user) {
          setState('error');
          return;
        }

        setHasSession(true);
        setState('success');
      } catch {
        if (active) setState('error');
      }
    };

    void confirmAccount();
    return () => {
      active = false;
    };
  }, []);

  const isLoading = state === 'loading';
  const isSuccess = state === 'success';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
            <Laptop className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">VistoriaTech</span>
        </div>

        <Card className="border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <CardHeader className="items-center px-7 pb-3 pt-8 text-center">
            <div className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full ${isLoading ? 'bg-sky-50 text-sky-600' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isLoading ? <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" /> : isSuccess ? <CheckCircle2 className="h-7 w-7" aria-hidden="true" /> : <CircleAlert className="h-7 w-7" aria-hidden="true" />}
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
              {isLoading ? 'Confirmando seu e-mail' : isSuccess ? 'E-mail confirmado!' : 'Não foi possível confirmar'}
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-slate-500">
              {isLoading
                ? 'Estamos validando o link e ativando sua conta. Isso leva só um instante.'
                : isSuccess
                  ? 'Sua conta está ativa. Você já pode entrar no VistoriaTech e acompanhar as vistorias.'
                  : 'Este link pode ter expirado ou já ter sido utilizado. Você pode tentar entrar ou solicitar uma nova confirmação.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-7 pb-7 pt-5">
            {isSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <p>Confirmação concluída com sucesso. Seus dados de acesso já estão prontos.</p>
                </div>
                <Button asChild className="h-11 w-full bg-sky-600 font-semibold text-white hover:bg-sky-700">
                  <Link to={hasSession ? '/' : '/login'}>
                    {hasSession ? 'Abrir o VistoriaTech' : 'Ir para o login'}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : state === 'error' ? (
              <div className="space-y-3">
                <Button asChild className="h-11 w-full bg-sky-600 font-semibold text-white hover:bg-sky-700">
                  <Link to="/login">Ir para o login</Link>
                </Button>
                <p className="text-center text-xs leading-5 text-slate-500">
                  Se sua conta já foi ativada, entre normalmente. Caso contrário, peça um novo link de confirmação.
                </p>
              </div>
            ) : (
              <div className="h-11" aria-hidden="true" />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
