import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getCleanEnv = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const DEFAULT_SUPABASE_URL = 'https://aztmenorefrgpdnpedjb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_VqN1piHxTm2Kby5uOQDXZQ_yxig73ex';

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
      },
    });
  }
  return _supabaseInstance;
};

export const supabase = getSupabaseClient();
