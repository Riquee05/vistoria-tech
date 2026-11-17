import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { normalizeInspectionIdentifiers } from '@/lib/inspection-identifiers';
import { ArrowLeft, Check, ClipboardList, PackageCheck } from 'lucide-react';

export default function NewInspection() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [osNumber, setOsNumber] = useState('');
  const [assetNumber, setAssetNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!profile?.id) {
      setError('Você não está logado');
      setIsLoading(false);
      return;
    }

    try {
      const identifiers = normalizeInspectionIdentifiers(assetNumber, osNumber);
      const { data, error: insertError } = await supabase
        .from('inspections')
        .insert({
          profile_id: profile.id,
          os_number: identifiers.osNumber,
          asset_number: identifiers.assetNumber,
          status: 'in_progress',
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Vistoria criada!',
        description: `Ativo: ${identifiers.assetNumber}${identifiers.osNumber ? ` - OS: ${identifiers.osNumber}` : ''}`,
      });

      navigate(`/vistoria/${data.id}`);
    } catch (err) {
      setError('Erro ao criar vistoria');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" /> Vistorias
        </button>

        <section className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Nova ordem de inspeção</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Identifique o equipamento</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Informe o ativo para abrir a vistoria. O número da ordem de serviço pode ser adicionado quando existir.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-950">Dados do equipamento</CardTitle>
                  <CardDescription className="mt-1 text-sm">A OS é opcional; o ativo é obrigatório.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-6 sm:px-7 sm:py-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="assetNumber" className="text-sm font-semibold text-slate-800">Número do ativo <span className="text-violet-700">*</span></Label>
                  <Input
                    id="assetNumber"
                    type="text"
                    placeholder="Ex.: 11799 ou NB-0042"
                    value={assetNumber}
                    onChange={(e) => setAssetNumber(e.target.value)}
                    required
                    autoFocus
                    className="h-12 rounded-xl border-slate-300 bg-white text-base placeholder:text-slate-400 focus-visible:ring-violet-600"
                  />
                  <p className="text-xs leading-5 text-slate-500">Use o número de identificação fixado no equipamento.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="osNumber" className="text-sm font-semibold text-slate-800">Ordem de serviço <span className="font-normal text-slate-500">(opcional)</span></Label>
                  <Input
                    id="osNumber"
                    type="text"
                    placeholder="Informe se houver uma OS"
                    value={osNumber}
                    onChange={(e) => setOsNumber(e.target.value)}
                    className="h-12 rounded-xl border-slate-300 bg-white text-base placeholder:text-slate-400 focus-visible:ring-violet-600"
                  />
                </div>
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-300 px-5" onClick={() => navigate('/')}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-11 rounded-xl bg-slate-950 px-6 hover:bg-violet-800" disabled={isLoading}>
                    {isLoading ? 'Criando vistoria…' : 'Iniciar vistoria'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <aside className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Checklist da vistoria</h2>
                <p className="mt-0.5 text-xs text-slate-400">5 etapas para registrar</p>
              </div>
            </div>
            <ol className="mt-5 space-y-4">
              {['Diagnóstico', 'Sistema Operacional', 'Configuração', 'Estado Físico', 'Foto Antes da Embalagem'].map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${index === 0 ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-300'}`}>
                    {index === 0 ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={index === 0 ? 'font-medium text-white' : 'text-slate-300'}>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl border border-violet-300/20 bg-violet-300/10 p-3 text-xs leading-5 text-violet-100">
              Você poderá avançar e voltar entre as etapas durante a vistoria.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
