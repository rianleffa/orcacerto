-- Enforce tenant ownership in the database for OrçaCerto's private data.
-- Safe to apply more than once; this migration does not alter or delete rows.

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles', 'companies', 'clients', 'budgets', 'budget_items',
        'notifications', 'subscriptions', 'site_access_events',
        'cakto_webhook_logs', 'app_settings'
      ])
  LOOP
    EXECUTE pg_catalog.format(
      'DROP POLICY %I ON public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  END LOOP;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY orcacerto_profiles_select_own
  ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY orcacerto_profiles_insert_own
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY orcacerto_profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY orcacerto_companies_own
  ON public.companies FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY orcacerto_clients_own
  ON public.clients FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY orcacerto_budgets_own
  ON public.budgets FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.clients AS client
        WHERE client.id = budgets.client_id
          AND client.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY orcacerto_budget_items_owned_budget
  ON public.budget_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.budgets AS budget
      WHERE budget.id = budget_items.budget_id
        AND budget.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.budgets AS budget
      WHERE budget.id = budget_items.budget_id
        AND budget.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY orcacerto_notifications_own
  ON public.notifications FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY orcacerto_subscriptions_select_own
  ON public.subscriptions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- The browser may edit contact/profile fields, but not subscription state,
-- plan limits, payment identifiers, or other billing-controlled columns.
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
DO $$
DECLARE
  insert_columns TEXT;
  update_columns TEXT;
BEGIN
  SELECT pg_catalog.string_agg(pg_catalog.quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO insert_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = ANY (ARRAY[
      'user_id', 'name', 'full_name', 'first_name', 'last_name', 'email',
      'avatar_url', 'provider', 'phone', 'document', 'company_name',
      'onboarding_completed', 'city', 'state', 'updated_at'
    ]);

  SELECT pg_catalog.string_agg(pg_catalog.quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO update_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = ANY (ARRAY[
      'name', 'full_name', 'first_name', 'last_name', 'avatar_url', 'phone',
      'document', 'company_name', 'onboarding_completed', 'city', 'state', 'updated_at'
    ]);

  IF insert_columns IS NOT NULL THEN
    EXECUTE pg_catalog.format(
      'GRANT INSERT (%s) ON TABLE public.profiles TO authenticated',
      insert_columns
    );
  END IF;

  IF update_columns IS NOT NULL THEN
    EXECUTE pg_catalog.format(
      'GRANT UPDATE (%s) ON TABLE public.profiles TO authenticated',
      update_columns
    );
  END IF;
END;
$$;

REVOKE ALL ON TABLE public.subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.subscriptions TO authenticated;

DO $$
BEGIN
  IF pg_catalog.to_regclass('public.cakto_webhook_logs') IS NOT NULL THEN
    ALTER TABLE public.cakto_webhook_logs ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.cakto_webhook_logs FROM PUBLIC, anon, authenticated;
  END IF;

  IF pg_catalog.to_regclass('public.app_settings') IS NOT NULL THEN
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.app_settings FROM PUBLIC, anon, authenticated;
  END IF;

  IF pg_catalog.to_regclass('public.site_access_events') IS NOT NULL THEN
    ALTER TABLE public.site_access_events ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.site_access_events FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON TABLE public.site_access_events TO authenticated;

    IF pg_catalog.to_regprocedure('public.is_site_admin()') IS NOT NULL THEN
      CREATE POLICY orcacerto_site_access_admin_read
        ON public.site_access_events FOR SELECT TO authenticated
        USING ((SELECT public.is_site_admin()));
    END IF;
  END IF;

  IF pg_catalog.to_regprocedure('public.is_site_admin()') IS NOT NULL THEN
    CREATE POLICY orcacerto_profiles_admin_read
      ON public.profiles FOR SELECT TO authenticated
      USING ((SELECT public.is_site_admin()));
  END IF;
END;
$$;
