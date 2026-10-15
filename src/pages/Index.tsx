import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Clock, HardDrive, Plus, X } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    assetNumber: "",
    osNumber: "",
    inspector: "",
    date: new Date().toISOString().split("T")[0],
    status: "in-progress"
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const handlePhotoCapture = async () => {
    setIsCapturing(true);
    try {
      // Simulate camera capture - in real app this would use device camera
      const mockPhoto = `https://picsum.photos/seed/${Date.now()}/800/600`;
      setPhotos((prev) => [...prev, mockPhoto]);
      toast.success("Foto capturada com sucesso!", {
        description: "Foto adicionada à inspeção"
      });
    } catch (error) {
      toast.error("Erro ao capturar foto", {
        description: "Tente novamente"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Foto removida", {
      description: "Foto removida da inspeção"
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      toast.success(`Passo ${currentStep + 1} de ${totalSteps}`, {
        description: "Próxima etapa da inspeção"
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeInspection = async () => {
    if (photos.length < 3) {
      toast.error("Mínimo de 3 fotos obrigatório", {
        description: "Adicione pelo menos 3 fotos para concluir a inspeção"
      });
      return;
    }

    try {
      // Simulate upload to Google Drive
      toast.loading("Enviando fotos para o Google Drive...", {
        description: "Organizando em pastas por Ativo e OS"
      });

      setTimeout(() => {
        toast.success("Inspeção concluída com sucesso!", {
          description: "Fotos enviadas e laudo gerado"
        });
        setInspectionData((prev) => ({ ...prev, status: "completed" }));
      }, 2000);
    } catch (error) {
      toast.error("Erro ao concluir inspeção", {
        description: "Tente novamente"
      });
    }
  };

  const getStepTitle = (step: number) => {
    const steps = [
      "Informações do Ativo",
      "Tela e Display",
      "Carcaça e Estrutura",
      "Bateria e Energia",
      "Placa Mãe e Componentes",
      "Conectores e Portas"
    ];
    return steps[step - 1] || "Etapa Desconhecida";
  };

  const getStepIcon = (step: number) => {
    const icons = [HardDrive, Camera, AlertCircle, Battery, FileText, CheckCircle];
    const Icon = icons[step - 1] || CheckCircle;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">VistoriaTech</h1>
              <p className="text-slate-600">Sistema de Inspeção de Notebooks com Fotos</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={inspectionData.status === "completed" ? "default" : "secondary"} className="text-sm">
                {inspectionData.status === "completed" ? "Concluído" : "Em Andamento"}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {photos.length} fotos
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Progresso da Inspeção</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Steps */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Etapas da Inspeção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNumber = index + 1;
                  const Icon = getStepIcon(stepNumber);
                  const isActive = stepNumber === currentStep;
                  const isCompleted = stepNumber < currentStep || inspectionData.status === "completed";

                  return (
                    <div
                      key={stepNumber}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 border border-blue-200"
                          : isCompleted
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                      onClick={() => setCurrentStep(stepNumber)}
                    >
                      <div className={`p-2 rounded-full ${
                        isActive
                          ? "bg-blue-100 text-blue-600"
                          : isCompleted
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isActive
                            ? "text-blue-900"
                            : isCompleted
                            ? "text-green-900"
                            : "text-gray-600"
                        }`}>
                          Etapa {stepNumber}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {getStepTitle(stepNumber)}
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Fotos Capturadas</span>
                  <span className="text-sm font-medium">{photos.length}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Fotos Obrigatórias</span>
                  <Badge variant="destructive" className="text-xs">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status de Upload</span>
                  <Badge variant="secondary" className="text-xs">
                    <Upload className="h-3 w-3 mr-1" /> Google Drive
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Step Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {getStepTitle(currentStep)}
                    </CardTitle>
                    <CardDescription>
                      Etapa {currentStep} de {totalSteps}
                    </CardDescription>
                  </div>
                  <Badge variant={inspectionData.status === "completed" ? "default" : "secondary"}>
                    {inspectionData.status === "completed" ? "Concluído" : "Em Andamento"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Asset Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Número do Ativo</label>
                        <input
                          type="text"
                          value={inspectionData.assetNumber}
                          onChange={(e) =>
                            setInspectionData((prev) => ({ ...prev, assetNumber: e.target.value }))
                          }
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: NOTEBOOK-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Número da OS</label>
                        <input
                          type="text"
                          value={inspectionData.osNumber}
                          onChange={(e) =>
                            setInspectionData((prev) => ({ ...prev, osNumber: e.target.value }))
                          }
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: OS-2024-001"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Inspetor</label>
                        <input
                          type="text"
                          value={inspectionData.inspector}
                          onChange={(e) =>
                            setInspectionData((prev) => ({ ...prev, inspector: e.target.value }))
                          }
                          className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent"
                          placeholder="Nome do inspetor"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Data</label>
                        <input
                          type="date"
                          value={inspectionData.date}
                          onChange={(e) =>
                            setInspectionData((prev) => ({ ...prev, date: e.target.value }))
                          }
                          className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Screen and Display */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Marca da Tela</label>
                        <select className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent">
                          <option>Selecione...</option>
                          <option>IPS</option>
                          <option>OLED</option>
                          <option>TN</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Resolução</label>
                        <select className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent">
                          <option>Selecione...</option>
                          <option>1920x1080</option>
                          <option>2560x1440</option>
                          <option>3840x2160</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Status da Tela</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["Normal", "Rachaduras", "Manchas", "Sem Imagem"].map((status) => (
                          <label key={status} className="flex items-center space-x-2">
                            <input type="radio" name="screen-status" value={status} />
                            <span className="text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Case and Structure */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Estado da Carcaça</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["Excelente", "Bom", "Regular", "Ruim"].map((status) => (
                          <label key={status} className="flex items-center space-x-2">
                            <input type="radio" name="case-status" value={status} />
                            <span className="text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Rachaduras Detectadas</label>
                      <textarea
                        className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent"
                        rows={3}
                        placeholder="Descreva as rachaduras encontradas..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Battery and Power */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Capacidade da Bateria</label>
                        <select className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent">
                          <option>Selecione...</option>
                          <option>3 células</option>
                          <option>4 células</option>
                          <option>6 células</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tempo de Duração</label>
                        <select className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent">
                          <option>Selecione...</option>
                          <option>< 2 horas</option>
                          <option>2-4 horas</option>
                          <option>> 4 horas</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Estado da Bateria</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["Excelente", "Bom", "Regular", "Ruim"].map((status) => (
                          <label key={status} className="flex items-center space-x-2">
                            <input type="radio" name="battery-status" value={status} />
                            <span className="text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Motherboard and Components */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Marca da Placa Mãe</label>
                      <select className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent">
                        <option>Selecione...</option>
                        <option>Intel</option>
                        <option>AMD</option>
                        <option>ASUS</option>
                        <option>MSI</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Componentes Detectados</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {["CPU", "RAM", "SSD", "HDD", "GPU", "Cooler"].map((component) => (
                          <label key={component} className="flex items-center space-x-2">
                            <input type="checkbox" name="component" value={component} />
                            <span className="text-sm">{component}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Connectors and Ports */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Portas Funcionais</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["USB-A", "USB-C", "HDMI", "Audio", "Ethernet", "SD Card"].map((port) => (
                          <label key={port} className="flex items-center space-x-2">
                            <input type="checkbox" name="port" value={port} />
                            <span className="text-sm">{port}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Observações Finais</label>
                      <textarea
                        className="w-full p-2 border border-slate-300 rounded-md focus-ring-2 focus-ring-blue-500 focus-border-transparent"
                        rows={4}
                        placeholder="Notas finais sobre a inspeção..."
                      />
                    </div>
                  </div>
                )}

                {/* Photo Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900">Fotos da Inspeção</h3>
                    <Button
                      onClick={handlePhotoCapture}
                      disabled={isCapturing || photos.length >= 10}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isCapturing ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      {isCapturing ? "Capturando..." : "Capturar Foto"}
                    </Button>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Foto {index + 1}
                        </div>
                      </div>
                    ))}
                    {photos.length < 10 && (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg h-24 flex items-center justify-center">
                        <Plus className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-slate-600">
                    {photos.length}/10 fotos capturadas (mínimo 3 obrigatório)
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    variant="outline"
                  >
                    Anterior
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      onClick={completeInspection}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={photos.length < 3}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Concluir e Gerar Laudo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;