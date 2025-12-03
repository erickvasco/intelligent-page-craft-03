import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  FileText, 
  Layout, 
  Palette,
  Upload,
  X,
  Check,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

interface FileUpload {
  file: File;
  preview?: string;
}

export default function NewProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    contentDoc: null as FileUpload | null,
    wireframe: null as FileUpload | null,
    designInspiration: null as FileUpload | null,
  });

  const steps = [
    { number: 1, title: "Informações", icon: FileText },
    { number: 2, title: "Conteúdo", icon: Upload },
    { number: 3, title: "Design", icon: Palette },
    { number: 4, title: "Gerar", icon: Wand2 },
  ];

  const handleFileUpload = (field: 'contentDoc' | 'wireframe' | 'designInspiration', file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setProjectData({ ...projectData, [field]: { file, preview } });
  };

  const removeFile = (field: 'contentDoc' | 'wireframe' | 'designInspiration') => {
    if (projectData[field]?.preview) {
      URL.revokeObjectURL(projectData[field]!.preview!);
    }
    setProjectData({ ...projectData, [field]: null });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Landing page gerada com sucesso!",
        description: "Você será redirecionado para o editor.",
      });
      navigate("/dashboard");
    }, 3000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectData.title.trim().length > 0;
      case 2:
        return true; // Content doc is optional
      case 3:
        return true; // Design files are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <div className="h-6 w-px bg-border" />
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Nova Landing Page</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive && "bg-gradient-primary shadow-glow",
                        isCompleted && "bg-accent",
                        !isActive && !isCompleted && "bg-muted"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-accent-foreground" />
                      ) : (
                        <StepIcon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm mt-2 font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-full h-1 mx-4 rounded-full",
                      currentStep > step.number ? "bg-accent" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle>Informações do Projeto</CardTitle>
                <CardDescription>
                  Dê um nome e descreva brevemente sua landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Nome do projeto *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Lançamento do Produto X"
                    value={projectData.title}
                    onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o objetivo da landing page..."
                    rows={4}
                    value={projectData.description}
                    onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle>Documento de Conteúdo</CardTitle>
                <CardDescription>
                  Envie um documento Word ou Google Docs com o texto base da sua landing page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  accept=".doc,.docx,.txt,.pdf"
                  file={projectData.contentDoc}
                  onUpload={(file) => handleFileUpload('contentDoc', file)}
                  onRemove={() => removeFile('contentDoc')}
                  icon={FileText}
                  label="Arraste seu documento ou clique para selecionar"
                  hint="Suporta DOC, DOCX, TXT, PDF"
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Wireframe / Esboço</CardTitle>
                  <CardDescription>
                    Envie uma imagem do seu wireframe ou esboço de layout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadZone
                    accept="image/*"
                    file={projectData.wireframe}
                    onUpload={(file) => handleFileUpload('wireframe', file)}
                    onRemove={() => removeFile('wireframe')}
                    icon={Layout}
                    label="Arraste sua imagem ou clique para selecionar"
                    hint="Suporta JPG, PNG, GIF"
                  />
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Inspiração de Design</CardTitle>
                  <CardDescription>
                    Envie uma imagem de um layout que você gosta como referência
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadZone
                    accept="image/*"
                    file={projectData.designInspiration}
                    onUpload={(file) => handleFileUpload('designInspiration', file)}
                    onRemove={() => removeFile('designInspiration')}
                    icon={Palette}
                    label="Arraste sua imagem ou clique para selecionar"
                    hint="Suporta JPG, PNG, GIF"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 4 && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Wand2 className="h-10 w-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Pronto para gerar!</CardTitle>
                <CardDescription className="text-base">
                  Nossa IA vai analisar seus arquivos e criar uma landing page personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projeto</span>
                    <span className="text-sm font-medium">{projectData.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Documento de conteúdo</span>
                    <span className="text-sm font-medium">
                      {projectData.contentDoc ? projectData.contentDoc.file.name : "Não enviado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wireframe</span>
                    <span className="text-sm font-medium">
                      {projectData.wireframe ? projectData.wireframe.file.name : "Não enviado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Inspiração</span>
                    <span className="text-sm font-medium">
                      {projectData.designInspiration ? projectData.designInspiration.file.name : "Não enviado"}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Gerando sua landing page...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Gerar Landing Page
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            {currentStep < 4 && (
              <Button
                variant="gradient"
                onClick={() => setCurrentStep((prev) => (prev + 1) as Step)}
                disabled={!canProceed()}
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface FileUploadZoneProps {
  accept: string;
  file: FileUpload | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  icon: React.ElementType;
  label: string;
  hint: string;
}

function FileUploadZone({ accept, file, onUpload, onRemove, icon: Icon, label, hint }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onUpload(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  if (file) {
    return (
      <div className="relative border-2 border-dashed border-accent rounded-xl p-6 bg-accent/5">
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-card hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        {file.preview ? (
          <img 
            src={file.preview} 
            alt="Preview" 
            className="max-h-48 mx-auto rounded-lg object-contain"
          />
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-medium">{file.file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="sr-only"
      />
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-center">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </label>
  );
}
