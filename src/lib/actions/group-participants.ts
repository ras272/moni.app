'use server';

import { createClient } from '@/lib/supabase/server';
import {
  addParticipantByMonitagSchema,
  type AddParticipantByMonitagInput
} from '@/lib/validations/monitag';
import type { GroupParticipant } from '@/types/database';
import { z } from 'zod';

// =====================================================
// RESPONSE TYPES
// =====================================================

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =====================================================
// ADD PARTICIPANT BY MONITAG
// =====================================================

/**
 * Agrega un participante a un grupo usando su @monitag
 *
 * @param input - Group ID y monitag del participante
 * @returns Promise con el participante creado
 */
export async function addParticipantByMonitag(
  input: AddParticipantByMonitagInput
): Promise<ActionResponse<GroupParticipant>> {
  try {
    // Validar input
    const validated = addParticipantByMonitagSchema.parse(input);
    const { groupId, monitag } = validated;

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

    // Verificar que el grupo existe y el usuario es owner o participante
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('id, owner_profile_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Grupo no encontrado'
      };
    }

    // Verificar permisos (owner o participante)
    const isOwner = group.owner_profile_id === currentProfile.id;

    if (!isOwner) {
      // Verificar si es participante
      const { data: participantCheck } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('profile_id', currentProfile.id)
        .single();

      if (!participantCheck) {
        return {
          success: false,
          error: 'No tienes permiso para agregar participantes a este grupo'
        };
      }
    }

    // Buscar profile por monitag
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('monitag', monitag)
      .single();

    if (targetProfileError || !targetProfile) {
      return {
        success: false,
        error: `No se encontró usuario con @monitag: @${monitag}`
      };
    }

    // Verificar que no esté ya en el grupo
    const { data: existingParticipant } = await supabase
      .from('group_participants')
      .select('id, invitation_status')
      .eq('group_id', groupId)
      .eq('profile_id', targetProfile.id)
      .single();

    if (existingParticipant) {
      if (existingParticipant.invitation_status === 'accepted') {
        return {
          success: false,
          error: 'Este usuario ya es participante del grupo'
        };
      } else if (existingParticipant.invitation_status === 'pending') {
        return {
          success: false,
          error: 'Este usuario tiene una invitación pendiente'
        };
      }
    }

    // Agregar participante
    const { data: newParticipant, error: insertError } = await supabase
      .from('group_participants')
      .insert({
        group_id: groupId,
        profile_id: targetProfile.id,
        name: targetProfile.full_name,
        avatar_url: targetProfile.avatar_url,
        invitation_status: 'accepted' // Auto-aceptado cuando se agrega por monitag
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding participant:', insertError);
      return {
        success: false,
        error: 'Error al agregar participante'
      };
    }

    return {
      success: true,
      data: newParticipant
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Parámetros inválidos'
      };
    }

    console.error('Unexpected error in addParticipantByMonitag:', error);
    return {
      success: false,
      error: 'Error inesperado al agregar participante'
    };
  }
}

// =====================================================
// ADD PARTICIPANT MANUAL (sin monitag)
// =====================================================

/**
 * Agrega un participante manualmente (nombre + teléfono opcional)
 * Para usuarios que NO tienen cuenta en Moni
 *
 * @param groupId - ID del grupo
 * @param name - Nombre del participante
 * @param phone - Teléfono (opcional)
 * @returns Promise con el participante creado
 */
export async function addParticipantManual(
  groupId: string,
  name: string,
  phone?: string
): Promise<ActionResponse<GroupParticipant>> {
  try {
    // Validar inputs
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Nombre es requerido'
      };
    }

    if (name.trim().length > 100) {
      return {
        success: false,
        error: 'Nombre demasiado largo (máximo 100 caracteres)'
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

    // Verificar que el grupo existe y el usuario es owner o participante
    const { data: group, error: groupError } = await supabase
      .from('money_tag_groups')
      .select('id, owner_profile_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Grupo no encontrado'
      };
    }

    // Verificar permisos
    const isOwner = group.owner_profile_id === currentProfile.id;

    if (!isOwner) {
      const { data: participantCheck } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('profile_id', currentProfile.id)
        .single();

      if (!participantCheck) {
        return {
          success: false,
          error: 'No tienes permiso para agregar participantes a este grupo'
        };
      }
    }

    // Verificar que no exista participante con mismo nombre
    const { data: existingByName } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .ilike('name', name.trim())
      .single();

    if (existingByName) {
      return {
        success: false,
        error: 'Ya existe un participante con este nombre en el grupo'
      };
    }

    // Si se proporciona teléfono, verificar que no exista en el grupo
    if (phone && phone.trim().length > 0) {
      const { data: existingByPhone } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('phone', phone.trim())
        .single();

      if (existingByPhone) {
        return {
          success: false,
          error: 'Ya existe un participante con este teléfono en el grupo'
        };
      }
    }

    // Agregar participante
    const { data: newParticipant, error: insertError } = await supabase
      .from('group_participants')
      .insert({
        group_id: groupId,
        profile_id: null, // Sin cuenta
        name: name.trim(),
        phone: phone?.trim() || null,
        invitation_status: 'accepted'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding manual participant:', insertError);
      return {
        success: false,
        error: 'Error al agregar participante'
      };
    }

    return {
      success: true,
      data: newParticipant
    };
  } catch (error) {
    console.error('Unexpected error in addParticipantManual:', error);
    return {
      success: false,
      error: 'Error inesperado al agregar participante'
    };
  }
}

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
