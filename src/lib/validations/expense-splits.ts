/**
 * =====================================================
 * VALIDATIONS: Expense Splits
 * =====================================================
 *
 * Validaciones para el sistema de divisiones flexibles de gastos.
 *
 * @module lib/validations/expense-splits
 * @author Sistema
 * @version 1.0.0
 * @created 2025-11-01
 *
 * PROPÓSITO:
 *   - Validar inputs de usuario antes de calcular splits
 *   - Validar splits calculados antes de insertar en BD
 *   - Proveer mensajes de error claros y específicos
 *   - Prevenir estados inconsistentes
 */

import type {
  SplitType,
  SplitInput,
  SplitValidationError,
  SplitValidationResult,
  CalculatedSplit
} from '@/types/expense-splits';
import { isValidSplitType, SPLIT_TYPES } from '@/types/expense-splits';

// =====================================================
// VALIDACIONES DE INPUT
// =====================================================

/**
 * Valida el tipo de división
 */
export function validateSplitType(splitType: unknown): SplitValidationResult {
  const errors: SplitValidationError[] = [];

  if (!splitType) {
    return {
      valid: false,
      errors: [],
      generalError: 'El tipo de división es requerido'
    };
  }

  if (!isValidSplitType(splitType)) {
    return {
      valid: false,
      errors: [],
      generalError: `Tipo de división inválido: ${splitType}. Valores permitidos: ${Object.values(SPLIT_TYPES).join(', ')}`
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Valida que haya participantes seleccionados
 */
export function validateParticipantsSelected(
  participantIds: string[]
): SplitValidationResult {
  const errors: SplitValidationError[] = [];

  if (!participantIds || participantIds.length === 0) {
    return {
      valid: false,
      errors: [],
      generalError: 'Debe seleccionar al menos un participante'
    };
  }

  // Validar que no haya IDs duplicados
  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    return {
      valid: false,
      errors: [],
      generalError: 'Hay participantes duplicados'
    };
  }

  // Validar que los IDs sean válidos (UUIDs)
  const invalidIds = participantIds.filter((id) => !isValidUUID(id));
  if (invalidIds.length > 0) {
    return {
      valid: false,
      errors: [],
      generalError: `IDs de participante inválidos: ${invalidIds.join(', ')}`
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Valida splits de entrada según el tipo de división
 */
export function validateSplitsInput(
  splitType: SplitType,
  splits: SplitInput[],
  totalAmount: number
): SplitValidationResult {
  const errors: SplitValidationError[] = [];

  // Validación 1: Debe haber al menos un split
  if (!splits || splits.length === 0) {
    return {
      valid: false,
      errors: [],
      generalError: 'Debe haber al menos un participante en el split'
    };
  }

  // Validación 2: Todos deben tener participant_id
  splits.forEach((split, index) => {
    if (!split.participant_id) {
      errors.push({
        participant_id: split.participant_id || `split_${index}`,
        field: 'amount',
        message: 'Participante sin ID'
      });
    }
  });

  // Validaciones específicas por tipo
  switch (splitType) {
    case 'equal':
      // No requiere validaciones adicionales
      break;

    case 'percentage':
      errors.push(...validatePercentageSplits(splits, totalAmount));
      break;

    case 'exact':
      errors.push(...validateExactSplits(splits, totalAmount));
      break;

    case 'itemized':
      return {
        valid: false,
        errors: [],
        generalError: 'División por ítems no implementada aún'
      };

    default:
      return {
        valid: false,
        errors: [],
        generalError: `Tipo de división desconocido: ${splitType}`
      };
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Valida splits de tipo porcentaje
 */
function validatePercentageSplits(
  splits: SplitInput[],
  totalAmount: number
): SplitValidationError[] {
  const errors: SplitValidationError[] = [];
  let totalPercentage = 0;

  splits.forEach((split) => {
    // Debe tener porcentaje
    if (split.percentage === undefined || split.percentage === null) {
      errors.push({
        participant_id: split.participant_id,
        field: 'percentage',
        message: 'Porcentaje no especificado'
      });
      return;
    }

    // Porcentaje debe ser número
    if (typeof split.percentage !== 'number') {
      errors.push({
        participant_id: split.participant_id,
        field: 'percentage',
        message: 'Porcentaje debe ser un número'
      });
      return;
    }

    // Porcentaje debe estar entre 0 y 100
    if (split.percentage < 0 || split.percentage > 100) {
      errors.push({
        participant_id: split.participant_id,
        field: 'percentage',
        message: `Porcentaje debe estar entre 0 y 100 (actual: ${split.percentage})`
      });
      return;
    }

    // Porcentaje no puede ser 0
    if (split.percentage === 0) {
      errors.push({
        participant_id: split.participant_id,
        field: 'percentage',
        message:
          'Porcentaje no puede ser 0 (excluye al participante en su lugar)'
      });
      return;
    }

    totalPercentage += split.percentage;
  });

  // Total debe sumar 100% (con tolerancia para decimales)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push({
      participant_id: '__general__',
      field: 'percentage',
      message: `Los porcentajes deben sumar 100% (actual: ${totalPercentage.toFixed(2)}%)`
    });
  }

  return errors;
}

/**
 * Valida splits de tipo monto exacto
 */
function validateExactSplits(
  splits: SplitInput[],
  totalAmount: number
): SplitValidationError[] {
  const errors: SplitValidationError[] = [];
  let totalSplits = 0;

  splits.forEach((split) => {
    // Debe tener amount
    if (split.amount === undefined || split.amount === null) {
      errors.push({
        participant_id: split.participant_id,
        field: 'amount',
        message: 'Monto no especificado'
      });
      return;
    }

    // Amount debe ser número
    if (typeof split.amount !== 'number') {
      errors.push({
        participant_id: split.participant_id,
        field: 'amount',
        message: 'Monto debe ser un número'
      });
      return;
    }

    // Amount debe ser positivo
    if (split.amount <= 0) {
      errors.push({
        participant_id: split.participant_id,
        field: 'amount',
        message: `Monto debe ser mayor a 0 (actual: ${split.amount.toLocaleString('es-PY')} Gs)`
      });
      return;
    }

    // Amount no puede ser mayor al total
    if (split.amount > totalAmount) {
      errors.push({
        participant_id: split.participant_id,
        field: 'amount',
        message: `Monto no puede ser mayor al total del gasto (${totalAmount.toLocaleString('es-PY')} Gs)`
      });
      return;
    }

    totalSplits += split.amount;
  });

  // Total debe sumar exactamente el monto del gasto
  if (totalSplits !== totalAmount) {
    const difference = Math.abs(totalSplits - totalAmount);
    errors.push({
      participant_id: '__general__',
      field: 'amount',
      message:
        `Los montos deben sumar ${totalAmount.toLocaleString('es-PY')} Gs ` +
        `(actual: ${totalSplits.toLocaleString('es-PY')} Gs, ` +
        `diferencia: ${difference.toLocaleString('es-PY')} Gs)`
    });
  }

  return errors;
}

// =====================================================
// VALIDACIONES DE SPLITS CALCULADOS
// =====================================================

/**
 * Valida que los splits calculados sean consistentes con el gasto
 */
export function validateCalculatedSplits(
  calculatedSplits: CalculatedSplit[],
  expectedTotal: number,
  participantIds: string[]
): SplitValidationResult {
  const errors: SplitValidationError[] = [];

  // Validación 1: Debe haber splits
  if (!calculatedSplits || calculatedSplits.length === 0) {
    return {
      valid: false,
      errors: [],
      generalError: 'No hay splits calculados'
    };
  }

  // Validación 2: Cantidad de splits debe coincidir
  if (calculatedSplits.length !== participantIds.length) {
    return {
      valid: false,
      errors: [],
      generalError: `Cantidad de splits (${calculatedSplits.length}) no coincide con participantes (${participantIds.length})`
    };
  }

  // Validación 3: Todos los participantes deben tener split
  participantIds.forEach((id) => {
    if (!calculatedSplits.some((s) => s.participant_id === id)) {
      errors.push({
        participant_id: id,
        field: 'amount',
        message: 'Participante sin split calculado'
      });
    }
  });

  // Validación 4: Todos los splits deben ser positivos
  calculatedSplits.forEach((split) => {
    if (split.amount <= 0) {
      errors.push({
        participant_id: split.participant_id,
        field: 'amount',
        message: `Monto calculado inválido: ${split.amount}`
      });
    }
  });

  // Validación 5: Suma debe ser exacta
  const actualTotal = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
  if (actualTotal !== expectedTotal) {
    const difference = Math.abs(actualTotal - expectedTotal);
    return {
      valid: false,
      errors: [],
      generalError:
        `Suma de splits (${actualTotal.toLocaleString('es-PY')} Gs) ` +
        `no coincide con total esperado (${expectedTotal.toLocaleString('es-PY')} Gs). ` +
        `Diferencia: ${difference.toLocaleString('es-PY')} Gs`
    };
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

// =====================================================
// VALIDACIONES DE DATOS PARA BD
// =====================================================

/**
 * Valida que los datos estén listos para insertar en BD
 */
export function validateExpenseForDatabase(
  groupId: string,
  description: string,
  amount: number,
  splitType: SplitType,
  paidByParticipantId: string,
  calculatedSplits: CalculatedSplit[]
): SplitValidationResult {
  const errors: SplitValidationError[] = [];

  // Validar group_id
  if (!groupId || !isValidUUID(groupId)) {
    return {
      valid: false,
      errors: [],
      generalError: 'ID de grupo inválido'
    };
  }

  // Validar description
  if (!description || description.length < 3) {
    return {
      valid: false,
      errors: [],
      generalError: 'La descripción debe tener al menos 3 caracteres'
    };
  }

  // Validar amount
  if (!amount || amount <= 0) {
    return {
      valid: false,
      errors: [],
      generalError: 'El monto debe ser mayor a 0'
    };
  }

  // Validar split_type
  const splitTypeValidation = validateSplitType(splitType);
  if (!splitTypeValidation.valid) {
    return splitTypeValidation;
  }

  // Validar paid_by_participant_id
  if (!paidByParticipantId || !isValidUUID(paidByParticipantId)) {
    return {
      valid: false,
      errors: [],
      generalError: 'ID del participante que pagó es inválido'
    };
  }

  // Validar calculatedSplits
  const splitsValidation = validateCalculatedSplits(
    calculatedSplits,
    amount,
    calculatedSplits.map((s) => s.participant_id)
  );

  if (!splitsValidation.valid) {
    return splitsValidation;
  }

  return { valid: true, errors: [] };
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Valida formato de UUID
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Formatea errores de validación para mostrar en UI
 */
export function formatValidationErrors(
  result: SplitValidationResult
): string[] {
  const messages: string[] = [];

  if (result.generalError) {
    messages.push(result.generalError);
  }

  result.errors.forEach((error) => {
    if (error.participant_id === '__general__') {
      messages.push(error.message);
    } else {
      messages.push(
        `[${error.participant_id}] ${error.field}: ${error.message}`
      );
    }
  });

  return messages;
}

/**
 * Obtiene errores para un participante específico
 */
export function getParticipantErrors(
  result: SplitValidationResult,
  participantId: string
): SplitValidationError[] {
  return result.errors.filter((e) => e.participant_id === participantId);
}

/**
 * Verifica si hay errores generales (no específicos de participante)
 */
export function hasGeneralErrors(result: SplitValidationResult): boolean {
  return !!(
    result.generalError ||
    result.errors.some((e) => e.participant_id === '__general__')
  );
}
