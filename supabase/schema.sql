-- ==============================================================================
-- ORÇACERTO — SUPABASE POSTGRESQL DATABASE SCHEMA
-- "Faça seu orçamento. Feche seu negócio."
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE budget_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'pending',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE payment_method_type AS ENUM (
  'pix',
  'money',
  'card',
  'boleto',
  'transfer'
);

CREATE TYPE template_type AS ENUM (
  'modern',
  'elegant',
  'minimalist'
);

CREATE TYPE plan_tier AS ENUM (
  'free',
  'professional',
  'pro',
  'premium'
);

-- 3. PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document TEXT,
  plan plan_tier DEFAULT 'free',
  monthly_budget_limit INTEGER NOT NULL DEFAULT 3,
  monthly_budget_count INTEGER NOT NULL DEFAULT 0,
  usage_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  paid_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status TEXT NOT NULL DEFAULT 'inactive', -- inactive, pending, active, canceled, expired
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  cakto_customer_id TEXT,
  cakto_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  instagram TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  default_template template_type DEFAULT 'modern',
  default_whatsapp_message TEXT DEFAULT 'Olá, {cliente}! 👋\n\nPreparei seu orçamento pelo OrçaCerto.\n\n📄 Orçamento {numero}\n💰 Valor total: {valor}\n\nFico à disposição!',
  pix_key TEXT,
  pix_key_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_number TEXT NOT NULL,
  title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  validity_days INTEGER NOT NULL DEFAULT 10,
  payment_method payment_method_type NOT NULL DEFAULT 'pix',
  payment_terms TEXT,
  execution_time TEXT,
  notes TEXT,
  warranty TEXT,
  template_id template_type NOT NULL DEFAULT 'modern',
  primary_color TEXT DEFAULT '#10b981',
  show_signature BOOLEAN DEFAULT TRUE,
  signature_name TEXT,
  status budget_status NOT NULL DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  last_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BUDGET ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SUBSCRIPTIONS TABLE (Billing structure for Stripe / Mercado Pago)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan plan_tier NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, canceled
  gateway TEXT,                         -- 'stripe', 'mercadopago'
  gateway_customer_id TEXT,
  gateway_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view and update their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Companies Policies
CREATE POLICY "Users can manage their own company"
  ON public.companies FOR ALL
  USING (auth.uid() = user_id);

-- Clients Policies
CREATE POLICY "Users can manage their own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can manage their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- Budget Items Policies (via parent budget)
CREATE POLICY "Users can manage budget items through budget ownership"
  ON public.budget_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets
      WHERE budgets.id = budget_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Users can view and edit their notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- Subscriptions Policies
CREATE POLICY "Users can view their subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON public.budgets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);

-- ==============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 10. CAKTO WEBHOOK AUDIT LOG TABLE (Prepared for Cakto Integration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cakto_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  cakto_transaction_id TEXT,
  cakto_customer_id TEXT,
  plan TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. SECURITY: 3-BUDGET MONTHLY LIMIT ENFORCEMENT ON DATABASE (Section 6, 7, 8, 20)
-- ==============================================================================
CREATE OR REPLACE FUNCTION check_budget_monthly_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan plan_tier;
  v_count INTEGER;
  v_current_period TEXT;
BEGIN
  -- 1. Identify user's active plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;

  -- 2. Paid plans (professional, pro, premium) enjoy unlimited budgets
  IF v_plan IN ('professional', 'pro', 'premium') THEN
    RETURN NEW;
  END IF;

  -- 3. Free plan: count budgets created strictly in current calendar month
  v_current_period := TO_CHAR(NOW(), 'YYYY-MM');

  SELECT COUNT(*) INTO v_count
  FROM public.budgets
  WHERE user_id = NEW.user_id
    AND TO_CHAR(created_at, 'YYYY-MM') = v_current_period;

  -- 4. Enforce strict blocking at 3 budgets
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 orçamentos gratuitos deste mês atingido. Faça upgrade para o plano Profissional ou Premium para orçamentos ilimitados.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_budget_monthly_limit ON public.budgets;
CREATE TRIGGER tr_check_budget_monthly_limit
BEFORE INSERT ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION check_budget_monthly_limit();

