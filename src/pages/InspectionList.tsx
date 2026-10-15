import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InspectionList() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [inspections, setInspections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    if (!profile?.id) return [];
    
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['inspections'],
    queryFn: fetchInspections,
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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center py-12">Carregando...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center py-12 text-destructive">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Vistorias</h1>
          <Button variant="outline" onClick={() => window.location.href = '/nova-vistoria'}>
            Nova Vistoria
          </Button>
        </div>

        {inspections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">Nenhuma vistoria encontrada. Crie sua primeira vistoria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inspections.map((inspection) => (
                          <Card key={inspection.id} className="border">
                            <CardHeader className="flex items-center justify-between pb-2">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold">
                                  OS: {inspection.os_number} | Ativo: {inspection.asset_number}
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                  {format(new Date(inspection.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.location.href = `/vistoria/${inspection.id}`}
                                  title="Visualizar"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.location.href = `/editar-vistoria/${inspection.id}`}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  ghost
                                  size="icon"
                                  onClick={() => handleDelete(inspection.id)}
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="px-4 py-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="px-2 py-1 rounded-md bg-muted">
                                    Status:
                                    <span className={`font-medium ${
                                      inspection.status === 'completed'
                                        ? 'text-success'
                                        : inspection.status === 'in_progress'
                                          ? 'text-warning'
                                          : 'text-muted-foreground'
                                    }`}>
                                      {inspection.status === 'completed' ? 'Concluída' :
                                       inspection.status === 'in_progress' ? 'Em andamento' : 'Arquivada'}
                                    </span>
                                  </span>
                                  <span className="px-2 py-1 rounded-md bg-muted">
                                    Responsável:
                                    <span className="font-medium">{profile?.full_name || 'Técnico'}</span>
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
          </div>
        )}
      </div>
    </div>
  );
}