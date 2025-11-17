/**
 * Configuración de IA para el bot de WhatsApp
 *
 * Feature flags para activar/desactivar funcionalidades de IA
 * sin afectar el funcionamiento normal del bot
 */

export const AI_CONFIG = {
  // 🎚️ Feature Flags - Cambiar a true para activar
  ENABLED: true, // Master switch - ACTIVADO ✅
  USE_RULES_FIRST: true, // Siempre intentar con reglas primero
  USE_AI_FALLBACK: true, // Usar IA si las reglas fallan

  // 🤖 Configuración de Groq
  GROQ_MODEL: 'llama-3.3-70b-versatile', // Actualizado: 3.1 → 3.3

  // 📊 Límites de seguridad
  MAX_DAILY_AI_REQUESTS: 1000, // Límite auto-impuesto por día
  MAX_AI_REQUESTS_PER_MINUTE: 20,

  // 🎯 Confianza mínima para usar reglas
  MIN_CONFIDENCE_RULES: 0.7, // Si es < 0.7, usar IA

  // 🔧 Configuración de extracción
  TEMPERATURE: 0.3, // Más determinista = más consistente

  // 📝 Logging
  LOG_EXTRACTIONS: true, // Loggear todas las extracciones (para debugging)
  LOG_AI_USAGE: true // Loggear cuando se usa IA vs reglas
} as const;

// Contador de requests para rate limiting
let dailyAIRequests = 0;
let lastReset = Date.now();
let minuteRequests: number[] = [];

/**
 * Verifica si se puede hacer un request de IA
 * Implementa rate limiting básico
 */
export function canMakeAIRequest(): boolean {
  // Si la IA está desactivada, siempre retornar false
  if (!AI_CONFIG.ENABLED || !AI_CONFIG.USE_AI_FALLBACK) {
    return false;
  }

  // Reset diario
  const now = Date.now();
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    dailyAIRequests = 0;
    lastReset = now;
    if (AI_CONFIG.LOG_AI_USAGE) {
      console.log('✅ AI rate limit reset (daily)');
    }
  }

  // Check límite diario
  if (dailyAIRequests >= AI_CONFIG.MAX_DAILY_AI_REQUESTS) {
    if (AI_CONFIG.LOG_AI_USAGE) {
      console.warn('⚠️ Daily AI request limit reached');
    }
    return false;
  }

  // Check límite por minuto
  const oneMinuteAgo = now - 60 * 1000;
  minuteRequests = minuteRequests.filter((t) => t > oneMinuteAgo);

  if (minuteRequests.length >= AI_CONFIG.MAX_AI_REQUESTS_PER_MINUTE) {
    if (AI_CONFIG.LOG_AI_USAGE) {
      console.warn('⚠️ Per-minute AI request limit reached');
    }
    return false;
  }

  return true;
}

/**
 * Registra que se hizo un request de IA
 */
export function recordAIRequest(): void {
  dailyAIRequests++;
  minuteRequests.push(Date.now());

  if (AI_CONFIG.LOG_AI_USAGE) {
    console.log(
      `📊 AI requests today: ${dailyAIRequests}/${AI_CONFIG.MAX_DAILY_AI_REQUESTS}`
    );
  }
}

/**
 * Obtiene estadísticas de uso de IA
 */
export function getAIStats() {
  return {
    dailyRequests: dailyAIRequests,
    dailyLimit: AI_CONFIG.MAX_DAILY_AI_REQUESTS,
    percentageUsed: (dailyAIRequests / AI_CONFIG.MAX_DAILY_AI_REQUESTS) * 100,
    canMakeRequest: canMakeAIRequest()
  };
}
