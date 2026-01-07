import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LandingPageData {
  title: string;
  generated_html: string | null;
  status: string;
}

export default function PublicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      if (!slug) {
        setError("Página não encontrada");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("landing_pages")
        .select("title, generated_html, status")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (fetchError || !data) {
        setError("Página não encontrada ou não publicada");
        setLoading(false);
        return;
      }

      setPage(data);
      setLoading(false);
    }

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">404</h1>
          <p className="text-muted-foreground">{error || "Página não encontrada"}</p>
        </div>
      </div>
    );
  }

  if (!page.generated_html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Em construção</h1>
          <p className="text-muted-foreground">Esta página ainda não foi gerada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        srcDoc={page.generated_html}
        title={page.title}
        className="w-full min-h-screen border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
