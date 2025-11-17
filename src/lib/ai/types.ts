/**
 * Tipos para el sistema de extracción de transacciones con IA
 */

export type TransactionType = 'expense' | 'income' | 'transfer';

export type TransactionCategory =
  | 'Comida'
  | 'Transporte'
  | 'Entretenimiento'
  | 'Salud'
  | 'Compras'
  | 'Servicios'
  | 'Educación'
  | 'Hogar'
  | 'Otros';

/**
 * Resultado de la extracción de una transacción
 */
export interface ExtractedTransaction {
  /** Monto en Guaraníes */
  amount: number | null;

  /** Tipo de transacción */
  type: TransactionType;

  /** Categoría detectada */
  category: TransactionCategory | null;

  /** Comercio/merchant detectado */
  merchant: string | null;

  /** Notas adicionales */
  notes: string | null;

  /** Nivel de confianza (0-1) */
  confidence: number;

  /** Método usado para extraer: 'rules' | 'ai' */
  method: 'rules' | 'ai';

  /** Mensaje original */
  originalMessage?: string;
}

/**
 * Respuesta del sistema de IA
 */
export interface AIResponse {
  success: boolean;
  data?: ExtractedTransaction;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Configuración para la extracción
 */
export interface ExtractionOptions {
  /** Forzar uso de IA (ignorar reglas) */
  forceAI?: boolean;

  /** Contexto adicional del usuario */
  userContext?: {
    userId?: string;
    phoneNumber?: string;
    previousTransactions?: ExtractedTransaction[];
  };
}
