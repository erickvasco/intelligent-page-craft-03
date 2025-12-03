import { Card, CardContent } from "@/components/ui/card";
import { 
  FileUp, 
  Wand2, 
  Eye, 
  Upload, 
  Palette, 
  Layout,
  Sparkles,
  Rocket
} from "lucide-react";

const features = [
  {
    icon: FileUp,
    title: "Upload de Conteúdo",
    description: "Envie seu documento Word ou Google Docs com o texto base da landing page.",
  },
  {
    icon: Layout,
    title: "Análise de Wireframe",
    description: "Faça upload de esboços ou wireframes e nossa IA interpreta a estrutura.",
  },
  {
    icon: Palette,
    title: "Inspiração de Design",
    description: "Compartilhe exemplos de layouts que você gosta para extrair estilos e cores.",
  },
  {
    icon: Wand2,
    title: "Geração com IA",
    description: "Nossa inteligência artificial cria conteúdo otimizado e design profissional.",
  },
  {
    icon: Eye,
    title: "Preview Interativo",
    description: "Visualize e edite sua landing page antes de publicar.",
  },
  {
    icon: Rocket,
    title: "Publicação Direta",
    description: "Publique no WordPress ou exporte o código com um clique.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Recursos Poderosos</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Tudo que você precisa para criar landing pages
          </h2>
          <p className="text-lg text-muted-foreground">
            Do documento à publicação em minutos. Nossa plataforma automatiza cada etapa do processo.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              variant="elevated"
              className="group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
