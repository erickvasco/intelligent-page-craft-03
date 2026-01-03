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

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log("Generating landing page for:", { landingPageId, title });

    // Build the prompt based on available inputs
    let systemPrompt = `Você é um especialista em criação de landing pages de alta conversão. 
Sua tarefa é gerar o conteúdo e estrutura HTML de uma landing page moderna e responsiva.
Use classes do Tailwind CSS para estilização.
Gere uma estrutura JSON com as seções da landing page e também o HTML completo.`;

    let userPrompt = `Crie uma landing page com as seguintes informações:

**Título do Projeto:** ${title}
${description ? `**Descrição:** ${description}` : ""}

A landing page deve incluir:
1. Hero section com headline impactante e CTA
2. Seção de benefícios/features
3. Seção de como funciona
4. Seção de depoimentos (pode ser placeholder)
5. Seção de CTA final
6. Footer básico

${wireframeUrl ? "O usuário enviou um wireframe como referência de layout. Siga a estrutura visual sugerida." : ""}
${designInspirationUrl ? "O usuário enviou uma imagem de inspiração de design. Inspire-se nas cores e estilo visual." : ""}
${contentDocUrl ? "O usuário enviou um documento com conteúdo base. Use esse conteúdo como ponto de partida." : ""}

Retorne um JSON válido com a seguinte estrutura:
{
  "sections": [
    {
      "type": "hero" | "features" | "how-it-works" | "testimonials" | "cta" | "footer",
      "content": { ... dados específicos da seção ... }
    }
  ],
  "metadata": {
    "primaryColor": "#hex",
    "headline": "headline principal",
    "subheadline": "subheadline"
  }
}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
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
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content;

    console.log("AI generated content length:", generatedContent?.length);

    // Parse the generated content
    let contentJson = {};
    let generatedHtml = "";

    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contentJson = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      contentJson = { raw: generatedContent };
    }

    // Generate HTML from the content structure
    generatedHtml = generateHtmlFromContent(contentJson, title);

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

function generateHtmlFromContent(content: any, title: string): string {
  const sections = content.sections || [];
  const metadata = content.metadata || {};
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
        <div class="grid md:grid-cols-2 gap-8">
          ${testimonials.map((t: any) => `
          <div class="bg-gray-50 p-6 rounded-xl">
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
    sectionsHtml = `
    <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">${title}</h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">Sua landing page foi gerada com sucesso!</p>
        <a href="#" class="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition">
          Começar Agora
        </a>
      </div>
    </section>
    <section class="py-20 px-4 bg-white">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-bold mb-6">Edite esta página no editor</h2>
        <p class="text-gray-600">Use o editor visual para personalizar cada seção da sua landing page.</p>
      </div>
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
