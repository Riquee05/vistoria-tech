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
      const { data, error: insertError } = await supabase
        .from('inspections')
        .insert({
          profile_id: profile.id,
          os_number: osNumber,
          asset_number: assetNumber,
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
        description: `OS: ${osNumber} - Ativo: ${assetNumber}`,
      });

      navigate(`/vistoria/${data.id}`);
    } catch (err) {
      setError('Erro ao criar vistoria');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <Header />
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Nova Vistoria</CardTitle>
            <CardDescription className="text-center">
              Preencha os dados do equipamento para iniciar a vistoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assetNumber">Número do Ativo *</Label>
                <Input
                  id="assetNumber"
                  type="text"
                  placeholder="Ex: NB-0042"
                  value={assetNumber}
                  onChange={(e) => setAssetNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="osNumber">Número da OS (Ordem de Serviço) *</Label>
                <Input
                  id="osNumber"
                  type="text"
                  placeholder="Ex: 2025-001"
                  value={osNumber}
                  onChange={(e) => setOsNumber(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Criando...' : 'Iniciar Vistoria'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
