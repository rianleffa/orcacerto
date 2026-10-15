import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '../types/database';
import { supabase, isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import { recordSiteVisit } from '../lib/analytics';
import { getAuthRedirectUrl } from '../lib/authRedirect';

const getSb = () => getSupabaseClient() || supabase;

interface SignupData {
  name: string;
  email: string;
  password?: string;
  companyName: string;
  phone: string;
  document?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string } | void>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserAccount>) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  syncSupabaseUser: (authUser: any) => Promise<UserAccount>;
  refreshSession: () => Promise<UserAccount | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const syncPromises = new Map<string, Promise<UserAccount>>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // A cache local não autentica ninguém: só uma sessão verificada pelo Supabase pode abrir rotas privadas.
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper otimizado para sincronização de usuário, perfil e empresa
  const syncSupabaseUser = async (authUser: any): Promise<UserAccount> => {
    if (!authUser?.id) {
      throw new Error('Usuário sem ID válido para sincronização');
    }

    // Deduplicação: se já houver uma sincronização ativa para este usuário, aguarda a mesma Promise
    const existing = syncPromises.get(authUser.id);
    if (existing) {
      return existing;
    }

    const syncWork = (async (): Promise<UserAccount> => {
      const meta = authUser.user_metadata || {};
      const appMeta = authUser.app_metadata || {};
      const fullName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Usuário';
      const firstName =
        meta.given_name ||
        meta.first_name ||
        (fullName.includes(' ') ? fullName.split(' ')[0] : fullName);
      const lastName =
        meta.family_name ||
        meta.last_name ||
        (fullName.includes(' ') ? fullName.substring(fullName.indexOf(' ') + 1) : '');
      const avatarUrl = meta.avatar_url || meta.picture || '';
      const isGoogle = appMeta.provider === 'google' || authUser.identities?.some((id: any) => id.provider === 'google');
      const provider = (isGoogle ? 'google' : (appMeta.provider || 'email')) as 'google' | 'email';
      const phone = meta.phone || meta.whatsapp || '';
      const document = meta.document || '';
      const companyName = meta.company_name || 'Minha Empresa';
      const nowIso = new Date().toISOString();

      let profileData: any = null;
      let companyData: any = null;
      const sb = getSb();

      if (sb && authUser.id) {
        try {
          // 1. Busca direta por user_id (coluna indexada com restrição única)
          const [profileRes, companyRes] = await Promise.allSettled([
            sb
              .from('profiles')
              .select('*')
              .eq('user_id', authUser.id)
              .maybeSingle(),
            sb
              .from('companies')
              .select('*')
              .eq('user_id', authUser.id)
              .maybeSingle(),
          ]);

          if (profileRes.status === 'fulfilled' && profileRes.value.data) {
            profileData = profileRes.value.data;
          } else {
            // Fallback para id primário
            try {
              const fb = await sb.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
              if (fb.data) profileData = fb.data;
            } catch {}
          }

          if (companyRes.status === 'fulfilled' && companyRes.value.data) {
            companyData = companyRes.value.data;
          }

          // 2. Se o perfil não existe, cria o perfil inicial
          if (!profileData) {
            const newProfile = {
              user_id: authUser.id,
              name: fullName,
              full_name: fullName,
              first_name: firstName,
              last_name: lastName,
              email: authUser.email || '',
              avatar_url: avatarUrl,
              provider,
              phone,
              document,
              company_name: companyName,
              updated_at: nowIso,
            };
            try {
              const res = await sb
                .from('profiles')
                .insert(newProfile)
                .select()
                .maybeSingle();
              if (res?.data) profileData = res.data;
            } catch (pErr) {
              console.warn('[Supabase Profiles]: Aviso ao criar perfil inicial:', pErr);
            }
          } else if (avatarUrl && !profileData.avatar_url) {
            Promise.resolve(
              sb
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', profileData.id)
            ).catch(() => {});
          }

          // 3. Se a empresa não existe, cria a empresa padrão
          if (!companyData) {
            try {
              const cRes = await sb.from('companies').upsert(
                {
                  user_id: authUser.id,
                  name: companyName,
                  email: authUser.email || '',
                  phone,
                  whatsapp: phone,
                  document,
                },
                { onConflict: 'user_id' }
              ).select().maybeSingle();
              if (cRes?.data) companyData = cRes.data;
            } catch (cErr) {
              console.warn('[Supabase Companies]: Aviso ao criar empresa inicial:', cErr);
            }
          }

          // This also attaches an anonymous visit in the current tab to the
          // signed-in account, using the identity from Supabase Auth.
          await recordSiteVisit();
        } catch (err) {
          console.warn('[Supabase]: Aviso na sincronização de perfil:', err);
        }
      }

      const localOnboarded = localStorage.getItem(`orcacerto_onboarded_${authUser.id}`) === 'true';
      const effectivePhone = profileData?.phone || companyData?.phone || phone || '';
      const effectiveDocument = profileData?.document || companyData?.document || document || '';
      const effectiveCompanyName = companyData?.name || profileData?.company_name || companyName;

      const isOnboarded = Boolean(
        meta.onboarding_completed ||
        profileData?.onboarding_completed ||
        localOnboarded ||
        (effectivePhone && effectivePhone.trim().length > 0) ||
        (effectiveCompanyName && effectiveCompanyName !== 'Minha Empresa')
      );

      const account: UserAccount = {
        id: authUser.id,
        user_id: authUser.id,
        name: profileData?.name || profileData?.full_name || fullName,
        full_name: profileData?.full_name || fullName,
        first_name: profileData?.first_name || firstName,
        last_name: profileData?.last_name || lastName,
        email: authUser.email || profileData?.email || '',
        avatar_url: profileData?.avatar_url || avatarUrl,
        provider: (profileData?.provider as any) || provider,
        company_name: effectiveCompanyName,
        phone: effectivePhone,
        document: effectiveDocument,
        city: profileData?.city || '',
        state: profileData?.state || '',
        onboarding_completed: isOnboarded,
        plan: profileData?.plan || 'free',
        monthly_budget_limit: profileData?.monthly_budget_limit ?? 3,
        monthly_budget_count: profileData?.monthly_budget_count ?? 0,
        usage_period: profileData?.usage_period || nowIso.substring(0, 7),
        paid_subscription: profileData?.paid_subscription || false,
        subscription_status: profileData?.subscription_status || 'inactive',
        subscription_started_at: profileData?.subscription_started_at,
        subscription_expires_at: profileData?.subscription_expires_at,
        cakto_customer_id: profileData?.cakto_customer_id,
        cakto_transaction_id: profileData?.cakto_transaction_id,
        created_at: profileData?.created_at || authUser.created_at || nowIso,
        updated_at: profileData?.updated_at || nowIso,
        last_login_at: profileData?.last_login_at || nowIso,
      };

      setUser(account);
      localStorage.setItem('orcacerto_user', JSON.stringify(account));
      if (isOnboarded) {
        localStorage.setItem(`orcacerto_onboarded_${authUser.id}`, 'true');
      }
      setLoading(false);
      return account;
    })();

    syncPromises.set(authUser.id, syncWork);

    try {
      const result = await syncWork;
      return result;
    } finally {
      syncPromises.delete(authUser.id);
    }
  };

  const refreshSession = async (): Promise<UserAccount | null> => {
    const sb = getSb();
    if (isSupabaseConfigured() && sb) {
      try {
        const { data: { user: authUser } } = await sb.auth.getUser();
        if (authUser) {
          const account = await syncSupabaseUser(authUser);
          return account;
        }
        const { data: { session }, error } = await sb.auth.getSession();
        if (error) {
          console.error('[Supabase getSession error]:', error);
          return null;
        }
        if (session?.user) {
          const account = await syncSupabaseUser(session.user);
          return account;
        }
      } catch (err) {
        console.error('[Supabase refreshSession error]:', err);
      }
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança: nunca deixe o app travado em loading por mais de 3.5 segundos
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3500);

    const initializeAuth = async () => {
      const isOAuthRoute =
        window.location.pathname.includes('/auth/callback') ||
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token=');

      if (isOAuthRoute) {
        // Na rota de callback OAuth, deixamos o AuthCallbackPage processar
        return;
      }

      const sb = getSb();
      if (isSupabaseConfigured() && sb) {
        try {
          const { data: { session } } = await sb.auth.getSession();

          if (session?.user && isMounted) {
            const account = await syncSupabaseUser(session.user);
            if (isMounted) {
              setUser(account);
              localStorage.setItem('orcacerto_user', JSON.stringify(account));
              setLoading(false);
              return;
            }
          } else if (!session?.user) {
            if (isMounted) {
              setUser(null);
              localStorage.removeItem('orcacerto_user');
            }
          }
        } catch (err) {
          console.warn('[Supabase]: Aviso ao restaurar sessão:', err);
        }
      }

      if (isMounted) setLoading(false);
    };

    initializeAuth();

    let authListener: { unsubscribe: () => void } | null = null;
    const sb = getSb();
    if (isSupabaseConfigured() && sb) {
      const { data } = sb.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session?.user) {
          const account = await syncSupabaseUser(session.user);
          if (isMounted) {
            setUser(account);
            localStorage.setItem('orcacerto_user', JSON.stringify(account));
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            localStorage.removeItem('orcacerto_user');
            setLoading(false);
          }
        }
      });
      authListener = data.subscription;
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      authListener?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    const sb = getSb();
    if (!isSupabaseConfigured() || !sb) {
      setLoading(false);
      return {
        success: false,
        error: 'Supabase não está configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.',
      };
    }

    if (!password) {
      setLoading(false);
      return { success: false, error: 'Por favor, informe a senha.' };
    }

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Supabase login error]:', error);
        setLoading(false);
        let friendly = error.message;
        if (error.message.includes('Invalid login credentials')) {
          friendly = 'E-mail ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          friendly = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
        }
        return { success: false, error: friendly };
      }

      if (data.user) {
        const account = await syncSupabaseUser(data.user);
        setUser(account);
        localStorage.setItem('orcacerto_user', JSON.stringify(account));
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Não foi possível autenticar o usuário.' };
    } catch (err: any) {
      console.error('[Supabase login unexpected error]:', err);
      setLoading(false);
      return { success: false, error: err?.message || 'Erro inesperado ao conectar ao Supabase.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ error?: string } | void> => {
    setLoading(true);

    const sb = getSb();
    if (!isSupabaseConfigured() || !sb) {
      const configErrMsg = 'Supabase não está configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.';
      console.error('[Google OAuth]:', configErrMsg);
      setLoading(false);
      return {
        error: configErrMsg,
      };
    }

    try {
      const redirectUrl = getAuthRedirectUrl(window.location.origin);
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('[Google OAuth Error]:', error);
        setLoading(false);
        let friendly = error.message;
        if (error.message.includes('provider is not enabled')) {
          friendly = 'O provedor Google não está ativado no painel do Supabase (Authentication > Providers > Google).';
        } else if (error.message.includes('invalid_client') || error.message.includes('OAuth client was not found')) {
          friendly = 'O Client ID do Google configurado no Supabase não foi encontrado no Google Cloud Console. Verifique o painel do Supabase.';
        } else if (error.message.includes('redirect_uri_mismatch')) {
          friendly = 'A URL de redirecionamento do Supabase não está autorizada no Google Cloud Console.';
        }
        return {
          error: friendly,
        };
      }

      // O navegador redirecionará para a tela oficial de login do Google
      return;
    } catch (err: any) {
      console.error('[Google OAuth Unexpected Error]:', err);
      setLoading(false);
      return {
        error: err?.message || 'Falha inesperada ao iniciar autenticação com o Google.',
      };
    }
  };

  const signup = async (
    data: SignupData
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    setLoading(true);

    const sb = getSb();
    if (!isSupabaseConfigured() || !sb) {
      setLoading(false);
      return {
        success: false,
        error: 'Supabase não está configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.',
      };
    }

    if (!data.name || !data.email || !data.companyName || !data.phone || !data.password) {
      setLoading(false);
      return {
        success: false,
        error: 'Preencha todos os campos obrigatórios (Nome, Empresa, E-mail, Telefone e Senha).',
      };
    }

    if (data.password.length < 6) {
      setLoading(false);
      return {
        success: false,
        error: 'A senha deve ter no mínimo 6 caracteres.',
      };
    }

    try {
      const { data: authData, error } = await sb.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(window.location.origin),
          data: {
            name: data.name,
            full_name: data.name,
            company_name: data.companyName,
            phone: data.phone,
            document: data.document || '',
          },
        },
      });

      if (error) {
        console.error('[Supabase signup error]:', error);
        setLoading(false);
        let friendly = error.message;
        if (error.message.includes('User already registered')) {
          friendly = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
        } else if (error.message.includes('Password should be at least')) {
          friendly = 'A senha informada é fraca. Utilize pelo menos 6 caracteres.';
        }
        return { success: false, error: friendly };
      }

      if (authData.user) {
        // Se a confirmação de e-mail estiver desligada ou gerou sessão imediata:
        if (authData.session) {
          const account = await syncSupabaseUser(authData.user);
          setUser(account);
          localStorage.setItem('orcacerto_user', JSON.stringify(account));
          setLoading(false);
          return { success: true, requiresEmailConfirmation: false };
        } else {
          // Se a sessão for nula, o Supabase enviou um e-mail de confirmação
          setLoading(false);
          return { success: true, requiresEmailConfirmation: true };
        }
      }

      setLoading(false);
      return { success: false, error: 'Não foi possível concluir o cadastro.' };
    } catch (err: any) {
      console.error('[Supabase signup unexpected error]:', err);
      setLoading(false);
      return { success: false, error: err?.message || 'Erro inesperado ao cadastrar no Supabase.' };
    }
  };

  const logout = async () => {
    const sb = getSb();
    if (isSupabaseConfigured() && sb) {
      try {
        await sb.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('orcacerto_user');
  };

  const updateUser = async (data: Partial<UserAccount>) => {
    if (!user) return;

    // 1. Atualização otimista e instantânea no estado e cache
    const updated: UserAccount = {
      ...user,
      ...data,
      updated_at: new Date().toISOString(),
    };
    setUser(updated);
    localStorage.setItem('orcacerto_user', JSON.stringify(updated));

    if (user.id && (data.onboarding_completed || user.onboarding_completed)) {
      localStorage.setItem(`orcacerto_onboarded_${user.id}`, 'true');
    }

    const sb = getSb();
    if (sb && user.id && !user.id.startsWith('usr_')) {
      const nowIso = new Date().toISOString();
      const promises: Promise<any>[] = [];

      // 2. Persistir metadados no Supabase Auth (garante que persista mesmo entre logins)
      const metadataUpdates: Record<string, any> = {};
      if (data.name !== undefined) metadataUpdates.name = data.name;
      if (data.full_name !== undefined) metadataUpdates.full_name = data.full_name;
      if (data.first_name !== undefined) metadataUpdates.first_name = data.first_name;
      if (data.last_name !== undefined) metadataUpdates.last_name = data.last_name;
      if (data.phone !== undefined) metadataUpdates.phone = data.phone;
      if (data.company_name !== undefined) metadataUpdates.company_name = data.company_name;
      if (data.document !== undefined) metadataUpdates.document = data.document;
      if (data.avatar_url !== undefined) metadataUpdates.avatar_url = data.avatar_url;
      if (data.onboarding_completed !== undefined) {
        metadataUpdates.onboarding_completed = data.onboarding_completed;
      }

      if (Object.keys(metadataUpdates).length > 0) {
        promises.push(
          sb.auth
            .updateUser({ data: metadataUpdates })
            .catch((e) => console.warn('[Supabase Auth]: Aviso ao atualizar metadados:', e))
        );
      }

      // 3. Persistir somente campos editáveis do perfil, sem sobrescrever campos de cobrança.
      const profilePayload: Record<string, any> = {
        updated_at: nowIso,
      };
      if (data.name !== undefined) profilePayload.name = data.name;
      if (data.full_name !== undefined) profilePayload.full_name = data.full_name;
      if (data.first_name !== undefined) profilePayload.first_name = data.first_name;
      if (data.last_name !== undefined) profilePayload.last_name = data.last_name;
      if (data.avatar_url !== undefined) profilePayload.avatar_url = data.avatar_url;
      if (data.phone !== undefined) profilePayload.phone = data.phone;
      if (data.document !== undefined) profilePayload.document = data.document;
      if (data.city !== undefined) profilePayload.city = data.city;
      if (data.state !== undefined) profilePayload.state = data.state;
      if (data.company_name !== undefined) profilePayload.company_name = data.company_name;
      if (data.onboarding_completed !== undefined) {
        profilePayload.onboarding_completed = data.onboarding_completed;
      }

      promises.push(
        Promise.resolve(
          sb.from('profiles').update(profilePayload).eq('user_id', user.id)
        ).catch((e: any) => console.warn('[Supabase Profiles]: Aviso ao salvar perfil:', e))
      );

      // 4. Persistir na tabela companies (upsert idempotente por user_id)
      if (data.company_name || data.phone || data.document) {
        const compPayload: Record<string, any> = {
          user_id: user.id,
          updated_at: nowIso,
        };
        if (data.company_name) compPayload.name = data.company_name;
        if (data.phone) {
          compPayload.phone = data.phone;
          compPayload.whatsapp = data.phone;
        }
        if (data.document) compPayload.document = data.document;

        promises.push(
          Promise.resolve(
            sb.from('companies').upsert(compPayload, { onConflict: 'user_id' })
          ).catch((e: any) => console.warn('[Supabase Companies]: Aviso ao salvar empresa:', e))
        );
      }

      // Execução paralela sem travar a interface
      await Promise.allSettled(promises);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateUser,
        setUser,
        syncSupabaseUser,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
