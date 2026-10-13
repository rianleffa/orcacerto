-- Temporary, reversible global free-access mode.
-- Safe to apply to an existing OrçaCerto database; preserves user and billing data.

CREATE TABLE IF NOT EXISTS public.app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_settings FROM PUBLIC, anon, authenticated;

INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('free_access_enabled', 'true')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = pg_catalog.now();

CREATE OR REPLACE FUNCTION public.is_free_access_enabled()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT settings.setting_value = 'true'
      FROM public.app_settings AS settings
      WHERE settings.setting_key = 'free_access_enabled'
    ),
    TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_free_access_enabled() FROM PUBLIC, anon, authenticated;

-- Keep the existing per-user plan limit ready for later reactivation.
CREATE OR REPLACE FUNCTION public.check_budget_monthly_limit()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_plan TEXT;
  monthly_count BIGINT;
BEGIN
  IF public.is_free_access_enabled() THEN
    RETURN NEW;
  END IF;

  SELECT profile.plan::TEXT
  INTO user_plan
  FROM public.profiles AS profile
  WHERE profile.user_id = NEW.user_id OR profile.id = NEW.user_id
  LIMIT 1;

  IF user_plan IN ('professional', 'pro', 'premium') THEN
    RETURN NEW;
  END IF;

  SELECT pg_catalog.count(*)
  INTO monthly_count
  FROM public.budgets AS budget
  WHERE budget.user_id = NEW.user_id
    AND budget.created_at >= pg_catalog.date_trunc('month', pg_catalog.now())
    AND budget.created_at < pg_catalog.date_trunc('month', pg_catalog.now()) + INTERVAL '1 month';

  IF monthly_count >= 3 THEN
    RAISE EXCEPTION 'Limite mensal de orçamentos atingido.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_budget_monthly_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_check_budget_monthly_limit ON public.budgets;
CREATE TRIGGER tr_check_budget_monthly_limit
BEFORE INSERT ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.check_budget_monthly_limit();
