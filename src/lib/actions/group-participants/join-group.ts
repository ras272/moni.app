'use server';

import { createClient } from '@/lib/supabase/server';
import type { GroupParticipant } from '@/types/database';
import { z } from 'zod';
import type { ActionResponse } from './types';

// =====================================================
// JOIN PUBLIC GROUP (AUTO-JOIN)
// =====================================================

/**
 * Permite que un usuario autenticado se una automáticamente a un grupo público
 * Se usa cuando un usuario con cuenta accede al link público del grupo
 *
 * @param groupId - ID del grupo público
 * @returns Promise con el participante creado o redirigido
 */
export async function joinPublicGroup(
  groupId: string
): Promise<ActionResponse<GroupParticipant>> {
  try {
    // Validar UUID
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
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
      .select('id, full_name, avatar_url')
      .eq('auth_id', user.id)
      .single();

    if (currentProfileError || !currentProfile) {
      return {
        success: false,
        error: 'No se encontró tu perfil'
      };
    }

    // Verificar que el grupo existe y es público
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('id, is_public')
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

    // Verificar que no esté ya en el grupo
    const { data: existingParticipant } = await supabase
      .from('group_participants')
      .select('*')
      .eq('group_id', groupId)
      .eq('profile_id', currentProfile.id)
      .single();

    if (existingParticipant) {
      // Ya es participante, retornar el existente
      return {
        success: true,
        data: existingParticipant as GroupParticipant
      };
    }

    // Agregar como participante
    const { data: newParticipant, error: insertError } = await supabase
      .from('group_participants')
      .insert({
        group_id: groupId,
        profile_id: currentProfile.id,
        name: currentProfile.full_name,
        avatar_url: currentProfile.avatar_url,
        invitation_status: 'accepted' // Auto-aceptado en grupos públicos
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error joining public group:', insertError);
      return {
        success: false,
        error: 'Error al unirse al grupo'
      };
    }

    return {
      success: true,
      data: newParticipant
    };
  } catch (error) {
    console.error('Unexpected error in joinPublicGroup:', error);
    return {
      success: false,
      error: 'Error inesperado al unirse al grupo'
    };
  }
}
