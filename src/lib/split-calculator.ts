/**
 * =====================================================
 * SPLIT CALCULATOR: Calcula divisiones de gastos
 * =====================================================
 *
 * Funciones para calcular cómo dividir un gasto entre participantes
 * según diferentes tipos de división (equitativa, porcentajes, exactos).
 *
 * @module lib/split-calculator
 * @author Sistema
 * @version 1.0.0
 * @created 2025-11-01
 *
 * PROPÓSITO:
 *   - Calcular montos de splits según tipo de división
 *   - Manejar redondeos correctamente (el primer participante se lleva el remainder)
 *   - Validar que la suma siempre coincida con el total
 *   - Proveer errores claros y específicos
 *
 * TIPOS SOPORTADOS:
 *   1. equal: División equitativa (todos pagan lo mismo)
 *   2. percentage: División por porcentajes (cada uno paga un % del total)
 *   3. exact: División por montos exactos (se especifica cuánto paga cada uno)
 */

import type {
  SplitType,
  SplitInput,
  CalculatedSplit,
  SplitCalculationResult
} from '@/types/expense-splits';

// =====================================================
// CONSTANTES
// =====================================================

/** Tolerance para comparaciones de punto flotante (1 Guaraní) */
const FLOAT_TOLERANCE = 1;

/** Porcentaje máximo permitido */
const MAX_PERCENTAGE = 100;

/** Porcentaje mínimo permitido */
const MIN_PERCENTAGE = 0;

// =====================================================
// FUNCIÓN PRINCIPAL: calculateSplitAmounts
// =====================================================

/**
 * Calcula los montos de cada split según el tipo de división
 *
 * @param totalAmount - Monto total del gasto
 * @param splitType - Tipo de división ('equal', 'percentage', 'exact')
 * @param splits - Array de splits con información de cada participante
 * @returns Resultado con splits calculados y validación
 *
 * @example
 * ```ts
 * // División equitativa
 * const result = calculateSplitAmounts(
 *   150000,
 *   'equal',
 *   [{ participant_id: '1' }, { participant_id: '2' }, { participant_id: '3' }]
 * );
 * // result.splits = [{ participant_id: '1', amount: 50000 }, ...]
 *
 * // División por porcentajes
 * const result = calculateSplitAmounts(
 *   150000,
 *   'percentage',
 *   [
 *     { participant_id: '1', percentage: 50 },
 *     { participant_id: '2', percentage: 30 },
 *     { participant_id: '3', percentage: 20 }
 *   ]
 * );
 * // result.splits = [{ participant_id: '1', amount: 75000 }, ...]
 * ```
 */
export function calculateSplitAmounts(
  totalAmount: number,
  splitType: SplitType,
  splits: SplitInput[]
): SplitCalculationResult {
  // Validaciones básicas
  const validationErrors: string[] = [];

  if (totalAmount <= 0) {
    validationErrors.push('El monto total debe ser mayor a 0');
  }

  if (!splits || splits.length === 0) {
    validationErrors.push('Debe haber al menos un participante');
  }

  if (validationErrors.length > 0) {
    return {
      splits: [],
      total: 0,
      valid: false,
      errors: validationErrors
    };
  }

  // Calcular según tipo de división
  switch (splitType) {
    case 'equal':
      return calculateEqualSplits(totalAmount, splits);

    case 'percentage':
      return calculatePercentageSplits(totalAmount, splits);

    case 'exact':
      return calculateExactSplits(totalAmount, splits);

    case 'itemized':
      // Futuro: implementar división por ítems
      return {
        splits: [],
        total: 0,
        valid: false,
        errors: ['División por ítems no implementada aún']
      };

    default:
      return {
        splits: [],
        total: 0,
        valid: false,
        errors: [`Tipo de división desconocido: ${splitType}`]
      };
  }
}

// =====================================================
// CALCULADORES POR TIPO
// =====================================================

/**
 * Calcula división equitativa (todos pagan lo mismo)
 * El primer participante se lleva el remainder para evitar pérdida por redondeo
 */
function calculateEqualSplits(
  totalAmount: number,
  splits: SplitInput[]
): SplitCalculationResult {
  const count = splits.length;
  const equalAmount = Math.floor(totalAmount / count);
  const remainder = totalAmount - equalAmount * count;

  const calculatedSplits: CalculatedSplit[] = splits.map((split, index) => ({
    participant_id: split.participant_id,
    // El primer participante se lleva el remainder
    amount: index === 0 ? equalAmount + remainder : equalAmount
  }));

  const total = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);

  return {
    splits: calculatedSplits,
    total,
    valid: total === totalAmount,
    errors:
      total !== totalAmount
        ? ['La suma de splits no coincide con el total']
        : undefined
  };
}

/**
 * Calcula división por porcentajes
 * Valida que los porcentajes sumen 100%
 * El último participante se lleva lo que queda para evitar redondeos
 */
function calculatePercentageSplits(
  totalAmount: number,
  splits: SplitInput[]
): SplitCalculationResult {
  const errors: string[] = [];

  // Validar que todos tengan porcentaje
  const missingPercentages = splits.filter((s) => s.percentage === undefined);
  if (missingPercentages.length > 0) {
    errors.push(
      `${missingPercentages.length} participante(s) sin porcentaje especificado`
    );
  }

  // Validar rangos de porcentajes
  const invalidPercentages = splits.filter(
    (s) =>
      s.percentage !== undefined &&
      (s.percentage < MIN_PERCENTAGE || s.percentage > MAX_PERCENTAGE)
  );
  if (invalidPercentages.length > 0) {
    errors.push(
      `Los porcentajes deben estar entre ${MIN_PERCENTAGE} y ${MAX_PERCENTAGE}`
    );
  }

  // Calcular suma de porcentajes
  const totalPercentage = splits.reduce(
    (sum, s) => sum + (s.percentage || 0),
    0
  );

  // Validar que sumen 100% (con tolerancia para floating point)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push(
      `Los porcentajes deben sumar 100% (actual: ${totalPercentage.toFixed(2)}%)`
    );
  }

  if (errors.length > 0) {
    return {
      splits: [],
      total: 0,
      valid: false,
      errors
    };
  }

  // Calcular montos
  let remaining = totalAmount;
  const calculatedSplits: CalculatedSplit[] = splits.map((split, index) => {
    // El último se lleva lo que queda (evita errores de redondeo)
    if (index === splits.length - 1) {
      return {
        participant_id: split.participant_id,
        amount: remaining
      };
    }

    const amount = Math.floor(totalAmount * (split.percentage! / 100));
    remaining -= amount;

    return {
      participant_id: split.participant_id,
      amount
    };
  });

  const total = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);

  return {
    splits: calculatedSplits,
    total,
    valid: total === totalAmount,
    errors:
      total !== totalAmount
        ? ['La suma de splits no coincide con el total']
        : undefined
  };
}

/**
 * Calcula división por montos exactos
 * Valida que los montos sumen exactamente el total
 */
function calculateExactSplits(
  totalAmount: number,
  splits: SplitInput[]
): SplitCalculationResult {
  const errors: string[] = [];

  // Validar que todos tengan monto
  const missingAmounts = splits.filter((s) => s.amount === undefined);
  if (missingAmounts.length > 0) {
    errors.push(
      `${missingAmounts.length} participante(s) sin monto especificado`
    );
  }

  // Validar que los montos sean positivos
  const invalidAmounts = splits.filter(
    (s) => s.amount !== undefined && s.amount <= 0
  );
  if (invalidAmounts.length > 0) {
    errors.push('Todos los montos deben ser mayores a 0');
  }

  if (errors.length > 0) {
    return {
      splits: [],
      total: 0,
      valid: false,
      errors
    };
  }

  // Calcular suma de montos
  const totalSplits = splits.reduce((sum, s) => sum + (s.amount || 0), 0);

  // Validar que sumen exactamente el total
  if (totalSplits !== totalAmount) {
    const difference = Math.abs(totalSplits - totalAmount);
    errors.push(
      `Los montos deben sumar ${totalAmount.toLocaleString('es-PY')} Gs ` +
        `(actual: ${totalSplits.toLocaleString('es-PY')} Gs, ` +
        `diferencia: ${difference.toLocaleString('es-PY')} Gs)`
    );

    return {
      splits: [],
      total: totalSplits,
      valid: false,
      errors
    };
  }

  // Crear splits calculados
  const calculatedSplits: CalculatedSplit[] = splits.map((split) => ({
    participant_id: split.participant_id,
    amount: split.amount!
  }));

  return {
    splits: calculatedSplits,
    total: totalSplits,
    valid: true
  };
}

// =====================================================
// FUNCIONES HELPER
// =====================================================

/**
 * Valida que los splits calculados sumen el total esperado
 */
export function validateSplitsSum(
  calculatedSplits: CalculatedSplit[],
  expectedTotal: number
): boolean {
  const actualTotal = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
  return Math.abs(actualTotal - expectedTotal) <= FLOAT_TOLERANCE;
}

/**
 * Formatea un monto para mostrar en mensajes de error
 */
export function formatAmountForError(amount: number): string {
  return amount.toLocaleString('es-PY') + ' Gs';
}

/**
 * Calcula el porcentaje que representa un monto del total
 */
export function calculatePercentageOfTotal(
  amount: number,
  total: number
): number {
  if (total === 0) return 0;
  return (amount / total) * 100;
}

/**
 * Redondea un monto al entero más cercano
 * (En Paraguay, los pagos se hacen en Guaraníes enteros)
 */
export function roundAmount(amount: number): number {
  return Math.floor(amount);
}

// =====================================================
// FUNCIONES DE UTILIDAD PARA UI
// =====================================================

/**
 * Genera splits equitativos a partir de lista de participant IDs
 */
export function generateEqualSplits(
  participantIds: string[],
  totalAmount: number
): SplitInput[] {
  return participantIds.map((id) => ({
    participant_id: id
  }));
}

/**
 * Genera splits por porcentaje equitativo
 * Útil como valor inicial en formularios
 */
export function generateEqualPercentageSplits(
  participantIds: string[]
): SplitInput[] {
  const equalPercentage = 100 / participantIds.length;

  return participantIds.map((id, index) => ({
    participant_id: id,
    // El primero se lleva el remainder
    percentage:
      index === 0
        ? equalPercentage + (100 - equalPercentage * participantIds.length)
        : equalPercentage
  }));
}

/**
 * Ajusta porcentajes cuando se agrega/quita un participante
 * Redistribuye equitativamente
 */
export function redistributePercentages(
  currentSplits: SplitInput[],
  newParticipantIds: string[]
): SplitInput[] {
  // Si no hay splits actuales, generar equitativos
  if (currentSplits.length === 0) {
    return generateEqualPercentageSplits(newParticipantIds);
  }

  // Mantener porcentajes de participantes existentes
  const existingSplits = currentSplits.filter((s) =>
    newParticipantIds.includes(s.participant_id)
  );

  // Calcular porcentaje usado
  const usedPercentage = existingSplits.reduce(
    (sum, s) => sum + (s.percentage || 0),
    0
  );

  // Nuevos participantes
  const newParticipants = newParticipantIds.filter(
    (id) => !currentSplits.some((s) => s.participant_id === id)
  );

  // Si hay porcentaje disponible, distribuirlo entre nuevos
  const availablePercentage = 100 - usedPercentage;
  const percentagePerNew =
    newParticipants.length > 0
      ? availablePercentage / newParticipants.length
      : 0;

  const newSplits = newParticipants.map((id) => ({
    participant_id: id,
    percentage: percentagePerNew
  }));

  return [...existingSplits, ...newSplits];
}

// =====================================================
// EXPORTS
// =====================================================

export type {
  SplitInput,
  CalculatedSplit,
  SplitCalculationResult
} from '@/types/expense-splits';
