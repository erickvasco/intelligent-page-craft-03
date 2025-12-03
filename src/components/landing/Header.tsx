import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">PageForge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </Link>
            <Link to="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </Link>
            <Link to="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/auth?mode=signup">Começar Grátis</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link to="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </Link>
              <Link to="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Como Funciona
              </Link>
              <Link to="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="ghost" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/auth?mode=signup">Começar Grátis</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
