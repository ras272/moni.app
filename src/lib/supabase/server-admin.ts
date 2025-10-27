import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con SERVICE ROLE KEY
 *
 * ⚠️ SOLO USAR EN SERVER ACTIONS Y API ROUTES
 *
 * Este cliente bypassa RLS porque:
 * 1. Server Actions ya validan permisos en código (getCurrentProfileId, ownership checks)
 * 2. No está expuesto al cliente (solo server-side)
 * 3. RLS SELECT policies siguen protegiendo qué puede VER cada usuario
 * 4. Es el patrón recomendado para Server Actions en Next.js 15
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
