'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// =====================================================
// TYPES
// =====================================================

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =====================================================
// ADD GUEST PARTICIPANT
// =====================================================

/**
 * Agrega un participante invitado (sin cuenta) a un grupo público
 *
 * Crea un registro en group_participants con:
 * - profile_id = null (no tiene cuenta)
 * - name = nombre ingresado
 * - phone = "guest:{guestId}" para identificación única
 *
 * @param groupId - ID del grupo público
 * @param guestName - Nombre del invitado
 * @param guestId - ID único generado en localStorage
 * @returns Promise con ID del participante creado
 */
export async function addGuestParticipant(
  groupId: string,
  guestName: string,
  guestId: string
): Promise<ActionResponse<{ participantId: string }>> {
  try {
    // Validar UUID del grupo
    if (!z.string().uuid().safeParse(groupId).success) {
      return {
        success: false,
        error: 'ID de grupo inválido'
      };
    }

    // Validar nombre
    const trimmedName = guestName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: 'Nombre debe tener al menos 2 caracteres'
      };
    }

    if (trimmedName.length > 50) {
      return {
        success: false,
        error: 'Nombre demasiado largo'
      };
    }

    // Obtener cliente Supabase
    const supabase = await createClient();

    // Verificar que el grupo existe y es público
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

    // Verificar si ya existe un participante guest con este nombre
    const { data: existing } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('name', trimmedName)
      .is('profile_id', null)
      .maybeSingle();

    // Si ya existe, retornar su ID (evita duplicados)
    if (existing) {
      return {
        success: true,
        data: { participantId: existing.id }
      };
    }

    // Crear participante guest
    const { data: participant, error: insertError } = await supabase
      .from('group_participants')
      .insert({
        group_id: groupId,
        profile_id: null, // Sin cuenta
        name: trimmedName,
        invitation_status: 'accepted',
        // Usar phone para guardar guestId (identificador único)
        phone: `guest:${guestId}`
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating guest participant:', insertError);
      return {
        success: false,
        error: 'Error al agregar invitado al grupo'
      };
    }

    return {
      success: true,
      data: { participantId: participant.id }
    };
  } catch (error) {
    console.error('Unexpected error in addGuestParticipant:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}
