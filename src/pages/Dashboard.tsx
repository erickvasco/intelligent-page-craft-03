import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Plus, 
  Search, 
  MoreVertical, 
  ExternalLink, 
  Edit, 
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  LogOut,
  User,
  Archive,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type LandingPageStatus = "draft" | "published" | "archived";

interface LandingPage {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  status: LandingPageStatus;
  content_json: Record<string, unknown> | null;
  generated_html: string | null;
  original_word_doc_url: string | null;
  original_wireframe_url: string | null;
  inspiration_layout_url: string | null;
  published_cms_url: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<LandingPageStatus, { label: string; icon: typeof Clock; className: string }> = {
  draft: { label: "Rascunho", icon: Clock, className: "text-muted-foreground bg-muted" },
  published: { label: "Publicado", icon: CheckCircle, className: "text-accent bg-accent/10" },
  archived: { label: "Arquivado", icon: Archive, className: "text-muted-foreground bg-muted" },
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch landing pages from database
  const { data: landingPages = [], isLoading, error } = useQuery({
    queryKey: ["landing-pages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("landing_pages" as never)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as LandingPage[];
    },
    enabled: !!user?.id,
  });

  // Delete landing page mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("landing_pages" as never)
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      toast({
        title: "Landing page excluída",
        description: "A landing page foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a landing page.",
        variant: "destructive",
      });
    },
  });

  const filteredProjects = landingPages.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta.",
    });
    navigate("/");
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">PageForge</span>
            </Link>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground border-b border-border mb-1">
                    {user?.email}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Landing Pages</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e crie suas landing pages
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/new-project">
              <Plus className="h-4 w-4" />
              Nova Landing Page
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card variant="elevated" className="text-center py-16">
            <CardContent>
              <p className="text-destructive">Erro ao carregar landing pages. Tente novamente.</p>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && (
          <>
            {filteredProjects.length === 0 ? (
              <Card variant="elevated" className="text-center py-16">
                <CardContent>
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? "Tente uma busca diferente" 
                      : "Crie sua primeira landing page para começar"}
                  </p>
                  {!searchQuery && (
                    <Button variant="gradient" asChild>
                      <Link to="/new-project">
                        <Plus className="h-4 w-4" />
                        Criar Landing Page
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const status = statusConfig[project.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={project.id} variant="elevated" className="group overflow-hidden">
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gradient-to-br from-primary/5 via-muted to-accent/5 flex items-center justify-center border-b border-border">
                        <FileText className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                            <CardDescription className="mt-1">
                              Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {project.published_cms_url && (
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => window.open(project.published_cms_url!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-destructive"
                                onClick={() => handleDelete(project.id, project.title)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
