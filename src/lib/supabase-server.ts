/**
 * Supabase client — SERVER-SIDE ONLY
 * Uses the service role key to bypass RLS.
 * Import only in route handlers, server actions, and seed scripts.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.'
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

// Lazy singleton — safe in Node.js serverless (one instance per cold start)
let _serviceClient: ReturnType<typeof getServiceClient> | null = null;

export function supabaseService() {
  if (!_serviceClient) _serviceClient = getServiceClient();
  return _serviceClient;
}
