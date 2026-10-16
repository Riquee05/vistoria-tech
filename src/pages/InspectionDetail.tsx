import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 'physical', name: 'Estado Físico', description: 'Fotos da carcaça, tela, teclado, portas e conectores' },
  { id: 'diagnosis', name: 'Diagnóstico', description: 'Fotos de testes, erros, telas de diagnóstico' },
  { id: 'os', name: 'Sistema Operacional', description: 'Fotos da tela de boot, versão do SO, licenças' },
  { id: 'config', name: 'Configuração', description: 'Fotos de BIOS, specs, configurações de hardware' },
  { id: 'pre-packaging', name: 'Pré-Embalagem', description: 'Foto final do equipamento antes de embalar' },
];

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [inspection, setInspection] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [additionalSoftware, setAdditionalSoftware] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchInspection();
  }, [id]);

  const fetchInspection = async () => {
    try {
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', id)
        .single();

      if (inspectionError) throw inspectionError;
      setInspection(inspectionData);

      const { data: stepsData, error: stepsError } = await supabase
        .from('inspection_steps')
        .select('*')
        .eq('inspection_id', id)
        .order('updated_at', { ascending: false });

      if (stepsError) throw stepsError;
      
      // Keep the UI on the stable step key (for example, "physical").
      // Database rows have their own UUID, which must not be used to match photos.
      const mergedSteps = STEPS.map(step => {
        const existing = stepsData?.find(s => s.step_id === step.id);
        return {
          ...step,
          step_id: step.id,
          status: existing?.status || 'pending',
          completed_at: existing?.completed_at || null,
          additional_software: existing?.additional_software || null,
        };
      });
      setSteps(mergedSteps);

      const { data: photosData, error: photosError } = await supabase
        .from('inspection_photos')
        .select('*')
        .eq('inspection_id', id);

      if (photosError) throw photosError;
      setPhotos(photosData || []);

      // Find first incomplete step
      const firstIncomplete = mergedSteps.findIndex(s => s.status !== 'completed');
      setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : mergedSteps.length - 1);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível carregar a vistoria', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    const step = steps.find(s => s.step_id === stepId);
    if (!step) return;

    const stepPhotos = photos.filter(p => p.step_id === stepId);
    if (stepPhotos.length === 0) {
      toast({ title: 'Atenção', description: 'Capture pelo menos uma foto para esta etapa', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: existingSteps, error: findStepError } = await supabase
        .from('inspection_steps')
        .select('id')
        .eq('inspection_id', id)
        .eq('step_id', stepId)
        .limit(1);

      if (findStepError) throw findStepError;

      const completedAt = new Date().toISOString();
      const stepUpdate = {
        step_name: step.name,
        status: 'completed' as const,
        completed_at: completedAt,
      };
      const { error } = existingSteps?.length
        ? await supabase
            .from('inspection_steps')
            .update(stepUpdate)
            .eq('inspection_id', id)
            .eq('step_id', stepId)
        : await supabase
            .from('inspection_steps')
            .insert({ inspection_id: id, step_id: stepId, ...stepUpdate });

      if (error) throw error;

      setSteps(prev => prev.map(s => s.step_id === stepId ? { ...s, status: 'completed', completed_at: completedAt } : s));
      
      // Move to next step
      const nextIndex = steps.findIndex(s => s.step_id === stepId) + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(nextIndex);
      }

      toast({ title: 'Etapa concluída', description: `${step.name} marcada como concluída` });
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível concluir a etapa', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    const allCompleted = steps.every(s => s.status === 'completed');
    if (!allCompleted) {
      toast({ title: 'Atenção', description: 'Conclua todas as etapas antes de finalizar', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Update steps with additional software
      await supabase
        .from('inspection_steps')
        .upsert({
          inspection_id: id,
          step_id: 'config',
          additional_software: additionalSoftware,
        });

      toast({ title: 'Vistoria finalizada!', description: 'A vistoria foi concluída com sucesso' });
      navigate('/');
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível finalizar a vistoria', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (stepId: string, file: File) => {
    // Compress image
    const compressed = await compressImage(file);
    
    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${id}/${stepId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(filePath, compressed);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      return;
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('inspection_photos')
      .insert({
        inspection_id: id,
        step_id: stepId,
        file_path: filePath,
        file_name: fileName,
        file_size: compressed.size,
        mime_type: compressed.type,
      });

    if (dbError) {
      toast({ title: 'Erro', description: 'Erro ao salvar foto', variant: 'destructive' });
      return;
    }

    // Update local state
    const newPhoto = {
      id: uploadData.id,
      inspection_id: id,
      step_id: stepId,
      file_path: filePath,
      file_name: fileName,
      file_size: compressed.size,
      mime_type: compressed.type,
      uploaded_at: new Date().toISOString(),
    };
    setPhotos(prev => [...prev, newPhoto]);
    
    // Update step status to in_progress if pending
    const step = steps.find(s => s.step_id === stepId);
    if (step && step.status === 'pending') {
      const { data: existingSteps, error: findStepError } = await supabase
        .from('inspection_steps')
        .select('id')
        .eq('inspection_id', id)
        .eq('step_id', stepId)
        .limit(1);

      if (findStepError) {
        toast({ title: 'Erro', description: 'A foto foi enviada, mas não foi possível atualizar a etapa', variant: 'destructive' });
        return;
      }

      const { error: stepError } = existingSteps?.length
        ? await supabase
            .from('inspection_steps')
            .update({ status: 'in_progress' })
            .eq('inspection_id', id)
            .eq('step_id', stepId)
        : await supabase
            .from('inspection_steps')
            .insert({
              inspection_id: id,
              step_id: stepId,
              step_name: step.name,
              status: 'in_progress',
            });

      if (stepError) {
        toast({ title: 'Erro', description: 'A foto foi enviada, mas não foi possível atualizar a etapa', variant: 'destructive' });
        return;
      }
      setSteps(prev => prev.map(s => s.step_id === stepId ? { ...s, status: 'in_progress' } : s));
    }

    toast({ title: 'Foto enviada', description: `${fileName} adicionada à etapa ${step?.name}` });
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', 0.8);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const getStepPhotos = (stepId: string) => photos.filter(p => p.step_id === stepId);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando vistoria...</div>;
  }

  if (!inspection) {
    return <div className="min-h-screen flex items-center justify-center text-destructive">Vistoria não encontrada</div>;
  }

  const currentStepData = steps[currentStep];
  const stepPhotos = getStepPhotos(currentStepData?.id || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        osNumber={inspection.os_number} 
        assetNumber={inspection.asset_number} 
        showOsAsset={true} 
      />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index < currentStep ? 'bg-primary text-primary-foreground' :
                  index === currentStep ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {STEPS.map(step => (
              <span key={step.id} className="w-20 text-center">{step.name}</span>
            ))}
          </div>
        </div>

        {/* Current Step */}
        {currentStepData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">{currentStepData.name}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Fotos da etapa</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stepPhotos.map((photo: any) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={supabase.storage.from('inspection-photos').getPublicUrl(photo.file_path).data.publicUrl}
                        alt={photo.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <label className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(currentStepData.id, file);
                      }}
                    />
                    <Camera className="h-8 w-8 text-muted-foreground/50" />
                    <span className="absolute bottom-2 text-xs text-muted-foreground">Adicionar foto</span>
                  </label>
                </div>
                {stepPhotos.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma foto adicionada. Capture pelo menos uma foto.</p>
                )}
              </div>

              {/* Additional Software field for config step */}
              {currentStepData.id === 'config' && (
                <div className="space-y-2">
                  <Label htmlFor="additionalSoftware">Software Adicional</Label>
                  <Textarea
                    id="additionalSoftware"
                    placeholder="Descreva o software adicional que será instalado no equipamento..."
                    value={additionalSoftware}
                    onChange={(e) => setAdditionalSoftware(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Complete Step Button */}
              <Button
                className="w-full"
                onClick={() => handleCompleteStep(currentStepData.id)}
                disabled={stepPhotos.length === 0 || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : currentStepData.status === 'completed' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Etapa Concluída
                  </>
                ) : (
                  'Concluir Etapa'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Finish Button */}
        {currentStep >= steps.length - 1 && steps.every(s => s.status === 'completed') && (
          <Button className="w-full text-lg py-4" onClick={handleFinish} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              'Finalizar Vistoria'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
