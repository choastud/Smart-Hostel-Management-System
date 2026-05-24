import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('shms_supabase_url') || '';
    const localKey = localStorage.getItem('shms_supabase_anon_key') || '';
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey };
    }
  }

  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('shms_supabase_url', url.trim());
    localStorage.setItem('shms_supabase_anon_key', anonKey.trim());
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('shms_supabase_url');
    localStorage.removeItem('shms_supabase_anon_key');
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    cachedClient = null;
    cachedUrl = '';
    cachedKey = '';
    return null;
  }

  if (cachedClient && cachedUrl === config.url && cachedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    cachedUrl = config.url;
    cachedKey = config.anonKey;
    return cachedClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    cachedClient = null;
    cachedUrl = '';
    cachedKey = '';
    return null;
  }
}
