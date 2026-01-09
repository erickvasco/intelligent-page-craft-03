// Utility function to generate HTML from content_json sections
export function generateHtmlFromSections(contentJson: Record<string, any> | null, title: string): string {
  if (!contentJson) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="antialiased">
  <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-bold mb-6">${title}</h1>
      <p class="text-xl md:text-2xl mb-8 opacity-90">Sua landing page está sendo gerada...</p>
    </div>
  </section>
</body>
</html>`;
  }

  const sections = contentJson.sections || [];
  let sectionsHtml = "";

  for (const section of sections) {
    switch (section.type) {
      case "hero":
        sectionsHtml += `
    <section class="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">${section.content?.headline || title}</h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">${section.content?.subheadline || ""}</p>
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

      case "testimonials":
        const testimonials = section.content?.testimonials || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-gray-50">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${section.content?.title || "O que dizem nossos clientes"}</h2>
        <div class="grid md:grid-cols-2 gap-8">
          ${testimonials.map((t: any) => `
          <div class="bg-white p-6 rounded-xl shadow-sm">
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

      case "how-it-works":
        const steps = section.content?.steps || [];
        sectionsHtml += `
    <section class="py-20 px-4 bg-white">
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

  // Add default footer if none exists
  if (!sections.some((s: any) => s.type === "footer")) {
    sectionsHtml += `
    <footer class="py-8 px-4 bg-gray-900 text-white">
      <div class="max-w-6xl mx-auto text-center">
        <p class="text-gray-400">© ${new Date().getFullYear()} ${title}. Todos os direitos reservados.</p>
      </div>
    </footer>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="antialiased">
  ${sectionsHtml}
</body>
</html>`;
}
