import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-10 blur-xl" />
          
          <div className="relative bg-gradient-primary rounded-3xl p-8 md:p-16 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary-foreground/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary-foreground/10 rounded-full translate-x-1/3 translate-y-1/3" />
            
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Comece gratuitamente hoje</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                Pronto para criar sua próxima landing page?
              </h2>
              
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">
                Junte-se a milhares de empreendedores e profissionais de marketing que 
                já estão economizando tempo e criando landing pages de alta conversão.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="xl" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-elevated"
                  asChild
                >
                  <Link to="/auth?mode=signup">
                    Criar Conta Gratuita
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
