import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerationRequest {
  landingPageId: string;
  title: string;
  description?: string;
  contentDocUrl?: string;
  wireframeUrl?: string;
  designInspirationUrl?: string;
}

interface SectionContent {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  title?: string;
  subtitle?: string;
  features?: Array<{ icon?: string; title: string; description: string }>;
  steps?: Array<{ title: string; description: string }>;
  testimonials?: Array<{ quote: string; name: string; role?: string }>;
  copyright?: string;
}

interface Section {
  type: "hero" | "features" | "how-it-works" | "testimonials" | "cta" | "footer";
  content: SectionContent;
}

interface LandingPageSchema {
  sections: Section[];
  metadata: {
    primaryColor: string;
    headline: string;
    subheadline: string;
  };
}

// Tool definition for structured output
const landingPageTool = {
  type: "function",
  function: {
    name: "generate_landing_page",
    description: "Generates a complete landing page structure with all sections and content.",
    parameters: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          description: "Array of landing page sections in order",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["hero", "features", "how-it-works", "testimonials", "cta", "footer"],
                description: "Type of section"
              },
              content: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Main headline for hero section" },
                  subheadline: { type: "string", description: "Subheadline or supporting text" },
                  ctaText: { type: "string", description: "Call to action button text" },
                  ctaLink: { type: "string", description: "Call to action link" },
                  title: { type: "string", description: "Section title" },
                  subtitle: { type: "string", description: "Section subtitle" },
                  features: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        icon: { type: "string", description: "Emoji icon for the feature" },
                        title: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["title", "description"]
                    }
                  },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["title", "description"]
                    }
                  },
                  testimonials: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        quote: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string" }
                      },
                      required: ["quote", "name"]
                    }
                  },
                  copyright: { type: "string", description: "Copyright text for footer" }
                }
              }
            },
            required: ["type", "content"]
          }
        },
        metadata: {
          type: "object",
          properties: {
            primaryColor: { type: "string", description: "Primary color in hex format (e.g., #6366f1)" },
            headline: { type: "string", description: "Main headline of the page" },
            subheadline: { type: "string", description: "Main subheadline" }
          },
          required: ["primaryColor", "headline", "subheadline"]
        }
      },
      required: ["sections", "metadata"]
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: GenerationRequest = await req.json();
    const { landingPageId, title, description, contentDocUrl, wireframeUrl, designInspirationUrl } = requestData;

    console.log("Generating landing page for:", { landingPageId, title, wireframeUrl, designInspirationUrl, contentDocUrl });

    // Build messages with multimodal support
    const messages: any[] = [];

    // System message
    const systemPrompt = `Você é um especialista em criação de landing pages de alta conversão para o mercado brasileiro.
    
Sua tarefa é gerar uma landing page COMPLETA e PERSONALIZADA baseada nas informações fornecidas pelo usuário.

REGRAS IMPORTANTES:
1. NUNCA gere conteúdo genérico ou placeholder. Todo texto deve ser específico para o projeto.
2. Se o usuário fornecer um wireframe ou inspiração visual, analise a ESTRUTURA e LAYOUT da imagem para criar seções correspondentes.
3. Se o usuário fornecer uma descrição, use-a como base para todo o conteúdo.
4. Gere headlines persuasivas e copy que converte.
5. Adapte o número e tipo de seções baseado no contexto do projeto.
6. Use cores que façam sentido para o nicho do projeto.
7. Crie pelo menos 3-4 features/benefícios relevantes.
8. Os testimonials devem parecer reais e específicos ao produto/serviço.

ESTRUTURA DAS SEÇÕES:
- hero: headline impactante, subheadline persuasiva, CTA claro
- features: lista de benefícios com ícones (emojis) e descrições
- how-it-works: passos claros de como funciona
- testimonials: depoimentos com nome e cargo
- cta: chamada final para ação
- footer: copyright e informações legais`;

    messages.push({ role: "system", content: systemPrompt });

    // User message with images if available
    const userContent: any[] = [];

    // Text content first
    let textPrompt = `Crie uma landing page completa para o seguinte projeto:

**Título:** ${title}
${description ? `**Descrição:** ${description}` : ""}

`;

    if (wireframeUrl) {
      textPrompt += `\n**IMPORTANTE:** Analise o wireframe/esboço fornecido na imagem. Use a ESTRUTURA e DISPOSIÇÃO dos elementos como guia para organizar as seções da landing page. Identifique quantas seções existem, sua ordem e layout.`;
    }

    if (designInspirationUrl) {
      textPrompt += `\n**IMPORTANTE:** Analise a imagem de inspiração fornecida. Extraia as CORES, ESTILO VISUAL e TIPOGRAFIA para aplicar na landing page. Use cores similares no primaryColor.`;
    }

    if (contentDocUrl) {
      textPrompt += `\n**IMPORTANTE:** Um documento de conteúdo foi fornecido (${contentDocUrl}). Use o texto e informações desse documento como base para o conteúdo da landing page.`;
    }

    textPrompt += `\n\nGere a landing page usando a função generate_landing_page. Inclua:
- Seção hero com headline impactante baseada no título "${title}"
- Seção de features/benefícios (mínimo 3 itens)
- Seção como funciona (3-4 passos)
- Seção de depoimentos (2-3 testimonials)
- Seção CTA final
- Footer com copyright`;

    userContent.push({ type: "text", text: textPrompt });

    // Add wireframe image if available (convert to data URL so the AI gateway can always fetch it)
    if (wireframeUrl) {
      try {
        console.log("Preparing wireframe image for prompt (data URL)...");
        const dataUrl = await downloadImageAsDataUrlFromStoragePublicUrl(supabase, wireframeUrl);
        userContent.push({
          type: "image_url",
          image_url: { url: dataUrl },
        });
      } catch (e) {
        console.warn("Failed to load wireframe image, continuing without it:", e);
      }
    }

    // Add design inspiration image if available (convert to data URL so the AI gateway can always fetch it)
    if (designInspirationUrl) {
      try {
        console.log("Preparing design inspiration image for prompt (data URL)...");
        const dataUrl = await downloadImageAsDataUrlFromStoragePublicUrl(supabase, designInspirationUrl);
        userContent.push({
          type: "image_url",
          image_url: { url: dataUrl },
        });
      } catch (e) {
        console.warn("Failed to load inspiration image, continuing without it:", e);
      }
    }

    messages.push({ role: "user", content: userContent });

    // Call Lovable AI Gateway with tool calling for structured output
    console.log("Calling AI with tool calling...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        tools: [landingPageTool],
        tool_choice: { type: "function", function: { name: "generate_landing_page" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione mais créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract structured data from tool call
    let contentJson: LandingPageSchema | null = null;
    
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      if (toolCall.function?.name === "generate_landing_page") {
        try {
          contentJson = JSON.parse(toolCall.function.arguments);
          console.log("Successfully parsed tool call response");
        } catch (parseError) {
          console.error("Error parsing tool call arguments:", parseError);
        }
      }
    }

    // Fallback: try to extract from message content if tool call failed
    if (!contentJson) {
      const messageContent = aiData.choices?.[0]?.message?.content;
      if (messageContent) {
        console.log("Trying to extract JSON from message content...");
        try {
          const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            contentJson = JSON.parse(jsonMatch[0]);
            console.log("Extracted JSON from message content");
          }
        } catch (parseError) {
          console.error("Error parsing message content:", parseError);
        }
      }
    }

    // If still no content, create a personalized fallback based on title
    if (!contentJson || !contentJson.sections || contentJson.sections.length === 0) {
      console.log("Creating personalized fallback content for:", title);
      contentJson = createPersonalizedFallback(title, description);
    }

    // Generate HTML from the content structure
    const generatedHtml = generateHtmlFromContent(contentJson, title);
    console.log("Generated HTML length:", generatedHtml.length);

    // Update the landing page in the database
    const { error: updateError } = await supabase
      .from("landing_pages")
      .update({
        content_json: contentJson,
        generated_html: generatedHtml,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", landingPageId);

    if (updateError) {
      console.error("Error updating landing page:", updateError);
      throw new Error("Failed to save generated content");
    }

    console.log("Landing page updated successfully:", landingPageId);

    return new Response(
      JSON.stringify({
        success: true,
        landingPageId,
        contentJson,
        message: "Landing page gerada com sucesso!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-landing-page:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseStoragePublicObjectUrl(storagePublicUrl: string): { bucket: string; path: string } {
  const u = new URL(storagePublicUrl);
  const marker = "/storage/v1/object/public/";
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) throw new Error("Unsupported storage URL format");

  const rest = u.pathname.slice(idx + marker.length);
  const [bucket, ...pathParts] = rest.split("/");
  const path = pathParts.join("/");
  if (!bucket || !path) throw new Error("Invalid storage URL");

  return { bucket, path: decodeURIComponent(path) };
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function downloadImageAsDataUrlFromStoragePublicUrl(
  supabase: any,
  storagePublicUrl: string
): Promise<string> {
  const { bucket, path } = parseStoragePublicObjectUrl(storagePublicUrl);

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download from storage: ${error?.message || "unknown error"}`);
  }

  const mime = data.type || "image/png";
  const base64 = arrayBufferToBase64(await data.arrayBuffer());
  return `data:${mime};base64,${base64}`;
}

function createPersonalizedFallback(title: string, description?: string): LandingPageSchema {
  const headline = title;
  const subheadline = description || `Descubra tudo sobre ${title} e transforme sua experiência`;
  
  return {
    sections: [
      {
        type: "hero",
        content: {
          headline,
          subheadline,
          ctaText: "Começar Agora",
          ctaLink: "#cta"
        }
      },
      {
        type: "features",
        content: {
          title: "Por que escolher " + title + "?",
          features: [
            { icon: "🚀", title: "Rápido e Eficiente", description: "Resultados em tempo recorde com a máxima qualidade." },
            { icon: "💡", title: "Inovador", description: "Tecnologia de ponta para resolver seus problemas." },
            { icon: "🎯", title: "Focado em Resultados", description: "Cada detalhe pensado para maximizar seu sucesso." },
            { icon: "🛡️", title: "Seguro e Confiável", description: "Sua tranquilidade é nossa prioridade." }
          ]
        }
      },
      {
        type: "how-it-works",
        content: {
          title: "Como Funciona",
          steps: [
            { title: "Cadastre-se", description: "Crie sua conta em menos de 2 minutos." },
            { title: "Configure", description: "Personalize de acordo com suas necessidades." },
            { title: "Aproveite", description: "Comece a usar e veja os resultados." }
          ]
        }
      },
      {
        type: "testimonials",
        content: {
          title: "O que nossos clientes dizem",
          testimonials: [
            { quote: "Simplesmente transformou a forma como trabalho. Recomendo!", name: "Maria Silva", role: "Empreendedora" },
            { quote: "Resultado incrível e suporte excepcional.", name: "João Santos", role: "Gerente de Marketing" }
          ]
        }
      },
      {
        type: "cta",
        content: {
          title: "Pronto para começar?",
          subtitle: "Junte-se a milhares de pessoas que já estão aproveitando.",
          ctaText: "Começar Gratuitamente",
          ctaLink: "#"
        }
      },
      {
        type: "footer",
        content: {
          copyright: `© ${new Date().getFullYear()} ${title}. Todos os direitos reservados.`
        }
      }
    ],
    metadata: {
      primaryColor: "#6366f1",
      headline,
      subheadline
    }
  };
}

function generateHtmlFromContent(content: LandingPageSchema, title: string): string {
  const sections = content.sections || [];
  const metadata = content.metadata || { primaryColor: "#6366f1", headline: title, subheadline: "" };
  const primaryColor = metadata.primaryColor || "#6366f1";

  let sectionsHtml = "";

  for (const section of sections) {
    switch (section.type) {
      case "hero":
        sectionsHtml += `
    <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">${section.content?.headline || metadata.headline || title}</h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">${section.content?.subheadline || metadata.subheadline || ""}</p>
        <a href="${section.content?.ctaLink || "#cta"}" class="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition">
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
        <div class="grid md:grid-cols-${Math.min(features.length, 4)} gap-8">
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

      case "how-it-works":
        const steps = section.content?.steps || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-gray-50">
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

      case "testimonials":
        const testimonials = section.content?.testimonials || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${section.content?.title || "O que dizem nossos clientes"}</h2>
        <div class="grid md:grid-cols-${Math.min(testimonials.length, 3)} gap-8">
          ${testimonials.map((t: any) => `
          <div class="bg-gray-50 p-6 rounded-xl">
            <p class="text-gray-700 mb-4">"${t.quote || ""}"</p>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center">
                <span class="text-indigo-600 font-semibold">${(t.name || "A")[0]}</span>
              </div>
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

      case "footer":
        sectionsHtml += `
    <footer class="py-8 px-4 bg-gray-900 text-white">
      <div class="max-w-6xl mx-auto text-center">
        <p class="text-gray-400">${section.content?.copyright || `© ${new Date().getFullYear()} ${title}. Todos os direitos reservados.`}</p>
      </div>
    </footer>`;
        break;
    }
  }

  // If no sections were generated, create a basic template
  if (!sectionsHtml) {
    console.warn("No sections HTML generated - this should not happen!");
    sectionsHtml = `
    <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">${title}</h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">Sua landing page está sendo preparada...</p>
      </div>
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metadata.subheadline || title}">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary-color: ${primaryColor};
    }
  </style>
</head>
<body class="antialiased">
  ${sectionsHtml}
</body>
</html>`;
}
