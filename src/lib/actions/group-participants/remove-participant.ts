'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ActionResponse } from './types';

// =====================================================
// REMOVE PARTICIPANT
// =====================================================

/**
 * Remueve un participante de un grupo
 * Solo el owner puede remover participantes
 *
 * @param groupId - ID del grupo
 * @param participantId - ID del participante a remover
 * @returns Promise con éxito o error
 */
export async function removeParticipant(
  groupId: string,
  participantId: string
): Promise<ActionResponse<{ success: true }>> {
  try {
    // Validar UUIDs
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    if (!z.string().uuid().safeParse(participantId).success) {
      return {
        success: false,
        error: 'ID de participante inválido'
      };
    }

    // Obtener cliente y usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Debes estar autenticado'
      };
    }

    // Obtener profile del usuario autenticado
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (currentProfileError || !currentProfile) {
      return {
        success: false,
        error: 'No se encontró tu perfil'
      };
    }

    // Verificar que el usuario es owner del grupo
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('owner_profile_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Grupo no encontrado'
      };
    }

    if (group.owner_profile_id !== currentProfile.id) {
      return {
        success: false,
        error: 'Solo el owner puede remover participantes'
      };
    }

    // Verificar que el participante existe en el grupo
    const { data: participant, error: participantError } = await supabase
      .from('group_participants')
      .select('id')
      .eq('id', participantId)
      .eq('group_id', groupId)
      .single();

    if (participantError || !participant) {
      return {
        success: false,
        error: 'Participante no encontrado en este grupo'
      };
    }

    // Remover participante
    const { error: deleteError } = await supabase
      .from('group_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) {
      console.error('Error removing participant:', deleteError);
      return {
        success: false,
        error: 'Error al remover participante'
      };
    }

    return {
      success: true,
      data: { success: true }
    };
  } catch (error) {
    console.error('Unexpected error in removeParticipant:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}
