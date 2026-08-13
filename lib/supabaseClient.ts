import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * `null` when Supabase env vars aren't configured yet — cloud sync features stay disabled
 * and the app keeps working purely from localStorage in that case.
 */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // Magic links resolve entirely client-side (no server callback route needed).
          flowType: 'implicit',
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true,
        },
      })
    : null;
