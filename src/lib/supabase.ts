import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getCleanEnv = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const DEFAULT_SUPABASE_URL = 'https://aztmenorefrgpdnpedjb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_VqN1piHxTm2Kby5uOQDXZQ_yxig73ex';
const REMEMBER_SESSION_KEY = 'orcacerto_remember_session';

export const getRememberSession = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_SESSION_KEY) !== 'false';
};

export const setRememberSession = (remember: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMEMBER_SESSION_KEY, String(remember));
};

const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    if (key.endsWith('-code-verifier')) {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    }
    if (!getRememberSession()) return window.sessionStorage.getItem(key);
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    // PKCE verifiers need to survive opening an email link in a new tab.
    if (key.endsWith('-code-verifier')) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
      return;
    }
    const target = getRememberSession() ? window.localStorage : window.sessionStorage;
    const other = getRememberSession() ? window.sessionStorage : window.localStorage;
    target.setItem(key, value);
    other.removeItem(key);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const getSupabaseUrl = (): string => {
  return (
    getCleanEnv(import.meta.env.VITE_SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL
  );
};

export const getSupabaseKey = (): string => {
  return (
    getCleanEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    getCleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    DEFAULT_SUPABASE_KEY
  );
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return Boolean(
    url && 
    key && 
    url.startsWith('https://') &&
    !url.includes('your-project') &&
    !url.includes('seu-projeto')
  );
};

let _supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabaseInstance) {
    _supabaseInstance = createClient(getSupabaseUrl(), getSupabaseKey(), {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: authStorage,
      },
    });
  }
  return _supabaseInstance;
};

export const supabase = getSupabaseClient();
