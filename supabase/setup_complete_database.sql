-- ==============================================================================
-- ORÇACERTO — SCRIPT DE BANCO DE DADOS DEFINITIVO (SUPABASE POSTGRESQL)
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/aztmenorefrgpdnpedjb/sql)
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS E ENUMS
DO $$ BEGIN
  CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'viewed', 'pending', 'approved', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('pix', 'money', 'card', 'boleto', 'transfer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE template_type AS ENUM ('modern', 'elegant', 'minimalist');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('free', 'professional', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA PROFILES (Perfis de Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  full_name TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  provider TEXT DEFAULT 'google',
  phone TEXT DEFAULT '',
  document TEXT DEFAULT '',
  company_name TEXT DEFAULT 'Minha Empresa',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  plan plan_tier DEFAULT 'free',
  monthly_budget_limit INTEGER NOT NULL DEFAULT 3,
  monthly_budget_count INTEGER NOT NULL DEFAULT 0,
  usage_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  paid_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  cakto_customer_id TEXT,
  cakto_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas adicionais caso a tabela já exista
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'Minha Empresa';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'google';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document TEXT DEFAULT '';

DO $$ BEGIN
  UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
EXCEPTION WHEN OTHERS THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. TABELA COMPANIES (Dados da Empresa por Usuário)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Minha Empresa',
  document TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  website TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#10b981',
  default_template template_type DEFAULT 'modern',
  default_whatsapp_message TEXT DEFAULT 'Olá, {cliente}! 👋\n\nPreparei seu orçamento pelo OrçaCerto.\n\n📄 Orçamento {numero}\n💰 Valor total: {valor}\n\nFico à disposição!',
  pix_key TEXT DEFAULT '',
  pix_key_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir constraint única por user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_user_id_key') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- 5. TABELA CLIENTS (Clientes)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- 6. TABELA BUDGETS (Orçamentos)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_number TEXT NOT NULL,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  validity_days INTEGER NOT NULL DEFAULT 10,
  payment_method payment_method_type NOT NULL DEFAULT 'pix',
  payment_terms TEXT DEFAULT '',
  execution_time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  warranty TEXT DEFAULT '',
  template_id template_type NOT NULL DEFAULT 'modern',
  primary_color TEXT DEFAULT '#10b981',
  show_signature BOOLEAN DEFAULT TRUE,
  signature_name TEXT DEFAULT '',
  status budget_status NOT NULL DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  last_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- 7. TABELA BUDGET_ITEMS (Itens do Orçamento)
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);

-- 8. TABELA NOTIFICATIONS (Notificações)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==============================================================================
-- 9. SEGURANÇA E POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- Políticas para Companies
DROP POLICY IF EXISTS "companies_all_own" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

CREATE POLICY "companies_all_own" ON public.companies FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para Clients
DROP POLICY IF EXISTS "clients_all_own" ON public.clients;
CREATE POLICY "clients_all_own" ON public.clients FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para Budgets
DROP POLICY IF EXISTS "budgets_all_own" ON public.budgets;
CREATE POLICY "budgets_all_own" ON public.budgets FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para Budget Items
DROP POLICY IF EXISTS "budget_items_all_own" ON public.budget_items;
CREATE POLICY "budget_items_all_own" ON public.budget_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid()));

-- Políticas para Notifications
DROP POLICY IF EXISTS "notifications_all_own" ON public.notifications;
CREATE POLICY "notifications_all_own" ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. TRIGGER AUTOMÁTICO: CRIAÇÃO DE PERFIL E EMPRESA NO CADASTRO / LOGIN GOOGLE
-- ==============================================================================
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
    NEW.raw_user_meta_data->>'picture',
    ''
  );

  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'google'
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
    company_name,
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
    COALESCE(NEW.email, ''),
    v_avatar_url,
    v_provider,
    v_phone,
    v_document,
    v_company_name,
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
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    avatar_url = COALESCE(NULLIF(public.profiles.avatar_url, ''), EXCLUDED.avatar_url),
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email),
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
    COALESCE(NEW.email, ''),
    v_phone,
    v_phone,
    v_document,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro no trigger handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reinstalar trigger em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincronizar usuários existentes em auth.users para profiles e companies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM auth.users LOOP
    INSERT INTO public.profiles (
      id, user_id, name, full_name, email, provider, created_at, updated_at
    ) VALUES (
      r.id, r.id,
      COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', split_part(r.email, '@', 1)),
      COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', split_part(r.email, '@', 1)),
      COALESCE(r.email, ''),
      COALESCE(r.raw_app_meta_data->>'provider', 'google'),
      r.created_at, NOW()
    ) ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.companies (user_id, name, email)
    VALUES (r.id, 'Minha Empresa', COALESCE(r.email, ''))
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;
