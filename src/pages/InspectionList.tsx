import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { CalendarDays, ClipboardCheck, Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InspectionList() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [inspections, setInspections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInspections = async () => {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['inspections', profile?.id],
    queryFn: fetchInspections,
    enabled: Boolean(profile?.id),
  });

  useEffect(() => {
    if (data !== undefined) {
      setInspections(data);
      setIsLoading(false);
    }
    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
    }
  }, [data, queryError]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta vistoria?')) return;
    
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir vistoria');
    } else {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const term = searchTerm.trim().toLocaleLowerCase('pt-BR');
    return !term || String(inspection.os_number).toLocaleLowerCase('pt-BR').includes(term)
      || String(inspection.asset_number).toLocaleLowerCase('pt-BR').includes(term);
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center py-12">Carregando...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center py-12 text-destructive">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
              <ClipboardCheck className="h-4 w-4" /> Gestão de inspeções
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Histórico de vistorias</h1>
            <p className="mt-2 text-sm text-slate-500">
              Consulte as vistorias da equipe e encontre rapidamente uma OS ou um ativo.
            </p>
          </div>
          <Button className="h-11 rounded-xl px-5 shadow-sm" onClick={() => window.location.href = '/nova-vistoria'}>
            <Plus className="mr-2 h-4 w-4" /> Nova vistoria
          </Button>
        </section>

        <Card className="mb-6 rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={event => { event.preventDefault(); setSearchTerm(searchInput); }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={event => setSearchInput(event.target.value)}
                  placeholder="Pesquisar por número da OS ou ativo"
                  aria-label="Pesquisar por número da OS ou ativo"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-10"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" className="h-11 rounded-xl px-6">
                <Search className="mr-2 h-4 w-4" /> Pesquisar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-700">
            {searchTerm ? 'Resultado da pesquisa' : 'Todas as vistorias'}
          </h2>
          <span className="text-sm text-slate-500">
            {filteredInspections.length} {filteredInspections.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {filteredInspections.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                {inspections.length === 0 ? <ClipboardCheck className="h-7 w-7" /> : <Search className="h-7 w-7" />}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {inspections.length === 0 ? 'Ainda não há vistorias' : 'Nenhuma vistoria encontrada'}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {inspections.length === 0
                  ? 'Crie uma nova vistoria para começar a registrar os equipamentos.'
                  : 'Confira o número informado ou pesquise por outro número de OS ou ativo.'}
              </p>
              {inspections.length === 0 && (
                <Button className="mt-5 rounded-xl" onClick={() => window.location.href = '/nova-vistoria'}>
                  <Plus className="mr-2 h-4 w-4" /> Criar vistoria
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map(inspection => {
              const completed = inspection.status === 'completed';
              const inProgress = inspection.status === 'in_progress';
              return (
                <Card key={inspection.id} className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:flex">
                          <ClipboardCheck className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:items-center sm:gap-8">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ordem de serviço</p>
                              <p className="mt-0.5 truncate text-lg font-bold text-slate-900">{inspection.os_number}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ativo</p>
                              <p className="mt-0.5 truncate text-lg font-bold text-slate-900">{inspection.asset_number}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                              completed ? 'bg-emerald-50 text-emerald-700' : inProgress ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${completed ? 'bg-emerald-500' : inProgress ? 'bg-amber-500' : 'bg-slate-400'}`} />
                              {completed ? 'Concluída' : inProgress ? 'Em andamento' : 'Arquivada'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {format(new Date(inspection.created_at), 'dd/MM/yyyy · HH:mm', { locale: ptBR })}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Equipe</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1 rounded-lg border-slate-200 sm:flex-none"
                          onClick={() => window.location.href = `/vistoria/${inspection.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </Button>
                        {inspection.profile_id === profile?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              onClick={() => window.location.href = `/editar-vistoria/${inspection.id}`}
                              title="Editar vistoria"
                              aria-label="Editar vistoria"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(inspection.id)}
                              title="Excluir vistoria"
                              aria-label="Excluir vistoria"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
