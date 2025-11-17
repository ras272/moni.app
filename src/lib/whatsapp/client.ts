/**
 * WhatsApp Bot - Meta API Client
 *
 * Cliente para interactuar con WhatsApp Business Cloud API
 */

import type { WhatsAppApiResponse, WhatsAppApiError } from './types';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

// =====================================================
// INDICADOR DE "ESCRIBIENDO..."
// =====================================================

/**
 * Muestra el indicador de "escribiendo..." en WhatsApp
 * @param to - Número de teléfono del destinatario
 */
export async function sendTypingIndicator(
  to: string
): Promise<{ success: boolean }> {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return { success: false };
    }

    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: '...' } // WhatsApp mostrará "escribiendo..."
      })
    });

    return { success: response.ok };
  } catch (error) {
    console.error('Failed to send typing indicator:', error);
    return { success: false };
  }
}

// =====================================================
// ENVIAR MENSAJE SIMPLE
// =====================================================

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.error('Missing WhatsApp credentials');
      return {
        success: false,
        error: 'WhatsApp not configured'
      };
    }

    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      })
    });

    if (!response.ok) {
      const error: WhatsAppApiError = await response.json();
      console.error('WhatsApp API error:', error);
      return {
        success: false,
        error: error.error?.message || 'Unknown error'
      };
    }

    const data: WhatsAppApiResponse = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id
    };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// ENVIAR MENSAJE CON BOTONES INTERACTIVOS
// =====================================================

export async function sendWhatsAppButtons(
  to: string,
  text: string,
  buttons: Array<{ id: string; title: string }>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return {
        success: false,
        error: 'WhatsApp not configured'
      };
    }

    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

    // WhatsApp permite máximo 3 botones
    const limitedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply' as const,
      reply: {
        id: btn.id,
        title: btn.title.slice(0, 20) // Max 20 caracteres por botón
      }
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text },
          action: {
            buttons: limitedButtons
          }
        }
      })
    });

    if (!response.ok) {
      const error: WhatsAppApiError = await response.json();
      return {
        success: false,
        error: error.error?.message || 'Unknown error'
      };
    }

    const data: WhatsAppApiResponse = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// UTILIDADES DE FORMATO
// =====================================================

/**
 * Formatea un monto con símbolo de moneda
 * @param amount - Monto en unidades mínimas (centavos para USD, guaraníes para PYG)
 * @param currency - Código de moneda (PYG, USD)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PYG'
): string {
  if (currency === 'PYG') {
    return `Gs. ${amount.toLocaleString('es-PY')}`;
  }

  // USD: convertir de centavos a dólares
  return `$${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formatea una fecha en formato DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha de forma relativa (hace 2 horas, hace 3 días, etc.)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

/**
 * Limpia el número de teléfono al formato internacional sin +
 * Ejemplos: +595991234567 → 595991234567
 *           595991234567 → 595991234567
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}
