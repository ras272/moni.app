/**
 * =====================================================
 * ACTION: Create MoneyTag Group
 * =====================================================
 *
 * Server action para crear un nuevo grupo de gastos compartidos.
 *
 * @module moneytags/actions/create-group
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
 * Crea un nuevo grupo MoneyTag
 *
 * @param formData - Datos del formulario
 * @returns Resultado con éxito o error
 *
 * FormData esperado:
 * - name: Nombre del grupo (mínimo 3 caracteres)
 * - description: Descripción opcional del grupo
 */
export async function createMoneyTagGroupAction(formData: FormData) {
  try {
    console.log('🚀 createMoneyTagGroupAction - START');
    const supabase = await createClient();

    const {
      data: { session }
    } = await supabase.auth.getSession();
    console.log('🔍 Session info:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    const profileId = await getCurrentProfileId();
    console.log('🔍 ProfileId obtained:', profileId);

    if (!profileId) {
      console.error('❌ No profileId - user not authenticated');
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Extract form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    console.log('🔍 Form data:', { name, description });

    // Validate
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'El nombre del grupo debe tener al menos 3 caracteres'
      };
    }

    console.log('✅ About to INSERT group with data:', {
      owner_profile_id: profileId,
      name,
      description: description || null,
      is_settled: false
    });

    // Use admin client for INSERT (bypasses RLS, but we already validated auth)
    const adminClient = createAdminClient();

    // 1. Create group
    const { data: group, error: groupError } = await adminClient
      .from('money_tag_groups')
      .insert({
        owner_profile_id: profileId,
        name,
        description: description || null,
        is_settled: false
      })
      .select()
      .single();

    if (groupError) {
      console.error('❌ Error creating group:', {
        code: groupError.code,
        message: groupError.message,
        details: groupError.details,
        hint: groupError.hint
      });
      return {
        success: false,
        error: 'Error al crear el grupo: ' + groupError.message
      };
    }

    console.log('✅ Group created successfully:', group.id);

    // 2. CRITICAL: Add owner as first participant automatically
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profileId)
      .single();

    const { error: participantError } = await adminClient
      .from('group_participants')
      .insert({
        group_id: group.id,
        profile_id: profileId,
        name: ownerProfile?.full_name || 'Yo'
      });

    if (participantError) {
      // Rollback: delete the group if participant insertion fails
      await adminClient.from('money_tag_groups').delete().eq('id', group.id);

      console.error('Error adding owner as participant:', participantError);
      return {
        success: false,
        error: 'Error al crear el grupo'
      };
    }

    revalidatePath('/dashboard/moneytags');

    return {
      success: true,
      data: group
    };
  } catch (error) {
    console.error('Unexpected error creating group:', error);
    return {
      success: false,
      error: 'Error inesperado al crear el grupo'
    };
  }
}
