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
  loginDemo: () => void;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserAccount>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved local user session
    const saved = localStorage.getItem('orcacerto_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
      }
    } else {
      // Default to demo user logged in on initial arrival so user can test seamlessly
      setUser(initialUser);
      localStorage.setItem('orcacerto_user', JSON.stringify(initialUser));
    }

    // Check Supabase session if configured
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // Sync with Supabase profile
        }
      });
    }

    setLoading(false);
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
          const userObj: UserAccount = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email || email,
            company_name: data.user.user_metadata?.company_name || 'Minha Empresa',
            phone: data.user.user_metadata?.phone || '',
            plan: 'free',
            monthly_budget_limit: 3,
            monthly_budget_count: 0,
            paid_subscription: false,
            subscription_status: 'inactive',
            created_at: data.user.created_at,
          };
          setUser(userObj);
          localStorage.setItem('orcacerto_user', JSON.stringify(userObj));
          setLoading(false);
          return true;
        }
      } catch (err) {
        console.error('Supabase login error, fallback to demo mode:', err);
      }
    }

    // Fallback login
    const userObj: UserAccount = {
      ...initialUser,
      email,
      name: email.includes('carlos') ? 'Carlos Eduardo' : email.split('@')[0],
    };
    setUser(userObj);
    localStorage.setItem('orcacerto_user', JSON.stringify(userObj));
    setLoading(false);
    return true;
  };

  const loginDemo = () => {
    setUser(initialUser);
    localStorage.setItem('orcacerto_user', JSON.stringify(initialUser));
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
              company_name: data.companyName,
              phone: data.phone,
              document: data.document,
            },
          },
        });
        if (error) throw error;
        if (authData.user) {
          const userObj: UserAccount = {
            id: authData.user.id,
            name: data.name,
            email: data.email,
            company_name: data.companyName,
            phone: data.phone,
            document: data.document,
            plan: 'free',
            monthly_budget_limit: 3,
            monthly_budget_count: 0,
            paid_subscription: false,
            subscription_status: 'inactive',
            created_at: new Date().toISOString(),
          };
          setUser(userObj);
          localStorage.setItem('orcacerto_user', JSON.stringify(userObj));
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
      email: data.email,
      company_name: data.companyName,
      phone: data.phone,
      document: data.document,
      plan: 'free',
      monthly_budget_limit: 3,
      monthly_budget_count: 0,
      paid_subscription: false,
      subscription_status: 'inactive',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('orcacerto_user', JSON.stringify(newUser));
    setLoading(false);
    return true;
  };

  const logout = () => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('orcacerto_user');
  };

  const updateUser = (data: Partial<UserAccount>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('orcacerto_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
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
