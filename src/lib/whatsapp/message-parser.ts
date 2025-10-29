/**
 * WhatsApp Bot - Message Parser
 *
 * NLP básico con regex para detectar intenciones y extraer datos
 * Optimizado para español paraguayo
 */

import type { ParsedMessage } from './types';

// =====================================================
// PARSER PRINCIPAL
// =====================================================

/**
 * Parsea un mensaje de WhatsApp y detecta la intención del usuario
 */
export function parseMessage(text: string): ParsedMessage {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Vinculación de cuenta
  if (/^vincular\s+/i.test(trimmed)) {
    const token = trimmed.split(/\s+/)[1];
    return {
      intent: 'link_account',
      linkToken: token,
      rawText: trimmed
    };
  }

  // 2. Gastos (más común, checar primero)
  if (/gast[eé]|pagu[eé]|compr[eé]/.test(lower)) {
    return parseExpense(trimmed);
  }

  // 3. Ingresos
  if (/cobr[eé]|recib[íi]|ingres[oó]/.test(lower)) {
    return parseIncome(trimmed);
  }

  // 4. Balance
  if (/cu[aá]nto\s+(tengo|ten[eé]s)|balance|saldo/.test(lower)) {
    return {
      intent: 'get_balance',
      rawText: trimmed
    };
  }

  // 5. Resumen
  if (/resumen|gastos?\s+(de\s+)?hoy|cu[aá]nto\s+gast[eé]/.test(lower)) {
    return {
      intent: 'get_summary',
      rawText: trimmed
    };
  }

  // 6. Ayuda
  if (/ayuda|help|comandos|qu[eé]\s+puedes?|qu[eé]\s+pod[eé]s/.test(lower)) {
    return {
      intent: 'help',
      rawText: trimmed
    };
  }

  // Default: unknown
  return {
    intent: 'unknown',
    rawText: trimmed
  };
}

// =====================================================
// PARSER DE GASTOS
// =====================================================

function parseExpense(text: string): ParsedMessage {
  const amount = parseAmount(text);
  const currency = detectCurrency(text);
  const description = extractDescription(text);
  const accountName = extractAccountName(text);

  return {
    intent: 'add_expense',
    amount,
    currency,
    description,
    accountName,
    rawText: text
  };
}

// =====================================================
// PARSER DE INGRESOS
// =====================================================

function parseIncome(text: string): ParsedMessage {
  const amount = parseAmount(text);
  const currency = detectCurrency(text);
  const description = extractDescription(text);
  const accountName = extractAccountName(text);

  return {
    intent: 'add_income',
    amount,
    currency,
    description: description || 'Ingreso desde WhatsApp',
    accountName,
    rawText: text
  };
}

// =====================================================
// EXTRAER MONTO
// =====================================================

/**
 * Extrae el monto de un texto
 * Soporta múltiples formatos:
 * - "50.000" → 50000
 * - "150k" → 150000
 * - "25 mil" → 25000
 * - "300000" → 300000
 * - "1.5m" → 1500000
 * - "2 millones" → 2000000
 */
export function parseAmount(text: string): number {
  // Orden de prioridad: millones > miles > números normales
  const patterns = [
    { regex: /(\d+[\.,]?\d*)\s*m(?:illones?)?/i, multiplier: 1_000_000 },
    { regex: /(\d+[\.,]?\d*)\s*k/i, multiplier: 1_000 },
    { regex: /(\d+[\.,]?\d*)\s+mil/i, multiplier: 1_000 },
    { regex: /(\d{1,3}(?:[\.,]\d{3})+)/, multiplier: 1 }, // Con separadores
    { regex: /(\d+)/, multiplier: 1 } // Sin separadores
  ];

  for (const { regex, multiplier } of patterns) {
    const match = text.match(regex);
    if (match) {
      // Remover separadores de miles (. o ,)
      const cleanNum = match[1].replace(/[.,]/g, '');
      let num = parseFloat(cleanNum);

      // Si el número tiene separadores pero es pequeño, es un decimal
      // Ej: "1.5" → 1.5, no 15
      if (match[1].includes('.') || match[1].includes(',')) {
        const parts = match[1].split(/[.,]/);
        if (parts.length === 2 && parts[1].length <= 2) {
          // Es decimal: "1.5", "25.50"
          num = parseFloat(match[1].replace(',', '.'));
        }
      }

      return Math.round(num * multiplier);
    }
  }

  return 0;
}

// =====================================================
// DETECTAR MONEDA
// =====================================================

/**
 * Detecta la moneda mencionada en el texto
 */
function detectCurrency(text: string): 'PYG' | 'USD' {
  const lower = text.toLowerCase();

  // Indicadores de dólares
  if (
    /\$/.test(text) ||
    /usd/i.test(text) ||
    /d[oó]lares?/.test(lower) ||
    /dolar(?:es)?/.test(lower)
  ) {
    return 'USD';
  }

  // Default: Guaraníes (moneda más común en Paraguay)
  return 'PYG';
}

// =====================================================
// EXTRAER DESCRIPCIÓN
// =====================================================

/**
 * Extrae la descripción del gasto/ingreso
 * Busca palabras después de "en", "para", "de", o después del número
 */
function extractDescription(text: string): string {
  // Patrones para buscar descripción
  const patterns = [
    /\b(?:en|para|de)\s+(.+)$/i, // Después de "en", "para", "de"
    /\d+[kmil\s]*\s+(.+)$/i // Después del número
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let desc = match[1].trim();

      // Limpiar palabras de moneda al final
      desc = desc.replace(/\s+(guaraníes?|gs|pesos?|dólares?|usd)$/i, '');

      if (desc.length > 0) {
        return desc;
      }
    }
  }

  // Si no encuentra descripción específica, remover solo números y monedas
  let cleaned = text
    .replace(/\d+[\.,]?\d*\s*[kmil]*/gi, '')
    .replace(
      /(gast[eé]|pagu[eé]|compr[eé]|cobr[eé]|recib[íi]|ingres[oó])/gi,
      ''
    )
    .replace(/\s+(guaraníes?|gs|pesos?|dólares?|usd|en|para|de)/gi, '')
    .trim();

  return cleaned || 'Sin descripción';
}

// =====================================================
// VALIDACIONES
// =====================================================

/**
 * Valida si un monto es válido
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount < 1_000_000_000_000; // Max 1 trillón
}

/**
 * Valida si una descripción es válida
 */
export function isValidDescription(description: string): boolean {
  return description.length > 0 && description.length <= 200;
}

// =====================================================
// EXTRACTOR DE NOMBRE DE CUENTA
// =====================================================

/**
 * Extrae el nombre de la cuenta del mensaje
 * Patrones:
 * - "en Itau"
 * - "cuenta ueno"
 * - "cuenta ueno bank"
 */
function extractAccountName(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Patrón 1: "en [nombre_cuenta]"
  const enMatch = text.match(/\s+en\s+([a-záéíóúñ\s]+?)(?:\s|$)/i);
  if (enMatch) {
    const accountName = enMatch[1].trim();
    // Ignorar palabras comunes que no son cuentas
    if (!/^(efectivo|cash|el|la|mi|tu)$/i.test(accountName)) {
      return accountName;
    }
  }

  // Patrón 2: "cuenta [nombre_cuenta]"
  const cuentaMatch = text.match(/\bcuenta\s+([a-záéíóúñ\s]+?)(?:\s|$)/i);
  if (cuentaMatch) {
    return cuentaMatch[1].trim();
  }

  return undefined;
}
