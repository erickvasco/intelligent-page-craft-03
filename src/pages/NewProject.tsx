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
  X,
  Check,
  Wand2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import { createLandingPage, updateLandingPageUrls, generateLandingPage } from "@/services/landingPageService";

type Step = 1 | 2 | 3 | 4;

interface FileUpload {
  file: File;
  preview?: string;
  uploadedPath?: string;
  publicUrl?: string;
}

export default function NewProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadFile, uploading } = useFileUpload();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    contentDoc: null as FileUpload | null,
    wireframe: null as FileUpload | null,
    designInspiration: null as FileUpload | null,
  });

  const steps = [
    { number: 1, title: "Informações", icon: FileText },
    { number: 2, title: "Conteúdo", icon: Wand2 },
    { number: 3, title: "Design", icon: Palette },
    { number: 4, title: "Gerar", icon: Wand2 },
  ];

  const handleFileUpload = async (field: 'contentDoc' | 'wireframe' | 'designInspiration', file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    
    // Set the file immediately for preview
    setProjectData(prev => ({ ...prev, [field]: { file, preview } }));
    setUploadingField(field);

    // Map field to bucket
    const bucketMap: Record<string, 'content-documents' | 'wireframes' | 'design-inspirations'> = {
      contentDoc: 'content-documents',
      wireframe: 'wireframes',
      designInspiration: 'design-inspirations',
    };

    const result = await uploadFile(file, bucketMap[field]);
    
    if (result) {
      setProjectData(prev => ({
        ...prev,
        [field]: { 
          file, 
          preview, 
          uploadedPath: result.path,
          publicUrl: result.publicUrl 
        }
      }));
      toast({
        title: "Arquivo enviado!",
        description: file.name,
      });
    } else {
      toast({
        title: "Erro ao enviar arquivo",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
    
    setUploadingField(null);
  };

  const removeFile = (field: 'contentDoc' | 'wireframe' | 'designInspiration') => {
    if (projectData[field]?.preview) {
      URL.revokeObjectURL(projectData[field]!.preview!);
    }
    setProjectData({ ...projectData, [field]: null });
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar uma landing page.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // 1. Create landing page record
      const landingPage = await createLandingPage(user.id, projectData.title, projectData.description);
      
      if (!landingPage) {
        throw new Error("Falha ao criar o projeto");
      }

      // 2. Update with file URLs if any
      const urls: Record<string, string> = {};
      if (projectData.contentDoc?.publicUrl) {
        urls.original_word_doc_url = projectData.contentDoc.publicUrl;
      }
      if (projectData.wireframe?.publicUrl) {
        urls.original_wireframe_url = projectData.wireframe.publicUrl;
      }
      if (projectData.designInspiration?.publicUrl) {
        urls.inspiration_layout_url = projectData.designInspiration.publicUrl;
      }

      if (Object.keys(urls).length > 0) {
        await updateLandingPageUrls(landingPage.id, urls);
      }

      // 3. Call AI generation
      const result = await generateLandingPage({
        landingPageId: landingPage.id,
        title: projectData.title,
        description: projectData.description,
        contentDocUrl: projectData.contentDoc?.publicUrl,
        wireframeUrl: projectData.wireframe?.publicUrl,
        designInspirationUrl: projectData.designInspiration?.publicUrl,
      });

      if (!result.success) {
        throw new Error(result.error || "Falha na geração");
      }

      toast({
        title: "Landing page gerada com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Erro ao gerar landing page",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectData.title.trim().length > 0;
      case 2:
        return true;
      case 3:
        return true;
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
                  isUploading={uploadingField === 'contentDoc'}
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
                    isUploading={uploadingField === 'wireframe'}
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
                    isUploading={uploadingField === 'designInspiration'}
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
                    <span className="text-sm font-medium flex items-center gap-2">
                      {projectData.contentDoc ? (
                        <>
                          {projectData.contentDoc.uploadedPath ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {projectData.contentDoc.file.name}
                        </>
                      ) : "Não enviado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wireframe</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      {projectData.wireframe ? (
                        <>
                          {projectData.wireframe.uploadedPath ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {projectData.wireframe.file.name}
                        </>
                      ) : "Não enviado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Inspiração</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      {projectData.designInspiration ? (
                        <>
                          {projectData.designInspiration.uploadedPath ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {projectData.designInspiration.file.name}
                        </>
                      ) : "Não enviado"}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || uploading}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
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
                disabled={!canProceed() || uploading}
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
  isUploading?: boolean;
}

function FileUploadZone({ accept, file, onUpload, onRemove, icon: Icon, label, hint, isUploading }: FileUploadZoneProps) {
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
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-card hover:bg-muted transition-colors z-10"
          disabled={isUploading}
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
        
        {file.uploadedPath && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Enviado com sucesso
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
