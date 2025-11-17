/**
 * Cliente de Groq para extracción de transacciones con IA
 *
 * Se usa solo cuando las reglas fallan o tienen baja confianza.
 * Groq es gratis y muy rápido (~300 tokens/segundo).
 */

import Groq from 'groq-sdk';
import { AI_CONFIG, canMakeAIRequest, recordAIRequest } from './config';
import type { ExtractedTransaction, TransactionCategory } from './types';

/**
 * Cliente de Groq
 * Solo se inicializa si existe la API key
 */
let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    if (AI_CONFIG.LOG_AI_USAGE) {
      console.warn('⚠️ GROQ_API_KEY not found in environment');
    }
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  return groqClient;
}

/**
 * Prompt del sistema para Groq
 */
const SYSTEM_PROMPT = `Sos un asistente que extrae información de transacciones financieras.
El usuario escribe en español paraguayo coloquial (puede usar "lucas", "mil", "k" para miles).

IMPORTANTE:
- SIEMPRE responde SOLO con un objeto JSON válido
- NO agregues texto adicional antes o después del JSON
- NO uses markdown code blocks (\`\`\`json)

Formato de respuesta (JSON):
{
  "amount": number (monto en guaraníes, null si no detectado),
  "type": "expense" | "income" | "transfer",
  "category": string | null (una de: Comida, Transporte, Entretenimiento, Salud, Compras, Servicios, Educación, Hogar, Otros),
  "merchant": string | null (nombre del comercio/lugar),
  "notes": string | null (información adicional relevante),
  "confidence": number (0-1, qué tan seguro estás)
}

Reglas:
1. "mil", "lucas", "k" = multiplicar por 1000
   Ej: "50 mil" = 50000
2. Si no está claro el tipo, asumir "expense"
3. Categorías válidas: Comida, Transporte, Entretenimiento, Salud, Compras, Servicios, Educación, Hogar, Otros
4. Confidence alto (>0.8) solo si tenés toda la info

Ejemplos:
Entrada: "gasté 50 mil en biggie"
Salida: {"amount": 50000, "type": "expense", "category": "Compras", "merchant": "Biggie", "notes": null, "confidence": 0.95}

Entrada: "cargué nafta 120"
Salida: {"amount": 120000, "type": "expense", "category": "Transporte", "merchant": null, "notes": "nafta", "confidence": 0.85}

Entrada: "me depositaron el sueldo"
Salida: {"amount": null, "type": "income", "category": null, "merchant": null, "notes": "sueldo", "confidence": 0.7}

Entrada: "compré en el super"
Salida: {"amount": null, "type": "expense", "category": "Compras", "merchant": "super", "notes": null, "confidence": 0.6}`;

/**
 * Valida que la respuesta de Groq sea un JSON válido
 */
function validateGroqResponse(response: any): ExtractedTransaction | null {
  try {
    // Verificar campos requeridos
    if (typeof response !== 'object' || response === null) {
      return null;
    }

    // Validar type
    if (
      !response.type ||
      !['expense', 'income', 'transfer'].includes(response.type)
    ) {
      return null;
    }

    // Validar confidence
    if (
      typeof response.confidence !== 'number' ||
      response.confidence < 0 ||
      response.confidence > 1
    ) {
      response.confidence = 0.5; // Default
    }

    return {
      amount: response.amount ? Number(response.amount) : null,
      type: response.type,
      category: response.category || null,
      merchant: response.merchant || null,
      notes: response.notes || null,
      confidence: response.confidence,
      method: 'ai'
    };
  } catch (error) {
    console.error('❌ Error validating Groq response:', error);
    return null;
  }
}

/**
 * Extrae una transacción usando Groq AI
 *
 * @param message Mensaje del usuario
 * @returns ExtractedTransaction o null si falla
 */
export async function extractWithGroq(
  message: string
): Promise<ExtractedTransaction | null> {
  // Verificar si se puede hacer el request
  if (!canMakeAIRequest()) {
    if (AI_CONFIG.LOG_AI_USAGE) {
      console.warn('⚠️ Cannot make AI request (rate limit or disabled)');
    }
    return null;
  }

  // Obtener cliente
  const client = getGroqClient();
  if (!client) {
    if (AI_CONFIG.LOG_AI_USAGE) {
      console.warn('⚠️ Groq client not initialized');
    }
    return null;
  }

  try {
    if (AI_CONFIG.LOG_EXTRACTIONS) {
      console.log('🤖 [Groq] Extracting from:', message);
    }

    // Registrar request antes de hacerlo
    recordAIRequest();

    // Llamar a Groq
    const response = await client.chat.completions.create({
      model: AI_CONFIG.GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: AI_CONFIG.TEMPERATURE,
      response_format: { type: 'json_object' }, // Forzar JSON
      max_tokens: 150 // Suficiente para nuestra respuesta
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('❌ [Groq] Empty response');
      return null;
    }

    // Parsear JSON
    const parsed = JSON.parse(content);

    // Validar respuesta
    const validated = validateGroqResponse(parsed);

    if (validated) {
      validated.originalMessage = message;

      if (AI_CONFIG.LOG_EXTRACTIONS) {
        console.log('✅ [Groq] Extracted:', {
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          merchant: validated.merchant,
          confidence: validated.confidence
        });
      }
    } else {
      console.error('❌ [Groq] Invalid response structure');
    }

    return validated;
  } catch (error: any) {
    console.error('❌ [Groq] Error:', error.message);

    // Si es error de rate limit, loggearlo especialmente
    if (error.message?.includes('rate limit')) {
      console.warn('⚠️ [Groq] Rate limit exceeded');
    }

    return null;
  }
}

/**
 * Verifica si Groq está disponible
 */
export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY && AI_CONFIG.ENABLED;
}
