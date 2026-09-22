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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to sync Supabase user and profile metadata
  const syncSupabaseUser = async (authUser: any): Promise<UserAccount> => {
    const meta = authUser.user_metadata || {};
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
    const provider = (authUser.app_metadata?.provider === 'google' ? 'google' : 'email') as 'google' | 'email';

    let profileData: any = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!error && data) {
          profileData = data;
        } else {
          // Idempotent upsert of profile
          const newProfile = {
            id: authUser.id,
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
            usage_period: new Date().toISOString().substring(0, 7),
            paid_subscription: false,
            subscription_status: 'inactive',
          };

          const { data: upserted } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (upserted) {
            profileData = upserted;
          }
        }
      } catch (err) {
        console.warn('Aviso: Não foi possível sincronizar com tabela profiles do Supabase:', err);
      }
    }

    const account: UserAccount = {
      id: authUser.id,
      name: profileData?.full_name || profileData?.name || fullName,
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
      usage_period: profileData?.usage_period || new Date().toISOString().substring(0, 7),
      paid_subscription: profileData?.paid_subscription || false,
      subscription_status: profileData?.subscription_status || 'inactive',
      subscription_started_at: profileData?.subscription_started_at,
      subscription_expires_at: profileData?.subscription_expires_at,
      cakto_customer_id: profileData?.cakto_customer_id,
      cakto_transaction_id: profileData?.cakto_transaction_id,
      created_at: profileData?.created_at || authUser.created_at || new Date().toISOString(),
      updated_at: profileData?.updated_at || new Date().toISOString(),
    };

    return account;
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
          console.warn('Não foi possível restaurar sessão do Supabase:', err);
        }
      }

      // 2. Check saved local session
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

    if (isSupabaseConfigured() && supabase) {
      try {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        // Browser will redirect to Google OAuth login screen
        return;
      } catch (err: any) {
        setLoading(false);
        return { error: err?.message || 'Falha ao iniciar login com Google.' };
      }
    }

    // Fallback if Supabase credentials are not configured in local environment
    console.warn('Supabase não configurado com chaves no .env. Ativando simulação de Login Google.');
    const demoGoogleUser: UserAccount = {
      id: `google_${Date.now()}`,
      name: 'Carlos Eduardo',
      full_name: 'Carlos Eduardo Santos',
      first_name: 'Carlos',
      last_name: 'Santos',
      email: 'carlos.eduardo@gmail.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      provider: 'google',
      company_name: 'EletroVolt Instalações',
      phone: '(11) 98765-4321',
      document: '12.345.678/0001-90',
      plan: 'free',
      monthly_budget_limit: 3,
      monthly_budget_count: 0,
      usage_period: new Date().toISOString().substring(0, 7),
      paid_subscription: false,
      subscription_status: 'inactive',
      created_at: new Date().toISOString(),
    };
    setUser(demoGoogleUser);
    localStorage.setItem('orcacerto_user', JSON.stringify(demoGoogleUser));
    setLoading(false);
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
