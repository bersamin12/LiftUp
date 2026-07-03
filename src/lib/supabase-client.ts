/**
 * Supabase browser client — safe for use in Client Components.
 * Uses the anon key only; RLS enforces access control.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function supabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
