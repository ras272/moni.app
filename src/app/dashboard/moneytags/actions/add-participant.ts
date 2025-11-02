/**
 * =====================================================
 * ACTION: Add Participant to Group
 * =====================================================
 *
 * Server action para agregar un participante a un grupo existente.
 * Puede agregar usuarios registrados o invitados (solo nombre/teléfono).
 *
 * @module moneytags/actions/add-participant
 * @author Sistema
 * @version 1.0.0
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

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
 * Agrega un participante a un grupo existente
 *
 * @param groupId - UUID del grupo
 * @param formData - Datos del formulario
 * @returns Resultado con éxito o error
 *
 * FormData esperado:
 * - name: Nombre del participante (mínimo 2 caracteres)
 * - email: Email opcional (para vincular usuario registrado)
 * - phone: Teléfono opcional (para vincular usuario registrado)
 *
 * Comportamiento:
 * - Si email/phone existe en profiles → vincula usuario registrado
 * - Si no existe → crea participante invitado
 * - Solo el owner del grupo puede agregar participantes
 */
export async function addParticipantAction(
  groupId: string,
  formData: FormData
) {
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
    const name = formData.get('name') as string;
    const email = formData.get('email') as string | null;
    const phone = formData.get('phone') as string | null;

    // Validate
    if (!name || name.length < 2) {
      return {
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      };
    }

    // Use admin client
    const adminClient = createAdminClient();

    // CRITICAL: Verify that current user is the owner of the group
    const { data: group, error: groupError } = await adminClient
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

    if (group.owner_profile_id !== profileId) {
      return {
        success: false,
        error: 'Solo el dueño del grupo puede agregar participantes'
      };
    }

    // Check if email or phone exists in profiles (registered user)
    let participantProfileId: string | null = null;
    let participantName = name;

    if (email) {
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .single();

      if (existingProfile) {
        participantProfileId = existingProfile.id;
        participantName = existingProfile.full_name || name;
      }
    } else if (phone) {
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .eq('phone', phone)
        .single();

      if (existingProfile) {
        participantProfileId = existingProfile.id;
        participantName = existingProfile.full_name || name;
      }
    }

    // Check if already participant
    if (participantProfileId) {
      const { data: existingParticipant } = await adminClient
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('profile_id', participantProfileId)
        .single();

      if (existingParticipant) {
        return {
          success: false,
          error: 'Este usuario ya es participante del grupo'
        };
      }
    }

    // Insert participant
    const { data, error } = await adminClient
      .from('group_participants')
      .insert({
        group_id: groupId,
        profile_id: participantProfileId,
        name: participantName,
        phone: phone || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding participant:', error);
      return {
        success: false,
        error: 'Error al agregar participante: ' + error.message
      };
    }

    revalidatePath('/dashboard/moneytags');
    revalidatePath(`/dashboard/moneytags/${groupId}`);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error adding participant:', error);
    return {
      success: false,
      error: 'Error inesperado al agregar participante'
    };
  }
}
