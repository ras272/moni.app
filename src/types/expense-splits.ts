/**
 * =====================================================
 * TYPES: Flexible Expense Splits
 * =====================================================
 *
 * Tipos TypeScript para el sistema de divisiones flexibles de gastos.
 *
 * @module types/expense-splits
 * @author Sistema
 * @version 1.0.0
 * @created 2025-11-01
 *
 * PROPÓSITO:
 *   Definir tipos seguros para los diferentes tipos de división de gastos:
 *   - División equitativa (equal)
 *   - División por porcentajes (percentage)
 *   - División por montos exactos (exact)
 *   - División por ítems (itemized - futuro)
 *
 * ARQUITECTURA:
 *   - Tipos base exportados para uso en toda la aplicación
 *   - Type guards para validación en runtime
 *   - Tipos helper para formularios y UI
 *   - Compatibilidad con tipos existentes en database.ts
 */

// =====================================================
// ENUMS Y CONSTANTES
// =====================================================

/**
 * Tipos de división de gastos soportados
 */
export const SPLIT_TYPES = {
  /** División equitativa: todos pagan lo mismo */
  EQUAL: 'equal',
  /** División por porcentajes: cada uno paga un % del total */
  PERCENTAGE: 'percentage',
  /** División por montos exactos: se especifica cuánto paga cada uno */
  EXACT: 'exact',
  /** División por ítems: cada uno paga ítems específicos (futuro) */
  ITEMIZED: 'itemized'
} as const;

/**
 * Tipo literal para split_type
 */
export type SplitType = (typeof SPLIT_TYPES)[keyof typeof SPLIT_TYPES];

/**
 * Descripción legible de cada tipo de división
 */
export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  equal: 'División Equitativa',
  percentage: 'División por Porcentajes',
  exact: 'División por Montos Exactos',
  itemized: 'División por Ítems'
};

/**
 * Descripción corta para tooltips/hints
 */
export const SPLIT_TYPE_HINTS: Record<SplitType, string> = {
  equal: 'Dividir en partes iguales entre todos',
  percentage: 'Cada persona paga un % del total',
  exact: 'Especificar cuánto paga cada persona',
  itemized: 'Cada persona paga ítems específicos'
};

// =====================================================
// TYPES: Input para crear/editar divisiones
// =====================================================

/**
 * Input básico para un split (usado en formularios)
 */
export interface SplitInput {
  /** ID del participante que pagará esta parte */
  participant_id: string;

  /** Monto exacto (para split_type = 'exact') */
  amount?: number;

  /** Porcentaje del total (para split_type = 'percentage') */
  percentage?: number;

  /** Lista de ítems (para split_type = 'itemized' - futuro) */
  items?: string[];
}

/**
 * Input completo para crear un gasto con división flexible
 */
export interface CreateExpenseWithSplitsInput {
  /** ID del grupo */
  group_id: string;

  /** Descripción del gasto */
  description: string;

  /** Monto total del gasto */
  amount: number;

  /** Moneda (default: PYG) */
  currency?: string;

  /** ID del participante que pagó */
  paid_by_participant_id: string;

  /** Fecha del gasto (default: hoy) */
  expense_date?: string;

  /** Tipo de división */
  split_type: SplitType;

  /** Splits individuales */
  splits: SplitInput[];
}

// =====================================================
// TYPES: Splits calculados (output)
// =====================================================

/**
 * Split calculado con monto final
 */
export interface CalculatedSplit {
  /** ID del participante */
  participant_id: string;

  /** Monto calculado que debe pagar */
  amount: number;
}

/**
 * Resultado del cálculo de splits
 */
export interface SplitCalculationResult {
  /** Splits calculados */
  splits: CalculatedSplit[];

  /** Suma total (debe ser igual al monto del gasto) */
  total: number;

  /** Validación exitosa */
  valid: boolean;

  /** Mensajes de error (si valid = false) */
  errors?: string[];
}

// =====================================================
// TYPES: Validación
// =====================================================

/**
 * Errores de validación por split
 */
export interface SplitValidationError {
  /** ID del participante con error */
  participant_id: string;

  /** Campo con error */
  field: 'amount' | 'percentage' | 'items';

  /** Mensaje de error */
  message: string;
}

/**
 * Resultado de validación de splits
 */
export interface SplitValidationResult {
  /** Validación exitosa */
  valid: boolean;

  /** Errores individuales por split */
  errors: SplitValidationError[];

  /** Error general (si aplica) */
  generalError?: string;
}

// =====================================================
// TYPES: Para UI/Formularios
// =====================================================

/**
 * Estado del formulario de división
 */
export interface SplitFormState {
  /** Tipo de división seleccionado */
  splitType: SplitType;

  /** Participantes seleccionados (IDs) */
  selectedParticipants: string[];

  /** Splits individuales con inputs */
  splits: SplitInput[];

  /** Splits calculados (preview) */
  calculatedSplits: CalculatedSplit[];

  /** Estado de validación */
  validation: SplitValidationResult;

  /** Monto total del gasto */
  totalAmount: number;
}

/**
 * Props comunes para componentes de splits
 */
export interface SplitComponentProps {
  /** Monto total del gasto */
  totalAmount: number;

  /** Lista de participantes disponibles */
  participants: Array<{
    id: string;
    name: string;
    avatar_url?: string | null;
  }>;

  /** Callback cuando cambian los splits */
  onChange: (splits: SplitInput[]) => void;

  /** Splits actuales (controlled) */
  value: SplitInput[];

  /** Disabled state */
  disabled?: boolean;
}

// =====================================================
// TYPE GUARDS
// =====================================================

/**
 * Valida si un string es un SplitType válido
 */
export function isValidSplitType(value: unknown): value is SplitType {
  return (
    typeof value === 'string' &&
    Object.values(SPLIT_TYPES).includes(value as SplitType)
  );
}

/**
 * Valida si un SplitInput es válido
 */
export function isValidSplitInput(split: unknown): split is SplitInput {
  if (typeof split !== 'object' || split === null) {
    return false;
  }

  const s = split as SplitInput;

  // participant_id es requerido
  if (typeof s.participant_id !== 'string' || !s.participant_id) {
    return false;
  }

  // amount es opcional pero debe ser number positivo si existe
  if (
    s.amount !== undefined &&
    (typeof s.amount !== 'number' || s.amount <= 0)
  ) {
    return false;
  }

  // percentage es opcional pero debe ser number entre 0-100 si existe
  if (
    s.percentage !== undefined &&
    (typeof s.percentage !== 'number' || s.percentage < 0 || s.percentage > 100)
  ) {
    return false;
  }

  return true;
}

/**
 * Valida si un array de SplitInput es válido
 */
export function isValidSplitInputArray(
  splits: unknown
): splits is SplitInput[] {
  if (!Array.isArray(splits)) {
    return false;
  }

  return splits.every(isValidSplitInput);
}

// =====================================================
// HELPER TYPES
// =====================================================

/**
 * Participante con información para splits
 */
export interface ParticipantForSplit {
  id: string;
  name: string;
  avatar_url?: string | null;
  profile_id?: string | null;
}

/**
 * Configuración de splits por tipo
 */
export interface SplitTypeConfig {
  /** Tipo de división */
  type: SplitType;

  /** Label para mostrar en UI */
  label: string;

  /** Descripción/hint */
  hint: string;

  /** Requiere input de usuario (false para 'equal') */
  requiresInput: boolean;

  /** Tipo de input requerido */
  inputType?: 'amount' | 'percentage';

  /** Validación custom */
  validate?: (
    splits: SplitInput[],
    totalAmount: number
  ) => SplitValidationResult;
}

/**
 * Configuración de todos los tipos soportados
 */
export const SPLIT_TYPE_CONFIGS: Record<SplitType, SplitTypeConfig> = {
  equal: {
    type: 'equal',
    label: SPLIT_TYPE_LABELS.equal,
    hint: SPLIT_TYPE_HINTS.equal,
    requiresInput: false
  },
  percentage: {
    type: 'percentage',
    label: SPLIT_TYPE_LABELS.percentage,
    hint: SPLIT_TYPE_HINTS.percentage,
    requiresInput: true,
    inputType: 'percentage'
  },
  exact: {
    type: 'exact',
    label: SPLIT_TYPE_LABELS.exact,
    hint: SPLIT_TYPE_HINTS.exact,
    requiresInput: true,
    inputType: 'amount'
  },
  itemized: {
    type: 'itemized',
    label: SPLIT_TYPE_LABELS.itemized,
    hint: SPLIT_TYPE_HINTS.itemized,
    requiresInput: true
  }
};

// =====================================================
// EXPORTS
// =====================================================
// Los tipos ya están exportados arriba como interfaces/types
// Solo exportamos aliases aquí para backwards compatibility

export type {
  // Tipos base
  SplitType as ExpenseSplitType,

  // Inputs
  SplitInput as ExpenseSplitInput
};
