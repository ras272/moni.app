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
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase admin credentials');
}

/**
 * Cliente admin de Supabase con service role
 * BYPASSA RLS - usar con precaución
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
