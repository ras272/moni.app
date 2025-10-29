/**
 * Supabase Admin Client
 *
 * Cliente con service role key que bypassa RLS
 * SOLO usar para operaciones administrativas seguras como:
 * - Vinculación de WhatsApp desde webhook
 * - Logging de mensajes
 * - Operaciones del sistema
 */

import { createClient } from '@supabase/supabase-js';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

/**
 * Obtiene el cliente admin de Supabase con service role
 * BYPASSA RLS - usar con precaución
 * Se inicializa bajo demanda para evitar errores en build
 */
export function getSupabaseAdmin() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdminInstance;
}
