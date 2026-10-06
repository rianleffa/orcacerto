-- ==============================================================================
-- ORÇACERTO — ATUALIZAÇÃO E CORREÇÃO DE AUTENTICAÇÃO, PERFIS E EMPRESAS
-- Execute este script no SQL Editor do Supabase para garantir a sincronização
-- correta dos usuários (E-mail/Senha e Google OAuth), Triggers e Políticas RLS.
-- ==============================================================================

-- 1. GARANTIR EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. GARANTIR COLUNAS EM PUBLIC.PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'google';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan plan_tier DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_budget_limit INTEGER DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_budget_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usage_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_subscription BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Garantir que user_id seja preenchido se nulo
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Criar constraint e índice único para user_id em profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 3. GARANTIR CONSTRAINT ESTRITA EM PUBLIC.COMPANIES
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;

-- Evitar duplicidade de empresa por usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_user_id_key'
  ) THEN
    -- Remove duplicatas antigas mantendo a mais recente por user_id caso existam
    DELETE FROM public.companies a
    USING public.companies b
    WHERE a.user_id = b.user_id AND a.created_at < b.created_at;

    ALTER TABLE public.companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- 4. POLÍTICAS ROW LEVEL SECURITY (RLS) ROBUSTAS

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. TRIGGER DEFINITIVO PARA SINCRONIZAÇÃO DE NOVOS USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_provider TEXT;
  v_phone TEXT;
  v_document TEXT;
  v_company_name TEXT;
BEGIN
  -- Extrair dados de metadados (compatível com Google OAuth e cadastro tradicional)
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    split_part(v_full_name, ' ', 1)
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    CASE 
      WHEN position(' ' in v_full_name) > 0 
      THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE ''
    END
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    ''
  );

  v_document := COALESCE(
    NEW.raw_user_meta_data->>'document',
    ''
  );

  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Minha Empresa'
  );

  -- 1. Inserir ou atualizar perfil
  INSERT INTO public.profiles (
    id,
    user_id,
    name,
    full_name,
    first_name,
    last_name,
    email,
    avatar_url,
    provider,
    phone,
    document,
    plan,
    monthly_budget_limit,
    monthly_budget_count,
    usage_period,
    paid_subscription,
    subscription_status,
    created_at,
    updated_at,
    last_login_at
  ) VALUES (
    NEW.id,
    NEW.id,
    v_full_name,
    v_full_name,
    v_first_name,
    v_last_name,
    NEW.email,
    v_avatar_url,
    v_provider,
    v_phone,
    v_document,
    'free',
    3,
    0,
    TO_CHAR(NOW(), 'YYYY-MM'),
    FALSE,
    'inactive',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    phone = CASE WHEN public.profiles.phone IS NULL OR public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    document = CASE WHEN public.profiles.document IS NULL OR public.profiles.document = '' THEN EXCLUDED.document ELSE public.profiles.document END,
    provider = COALESCE(public.profiles.provider, EXCLUDED.provider),
    last_login_at = NOW(),
    updated_at = NOW();

  -- 2. Inserir ou atualizar empresa padrão
  INSERT INTO public.companies (
    user_id,
    name,
    email,
    phone,
    whatsapp,
    document,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_company_name,
    NEW.email,
    v_phone,
    v_phone,
    v_document,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    phone = CASE WHEN public.companies.phone IS NULL OR public.companies.phone = '' THEN EXCLUDED.phone ELSE public.companies.phone END,
    whatsapp = CASE WHEN public.companies.whatsapp IS NULL OR public.companies.whatsapp = '' THEN EXCLUDED.whatsapp ELSE public.companies.whatsapp END,
    document = CASE WHEN public.companies.document IS NULL OR public.companies.document = '' THEN EXCLUDED.document ELSE public.companies.document END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Evita bloquear o cadastro do auth.users em caso de erro secundário
  RAISE WARNING 'Erro no trigger handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reinstalar trigger em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
