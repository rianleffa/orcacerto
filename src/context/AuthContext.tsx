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
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ error?: string } | void>;
  loginDemo: () => void;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserAccount>) => Promise<void>;
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
          // Update last_login_at and ensure avatar / user_id are set
          const updates: Record<string, any> = {
            last_login_at: nowIso,
            updated_at: nowIso,
          };
          if (!data.user_id) updates.user_id = authUser.id;
          if (avatarUrl && !data.avatar_url) updates.avatar_url = avatarUrl;
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

        // Ensure default company record exists for this user
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (!existingCompany) {
          await supabase.from('companies').insert({
            user_id: authUser.id,
            name: meta.company_name || 'Minha Empresa',
            email: authUser.email,
          });
        }
      } catch (err) {
        console.error('[Supabase]: Erro na sincronização da tabela profiles:', err);
      }
    }

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
      phone: profileData?.phone || meta.phone || '',
      document: profileData?.document || meta.document || '',
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

    return account;
  };

  const refreshSession = async (): Promise<UserAccount | null> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Supabase getSession error]:', error);
          return null;
        }
        if (session?.user) {
          const account = await syncSupabaseUser(session.user);
          setUser(account);
          localStorage.setItem('orcacerto_user', JSON.stringify(account));
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
      // 1. Check Supabase session first if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const account = await syncSupabaseUser(session.user);
            if (isMounted) {
              setUser(account);
              localStorage.setItem('orcacerto_user', JSON.stringify(account));
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('[Supabase]: Não foi possível restaurar sessão:', err);
        }
      }

      // 2. Check saved local session (for demo mode or fallback)
      const saved = localStorage.getItem('orcacerto_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (isMounted) setUser(parsed);
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

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    if (isSupabaseConfigured() && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          const account = await syncSupabaseUser(data.user);
          setUser(account);
          localStorage.setItem('orcacerto_user', JSON.stringify(account));
          setLoading(false);
          return true;
        }
      } catch (err) {
        console.error('Supabase login error, fallback to local:', err);
      }
    }

    // Fallback local login
    const userObj: UserAccount = {
      ...initialUser,
      email,
      name: email.includes('carlos') ? 'Carlos Eduardo' : email.split('@')[0],
      full_name: email.includes('carlos') ? 'Carlos Eduardo' : email.split('@')[0],
      first_name: email.includes('carlos') ? 'Carlos' : email.split('@')[0],
      provider: 'email',
    };
    setUser(userObj);
    localStorage.setItem('orcacerto_user', JSON.stringify(userObj));
    setLoading(false);
    return true;
  };

  const loginWithGoogle = async (): Promise<{ error?: string } | void> => {
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      const configErrMsg = 'Supabase não está configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.';
      console.error('[Google OAuth]:', configErrMsg);
      setLoading(false);
      return {
        error: 'Não foi possível entrar com o Google. Verifique a configuração da autenticação e tente novamente.',
      };
    }

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
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
        return {
          error: 'Não foi possível entrar com o Google. Verifique a configuração da autenticação e tente novamente.',
        };
      }
      // O navegador redirecionará para a tela oficial de login do Google
      return;
    } catch (err: any) {
      console.error('[Google OAuth Unexpected Error]:', err);
      setLoading(false);
      return {
        error: 'Não foi possível entrar com o Google. Verifique a configuração da autenticação e tente novamente.',
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

  const signup = async (data: SignupData): Promise<boolean> => {
    setLoading(true);
    if (isSupabaseConfigured() && supabase && data.password) {
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
              document: data.document,
            },
          },
        });
        if (error) throw error;
        if (authData.user) {
          const account = await syncSupabaseUser(authData.user);
          setUser(account);
          localStorage.setItem('orcacerto_user', JSON.stringify(account));
          setLoading(false);
          return true;
        }
      } catch (err) {
        console.error('Supabase signup error, fallback:', err);
      }
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name: data.name,
      full_name: data.name,
      first_name: data.name.split(' ')[0] || data.name,
      last_name: data.name.includes(' ') ? data.name.substring(data.name.indexOf(' ') + 1) : '',
      email: data.email,
      provider: 'email',
      company_name: data.companyName,
      phone: data.phone,
      document: data.document,
      plan: 'free',
      monthly_budget_limit: 3,
      monthly_budget_count: 0,
      usage_period: new Date().toISOString().substring(0, 7),
      paid_subscription: false,
      subscription_status: 'inactive',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('orcacerto_user', JSON.stringify(newUser));
    setLoading(false);
    return true;
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

    if (isSupabaseConfigured() && supabase && user.id && !user.id.startsWith('demo_') && !user.id.startsWith('usr_')) {
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
          .eq('id', user.id);
      } catch (err) {
        console.warn('Aviso: Erro ao sincronizar atualização no Supabase:', err);
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
