'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getPublicGroupSchema,
  type GetPublicGroupInput,
  type PublicGroupInfo
} from '@/lib/validations/monitag';
import type {
  GroupParticipant,
  GroupExpenseWithRelations,
  GroupDebt
} from '@/types/database';
import { z } from 'zod';

// =====================================================
// RESPONSE TYPES
// =====================================================

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =====================================================
// GET PUBLIC GROUP
// =====================================================

/**
 * Obtiene información de un grupo público por @monitag + slug
 *
 * @param input - Owner monitag y group slug
 * @returns Promise con información del grupo o error
 */
export async function getPublicGroup(
  input: GetPublicGroupInput
): Promise<ActionResponse<PublicGroupInfo>> {
  try {
    // Validar input
    const validated = getPublicGroupSchema.parse(input);
    const { ownerMonitag, groupSlug } = validated;

    // Obtener cliente (no requiere autenticación)
    const supabase = await createClient();

    // Obtener grupo público
    const { data, error } = await supabase.rpc('get_public_group_by_url', {
      owner_monitag: ownerMonitag,
      group_slug: groupSlug
    });

    if (error) {
      console.error('Error fetching public group:', error);
      return {
        success: false,
        error: 'Error al obtener grupo'
      };
    }

    // Si no hay datos, el grupo no existe o no es público
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Grupo no encontrado o no público'
      };
    }

    return {
      success: true,
      data: data[0]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Parámetros inválidos'
      };
    }

    console.error('Unexpected error in getPublicGroup:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener grupo'
    };
  }
}

// =====================================================
// GET PUBLIC GROUP PARTICIPANTS
// =====================================================

/**
 * Obtiene participantes de un grupo público
 *
 * @param groupId - ID del grupo
 * @returns Promise con lista de participantes
 */
export async function getPublicGroupParticipants(
  groupId: string
): Promise<ActionResponse<GroupParticipant[]>> {
  try {
    // Validar UUID
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    // Obtener cliente
    const supabase = await createClient();

    // Verificar que el grupo es público
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('is_public')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Grupo no encontrado'
      };
    }

    if (!group.is_public) {
      return {
        success: false,
        error: 'Este grupo no es público'
      };
    }

    // Obtener participantes con avatares
    const { data, error } = await supabase
      .from('group_participants')
      .select(
        `
        *,
        profile:profiles(avatar_url)
      `
      )
      .eq('group_id', groupId)
      .eq('invitation_status', 'accepted')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching participants:', error);
      return {
        success: false,
        error: 'Error al obtener participantes'
      };
    }

    // Flatten avatar_url from nested profile object
    const participantsWithAvatar = (data || []).map((p: any) => ({
      ...p,
      avatar_url: p.profile?.avatar_url || p.avatar_url
    }));

    return {
      success: true,
      data: participantsWithAvatar
    };
  } catch (error) {
    console.error('Unexpected error in getPublicGroupParticipants:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}

// =====================================================
// GET PUBLIC GROUP EXPENSES
// =====================================================

/**
 * Obtiene gastos de un grupo público con sus relaciones
 *
 * @param groupId - ID del grupo
 * @returns Promise con lista de gastos
 */
export async function getPublicGroupExpenses(
  groupId: string
): Promise<ActionResponse<GroupExpenseWithRelations[]>> {
  try {
    // Validar UUID
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    // Obtener cliente
    const supabase = await createClient();

    // Verificar que el grupo es público
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('is_public')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Grupo no encontrado'
      };
    }

    if (!group.is_public) {
      return {
        success: false,
        error: 'Este grupo no es público'
      };
    }

    // Obtener gastos con relaciones
    const { data, error } = await supabase
      .from('group_expenses')
      .select(
        `
        *,
        paid_by:group_participants!group_expenses_paid_by_participant_id_fkey(*),
        splits:expense_splits(
          *,
          participant:group_participants(*)
        )
      `
      )
      .eq('group_id', groupId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return {
        success: false,
        error: 'Error al obtener gastos'
      };
    }

    return {
      success: true,
      data: (data as any) || []
    };
  } catch (error) {
    console.error('Unexpected error in getPublicGroupExpenses:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}

// =====================================================
// GET PUBLIC GROUP DEBTS
// =====================================================

/**
 * Calcula y obtiene las deudas de un grupo público
 *
 * @param groupId - ID del grupo
 * @returns Promise con lista de deudas
 */
export async function getPublicGroupDebts(
  groupId: string
): Promise<ActionResponse<GroupDebt[]>> {
  try {
    // Validar UUID
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    // Obtener cliente
    const supabase = await createClient();

    // Verificar que el grupo es público
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('is_public')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Grupo no encontrado'
      };
    }

    if (!group.is_public) {
      return {
        success: false,
        error: 'Este grupo no es público'
      };
    }

    // Calcular deudas
    const { data, error } = await supabase.rpc('calculate_group_debts', {
      group_uuid: groupId
    });

    if (error) {
      console.error('Error calculating debts:', error);
      return {
        success: false,
        error: 'Error al calcular deudas'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Unexpected error in getPublicGroupDebts:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}

// =====================================================
// GET VISITOR DEBT SUMMARY
// =====================================================

/**
 * Calcula el resumen de deuda de un visitante específico
 * Útil para mostrar "Tu deuda: X" en vista pública
 *
 * @param groupId - ID del grupo
 * @param visitorName - Nombre del visitante
 * @returns Promise con resumen de deuda del visitante
 */
export async function getVisitorDebtSummary(
  groupId: string,
  visitorName: string
): Promise<
  ActionResponse<{
    totalOwed: number;
    debtsTo: Array<{ creditor: string; amount: number }>;
  }>
> {
  try {
    // Validar inputs
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    if (!visitorName || visitorName.trim().length === 0) {
      return {
        success: false,
        error: 'Nombre de visitante requerido'
      };
    }

    // Obtener todas las deudas del grupo
    const debtsResult = await getPublicGroupDebts(groupId);

    if (!debtsResult.success) {
      return {
        success: false,
        error: debtsResult.error
      };
    }

    const allDebts = debtsResult.data;

    // Filtrar deudas donde el visitante es el deudor
    const visitorDebts = allDebts.filter(
      (debt) =>
        debt.debtor_name.toLowerCase().trim() ===
        visitorName.toLowerCase().trim()
    );

    // Calcular total adeudado
    const totalOwed = visitorDebts.reduce(
      (sum, debt) => sum + debt.debt_amount,
      0
    );

    // Mapear deudas a formato simple
    const debtsTo = visitorDebts.map((debt) => ({
      creditor: debt.creditor_name,
      amount: debt.debt_amount
    }));

    return {
      success: true,
      data: {
        totalOwed,
        debtsTo
      }
    };
  } catch (error) {
    console.error('Unexpected error in getVisitorDebtSummary:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}
