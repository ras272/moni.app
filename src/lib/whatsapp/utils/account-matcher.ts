/**
 * WhatsApp Bot - Account Matcher Utilities
 *
 * Utilidades para matching flexible de cuentas bancarias
 */

export interface AccountInfo {
  id: string;
  name: string;
  currency: string;
}

/**
 * Normaliza un string para comparación
 * - Convierte a minúsculas
 * - Elimina acentos
 * - Elimina espacios extra
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .trim()
    .replace(/\s+/g, ' '); // Normalizar espacios
}

/**
 * Calcula similitud entre dos strings (Levenshtein simplificado)
 * Retorna un score de 0 a 1, donde 1 es match perfecto
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Simple character overlap
  const chars1 = new Set(s1.split(''));
  const chars2 = new Set(s2.split(''));
  const intersection = new Set([...chars1].filter((x) => chars2.has(x)));
  const union = new Set([...chars1, ...chars2]);

  return intersection.size / union.size;
}

/**
 * Busca una cuenta por nombre con fuzzy matching
 * Retorna la mejor coincidencia si supera el threshold
 */
export function fuzzyMatchAccount(
  searchName: string,
  accounts: AccountInfo[],
  threshold: number = 0.7
): AccountInfo | null {
  if (!searchName || !accounts.length) return null;

  const normalized = normalizeString(searchName);
  let bestMatch: AccountInfo | null = null;
  let bestScore = threshold;

  for (const account of accounts) {
    const accountNormalized = normalizeString(account.name);

    // Match exacto
    if (accountNormalized === normalized) {
      return account;
    }

    // Contiene el nombre completo
    if (
      accountNormalized.includes(normalized) ||
      normalized.includes(accountNormalized)
    ) {
      if (0.9 > bestScore) {
        bestScore = 0.9;
        bestMatch = account;
      }
      continue;
    }

    // Similitud por caracteres
    const score = calculateSimilarity(searchName, account.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = account;
    }
  }

  return bestMatch;
}

/**
 * Verifica si una palabra es un artículo o preposición común
 */
export function isStopWord(word: string): boolean {
  const stopWords = [
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'de',
    'en',
    'con',
    'mi',
    'tu',
    'su'
  ];
  return stopWords.includes(normalizeString(word));
}
