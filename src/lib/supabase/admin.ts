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

  console.log('🔧 Initializing Supabase Admin Client:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlPrefix: supabaseUrl?.substring(0, 20),
    keyPrefix: supabaseServiceKey?.substring(0, 20)
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    const error = new Error('Missing Supabase admin credentials');
    console.error('❌ Admin client initialization failed:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });
    throw error;
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase Admin Client initialized successfully');

  return supabaseAdminInstance;
}
