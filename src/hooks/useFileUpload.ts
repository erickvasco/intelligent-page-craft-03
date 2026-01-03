import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type BucketName = "content-documents" | "wireframes" | "design-inspirations";

interface UploadResult {
  path: string;
  publicUrl: string;
}

export function useFileUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    bucket: BucketName
  ): Promise<UploadResult | null> => {
    if (!user) {
      setError("Usuário não autenticado");
      return null;
    }

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get the public URL or signed URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        path: data.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer upload";
      setError(message);
      console.error("Upload failed:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (path: string, bucket: BucketName): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Delete failed:", err);
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    error,
  };
}
