/**
 * WhatsApp Bot - Webhook Validator
 * 
 * Valida la autenticidad de los webhooks de Meta usando HMAC-SHA256
 */

import crypto from 'crypto';

const APP_SECRET = process.env.WHATSAPP_APP_SECRET!;

// =====================================================
// VALIDATE WEBHOOK SIGNATURE
// =====================================================

/**
 * Valida la firma HMAC-SHA256 de un webhook de Meta
 * @param payload - Cuerpo del request (raw string)
 * @param signature - Header x-hub-signature-256
 * @returns true si la firma es válida
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    console.error('Missing signature header');
    return false;
  }

  if (!APP_SECRET) {
    console.error('WHATSAPP_APP_SECRET not configured');
    return false;
  }

  try {
    // Meta envía: "sha256=HASH"
    const signatureHash = signature.replace('sha256=', '');

    // Calcular HMAC-SHA256 esperado
    const expectedHash = crypto
      .createHmac('sha256', APP_SECRET)
      .update(payload)
      .digest('hex');

    // Comparación segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(expectedHash)
    );
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

// =====================================================
// VALIDATE VERIFY TOKEN
// =====================================================

/**
 * Valida el verify token durante el setup del webhook
 * Meta lo envía para verificar que el endpoint es legítimo
 */
export function validateVerifyToken(token: string | null): boolean {
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'moni_webhook_2024';

  return token === expectedToken;
}
