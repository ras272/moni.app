/**
 * Sistema de IA para extracción de transacciones
 *
 * Exporta todas las funciones principales para usar
 * desde otros módulos del proyecto.
 */

// Configuración
export { AI_CONFIG, getAIStats } from './config';

// Tipos
export type {
  ExtractedTransaction,
  AIResponse,
  ExtractionOptions,
  TransactionType,
  TransactionCategory
} from './types';

// Funciones principales
export {
  extractTransaction,
  extractTransactionsBatch,
  formatExtractedTransaction,
  generateConfirmationMessage
} from './transaction-extractor';

// Funciones de bajo nivel (para casos especiales)
export { extractWithRules, isRulesExtractionValid } from './rules-extractor';
export { extractWithGroq, isGroqAvailable } from './groq-client';
