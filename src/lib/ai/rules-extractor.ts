/**
 * Sistema de extracción basado en reglas (sin IA)
 *
 * Intenta extraer transacciones usando patrones regex
 * y conocimiento de comercios/categorías comunes.
 *
 * VENTAJAS:
 * - Gratis (0 costo)
 * - Instantáneo (<1ms)
 * - No requiere API externa
 * - Funciona ~80% del tiempo para casos comunes
 */

import { AI_CONFIG } from './config';
import type {
  ExtractedTransaction,
  TransactionType,
  TransactionCategory
} from './types';

/**
 * Patrones regex para detectar diferentes partes de la transacción
 */
const PATTERNS = {
  // Detectar montos: "50 mil", "150 lucas", "75k", "100000"
  amount: {
    mil: /(\d+(?:\.\d+)?)\s*(?:mil|lucas|k)/i,
    miles: /(\d+)\s*miles/i,
    raw: /(?:^|\s)(\d{4,})(?:\s|$)/ // Números de 4+ dígitos
  },

  // Detectar tipo de transacción
  expense: /(?:gast[eé]|pagu[eé]|compr[eé]|sal[ií]|egreso)/i,
  income: /(?:cobr[eé]|recib[ií]|deposit|ingreso|sueldo|salario)/i,
  transfer: /(?:transfer|envie|mand[eé])/i,

  // Detectar comercio: "en biggie", "en el super", "de netflix"
  merchant:
    /(?:en|en el|en la|de|del)\s+([A-Za-zÀ-ÿ0-9\s]{2,30})(?:\s+(?:y|para|de|$)|$)/i
};

/**
 * Mapeo de comercios conocidos a categorías
 * (se puede expandir basado en uso real)
 */
const MERCHANT_TO_CATEGORY: Record<string, TransactionCategory> = {
  // Comida
  biggie: 'Compras',
  'casa rica': 'Compras',
  super: 'Compras',
  supermercado: 'Compras',
  stock: 'Compras',
  'el pueblo': 'Compras',
  despensa: 'Compras',
  panaderia: 'Comida',
  panadería: 'Comida',
  restaurant: 'Comida',
  restaurante: 'Comida',
  delivery: 'Comida',
  pedidosya: 'Comida',

  // Transporte
  uber: 'Transporte',
  bolt: 'Transporte',
  taxi: 'Transporte',
  nafta: 'Transporte',
  gasolina: 'Transporte',
  combustible: 'Transporte',
  copetrol: 'Transporte',
  petropar: 'Transporte',
  estacionamiento: 'Transporte',

  // Entretenimiento
  netflix: 'Entretenimiento',
  spotify: 'Entretenimiento',
  youtube: 'Entretenimiento',
  cine: 'Entretenimiento',
  cinema: 'Entretenimiento',
  teatro: 'Entretenimiento',
  bar: 'Entretenimiento',
  disco: 'Entretenimiento',
  boliche: 'Entretenimiento',

  // Servicios
  ande: 'Servicios',
  essap: 'Servicios',
  copaco: 'Servicios',
  tigo: 'Servicios',
  claro: 'Servicios',
  personal: 'Servicios',
  vox: 'Servicios',
  internet: 'Servicios',
  luz: 'Servicios',
  agua: 'Servicios',

  // Salud
  farmacia: 'Salud',
  doctor: 'Salud',
  médico: 'Salud',
  clinica: 'Salud',
  clínica: 'Salud',
  hospital: 'Salud',
  laboratorio: 'Salud',

  // Educación
  universidad: 'Educación',
  colegio: 'Educación',
  escuela: 'Educación',
  curso: 'Educación',
  libro: 'Educación',
  libreria: 'Educación',
  librería: 'Educación'
};

/**
 * Keywords que indican categorías específicas
 */
const CATEGORY_KEYWORDS: Record<string, TransactionCategory> = {
  // Comida
  'comida|almuerzo|cena|desayuno|merienda': 'Comida',

  // Transporte
  'colectivo|bus|bondi|pasaje|viaje': 'Transporte',

  // Entretenimiento
  'salida|fiesta|cerveza|bebida|tragos': 'Entretenimiento',

  // Compras
  'compra|ropa|zapato|zapatilla|remera|pantalon|jean': 'Compras',

  // Salud
  'medicina|medicamento|consulta|analisis|análisis': 'Salud',

  // Hogar
  'casa|hogar|mueble|decoracion|decoración': 'Hogar'
};

/**
 * Normaliza texto para matching
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
}

/**
 * Extrae el monto del mensaje
 */
function extractAmount(message: string): number | null {
  const normalized = normalize(message);

  // Intentar "50 mil", "150 lucas", "75k"
  const milMatch = normalized.match(PATTERNS.amount.mil);
  if (milMatch) {
    return parseFloat(milMatch[1]) * 1000;
  }

  // Intentar "2 miles" (2000)
  const milesMatch = normalized.match(PATTERNS.amount.miles);
  if (milesMatch) {
    return parseInt(milesMatch[1]) * 1000;
  }

  // Intentar número raw "150000"
  const rawMatch = normalized.match(PATTERNS.amount.raw);
  if (rawMatch) {
    return parseInt(rawMatch[1]);
  }

  return null;
}

/**
 * Detecta el tipo de transacción
 */
function extractType(message: string): TransactionType {
  const normalized = normalize(message);

  if (PATTERNS.expense.test(normalized)) return 'expense';
  if (PATTERNS.income.test(normalized)) return 'income';
  if (PATTERNS.transfer.test(normalized)) return 'transfer';

  // Por defecto, asumir egreso (más común)
  return 'expense';
}

/**
 * Extrae el comercio/merchant
 */
function extractMerchant(message: string): string | null {
  const merchantMatch = message.match(PATTERNS.merchant);
  if (merchantMatch) {
    return merchantMatch[1].trim();
  }
  return null;
}

/**
 * Detecta categoría basada en merchant o keywords
 */
function extractCategory(
  message: string,
  merchant: string | null
): TransactionCategory | null {
  const normalized = normalize(message);

  // 1. Intentar por merchant conocido
  if (merchant) {
    const merchantNormalized = normalize(merchant);
    for (const [key, category] of Object.entries(MERCHANT_TO_CATEGORY)) {
      if (
        merchantNormalized.includes(key) ||
        key.includes(merchantNormalized)
      ) {
        return category;
      }
    }
  }

  // 2. Intentar por keywords en el mensaje
  for (const [pattern, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (new RegExp(pattern, 'i').test(normalized)) {
      return category;
    }
  }

  return null;
}

/**
 * Calcula nivel de confianza de la extracción
 */
function calculateConfidence(
  amount: number | null,
  type: TransactionType,
  category: TransactionCategory | null,
  merchant: string | null
): number {
  let confidence = 0;

  // Monto detectado: +40%
  if (amount !== null && amount > 0) confidence += 0.4;

  // Tipo detectado explícitamente: +20%
  if (type !== 'expense' || PATTERNS.expense.test(normalize(''))) {
    confidence += 0.2;
  }

  // Categoría detectada: +20%
  if (category !== null) confidence += 0.2;

  // Merchant detectado: +20%
  if (merchant !== null) confidence += 0.2;

  return Math.min(confidence, 1.0);
}

/**
 * Extrae una transacción usando solo reglas (sin IA)
 *
 * @param message Mensaje del usuario
 * @returns ExtractedTransaction con nivel de confianza
 */
export function extractWithRules(message: string): ExtractedTransaction {
  if (AI_CONFIG.LOG_EXTRACTIONS) {
    console.log('🔍 [Rules] Extracting from:', message);
  }

  const amount = extractAmount(message);
  const type = extractType(message);
  const merchant = extractMerchant(message);
  const category = extractCategory(message, merchant);
  const confidence = calculateConfidence(amount, type, category, merchant);

  const result: ExtractedTransaction = {
    amount,
    type,
    category,
    merchant,
    notes: null,
    confidence,
    method: 'rules',
    originalMessage: message
  };

  if (AI_CONFIG.LOG_EXTRACTIONS) {
    console.log('✅ [Rules] Extracted:', {
      amount: result.amount,
      type: result.type,
      category: result.category,
      merchant: result.merchant,
      confidence: result.confidence
    });
  }

  return result;
}

/**
 * Valida si la extracción por reglas es suficientemente confiable
 */
export function isRulesExtractionValid(
  extraction: ExtractedTransaction
): boolean {
  // Debe tener al menos un monto
  if (!extraction.amount || extraction.amount <= 0) {
    return false;
  }

  // La confianza debe superar el umbral
  if (extraction.confidence < AI_CONFIG.MIN_CONFIDENCE_RULES) {
    return false;
  }

  return true;
}
