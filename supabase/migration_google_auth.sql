-- ==============================================================================
-- ORÇACERTO — MIGRAÇÃO GOOGLE OAUTH E PERFIS DE USUÁRIO
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Assegurar colunas necessárias na tabela public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'google';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Preencher user_id retroativo para registros antigos que usavam id = auth.users(id)
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- 3. Índices únicos e de busca rápida
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Habilitar e atualizar políticas de Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
CREATE POLICY "Users can view and update their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- 5. Atualizar função e trigger de sincronização automática com auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_provider TEXT;
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
    NEW.raw_user_meta_data->>'picture'
  );
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'google');

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
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    last_login_at = NOW(),
    updated_at = NOW();

  -- Cria registro de empresa padrão vinculado ao usuário se não existir
  INSERT INTO public.companies (
    user_id,
    name,
    email
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    NEW.email
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
