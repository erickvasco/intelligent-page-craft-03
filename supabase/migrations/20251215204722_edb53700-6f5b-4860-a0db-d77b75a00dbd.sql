-- =============================================
-- FASE 1: INFRAESTRUTURA COMPLETA DO BANCO
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.landing_page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.cms_type AS ENUM ('wordpress', 'webflow');

-- 2. TABELA PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA USER_ROLES (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. TABELA LANDING_PAGES
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  status public.landing_page_status NOT NULL DEFAULT 'draft',
  content_json JSONB DEFAULT '{}',
  generated_html TEXT,
  original_word_doc_url TEXT,
  original_wireframe_url TEXT,
  inspiration_layout_url TEXT,
  published_cms_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABELA CMS_INTEGRATIONS
CREATE TABLE public.cms_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cms_type public.cms_type NOT NULL,
  base_url TEXT NOT NULL,
  api_key_secret_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. FUNÇÃO PARA ATUALIZAR TIMESTAMPS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA VERIFICAR ROLES (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 8. FUNÇÃO PARA CRIAR PROFILE AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 9. TRIGGERS
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_integrations_updated_at
  BEFORE UPDATE ON public.cms_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_integrations ENABLE ROW LEVEL SECURITY;

-- 11. RLS POLICIES - PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS POLICIES - USER_ROLES
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. RLS POLICIES - LANDING_PAGES
CREATE POLICY "Users can view own landing pages"
  ON public.landing_pages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own landing pages"
  ON public.landing_pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing pages"
  ON public.landing_pages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing pages"
  ON public.landing_pages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all landing pages"
  ON public.landing_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS POLICIES - CMS_INTEGRATIONS
CREATE POLICY "Users can view own integrations"
  ON public.cms_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own integrations"
  ON public.cms_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON public.cms_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON public.cms_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 15. INDEXES
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_landing_pages_user_id ON public.landing_pages(user_id);
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX idx_cms_integrations_user_id ON public.cms_integrations(user_id);

-- 16. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('content-documents', 'content-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('wireframes', 'wireframes', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('design-inspirations', 'design-inspirations', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-assets', 'generated-assets', true);

-- 17. STORAGE POLICIES - CONTENT DOCUMENTS
CREATE POLICY "Users can upload own content documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own content documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'content-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own content documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 18. STORAGE POLICIES - WIREFRAMES
CREATE POLICY "Users can upload own wireframes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wireframes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own wireframes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'wireframes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own wireframes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'wireframes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 19. STORAGE POLICIES - DESIGN INSPIRATIONS
CREATE POLICY "Users can upload own design inspirations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'design-inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own design inspirations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'design-inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own design inspirations"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'design-inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 20. STORAGE POLICIES - GENERATED ASSETS (PUBLIC)
CREATE POLICY "Anyone can view generated assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-assets');

CREATE POLICY "Users can upload own generated assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own generated assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'generated-assets' AND auth.uid()::text = (storage.foldername(name))[1]);