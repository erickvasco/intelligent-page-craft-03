import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Envie seus arquivos",
    description: "Faça upload do documento de conteúdo, wireframe e exemplos de design que inspiram você.",
  },
  {
    number: "02",
    title: "IA processa tudo",
    description: "Nossa inteligência artificial analisa os arquivos e gera conteúdo, layout e código otimizados.",
  },
  {
    number: "03",
    title: "Revise e edite",
    description: "Use nosso editor visual para fazer ajustes finais no texto, cores e layout.",
  },
  {
    number: "04",
    title: "Publique com um clique",
    description: "Conecte seu WordPress e publique diretamente, ou exporte o código para usar onde quiser.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground">
            Quatro passos simples para transformar sua ideia em uma landing page profissional
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="flex items-start gap-6 group"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-8 pt-6">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
