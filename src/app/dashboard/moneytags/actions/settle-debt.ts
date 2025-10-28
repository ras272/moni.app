'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

interface SettleDebtParams {
  groupId: string;
  debtorParticipantId: string;
  creditorParticipantId: string;
  amount: number;
  notes?: string;
}

interface SettleDebtResult {
  success: boolean;
  error?: string;
}

/**
 * Registers a debt settlement between two group participants
 * This reduces the calculated debt in future queries
 */
export async function settleDebtAction(
  params: SettleDebtParams
): Promise<SettleDebtResult> {
  try {
    // Get current user profile
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Perfil no encontrado' };
    }

    const currentProfileId = profile.id;

    const {
      groupId,
      debtorParticipantId,
      creditorParticipantId,
      amount,
      notes
    } = params;

    // Validate amount
    if (amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    const adminClient = createAdminClient();

    // 1. Verify group exists and get participants
    const { data: group, error: groupError } = await adminClient
      .from('money_tag_groups')
      .select('id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return { success: false, error: 'Grupo no encontrado' };
    }

    // 2. Verify both participants belong to this group
    const { data: participants, error: participantsError } = await adminClient
      .from('group_participants')
      .select('id, profile_id')
      .eq('group_id', groupId)
      .in('id', [debtorParticipantId, creditorParticipantId]);

    if (participantsError || !participants || participants.length !== 2) {
      return {
        success: false,
        error: 'Los participantes no pertenecen al grupo'
      };
    }

    // 3. Authorization: Only the debtor or creditor can register the settlement
    const currentUserParticipant = participants.find(
      (p) => p.profile_id === currentProfileId
    );

    if (!currentUserParticipant) {
      return {
        success: false,
        error: 'Solo los participantes involucrados pueden registrar el pago'
      };
    }

    // 4. Insert settlement record
    const { error: insertError } = await adminClient
      .from('group_settlements')
      .insert({
        group_id: groupId,
        from_participant_id: debtorParticipantId,
        to_participant_id: creditorParticipantId,
        amount,
        notes: notes || null,
        settlement_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      });

    if (insertError) {
      console.error('Error inserting settlement:', insertError);

      // Check if it's a duplicate constraint error
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('unique_settlement_per_day')
      ) {
        return {
          success: false,
          error:
            'Este pago ya fue registrado hoy. Si necesitas registrar otro pago, intenta con un monto diferente.'
        };
      }

      return {
        success: false,
        error: 'Error al registrar la liquidación: ' + insertError.message
      };
    }

    // 5. Revalidate to update debts calculation
    revalidatePath(`/dashboard/moneytags/${groupId}`);
    revalidatePath('/dashboard/moneytags');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in settleDebtAction:', error);
    return {
      success: false,
      error: 'Error inesperado al registrar el pago'
    };
  }
}
