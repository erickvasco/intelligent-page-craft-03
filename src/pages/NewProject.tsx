import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
import { extractTextFromDocx, isDocxFile } from "@/lib/docxExtractor";

type Step = 1 | 2 | 3 | 4;

interface FileUpload {
  file: File;
  preview?: string;
  uploadedPath?: string;
  publicUrl?: string;
  extractedText?: string;
}

export default function NewProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadFile, uploading } = useFileUpload();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    tone: "professional",
    language: "pt-BR",
    targetAudience: "",
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

    // Extract text from DOCX files
    let extractedText: string | undefined;
    if (field === 'contentDoc' && isDocxFile(file)) {
      try {
        extractedText = await extractTextFromDocx(file);
        toast({
          title: "Texto extraído!",
          description: `${extractedText.split(/\s+/).length} palavras encontradas`,
        });
      } catch (error) {
        console.error("DOCX extraction error:", error);
        toast({
          title: "Aviso",
          description: "Não foi possível extrair texto do documento",
          variant: "destructive",
        });
      }
    }

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
          publicUrl: result.publicUrl,
          extractedText,
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
    setGenerationStep(1);
    
    try {
      // 1. Create landing page record
      setGenerationStep(1);
      const landingPage = await createLandingPage(user.id, projectData.title, projectData.description);
      
      if (!landingPage) {
        throw new Error("Falha ao criar o projeto");
      }

      // 2. Update with file URLs and extra fields
      const updateData: Record<string, string> = {};
      if (projectData.contentDoc?.publicUrl) {
        updateData.original_word_doc_url = projectData.contentDoc.publicUrl;
      }
      if (projectData.wireframe?.publicUrl) {
        updateData.original_wireframe_url = projectData.wireframe.publicUrl;
      }
      if (projectData.designInspiration?.publicUrl) {
        updateData.inspiration_layout_url = projectData.designInspiration.publicUrl;
      }
      if (projectData.contentDoc?.extractedText) {
        updateData.doc_text = projectData.contentDoc.extractedText;
      }
      if (projectData.tone) {
        updateData.tone = projectData.tone;
      }
      if (projectData.language) {
        updateData.language = projectData.language;
      }
      if (projectData.targetAudience) {
        updateData.target_audience = projectData.targetAudience;
      }

      if (Object.keys(updateData).length > 0) {
        await updateLandingPageUrls(landingPage.id, updateData);
      }

      // 3. Call AI generation
      setGenerationStep(2);
      const result = await generateLandingPage({
        landingPageId: landingPage.id,
        title: projectData.title,
        description: projectData.description,
        docText: projectData.contentDoc?.extractedText,
        contentDocUrl: projectData.contentDoc?.publicUrl,
        wireframeUrl: projectData.wireframe?.publicUrl,
        designInspirationUrl: projectData.designInspiration?.publicUrl,
        tone: projectData.tone,
        language: projectData.language,
        targetAudience: projectData.targetAudience,
      });

      if (!result.success) {
        throw new Error(result.error || "Falha na geração");
      }

      setGenerationStep(3);
      
      toast({
        title: "Landing page gerada com sucesso!",
        description: "Você será redirecionado para o editor.",
      });
      
      // Navigate to editor instead of dashboard
      navigate(`/editor/${landingPage.id}`);
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Erro ao gerar landing page",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
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
                    rows={3}
                    value={projectData.description}
                    onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tom de voz</Label>
                    <Select
                      value={projectData.tone}
                      onValueChange={(value) => setProjectData({ ...projectData, tone: value })}
                    >
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="playful">Divertido</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="friendly">Amigável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={projectData.language}
                      onValueChange={(value) => setProjectData({ ...projectData, language: value })}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en">Inglês</SelectItem>
                        <SelectItem value="es">Espanhol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Público-alvo (opcional)</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Descreva seu público-alvo: idade, interesses, profissão..."
                    rows={2}
                    value={projectData.targetAudience}
                    onChange={(e) => setProjectData({ ...projectData, targetAudience: e.target.value })}
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
                <CardTitle className="text-2xl">
                  {isGenerating ? "Gerando sua landing page..." : "Pronto para gerar!"}
                </CardTitle>
                <CardDescription className="text-base">
                  {isGenerating 
                    ? "Aguarde enquanto nossa IA cria sua página"
                    : "Nossa IA vai analisar seus arquivos e criar uma landing page personalizada"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generation Progress */}
                {isGenerating && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Progress value={generationStep * 33} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      {[
                        { step: 1, label: "Criando projeto..." },
                        { step: 2, label: "Analisando documentos e gerando conteúdo..." },
                        { step: 3, label: "Finalizando..." },
                      ].map((item) => (
                        <div 
                          key={item.step}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all",
                            generationStep >= item.step ? "bg-accent/50" : "bg-muted/30",
                            generationStep === item.step && "ring-2 ring-primary/20"
                          )}
                        >
                          {generationStep > item.step ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : generationStep === item.step ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span className={cn(
                            "text-sm",
                            generationStep >= item.step ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary - only show when not generating */}
                {!isGenerating && (
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Projeto</span>
                      <span className="text-sm font-medium">{projectData.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tom de voz</span>
                      <span className="text-sm font-medium capitalize">{projectData.tone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Idioma</span>
                      <span className="text-sm font-medium">{projectData.language === 'pt-BR' ? 'Português' : projectData.language}</span>
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
                )}

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
