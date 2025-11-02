/**
 * =====================================================
 * ACTION: Create Group Expense (with flexible splits)
 * =====================================================
 *
 * Server action para crear gastos compartidos en grupos.
 * Soporta divisiones flexibles (equitativa, porcentajes, montos exactos).
 *
 * @module moneytags/actions/create-expense
 * @author Sistema
 * @version 2.0.0
 * @created 2025-11-01
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateSplitAmounts } from '@/lib/split-calculator';
import { validateCalculatedSplits } from '@/lib/validations/expense-splits';

/**
 * Helper para obtener profile_id del usuario actual
 */
async function getCurrentProfileId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  return profile?.id || null;
}

/**
 * Crea un gasto compartido en un grupo con división flexible
 *
 * @param formData - Datos del formulario
 * @returns Resultado con éxito o error
 *
 * FormData esperado:
 * - group_id: UUID del grupo
 * - description: Descripción del gasto
 * - amount: Monto total (número)
 * - currency: Moneda (default: PYG)
 * - paid_by_participant_id: UUID del participante que pagó
 * - expense_date: Fecha del gasto (default: hoy)
 * - split_type: 'equal' | 'percentage' | 'exact' (default: 'equal')
 * - splits: JSON string con array de splits (opcional para 'equal')
 */
export async function createGroupExpenseAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const profileId = await getCurrentProfileId();

    if (!profileId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Extract form data
    const groupId = formData.get('group_id') as string;
    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const currency = (formData.get('currency') as string) || 'PYG';
    const paidByParticipantId = formData.get('paid_by_participant_id') as
      | string
      | null;
    const expenseDate =
      (formData.get('expense_date') as string) ||
      new Date().toISOString().split('T')[0];

    // NUEVO: Obtener tipo de división y splits
    const splitType = (formData.get('split_type') as string) || 'equal';
    const splitsJson = formData.get('splits') as string | null;

    // Validate basic fields
    if (!description || description.length < 3) {
      return {
        success: false,
        error: 'La descripción debe tener al menos 3 caracteres'
      };
    }

    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'El monto debe ser mayor a 0'
      };
    }

    if (!groupId) {
      return {
        success: false,
        error: 'Grupo no especificado'
      };
    }

    // Verify user is participant or owner of the group
    const { data: group } = await supabase
      .from('money_tag_groups')
      .select('owner_profile_id')
      .eq('id', groupId)
      .single();

    const { data: userParticipant } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .single();

    if (!group || (!userParticipant && group.owner_profile_id !== profileId)) {
      return {
        success: false,
        error: 'No tienes permiso para crear gastos en este grupo'
      };
    }

    // Determine who paid (default to current user's participant ID)
    let finalPaidByParticipantId = paidByParticipantId;

    if (!finalPaidByParticipantId) {
      const { data: currentParticipant } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('profile_id', profileId)
        .single();

      if (!currentParticipant) {
        return {
          success: false,
          error: 'No eres participante de este grupo'
        };
      }

      finalPaidByParticipantId = currentParticipant.id;
    }

    // NUEVO: Preparar splits según tipo de división
    let splitInputs: Array<{
      participant_id: string;
      amount?: number;
      percentage?: number;
    }>;

    if (splitsJson) {
      // Usuario especificó splits custom (percentage o exact)
      try {
        splitInputs = JSON.parse(splitsJson);
      } catch (e) {
        return {
          success: false,
          error: 'Formato de splits inválido'
        };
      }
    } else {
      // DEFAULT: división equitativa entre todos los participantes
      const { data: allParticipants } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId);

      if (!allParticipants || allParticipants.length === 0) {
        return {
          success: false,
          error: 'No hay participantes en el grupo'
        };
      }

      splitInputs = allParticipants.map((p) => ({
        participant_id: p.id
      }));
    }

    // NUEVO: Calcular montos de splits usando helper
    const calculationResult = calculateSplitAmounts(
      amount,
      splitType as any,
      splitInputs
    );

    if (!calculationResult.valid) {
      return {
        success: false,
        error:
          calculationResult.errors?.[0] ||
          'Error al calcular división de gastos'
      };
    }

    // NUEVO: Validar splits calculados
    const validation = validateCalculatedSplits(
      calculationResult.splits,
      amount,
      splitInputs.map((s) => s.participant_id)
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.generalError || 'Los splits calculados no son válidos'
      };
    }

    // 1. Insert expense con split_type
    const { data: expense, error: expenseError } = await supabase
      .from('group_expenses')
      .insert({
        group_id: groupId,
        description,
        amount,
        currency,
        paid_by_participant_id: finalPaidByParticipantId,
        expense_date: expenseDate,
        split_type: splitType
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return {
        success: false,
        error: 'Error al crear el gasto: ' + expenseError.message
      };
    }

    // 2. NUEVO: Create expense splits CON montos calculados
    const splitsToInsert = calculationResult.splits.map((split) => ({
      expense_id: expense.id,
      participant_id: split.participant_id,
      amount: split.amount
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitsToInsert);

    if (splitsError) {
      // Rollback: delete expense if splits fail
      await supabase.from('group_expenses').delete().eq('id', expense.id);

      console.error('Error creating expense splits:', splitsError);
      return {
        success: false,
        error: 'Error al dividir el gasto entre participantes'
      };
    }

    revalidatePath('/dashboard/moneytags');
    revalidatePath(`/dashboard/moneytags/${groupId}`);

    return {
      success: true,
      data: expense
    };
  } catch (error) {
    console.error('Unexpected error creating expense:', error);
    return {
      success: false,
      error: 'Error inesperado al crear el gasto'
    };
  }
}
