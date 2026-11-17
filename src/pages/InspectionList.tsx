import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { CalendarDays, CheckCircle2, ClipboardCheck, Clock3, Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { normalizeInspectionIdentifiers } from '@/lib/inspection-identifiers';

export default function InspectionList() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDemoAccount = profile?.id === 'demo-admin-id-001';
  const [inspections, setInspections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
    enabled: Boolean(profile?.id) && !isDemoAccount,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (isDemoAccount) {
      setInspections([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    if (data !== undefined) {
      setInspections(data);
      setIsLoading(false);
    }
    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
    }
  }, [data, queryError, isDemoAccount]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta vistoria?')) return;
    
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir vistoria');
    } else {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  };

  const completedCount = inspections.filter(inspection => inspection.status === 'completed').length;
  const inProgressCount = inspections.filter(inspection => inspection.status === 'in_progress').length;
  const hasActiveFilters = Boolean(searchTerm || statusFilter !== 'all' || periodFilter !== 'all' || dateFrom || dateTo);

  const filteredInspections = inspections.filter(inspection => {
    const term = searchTerm.trim().toLocaleLowerCase('pt-BR');
    const identifiers = normalizeInspectionIdentifiers(inspection.asset_number, inspection.os_number);
    const matchesSearch = !term || String(identifiers.osNumber ?? '').toLocaleLowerCase('pt-BR').includes(term)
      || identifiers.assetNumber.toLocaleLowerCase('pt-BR').includes(term);
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    const createdAt = new Date(inspection.created_at);
    const cutoff = periodFilter === '7'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : periodFilter === '30'
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : periodFilter === '90'
          ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          : periodFilter === 'year'
            ? new Date(new Date().getFullYear(), 0, 1)
            : null;
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    const matchesPeriod = !cutoff || createdAt >= cutoff;
    const matchesDateRange = (!from || createdAt >= from) && (!to || createdAt <= to);
    return matchesSearch && matchesStatus && matchesPeriod && matchesDateRange;
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
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:py-9">
        {isDemoAccount && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Você está no modo demonstração. Para ver as vistorias compartilhadas, saia e entre com uma conta cadastrada.
          </div>
        )}
        <section className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="border-l-[3px] border-violet-600 pl-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-700">WeBancada · Operações</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">Painel de vistorias</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Acompanhe a equipe, encontre um ativo ou consulte uma ordem de serviço.
            </p>
          </div>
          <Button className="h-11 rounded-lg bg-slate-950 px-5 shadow-sm hover:bg-violet-800" onClick={() => navigate('/nova-vistoria')}>
            <Plus className="mr-2 h-4 w-4" /> Nova vistoria
          </Button>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo das vistorias">
          <Card className="rounded-xl border-slate-200 border-t-[3px] border-t-slate-900 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div><p className="text-sm font-medium text-slate-600">Total de vistorias</p><p className="mt-1 text-3xl font-bold tabular-nums text-slate-950">{inspections.length}</p></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><ClipboardCheck className="h-5 w-5" /></div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 border-t-[3px] border-t-amber-500 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div><p className="text-sm font-medium text-slate-600">Em andamento</p><p className="mt-1 text-3xl font-bold tabular-nums text-slate-950">{inProgressCount}</p></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Clock3 className="h-5 w-5" /></div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 border-t-[3px] border-t-emerald-600 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div><p className="text-sm font-medium text-slate-600">Concluídas</p><p className="mt-1 text-3xl font-bold tabular-nums text-slate-950">{completedCount}</p></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
            </CardContent>
          </Card>
        </section>

        <Card className="mb-6 rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Buscar e filtrar</h2>
              {hasActiveFilters && <span className="text-xs font-medium text-violet-700">Filtros ativos</span>}
            </div>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={event => { event.preventDefault(); setSearchTerm(searchInput); }}
            >
              <div className="relative min-w-0 flex-1">
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
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                Situação
                <select
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Filtrar por situação"
                >
                  <option value="all">Todas as situações</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="completed">Concluídas</option>
                  <option value="archived">Arquivadas</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                Atalho de período
                <select
                  value={periodFilter}
                  onChange={event => setPeriodFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Filtrar por período rápido"
                >
                  <option value="all">Qualquer período</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="year">Este ano</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                A partir de
                <Input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={event => setDateFrom(event.target.value)}
                  className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800"
                  aria-label="Filtrar a partir desta data"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                Até
                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={event => setDateTo(event.target.value)}
                  className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800"
                  aria-label="Filtrar até esta data"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-700">
            {hasActiveFilters ? 'Vistorias encontradas' : 'Todas as vistorias'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{filteredInspections.length} {filteredInspections.length === 1 ? 'registro' : 'registros'}</span>
            {hasActiveFilters && (
              <button
                type="button"
                className="text-sm font-medium text-violet-700 hover:text-violet-900"
                onClick={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter('all'); setPeriodFilter('all'); setDateFrom(''); setDateTo(''); }}
              >
                Limpar filtros
              </button>
            )}
          </div>
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
                  : 'Tente mudar a situação, o período ou pesquisar por outro número de OS ou ativo.'}
              </p>
              {inspections.length === 0 && (
                <Button className="mt-5 rounded-lg" onClick={() => navigate('/nova-vistoria')}>
                  <Plus className="mr-2 h-4 w-4" /> Criar vistoria
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map(inspection => {
              const identifiers = normalizeInspectionIdentifiers(inspection.asset_number, inspection.os_number);
              const completed = inspection.status === 'completed';
              const inProgress = inspection.status === 'in_progress';
              return (
                <Card key={inspection.id} className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm transition-shadow hover:border-violet-200 hover:shadow-md">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 sm:flex">
                          <ClipboardCheck className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:items-center sm:gap-8">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ativo</p>
                              <p className="mt-0.5 truncate text-lg font-bold text-slate-900">{identifiers.assetNumber}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ordem de serviço</p>
                              <p className="mt-0.5 truncate text-lg font-bold text-slate-900">{identifiers.osNumber || 'Não informada'}</p>
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
                          onClick={() => navigate(`/vistoria/${inspection.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </Button>
                        {inspection.profile_id === profile?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              onClick={() => navigate(`/editar-vistoria/${inspection.id}`)}
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
