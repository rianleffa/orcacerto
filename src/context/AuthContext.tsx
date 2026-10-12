import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '../types/database';
import { initialUser } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  loginDemo: () => void;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserAccount>) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  syncSupabaseUser: (authUser: any) => Promise<UserAccount>;
  refreshSession: () => Promise<UserAccount | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to sync Supabase user and profile metadata
  const syncSupabaseUser = async (authUser: any): Promise<UserAccount> => {
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

    if (supabase) {
      try {
        // Query by user_id or id
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`user_id.eq.${authUser.id},id.eq.${authUser.id}`)
          .maybeSingle();

        if (!error && data) {
          profileData = data;
          // Update last_login_at and fill missing fields
          const updates: Record<string, any> = {
            last_login_at: nowIso,
            updated_at: nowIso,
          };
          if (!data.user_id) updates.user_id = authUser.id;
          if (avatarUrl && !data.avatar_url) updates.avatar_url = avatarUrl;
          if (phone && !data.phone) updates.phone = phone;
          if (document && !data.document) updates.document = document;
          if (provider && (!data.provider || data.provider === 'email') && isGoogle) {
            updates.provider = 'google';
          }

          const { data: updatedProfile, error: updateErr } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', data.id)
            .select()
            .maybeSingle();

          if (!updateErr && updatedProfile) {
            profileData = updatedProfile;
          }
        } else {
          // Idempotent upsert of profile
          const newProfile = {
            id: authUser.id,
            user_id: authUser.id,
            name: fullName,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            email: authUser.email,
            avatar_url: avatarUrl,
            provider,
            phone,
            document,
            plan: 'free',
            monthly_budget_limit: 3,
            monthly_budget_count: 0,
            usage_period: nowIso.substring(0, 7),
            paid_subscription: false,
            subscription_status: 'inactive',
            created_at: nowIso,
            updated_at: nowIso,
            last_login_at: nowIso,
          };

          const { data: upserted, error: upsertErr } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (!upsertErr && upserted) {
            profileData = upserted;
          } else if (upsertErr) {
            console.error('[Supabase profiles upsert error]:', upsertErr);
          }
        }

        // Ensure company record exists for this user with correct phone & document
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (!existingCompany) {
          await supabase.from('companies').insert({
            user_id: authUser.id,
            name: companyName,
            email: authUser.email,
            phone,
            whatsapp: phone,
            document,
          });
        } else if (phone || document) {
          const companyUpdates: Record<string, any> = {};
          if (phone && !existingCompany.phone) {
            companyUpdates.phone = phone;
            companyUpdates.whatsapp = phone;
          }
          if (document && !existingCompany.document) {
            companyUpdates.document = document;
          }
          if (Object.keys(companyUpdates).length > 0) {
            await supabase.from('companies').update(companyUpdates).eq('id', existingCompany.id);
          }
        }
      } catch (err) {
        console.warn('[Supabase]: Aviso na sincronização da tabela profiles:', err);
      }
    }

    const localOnboarded = localStorage.getItem(`orcacerto_onboarded_${authUser.id}`) === 'true';
    const hasCompanyData = (phone && phone.trim().length > 0) || (companyName && companyName !== 'Minha Empresa');
    const isOnboarded = Boolean(
      meta.onboarding_completed ||
      profileData?.onboarding_completed ||
      localOnboarded ||
      hasCompanyData
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
      company_name: profileData?.company_name || meta.company_name || 'Minha Empresa',
      phone: profileData?.phone || phone || '',
      document: profileData?.document || document || '',
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
    return account;
  };

  const refreshSession = async (): Promise<UserAccount | null> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const account = await syncSupabaseUser(authUser);
          return account;
        }
        const { data: { session }, error } = await supabase.auth.getSession();
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

    const initializeAuth = async () => {
      // 1. Check if an OAuth callback is currently in progress
      const isOAuthRoute =
        window.location.pathname.includes('/auth/callback') ||
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token=');

      // 2. Check real Supabase user first if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          // Use getUser() for verified server-side authentication
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser && isMounted) {
            await syncSupabaseUser(authUser);
            if (isMounted) {
              setLoading(false);
              return;
            }
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && isMounted) {
              await syncSupabaseUser(session.user);
              if (isMounted) {
                setLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.error('[Supabase]: Não foi possível restaurar sessão:', err);
        }
      }

      // If in OAuth callback, keep loading so AuthCallbackPage can perform exchange safely
      if (isOAuthRoute) {
        return;
      }

      // 3. Check saved local session (for demo mode or fallback only when Supabase is not configured)
      const saved = localStorage.getItem('orcacerto_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.provider === 'demo' && isMounted) {
            setUser(parsed);
          } else if (!isSupabaseConfigured() && isMounted) {
            setUser(parsed);
          } else {
            // Se Supabase está configurado mas não possui sessão ativa válida, limpa cache
            if (isMounted) setUser(null);
            localStorage.removeItem('orcacerto_user');
          }
        } catch {
          if (isMounted) setUser(null);
        }
      } else {
        if (isMounted) setUser(null);
      }

      if (isMounted) setLoading(false);
    };

    initializeAuth();

    // 3. Listen to Supabase Auth state changes in real time
    let authListener: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured() && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      authListener?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
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
      const { data, error } = await supabase.auth.signInWithPassword({
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

    if (!isSupabaseConfigured() || !supabase) {
      const configErrMsg = 'Supabase não está configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.';
      console.error('[Google OAuth]:', configErrMsg);
      setLoading(false);
      return {
        error: configErrMsg,
      };
    }

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const redirectUrl = `${siteUrl}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
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

  const loginDemo = () => {
    const demoUser: UserAccount = {
      ...initialUser,
      full_name: initialUser.name,
      first_name: 'Carlos',
      last_name: 'Eduardo',
      provider: 'demo',
    };
    setUser(demoUser);
    localStorage.setItem('orcacerto_user', JSON.stringify(demoUser));
  };

  const signup = async (
    data: SignupData
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
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
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
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
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('orcacerto_user');
  };

  const updateUser = async (data: Partial<UserAccount>) => {
    if (!user) return;
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

    if (isSupabaseConfigured() && supabase && user.id && !user.id.startsWith('demo_') && !user.id.startsWith('usr_')) {
      // 1. Atualizar metadados nativos no Supabase Auth (persiste mesmo sem tabelas criadas no Postgres)
      try {
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
          await supabase.auth.updateUser({
            data: metadataUpdates,
          });
        }
      } catch (authErr) {
        console.warn('[Supabase Auth]: Aviso ao sincronizar metadados do usuário:', authErr);
      }

      // 2. Atualizar tabela profiles (se disponível)
      try {
        await supabase
          .from('profiles')
          .update({
            name: data.name ?? data.full_name ?? user.name,
            full_name: data.full_name ?? data.name ?? user.full_name,
            first_name: data.first_name ?? user.first_name,
            last_name: data.last_name ?? user.last_name,
            avatar_url: data.avatar_url ?? user.avatar_url,
            phone: data.phone ?? user.phone,
            document: data.document ?? user.document,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${user.id},user_id.eq.${user.id}`);
      } catch (err) {
        console.warn('Aviso: Erro ao sincronizar atualização em profiles:', err);
      }

      // 3. Atualizar tabela companies (se disponível)
      if (data.company_name || data.phone || data.document) {
        try {
          const compUpdates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if (data.company_name) compUpdates.name = data.company_name;
          if (data.phone) {
            compUpdates.phone = data.phone;
            compUpdates.whatsapp = data.phone;
          }
          if (data.document) compUpdates.document = data.document;

          await supabase
            .from('companies')
            .update(compUpdates)
            .eq('user_id', user.id);
        } catch (compErr) {
          console.warn('Aviso: Erro ao sincronizar empresa no Supabase:', compErr);
        }
      }
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
        loginDemo,
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
