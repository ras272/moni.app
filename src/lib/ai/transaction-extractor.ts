/**
 * Extractor híbrido de transacciones
 *
 * Estrategia inteligente:
 * 1. Intentar con reglas (gratis, rápido, ~80% éxito)
 * 2. Si falla o confianza baja → usar Groq (gratis pero con rate limits)
 * 3. Si Groq falla → devolver mejor intento de reglas
 *
 * Este es el punto de entrada principal para extraer transacciones.
 */

import { AI_CONFIG } from './config';
import { extractWithRules, isRulesExtractionValid } from './rules-extractor';
import { extractWithGroq, isGroqAvailable } from './groq-client';
import type {
  ExtractedTransaction,
  AIResponse,
  ExtractionOptions
} from './types';

/**
 * Extrae una transacción de un mensaje de texto
 *
 * @param message Mensaje del usuario (ej: "gasté 50 mil en biggie")
 * @param options Opciones de extracción
 * @returns AIResponse con la transacción extraída
 */
export async function extractTransaction(
  message: string,
  options: ExtractionOptions = {}
): Promise<AIResponse> {
  // Validación básica
  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: 'Mensaje vacío'
    };
  }

  const trimmedMessage = message.trim();

  // Si la IA está desactivada, solo usar reglas
  if (!AI_CONFIG.ENABLED) {
    const rulesResult = extractWithRules(trimmedMessage);
    return {
      success: true,
      data: rulesResult
    };
  }

  try {
    // PASO 1: Intentar con reglas (siempre primero, a menos que se fuerce IA)
    if (!options.forceAI && AI_CONFIG.USE_RULES_FIRST) {
      const rulesResult = extractWithRules(trimmedMessage);

      // Si las reglas dieron un resultado válido y confiable → usar ese
      if (isRulesExtractionValid(rulesResult)) {
        if (AI_CONFIG.LOG_EXTRACTIONS) {
          console.log(
            '✅ [Hybrid] Using rules result (high confidence):',
            rulesResult.confidence
          );
        }

        return {
          success: true,
          data: rulesResult
        };
      }

      // Si las reglas fallaron pero la IA no está disponible → devolver mejor intento
      if (!AI_CONFIG.USE_AI_FALLBACK || !isGroqAvailable()) {
        if (AI_CONFIG.LOG_EXTRACTIONS) {
          console.log(
            '⚠️ [Hybrid] Rules low confidence, but AI not available. Using rules anyway:',
            rulesResult.confidence
          );
        }

        return {
          success: true,
          data: rulesResult,
          fallbackUsed: true
        };
      }

      // PASO 2: Reglas dieron baja confianza → intentar con IA
      if (AI_CONFIG.LOG_EXTRACTIONS) {
        console.log(
          '🔄 [Hybrid] Rules confidence low (',
          rulesResult.confidence,
          '), trying AI...'
        );
      }

      const aiResult = await extractWithGroq(trimmedMessage);

      // Si la IA funcionó y tiene buena confianza → usar IA
      if (aiResult && aiResult.confidence >= rulesResult.confidence) {
        if (AI_CONFIG.LOG_EXTRACTIONS) {
          console.log(
            '✅ [Hybrid] Using AI result (higher confidence):',
            aiResult.confidence
          );
        }

        return {
          success: true,
          data: aiResult
        };
      }

      // Si la IA falló o dio peor resultado → usar reglas
      if (AI_CONFIG.LOG_EXTRACTIONS) {
        console.log(
          '⚠️ [Hybrid] AI failed or lower confidence, using rules:',
          rulesResult.confidence
        );
      }

      return {
        success: true,
        data: rulesResult,
        fallbackUsed: true
      };
    }

    // PASO 3: Si se forzó IA → usar solo IA
    if (options.forceAI) {
      const aiResult = await extractWithGroq(trimmedMessage);

      if (aiResult) {
        return {
          success: true,
          data: aiResult
        };
      }

      // Si la IA falló, hacer fallback a reglas
      const rulesResult = extractWithRules(trimmedMessage);
      return {
        success: true,
        data: rulesResult,
        fallbackUsed: true
      };
    }

    // Caso por defecto: usar reglas
    const rulesResult = extractWithRules(trimmedMessage);
    return {
      success: true,
      data: rulesResult
    };
  } catch (error: any) {
    console.error('❌ [Hybrid] Unexpected error:', error);

    // En caso de error, intentar con reglas como último recurso
    try {
      const rulesResult = extractWithRules(trimmedMessage);
      return {
        success: true,
        data: rulesResult,
        fallbackUsed: true,
        error: error.message
      };
    } catch (fallbackError: any) {
      return {
        success: false,
        error: `Error: ${error.message}`
      };
    }
  }
}

/**
 * Extrae múltiples transacciones en batch
 * Útil para procesar varios mensajes a la vez
 */
export async function extractTransactionsBatch(
  messages: string[],
  options: ExtractionOptions = {}
): Promise<AIResponse[]> {
  const results: AIResponse[] = [];

  for (const message of messages) {
    const result = await extractTransaction(message, options);
    results.push(result);

    // Pequeño delay para no saturar la API
    if (results.length < messages.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Formatea una transacción extraída para mostrar al usuario
 */
export function formatExtractedTransaction(
  extraction: ExtractedTransaction
): string {
  const emoji = extraction.type === 'expense' ? '💸' : '💰';
  const typeLabel =
    extraction.type === 'expense'
      ? 'Egreso'
      : extraction.type === 'income'
        ? 'Ingreso'
        : 'Transferencia';

  let text = `${emoji} ${typeLabel}`;

  if (extraction.amount) {
    text += `: ₲${extraction.amount.toLocaleString('es-PY')}`;
  } else {
    text += ' (monto no detectado)';
  }

  if (extraction.merchant) {
    text += `\n🏪 Comercio: ${extraction.merchant}`;
  }

  if (extraction.category) {
    text += `\n📁 Categoría: ${extraction.category}`;
  }

  if (extraction.notes) {
    text += `\n📝 Notas: ${extraction.notes}`;
  }

  // Indicador de método usado
  const methodEmoji = extraction.method === 'rules' ? '⚡' : '🤖';
  const methodLabel = extraction.method === 'rules' ? 'Reglas' : 'IA';
  text += `\n\n${methodEmoji} Detectado con: ${methodLabel}`;

  // Indicador de confianza
  const confidencePercent = Math.round(extraction.confidence * 100);
  if (confidencePercent < 70) {
    text += `\n⚠️ Confianza: ${confidencePercent}% (verificá los datos)`;
  } else {
    text += `\n✅ Confianza: ${confidencePercent}%`;
  }

  return text;
}

/**
 * Genera una respuesta para confirmar con el usuario
 */
export function generateConfirmationMessage(
  extraction: ExtractedTransaction
): string {
  const formatted = formatExtractedTransaction(extraction);

  return `✨ Detecté una transacción:\n\n${formatted}\n\n¿Es correcto?\n\n✅ Responde "confirmar" para registrar\n❌ Responde "cancelar" para descartar\n✏️ O escribí correcciones`;
}
