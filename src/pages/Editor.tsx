import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Sparkles, 
  GripVertical,
  Loader2,
  Type,
  List,
  MessageSquare,
  MousePointerClick,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SortableSection } from "@/components/editor/SortableSection";
import { SectionEditor } from "@/components/editor/SectionEditor";
import { generateLandingPage } from "@/services/landingPageService";
import { generateHtmlFromSections } from "@/lib/htmlGenerator";

interface Section {
  id: string;
  type: string;
  content: Record<string, any>;
}

interface LandingPageData {
  id: string;
  title: string;
  content_json: Record<string, any> | null;
  generated_html?: string | null;
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Generate preview HTML in real-time
  const previewHtml = useMemo(() => {
    const contentJson = { sections, metadata: (landingPage?.content_json as any)?.metadata };
    return generateHtmlFromSections(contentJson, title);
  }, [sections, title, landingPage?.content_json]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load landing page data
  useEffect(() => {
    async function loadLandingPage() {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: "Página não encontrada",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        setLandingPage({
          id: data.id,
          title: data.title,
          content_json: data.content_json as Record<string, any> | null,
          generated_html: data.generated_html,
        });
        setTitle(data.title);
        
        // Parse content_json safely
        const contentJson = data.content_json as Record<string, any> | null;
        if (contentJson?.sections && Array.isArray(contentJson.sections)) {
          setSections(contentJson.sections);
        } else {
          // Create default sections if none exist
          setSections([
            { id: "hero-1", type: "hero", content: { headline: data.title, subheadline: "", ctaText: "Saiba Mais" } },
            { id: "features-1", type: "features", content: { title: "Benefícios", features: [] } },
            { id: "cta-1", type: "cta", content: { title: "Pronto para começar?", ctaText: "Começar Agora" } },
          ]);
        }
      } catch (error) {
        console.error("Error loading landing page:", error);
        toast({
          title: "Erro ao carregar página",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadLandingPage();
  }, [id, navigate, toast]);

  // Auto-save
  useEffect(() => {
    if (!hasUnsavedChanges || !id) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, sections, title]);

  const handleSave = async (isAutoSave = false) => {
    if (!id) return;

    setSaving(true);
    try {
      const contentJson = {
        ...(landingPage?.content_json || {}),
        sections: sections as unknown as Record<string, any>[],
        metadata: {
          ...((landingPage?.content_json as any)?.metadata || {}),
          lastEdited: new Date().toISOString(),
        },
      };

      const { error } = await supabase
        .from("landing_pages")
        .update({
          title,
          content_json: contentJson as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setHasUnsavedChanges(false);
      
      if (!isAutoSave) {
        toast({
          title: "Salvo com sucesso!",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Erro ao salvar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasUnsavedChanges(true);
        return newItems;
      });
    }
  };

  const updateSection = useCallback((sectionId: string, newContent: Record<string, any>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content: newContent } : s))
    );
    setHasUnsavedChanges(true);
  }, []);

  const addSection = (type: string) => {
    const newSection: Section = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContentForType(type),
    };
    setSections([...sections, newSection]);
    setHasUnsavedChanges(true);
    setSelectedSectionId(newSection.id);
  };

  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setHasUnsavedChanges(true);
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const handleRegenerate = async () => {
    if (!id || !landingPage) return;
    
    setRegenerating(true);
    try {
      // Fetch current page data to get original URLs
      const { data: pageData } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (!pageData) throw new Error("Página não encontrada");

      const result = await generateLandingPage({
        landingPageId: id,
        title: title,
        description: (pageData.content_json as any)?.description,
        docText: pageData.doc_text || undefined,
        contentDocUrl: pageData.original_word_doc_url || undefined,
        wireframeUrl: pageData.original_wireframe_url || undefined,
        designInspirationUrl: pageData.inspiration_layout_url || undefined,
        tone: pageData.tone || undefined,
        language: pageData.language || undefined,
        targetAudience: pageData.target_audience || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Falha ao regenerar");
      }

      // Reload page data
      const { data: updatedData } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (updatedData) {
        const contentJson = updatedData.content_json as Record<string, any> | null;
        if (contentJson?.sections) {
          setSections(contentJson.sections);
        }
        setLandingPage({
          id: updatedData.id,
          title: updatedData.title,
          content_json: contentJson,
          generated_html: updatedData.generated_html,
        });
      }

      toast({
        title: "Landing page regenerada!",
        description: "O conteúdo foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Regeneration error:", error);
      toast({
        title: "Erro ao regenerar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Link>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="h-8 w-64 text-sm font-medium border-none bg-transparent hover:bg-muted/50 focus:bg-muted"
                    placeholder="Título da página"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {regenerating && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Regenerando...
                  </span>
                )}
                {hasUnsavedChanges && !regenerating && (
                  <span className="text-xs text-muted-foreground">
                    Alterações não salvas
                  </span>
                )}
                {saving && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Salvando...
                  </span>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRegenerate}
                  disabled={regenerating || saving}
                >
                  <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerar
                </Button>
                
                <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving}>
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="gradient" 
                  size="sm" 
                  onClick={() => navigate(`/preview/${id}`)}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Sections List */}
          <div className="w-80 border-r border-border bg-card/30 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Seções</h3>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      isSelected={selectedSectionId === section.id}
                      onSelect={() => setSelectedSectionId(section.id)}
                      onDelete={() => deleteSection(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Section Buttons */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Adicionar seção</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => addSection("hero")} className="justify-start">
                  <Type className="h-3 w-3 mr-1" />
                  Hero
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("features")} className="justify-start">
                  <List className="h-3 w-3 mr-1" />
                  Features
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("testimonials")} className="justify-start">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Depoimentos
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("cta")} className="justify-start">
                  <MousePointerClick className="h-3 w-3 mr-1" />
                  CTA
                </Button>
              </div>
            </div>
          </div>

          {/* Section Editor */}
          <div className={`${showPreview ? 'w-1/2' : 'flex-1'} p-6 overflow-y-auto border-r border-border`}>
            {selectedSectionId ? (
              <SectionEditor
                section={sections.find((s) => s.id === selectedSectionId)!}
                onUpdate={(content) => updateSection(selectedSectionId, content)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <GripVertical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma seção para editar</p>
                  <p className="text-sm">Arraste para reordenar</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="w-1/2 bg-muted/20 flex flex-col">
              <div className="px-4 py-2 border-b border-border bg-card/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Preview em tempo real</span>
              </div>
              <div className="flex-1 p-2">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full rounded-lg border border-border bg-white"
                  title="Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultContentForType(type: string): Record<string, any> {
  switch (type) {
    case "hero":
      return { headline: "Título Principal", subheadline: "Subtítulo descritivo", ctaText: "Começar Agora" };
    case "features":
      return { title: "Nossos Benefícios", features: [
        { icon: "✨", title: "Feature 1", description: "Descrição da feature" },
        { icon: "🚀", title: "Feature 2", description: "Descrição da feature" },
        { icon: "💡", title: "Feature 3", description: "Descrição da feature" },
      ]};
    case "testimonials":
      return { title: "O que dizem nossos clientes", testimonials: [
        { name: "Cliente 1", role: "CEO", quote: "Excelente produto!" },
      ]};
    case "cta":
      return { title: "Pronto para começar?", subtitle: "Junte-se a milhares de clientes satisfeitos", ctaText: "Começar Agora", ctaLink: "#" };
    case "how-it-works":
      return { title: "Como Funciona", steps: [
        { title: "Passo 1", description: "Descrição do passo" },
        { title: "Passo 2", description: "Descrição do passo" },
        { title: "Passo 3", description: "Descrição do passo" },
      ]};
    default:
      return {};
  }
}
