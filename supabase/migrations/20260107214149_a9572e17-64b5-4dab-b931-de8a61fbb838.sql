-- Adicionar novas colunas à tabela landing_pages
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS doc_text TEXT,
ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Criar policy para acesso público a páginas publicadas
CREATE POLICY "Public can view published pages"
ON landing_pages FOR SELECT
USING (status = 'published');