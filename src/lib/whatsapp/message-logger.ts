/**
 * WhatsApp Bot - Message Logger
 * 
 * Registra todos los mensajes en la tabla whatsapp_message_logs
 */

import { createClient } from '@/lib/supabase/server';

// =====================================================
// LOG INBOUND MESSAGE
// =====================================================

/**
 * Registra un mensaje recibido del usuario
 */
export async function logInboundMessage(
  connectionId: string,
  messageText: string,
  intent: string | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('whatsapp_message_logs').insert({
      connection_id: connectionId,
      direction: 'inbound',
      message_text: messageText,
      intent,
      metadata
    });
  } catch (error) {
    console.error('Error logging inbound message:', error);
    // No throw - logging no debe romper el flujo
  }
}

// =====================================================
// LOG OUTBOUND MESSAGE
// =====================================================

/**
 * Registra un mensaje enviado al usuario
 */
export async function logOutboundMessage(
  connectionId: string,
  messageText: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('whatsapp_message_logs').insert({
      connection_id: connectionId,
      direction: 'outbound',
      message_text: messageText,
      intent: null, // Outbound no tiene intent
      metadata
    });
  } catch (error) {
    console.error('Error logging outbound message:', error);
    // No throw - logging no debe romper el flujo
  }
}

// =====================================================
// RATE LIMITING
// =====================================================

/**
 * Verifica si un usuario ha excedido el rate limit
 * Límite: 10 mensajes por minuto
 */
export async function checkRateLimit(connectionId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('whatsapp_message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .eq('direction', 'inbound')
      .gte('created_at', oneMinuteAgo);

    if (error) {
      console.error('Error checking rate limit:', error);
      return true; // En caso de error, permitir (fail open)
    }

    const messageCount = count || 0;
    const RATE_LIMIT = 10;

    if (messageCount >= RATE_LIMIT) {
      console.warn(`Rate limit exceeded for connection ${connectionId}`);
      return false; // Rate limit excedido
    }

    return true; // OK
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    return true; // Fail open
  }
}
