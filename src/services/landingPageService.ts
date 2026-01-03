import { supabase } from "@/integrations/supabase/client";

interface GenerateLandingPageParams {
  landingPageId: string;
  title: string;
  description?: string;
  contentDocUrl?: string;
  wireframeUrl?: string;
  designInspirationUrl?: string;
}

interface GenerationResult {
  success: boolean;
  landingPageId?: string;
  contentJson?: Record<string, unknown>;
  message?: string;
  error?: string;
}

export async function generateLandingPage(
  params: GenerateLandingPageParams
): Promise<GenerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-landing-page", {
      body: params,
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        error: error.message || "Erro ao gerar landing page",
      };
    }

    return data as GenerationResult;
  } catch (err) {
    console.error("Generate landing page error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

export async function createLandingPage(
  userId: string,
  title: string,
  description?: string
): Promise<{ id: string } | null> {
  try {
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    const { data, error } = await supabase
      .from("landing_pages")
      .insert({
        user_id: userId,
        title,
        slug,
        status: "draft",
        content_json: {
          title,
          description,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("Create landing page error:", error);
      return null;
    }

    return { id: data.id };
  } catch (err) {
    console.error("Create landing page failed:", err);
    return null;
  }
}

export async function updateLandingPageUrls(
  landingPageId: string,
  urls: {
    original_word_doc_url?: string;
    original_wireframe_url?: string;
    inspiration_layout_url?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("landing_pages")
      .update(urls)
      .eq("id", landingPageId);

    if (error) {
      console.error("Update URLs error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Update URLs failed:", err);
    return false;
  }
}
