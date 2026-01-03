import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface Section {
  id: string;
  type: string;
  content: Record<string, any>;
}

interface SectionEditorProps {
  section: Section;
  onUpdate: (content: Record<string, any>) => void;
}

export function SectionEditor({ section, onUpdate }: SectionEditorProps) {
  const updateField = (field: string, value: any) => {
    onUpdate({ ...section.content, [field]: value });
  };

  const updateArrayItem = (arrayField: string, index: number, field: string, value: any) => {
    const array = [...(section.content[arrayField] || [])];
    array[index] = { ...array[index], [field]: value };
    onUpdate({ ...section.content, [arrayField]: array });
  };

  const addArrayItem = (arrayField: string, defaultItem: Record<string, any>) => {
    const array = [...(section.content[arrayField] || []), defaultItem];
    onUpdate({ ...section.content, [arrayField]: array });
  };

  const removeArrayItem = (arrayField: string, index: number) => {
    const array = (section.content[arrayField] || []).filter((_: any, i: number) => i !== index);
    onUpdate({ ...section.content, [arrayField]: array });
  };

  switch (section.type) {
    case "hero":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Título Principal</Label>
              <Input
                id="headline"
                value={section.content.headline || ""}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="Seu título impactante"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheadline">Subtítulo</Label>
              <Textarea
                id="subheadline"
                value={section.content.subheadline || ""}
                onChange={(e) => updateField("subheadline", e.target.value)}
                placeholder="Descrição breve que complementa o título"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaText">Texto do Botão</Label>
              <Input
                id="ctaText"
                value={section.content.ctaText || ""}
                onChange={(e) => updateField("ctaText", e.target.value)}
                placeholder="Começar Agora"
              />
            </div>
          </CardContent>
        </Card>
      );

    case "features":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Features Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Seção</Label>
              <Input
                id="title"
                value={section.content.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Nossos Benefícios"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("features", { icon: "✨", title: "", description: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {(section.content.features || []).map((feature: any, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Feature {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("features", index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Ícone</Label>
                      <Input
                        value={feature.icon || ""}
                        onChange={(e) => updateArrayItem("features", index, "icon", e.target.value)}
                        placeholder="✨"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Título</Label>
                      <Input
                        value={feature.title || ""}
                        onChange={(e) => updateArrayItem("features", index, "title", e.target.value)}
                        placeholder="Título da feature"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea
                      value={feature.description || ""}
                      onChange={(e) => updateArrayItem("features", index, "description", e.target.value)}
                      placeholder="Descrição da feature"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case "testimonials":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Depoimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Seção</Label>
              <Input
                id="title"
                value={section.content.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="O que dizem nossos clientes"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Depoimentos</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("testimonials", { name: "", role: "", quote: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {(section.content.testimonials || []).map((testimonial: any, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Depoimento {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("testimonials", index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={testimonial.name || ""}
                        onChange={(e) => updateArrayItem("testimonials", index, "name", e.target.value)}
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cargo</Label>
                      <Input
                        value={testimonial.role || ""}
                        onChange={(e) => updateArrayItem("testimonials", index, "role", e.target.value)}
                        placeholder="CEO, Empresa X"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Depoimento</Label>
                    <Textarea
                      value={testimonial.quote || ""}
                      onChange={(e) => updateArrayItem("testimonials", index, "quote", e.target.value)}
                      placeholder="O que o cliente disse..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case "cta":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Call to Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={section.content.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Pronto para começar?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Textarea
                id="subtitle"
                value={section.content.subtitle || ""}
                onChange={(e) => updateField("subtitle", e.target.value)}
                placeholder="Junte-se a milhares de clientes satisfeitos"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaText">Texto do Botão</Label>
                <Input
                  id="ctaText"
                  value={section.content.ctaText || ""}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="Começar Agora"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaLink">Link do Botão</Label>
                <Input
                  id="ctaLink"
                  value={section.content.ctaLink || ""}
                  onChange={(e) => updateField("ctaLink", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case "how-it-works":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Seção</Label>
              <Input
                id="title"
                value={section.content.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Como Funciona"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Passos</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("steps", { title: "", description: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {(section.content.steps || []).map((step: any, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Passo {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("steps", index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Título</Label>
                    <Input
                      value={step.title || ""}
                      onChange={(e) => updateArrayItem("steps", index, "title", e.target.value)}
                      placeholder="Título do passo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea
                      value={step.description || ""}
                      onChange={(e) => updateArrayItem("steps", index, "description", e.target.value)}
                      placeholder="Descrição do passo"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Seção: {section.type}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Editor para este tipo de seção ainda não disponível.
            </p>
            <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
              {JSON.stringify(section.content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
  }
}
