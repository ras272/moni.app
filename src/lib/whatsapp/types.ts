/**
 * WhatsApp Bot - Type Definitions
 * 
 * Tipos e interfaces compartidas para toda la integración WhatsApp
 */

// =====================================================
// INTENCIONES SOPORTADAS
// =====================================================

export type Intent =
  | 'add_expense'
  | 'add_income'
  | 'get_balance'
  | 'get_summary'
  | 'link_account'
  | 'help'
  | 'unknown';

// =====================================================
// MENSAJE PARSEADO
// =====================================================

export interface ParsedMessage {
  intent: Intent;
  amount?: number;
  currency?: 'PYG' | 'USD';
  description?: string;
  category?: string;
  linkToken?: string;
  rawText: string;
}

// =====================================================
// CONTEXTO DEL MENSAJE
// =====================================================

export interface MessageContext {
  from: string; // Número de WhatsApp (595991234567)
  messageId: string; // ID del mensaje de WhatsApp
  timestamp: number;
  profileId?: string; // UUID del usuario vinculado (si existe)
  connectionId?: string; // ID de la conexión en DB
}

// =====================================================
// RESPUESTA DE HANDLERS
// =====================================================

export interface HandlerResponse {
  success: boolean;
  message: string; // Texto a enviar al usuario
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  metadata?: Record<string, any>;
}

// =====================================================
// WEBHOOK DE META
// =====================================================

export interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// =====================================================
// CONEXIÓN WHATSAPP (DB)
// =====================================================

export interface WhatsAppConnection {
  id: string;
  profile_id: string;
  phone_number: string;
  is_active: boolean;
  verification_token: string | null;
  token_expires_at: string | null;
  linked_at: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// LOG DE MENSAJES (DB)
// =====================================================

export interface WhatsAppMessageLog {
  id: string;
  connection_id: string;
  direction: 'inbound' | 'outbound';
  message_text: string;
  intent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// RESPUESTA DE META API
// =====================================================

export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
}

export interface WhatsAppApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
    fbtrace_id: string;
  };
}
