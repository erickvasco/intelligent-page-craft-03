import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative text-center animate-slide-up">
        <h1 className="text-8xl md:text-9xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="gradient" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
