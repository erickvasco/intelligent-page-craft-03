import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Pencil, 
  Globe, 
  Download, 
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  type: string;
  content: Record<string, any>;
}

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [landingPage, setLandingPage] = useState<{
    id: string;
    title: string;
    status: string;
    generated_html: string | null;
    content_json: Record<string, any> | null;
    slug: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadLandingPage() {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("landing_pages")
          .select("id, title, status, generated_html, content_json, slug")
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
          ...data,
          content_json: data.content_json as Record<string, any> | null,
        });
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

  const handlePublish = async () => {
    if (!id) return;
    
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("landing_pages")
        .update({ status: "published" })
        .eq("id", id);

      if (error) throw error;

      setLandingPage((prev) => prev ? { ...prev, status: "published" } : null);
      
      toast({
        title: "Landing page publicada!",
        description: "Sua página está pronta para ser compartilhada.",
      });
    } catch (error) {
      console.error("Error publishing:", error);
      toast({
        title: "Erro ao publicar",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleExportHTML = () => {
    if (!landingPage?.generated_html) {
      // Generate HTML from content_json if no generated_html exists
      const html = generateHtmlFromSections(landingPage?.content_json, landingPage?.title || "");
      downloadHtml(html, landingPage?.title || "landing-page");
    } else {
      downloadHtml(landingPage.generated_html, landingPage.title);
    }
  };

  const downloadHtml = (html: string, title: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "HTML exportado!",
      description: "O arquivo foi baixado.",
    });
  };

  const handleCopyHTML = async () => {
    const html = landingPage?.generated_html || 
      generateHtmlFromSections(landingPage?.content_json, landingPage?.title || "");
    
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast({
      title: "HTML copiado!",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const previewHtml = landingPage?.generated_html || 
    generateHtmlFromSections(landingPage?.content_json, landingPage?.title || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                <span className="font-medium">{landingPage?.title}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  landingPage?.status === "published" 
                    ? "bg-green-500/20 text-green-600" 
                    : "bg-yellow-500/20 text-yellow-600"
                )}>
                  {landingPage?.status === "published" ? "Publicado" : "Rascunho"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/editor/${id}`)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyHTML}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar HTML"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportHTML}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              
              {landingPage?.status !== "published" && (
                <Button 
                  variant="gradient" 
                  size="sm" 
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Publicar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Preview Area */}
      <div className="flex-1 p-4 sm:p-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="bg-muted/50 border-b border-border py-2 px-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background/80 rounded px-4 py-1 text-xs text-muted-foreground flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    {landingPage?.slug ? `seusite.com/${landingPage.slug}` : "preview"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[600px] border-0"
                title="Landing Page Preview"
                sandbox="allow-scripts"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function generateHtmlFromSections(contentJson: Record<string, any> | null, title: string): string {
  if (!contentJson) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="antialiased">
  <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-bold mb-6">${title}</h1>
      <p class="text-xl md:text-2xl mb-8 opacity-90">Sua landing page está sendo gerada...</p>
    </div>
  </section>
</body>
</html>`;
  }

  const sections = contentJson.sections || [];
  let sectionsHtml = "";

  for (const section of sections) {
    switch (section.type) {
      case "hero":
        sectionsHtml += `
    <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">${section.content?.headline || title}</h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">${section.content?.subheadline || ""}</p>
        <a href="#cta" class="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition">
          ${section.content?.ctaText || "Começar Agora"}
        </a>
      </div>
    </section>`;
        break;

      case "features":
        const features = section.content?.features || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${section.content?.title || "Por que escolher?"}</h2>
        <div class="grid md:grid-cols-3 gap-8">
          ${features.map((f: any) => `
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">${f.icon || "✨"}</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">${f.title || ""}</h3>
            <p class="text-gray-600">${f.description || ""}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>`;
        break;

      case "testimonials":
        const testimonials = section.content?.testimonials || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-gray-50">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${section.content?.title || "O que dizem nossos clientes"}</h2>
        <div class="grid md:grid-cols-2 gap-8">
          ${testimonials.map((t: any) => `
          <div class="bg-white p-6 rounded-xl shadow-sm">
            <p class="text-gray-700 mb-4">"${t.quote || ""}"</p>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <p class="font-semibold">${t.name || "Cliente"}</p>
                <p class="text-sm text-gray-500">${t.role || ""}</p>
              </div>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </section>`;
        break;

      case "cta":
        sectionsHtml += `
    <section id="cta" class="py-20 px-4 bg-indigo-600 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">${section.content?.title || "Pronto para começar?"}</h2>
        <p class="text-xl mb-8 opacity-90">${section.content?.subtitle || ""}</p>
        <a href="${section.content?.ctaLink || "#"}" class="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition">
          ${section.content?.ctaText || "Começar Agora"}
        </a>
      </div>
    </section>`;
        break;

      case "how-it-works":
        const steps = section.content?.steps || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${section.content?.title || "Como Funciona"}</h2>
        <div class="space-y-8">
          ${steps.map((s: any, i: number) => `
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">${i + 1}</div>
            <div>
              <h3 class="text-xl font-semibold mb-2">${s.title || ""}</h3>
              <p class="text-gray-600">${s.description || ""}</p>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </section>`;
        break;
    }
  }

  // Add footer
  sectionsHtml += `
    <footer class="py-8 px-4 bg-gray-900 text-white">
      <div class="max-w-6xl mx-auto text-center">
        <p class="text-gray-400">© ${new Date().getFullYear()} ${title}. Todos os direitos reservados.</p>
      </div>
    </footer>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="antialiased">
  ${sectionsHtml}
</body>
</html>`;
}
