import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ExternalLink } from "lucide-react";

interface WordPressPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landingPageId: string;
  title: string;
  slug: string | null;
  htmlContent: string;
}

export function WordPressPublishDialog({
  open,
  onOpenChange,
  landingPageId,
  title,
  slug,
  htmlContent,
}: WordPressPublishDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // For this flow, we need to get credentials temporarily
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");

  const handlePublish = async () => {
    if (!user) return;
    if (!siteUrl || !username || !appPassword) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      // Extract body content from HTML (remove doctype, html, head tags)
      let bodyContent = htmlContent;
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
      }

      const { data, error } = await supabase.functions.invoke("wordpress-publish", {
        body: {
          action: "publish",
          userId: user.id,
          landingPageId,
          title,
          content: bodyContent,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          status: "publish",
          siteUrl: siteUrl.replace(/\/$/, ""),
          username,
          appPassword,
        },
      });

      if (error) throw error;

      if (data.success) {
        setPublishedUrl(data.pageUrl);
        toast({
          title: "Publicado no WordPress!",
          description: "Sua landing page está online.",
        });
      } else {
        throw new Error(data.error || "Erro ao publicar");
      }
    } catch (error: any) {
      console.error("Publish error:", error);
      toast({
        title: "Erro ao publicar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    setPublishedUrl(null);
    setSiteUrl("");
    setUsername("");
    setAppPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar no WordPress</DialogTitle>
          <DialogDescription>
            {publishedUrl
              ? "Sua landing page foi publicada com sucesso!"
              : "Insira as credenciais do seu WordPress para publicar."}
          </DialogDescription>
        </DialogHeader>

        {publishedUrl ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ExternalLink className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-lg mb-2">Página publicada!</p>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {publishedUrl}
              </a>
            </div>
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="wp-site-url">URL do Site</Label>
                <Input
                  id="wp-site-url"
                  placeholder="https://seusite.com.br"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wp-username">Usuário</Label>
                <Input
                  id="wp-username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wp-app-password">Application Password</Label>
                <Input
                  id="wp-app-password"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Gere em: WP Admin → Usuários → Perfil → Application Passwords
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing || !siteUrl || !username || !appPassword}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Publicar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
