import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { buildInspectionReportHtml, openInspectionReport } from '@/lib/inspection-report';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Camera, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [reportHtml, setReportHtml] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [additionalSoftware, setAdditionalSoftware] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const reportFrame = useRef<HTMLIFrameElement>(null);

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
      const software = mergedSteps.find(step => step.id === 'config')?.additional_software || '';
      setAdditionalSoftware(software);

      const { data: photosData, error: photosError } = await supabase
        .from('inspection_photos')
        .select('*')
        .eq('inspection_id', id);

      if (photosError) throw photosError;
      const photosWithUrls = await Promise.all((photosData || []).map(async photo => {
        const { data, error } = await supabase.storage
          .from('inspection-photos')
          .createSignedUrl(photo.file_path, 60 * 60 * 12);
        if (error || !data?.signedUrl) throw error || new Error('Não foi possível carregar uma foto.');
        return { ...photo, signed_url: data.signedUrl };
      }));
      setPhotos(photosWithUrls);

      if (inspectionData.status === 'completed') {
        setReportLoading(true);
        setReportError(null);
        try {
          const html = await buildInspectionReportHtml(inspectionData, mergedSteps, photosData || [], software);
          setReportHtml(html);
        } catch (error) {
          setReportError(error instanceof Error ? error.message : 'Não foi possível preparar o relatório.');
        } finally {
          setReportLoading(false);
        }
      }

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
    let inspectionCompleted = false;
    const completedAt = inspection.completed_at || new Date().toISOString();
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'completed',
          completed_at: completedAt,
        })
        .eq('id', id);

      if (error) throw error;
      inspectionCompleted = true;
      setInspection((previous: any) => ({ ...previous, status: 'completed', completed_at: completedAt }));

      // Update steps with additional software
      await supabase
        .from('inspection_steps')
        .upsert({
          inspection_id: id,
          step_id: 'config',
          additional_software: additionalSoftware,
        });

      const { error: driveError } = await supabase.functions.invoke('sync-inspection-to-drive', {
        body: { inspectionId: id },
      });

      if (driveError) throw driveError;

      toast({ title: 'Vistoria finalizada!', description: 'As fotos foram enviadas ao Google Drive com sucesso.' });
      navigate('/');
    } catch (err) {
      toast({
        title: inspectionCompleted ? 'Vistoria concluída, mas o envio falhou' : 'Erro',
        description: inspectionCompleted
          ? 'As fotos não foram enviadas ao Google Drive. A vistoria está salva; tente finalizar novamente.'
          : 'Não foi possível finalizar a vistoria',
        variant: 'destructive',
      });
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
      await supabase.storage.from('inspection-photos').remove([filePath]);
      toast({ title: 'Erro', description: 'Erro ao salvar foto', variant: 'destructive' });
      return;
    }

    const { data: signedPhoto, error: signedPhotoError } = await supabase.storage
      .from('inspection-photos')
      .createSignedUrl(filePath, 60 * 60 * 12);
    if (signedPhotoError || !signedPhoto?.signedUrl) {
      toast({ title: 'Foto salva', description: 'Reabra a vistoria para carregar a imagem.', variant: 'destructive' });
      await fetchInspection();
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
      signed_url: signedPhoto.signedUrl,
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

    const { error: driveError } = await supabase.functions.invoke('sync-inspection-to-drive', {
      body: { inspectionId: id },
    });

    if (driveError) {
      toast({
        title: 'Foto enviada, sincronização pendente',
        description: 'A foto foi salva na vistoria. O envio ao Google Drive será tentado novamente ao concluir a vistoria.',
        variant: 'destructive',
      });
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

  if (inspection.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header osNumber={inspection.os_number} assetNumber={inspection.asset_number} showOsAsset={true} />
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Vistoria concluída</h1>
              <p className="text-sm text-muted-foreground">
                Relatório de Ativo {inspection.asset_number} · OS {inspection.os_number || 'não informada'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
              {reportHtml && <Button onClick={() => reportFrame.current?.contentWindow?.print()}>Salvar / imprimir PDF</Button>}
            </div>
          </div>
          {reportLoading ? (
            <Card><CardContent className="flex items-center justify-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" /> Preparando relatório e fotos…</CardContent></Card>
          ) : reportError ? (
            <Card><CardContent className="space-y-4 py-8 text-center">
              <p className="text-destructive">{reportError}</p>
              <Button onClick={() => { setReportError(null); fetchInspection(); }}>Tentar carregar novamente</Button>
            </CardContent></Card>
          ) : reportHtml ? (
            <iframe
              ref={reportFrame}
              title={`Relatório da vistoria OS ${inspection.os_number}`}
              srcDoc={reportHtml}
              className="h-[78vh] min-h-[560px] w-full rounded-lg border bg-white shadow-sm"
            />
          ) : null}
        </div>
      </div>
    );
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
        <div className="flex justify-end mb-6">
          <Button variant="outline" disabled={generatingPdf || saving} onClick={async () => {
            setGeneratingPdf(true);
            try {
              await openInspectionReport(inspection, steps, photos, additionalSoftware);
            } catch (error) {
              toast({ title: 'Não foi possível gerar o PDF', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
            } finally {
              setGeneratingPdf(false);
            }
          }}>
            {generatingPdf && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {generatingPdf ? 'Preparando relatório…' : 'Gerar relatório PDF'}
          </Button>
        </div>
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
                        src={photo.signed_url}
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
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(step => Math.max(0, step - 1))}
                  disabled={currentStep === 0 || saving}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Etapa anterior
                </Button>
                <Button
                  className="flex-1"
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
              </div>
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
