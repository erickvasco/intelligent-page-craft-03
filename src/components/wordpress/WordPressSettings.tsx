import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Settings, Check, X } from "lucide-react";

interface WordPressSettingsProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function WordPressSettings({ onConnectionChange }: WordPressSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [existingIntegration, setExistingIntegration] = useState<string | null>(null);
  
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");

  useEffect(() => {
    if (user) {
      checkExistingConnection();
    }
  }, [user]);

  const checkExistingConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_integrations")
        .select("id, base_url")
        .eq("user_id", user?.id)
        .eq("cms_type", "wordpress")
        .maybeSingle();

      if (data) {
        setExistingIntegration(data.id);
        setSiteUrl(data.base_url);
        setConnected(true);
        onConnectionChange?.(true);
      }
    } catch (error) {
      console.error("Error checking WordPress connection:", error);
    }
  };

  const handleTestConnection = async () => {
    if (!siteUrl || !username || !appPassword) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("wordpress-publish", {
        body: {
          action: "test",
          siteUrl: siteUrl.replace(/\/$/, ""),
          username,
          appPassword,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: `Conectado como ${data.user}`,
        });
      } else {
        throw new Error(data.error || "Falha na conexão");
      }
    } catch (error: any) {
      console.error("Test connection error:", error);
      toast({
        title: "Falha na conexão",
        description: error.message || "Verifique as credenciais e tente novamente",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!siteUrl || !username || !appPassword) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Store credentials securely via edge function
      const { data: storeResult, error: storeError } = await supabase.functions.invoke(
        "wordpress-publish",
        {
          body: {
            action: "store-credentials",
            userId: user.id,
            siteUrl: siteUrl.replace(/\/$/, ""),
            username,
            appPassword,
          },
        }
      );

      if (storeError) throw storeError;

      if (!storeResult.success) {
        throw new Error(storeResult.error || "Erro ao salvar credenciais");
      }

      // Update or create CMS integration record
      if (existingIntegration) {
        await supabase
          .from("cms_integrations")
          .update({
            base_url: siteUrl.replace(/\/$/, ""),
            api_key_secret_name: storeResult.secretName,
          })
          .eq("id", existingIntegration);
      } else {
        const { data: newIntegration, error: insertError } = await supabase
          .from("cms_integrations")
          .insert({
            user_id: user.id,
            cms_type: "wordpress",
            base_url: siteUrl.replace(/\/$/, ""),
            api_key_secret_name: storeResult.secretName,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        setExistingIntegration(newIntegration.id);
      }

      setConnected(true);
      onConnectionChange?.(true);
      setOpen(false);
      setAppPassword(""); // Clear password from memory

      toast({
        title: "WordPress conectado!",
        description: "Agora você pode publicar landing pages diretamente.",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!existingIntegration) return;

    setLoading(true);
    try {
      await supabase
        .from("cms_integrations")
        .delete()
        .eq("id", existingIntegration);

      setExistingIntegration(null);
      setConnected(false);
      setSiteUrl("");
      setUsername("");
      setAppPassword("");
      onConnectionChange?.(false);

      toast({
        title: "WordPress desconectado",
      });
      setOpen(false);
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Erro ao desconectar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          WordPress
          {connected ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar WordPress</DialogTitle>
          <DialogDescription>
            Conecte seu site WordPress para publicar landing pages diretamente.
            Você precisará de uma Application Password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="site-url">URL do Site</Label>
            <Input
              id="site-url"
              placeholder="https://seusite.com.br"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Usuário WordPress</Label>
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-password">Application Password</Label>
            <Input
              id="app-password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Gere em: Seu WP Admin → Usuários → Perfil → Application Passwords
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleTestConnection}
            disabled={testing || !siteUrl || !username || !appPassword}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Testar Conexão
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {connected && (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || !siteUrl || !username || !appPassword}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
