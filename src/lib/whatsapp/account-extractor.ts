/**
 * WhatsApp Bot - Smart Account Extractor
 *
 * Sistema inteligente para extraer nombres de cuentas de mensajes naturales
 */

import type { AccountInfo } from './utils/account-matcher';
import { normalizeString, isStopWord } from './utils/account-matcher';

export interface AccountExtractionResult {
  accountName: string | null;
  cleanedMessage: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Patrones de preposiciones que indican cuenta
 * Ordenados por prioridad (más específicos primero)
 */
const ACCOUNT_PATTERNS = [
  // Alta confianza - patrones explícitos
  {
    regex:
      /\b(?:de\s+la\s+cuenta|con\s+la\s+cuenta|desde\s+la\s+cuenta)\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+para|$)/i,
    confidence: 'high' as const
  },
  {
    regex: /\b(?:cuenta|tarjeta)\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+para|$)/i,
    confidence: 'high' as const
  },
  {
    regex:
      /\b(?:con\s+mi|de\s+mi|desde\s+mi)\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+para|$)/i,
    confidence: 'high' as const
  },

  // Media confianza - preposiciones simples
  {
    regex: /\b(?:con|de|desde|usando)\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+para|$)/i,
    confidence: 'medium' as const
  }
];

/**
 * Construye patrones específicos para cada cuenta
 */
function buildAccountSpecificPatterns(accounts: AccountInfo[]) {
  const patterns: Array<{
    regex: RegExp;
    accountName: string;
    confidence: 'high' | 'medium';
  }> = [];

  for (const account of accounts) {
    const accountName = account.name;
    const normalized = normalizeString(accountName);
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Patrón con preposiciones explícitas
    patterns.push({
      regex: new RegExp(`\\b(?:con|de|desde)\\s+(?:mi\\s+)?${escaped}\\b`, 'i'),
      accountName,
      confidence: 'high'
    });

    // Patrón al inicio o final del mensaje
    patterns.push({
      regex: new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i'),
      accountName,
      confidence: 'medium'
    });
  }

  return patterns;
}

/**
 * Extrae nombre de cuenta usando patrones genéricos
 */
function extractWithGenericPatterns(
  message: string
): { match: string; confidence: 'high' | 'medium' } | null {
  for (const pattern of ACCOUNT_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match && match[1]) {
      const accountName = match[1].trim();
      // Validar que no sea solo palabras vacías
      if (accountName.length > 2 && !isStopWord(accountName)) {
        return { match: accountName, confidence: pattern.confidence };
      }
    }
  }
  return null;
}

/**
 * Extrae nombre de cuenta usando patrones específicos de las cuentas del usuario
 */
function extractWithSpecificPatterns(
  message: string,
  accounts: AccountInfo[]
): { accountName: string; confidence: 'high' | 'medium' } | null {
  const patterns = buildAccountSpecificPatterns(accounts);

  for (const pattern of patterns) {
    if (pattern.regex.test(message)) {
      return {
        accountName: pattern.accountName,
        confidence: pattern.confidence
      };
    }
  }

  return null;
}

/**
 * Limpia el mensaje removiendo referencias a la cuenta
 */
function cleanDescriptionFromAccount(
  message: string,
  accountName: string
): string {
  const normalized = normalizeString(accountName);
  let cleaned = message;

  // Remover patrones con preposiciones
  const patternsToRemove = [
    new RegExp(
      `\\b(?:de\\s+la\\s+cuenta|con\\s+la\\s+cuenta|desde\\s+la\\s+cuenta)\\s+${normalized}\\b`,
      'gi'
    ),
    new RegExp(`\\b(?:cuenta|tarjeta)\\s+${normalized}\\b`, 'gi'),
    new RegExp(
      `\\b(?:con|de|desde|usando)\\s+(?:mi\\s+)?${normalized}\\b`,
      'gi'
    ),
    new RegExp(`\\b${normalized}\\b`, 'gi')
  ];

  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Limpiar preposiciones sueltas al inicio o final
  cleaned = cleaned.replace(/^\s*(?:en|con|de|desde)\s+/i, '');
  cleaned = cleaned.replace(/\s+(?:en|con|de|desde)\s*$/i, '');

  // Normalizar espacios
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Verifica si el contexto sugiere que NO es una cuenta
 * Por ejemplo: "en Itau Center" donde "Itau" es parte del lugar
 */
function isAmbiguousContext(message: string, accountName: string): boolean {
  const normalized = normalizeString(accountName);
  const lowerMessage = normalizeString(message);

  // Patrones que sugieren que es un lugar, no una cuenta
  const placeIndicators = [
    `${normalized} center`,
    `${normalized} shopping`,
    `${normalized} mall`,
    `${normalized} plaza`,
    `${normalized} edificio`
  ];

  return placeIndicators.some((indicator) => lowerMessage.includes(indicator));
}

/**
 * Función principal: Extrae información de cuenta de un mensaje
 */
export function extractAccountFromMessage(
  message: string,
  userAccounts: AccountInfo[]
): AccountExtractionResult {
  if (!userAccounts.length) {
    return {
      accountName: null,
      cleanedMessage: message,
      confidence: 'none'
    };
  }

  // Paso 1: Intentar con patrones específicos de las cuentas del usuario
  const specificMatch = extractWithSpecificPatterns(message, userAccounts);
  if (specificMatch) {
    // Verificar ambigüedad
    if (isAmbiguousContext(message, specificMatch.accountName)) {
      return {
        accountName: null,
        cleanedMessage: message,
        confidence: 'none'
      };
    }

    const cleaned = cleanDescriptionFromAccount(
      message,
      specificMatch.accountName
    );
    return {
      accountName: specificMatch.accountName,
      cleanedMessage: cleaned,
      confidence: specificMatch.confidence
    };
  }

  // Paso 2: Intentar con patrones genéricos
  const genericMatch = extractWithGenericPatterns(message);
  if (genericMatch) {
    // Verificar si el match genérico corresponde a alguna cuenta del usuario
    const matchedAccount = userAccounts.find(
      (acc) =>
        normalizeString(acc.name).includes(
          normalizeString(genericMatch.match)
        ) ||
        normalizeString(genericMatch.match).includes(normalizeString(acc.name))
    );

    if (matchedAccount) {
      const cleaned = cleanDescriptionFromAccount(message, matchedAccount.name);
      return {
        accountName: matchedAccount.name,
        cleanedMessage: cleaned,
        confidence: genericMatch.confidence
      };
    }
  }

  // No se encontró cuenta
  return {
    accountName: null,
    cleanedMessage: message,
    confidence: 'none'
  };
}
