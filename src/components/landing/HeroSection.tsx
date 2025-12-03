import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, Palette, Code, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-slide-up">
            <Zap className="h-4 w-4" />
            <span>Crie landing pages em minutos, não em dias</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Transforme suas ideias em{" "}
            <span className="gradient-text">landing pages incríveis</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Use inteligência artificial para converter documentos, wireframes e inspirações em 
            landing pages profissionais. Publique diretamente no seu CMS com um clique.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Começar Gratuitamente
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="#how-it-works">Ver Demonstração</Link>
            </Button>
          </div>
          
          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Upload de Documentos</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Análise de Design</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Código Gerado por IA</span>
            </div>
          </div>
        </div>
        
        {/* Hero visual */}
        <div className="mt-16 md:mt-20 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border/50">
            <div className="aspect-video bg-gradient-to-br from-primary/5 via-card to-accent/5 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-3xl">
                <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="h-2 w-16 bg-muted rounded-full" />
                  <div className="h-2 w-12 bg-muted/50 rounded-full" />
                </div>
                <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                  <div className="h-2 w-16 bg-muted rounded-full" />
                  <div className="h-2 w-12 bg-muted/50 rounded-full" />
                </div>
                <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div className="h-2 w-16 bg-muted rounded-full" />
                  <div className="h-2 w-12 bg-muted/50 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
