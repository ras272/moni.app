'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';
import type { AccountType, TransactionType } from '@/types/database';

// =====================================================
// HELPER: Get current profile_id
// =====================================================
async function getCurrentProfileId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile_id from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  return profile?.id || null;
}

// =====================================================
// ACTION: Create Account
// =====================================================
export async function createAccountAction(formData: FormData) {
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
    const type = (formData.get('type') as AccountType) || 'wallet';
    const institution = formData.get('institution') as string | null;
    const currency = (formData.get('currency') as string) || 'PYG';
    const initialBalance = parseFloat(
      (formData.get('initial_balance') as string) || '0'
    );
    const color = (formData.get('color') as string) || '#3B82F6';
    const icon = (formData.get('icon') as string) || 'wallet';

    // Validate required fields
    if (!name || name.length < 3) {
      return {
        success: false,
        error: 'El nombre debe tener al menos 3 caracteres'
      };
    }

    // Insert account
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        profile_id: profileId,
        name,
        type,
        institution: institution || null,
        currency,
        initial_balance: initialBalance,
        current_balance: initialBalance,
        color,
        icon,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return {
        success: false,
        error: 'Error al crear la cuenta: ' + error.message
      };
    }

    // Revalidate pages
    revalidatePath('/dashboard/cuentas');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error creating account:', error);
    return {
      success: false,
      error: 'Error inesperado al crear la cuenta'
    };
  }
}

// =====================================================
// ACTION: Create Transaction
// =====================================================
export async function createTransactionAction(formData: FormData) {
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
    const type = formData.get('type') as TransactionType;
    const amount = parseFloat(formData.get('amount') as string);
    const currency = (formData.get('currency') as string) || 'PYG';
    const description = formData.get('description') as string;
    const merchant = formData.get('merchant') as string | null;
    const categoryId = formData.get('category_id') as string | null;
    const accountId = formData.get('account_id') as string;
    const toAccountId = formData.get('to_account_id') as string | null;
    const status = (formData.get('status') as string) || 'completed';
    const notes = formData.get('notes') as string | null;
    const transactionDate =
      (formData.get('transaction_date') as string) ||
      new Date().toISOString().split('T')[0];

    // Validate required fields
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

    if (!accountId) {
      return {
        success: false,
        error: 'Debes seleccionar una cuenta'
      };
    }

    // CRITICAL: Verify that the account belongs to the current user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, profile_id')
      .eq('id', accountId)
      .eq('profile_id', profileId)
      .single();

    if (accountError || !account) {
      return {
        success: false,
        error: 'La cuenta seleccionada no existe o no te pertenece'
      };
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        profile_id: profileId,
        type,
        amount,
        currency,
        description,
        merchant: merchant || null,
        category_id: categoryId || null,
        account_id: accountId,
        to_account_id: toAccountId || null,
        status: status as any,
        notes: notes || null,
        transaction_date: transactionDate
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        error: 'Error al crear la transacción: ' + error.message
      };
    }

    // Revalidate pages
    revalidatePath('/dashboard/transacciones');
    revalidatePath('/dashboard/cuentas');
    revalidatePath('/dashboard/overview');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error creating transaction:', error);
    return {
      success: false,
      error: 'Error inesperado al crear la transacción'
    };
  }
}

// =====================================================
// ACTION: Update Account
// =====================================================
export async function updateAccountAction(
  accountId: string,
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

    // Verify ownership
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('profile_id', profileId)
      .single();

    if (!account) {
      return {
        success: false,
        error: 'Cuenta no encontrada'
      };
    }

    // Extract updates
    const updates: any = {};
    const name = formData.get('name');
    const type = formData.get('type');
    const institution = formData.get('institution');
    const color = formData.get('color');
    const icon = formData.get('icon');
    const isActive = formData.get('is_active');

    if (name) updates.name = name;
    if (type) updates.type = type;
    if (institution !== undefined) updates.institution = institution || null;
    if (color) updates.color = color;
    if (icon) updates.icon = icon;
    if (isActive !== undefined) updates.is_active = isActive === 'true';

    // Update account
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Error al actualizar la cuenta: ' + error.message
      };
    }

    revalidatePath('/dashboard/cuentas');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error updating account:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar la cuenta'
    };
  }
}

// =====================================================
// ACTION: Delete Account (Soft delete)
// =====================================================
export async function deleteAccountAction(accountId: string) {
  try {
    const supabase = await createClient();
    const profileId = await getCurrentProfileId();

    if (!profileId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Verify ownership
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('profile_id', profileId)
      .single();

    if (!account) {
      return {
        success: false,
        error: 'Cuenta no encontrada'
      };
    }

    // Soft delete
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', accountId);

    if (error) {
      return {
        success: false,
        error: 'Error al eliminar la cuenta: ' + error.message
      };
    }

    revalidatePath('/dashboard/cuentas');

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error deleting account:', error);
    return {
      success: false,
      error: 'Error inesperado al eliminar la cuenta'
    };
  }
}

// =====================================================
// ACTION: Update Transaction
// =====================================================
export async function updateTransactionAction(
  transactionId: string,
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

    // Verify ownership
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, profile_id')
      .eq('id', transactionId)
      .eq('profile_id', profileId)
      .single();

    if (!transaction) {
      return {
        success: false,
        error: 'Transacción no encontrada'
      };
    }

    // Extract updates
    const updates: any = {};
    const type = formData.get('type');
    const amount = formData.get('amount');
    const description = formData.get('description');
    const merchant = formData.get('merchant');
    const categoryId = formData.get('category_id');
    const accountId = formData.get('account_id');
    const status = formData.get('status');
    const notes = formData.get('notes');
    const transactionDate = formData.get('transaction_date');

    if (type) updates.type = type;
    if (amount) updates.amount = parseFloat(amount as string);
    if (description) updates.description = description;
    if (merchant !== undefined) updates.merchant = merchant || null;
    if (categoryId !== undefined) updates.category_id = categoryId || null;
    if (accountId) updates.account_id = accountId;
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes || null;
    if (transactionDate) updates.transaction_date = transactionDate;

    // If account is being changed, verify ownership of the new account
    if (accountId) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', accountId as string)
        .eq('profile_id', profileId)
        .single();

      if (!account) {
        return {
          success: false,
          error: 'La cuenta seleccionada no existe o no te pertenece'
        };
      }
    }

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Error al actualizar la transacción: ' + error.message
      };
    }

    revalidatePath('/dashboard/transacciones');
    revalidatePath('/dashboard/cuentas');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error updating transaction:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar la transacción'
    };
  }
}

// =====================================================
// ACTION: Delete Transaction
// =====================================================
export async function deleteTransactionAction(transactionId: string) {
  try {
    const supabase = await createClient();
    const profileId = await getCurrentProfileId();

    if (!profileId) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Verify ownership
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('profile_id', profileId)
      .single();

    if (!transaction) {
      return {
        success: false,
        error: 'Transacción no encontrada'
      };
    }

    // Delete transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      return {
        success: false,
        error: 'Error al eliminar la transacción: ' + error.message
      };
    }

    revalidatePath('/dashboard/transacciones');
    revalidatePath('/dashboard/cuentas');

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error deleting transaction:', error);
    return {
      success: false,
      error: 'Error inesperado al eliminar la transacción'
    };
  }
}

// =====================================================
// MONEYTAGS: Server Actions para Grupos y Gastos
// =====================================================

// =====================================================
// ACTION: Create MoneyTag Group
// =====================================================
export async function createMoneyTagGroupAction(formData: FormData) {
  try {
    console.log('🚀 createMoneyTagGroupAction - START');
    const supabase = await createClient();

    // Get session info for debugging
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

// =====================================================
// ACTION: Add Participant to Group
// =====================================================
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

// =====================================================
// ACTION: Create Group Expense (with equal splits)
// =====================================================
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

    // Get participant IDs to split (comma-separated or all)
    const participantIdsStr = formData.get('participant_ids') as string | null;

    // Validate
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

    // Get all participants or specified ones
    let participantIds: string[];

    if (participantIdsStr) {
      participantIds = participantIdsStr.split(',').filter((id) => id.trim());
    } else {
      // Default: split equally among ALL participants
      const { data: allParticipants } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId);

      participantIds = allParticipants?.map((p) => p.id) || [];
    }

    if (participantIds.length === 0) {
      return {
        success: false,
        error: 'No hay participantes en el grupo'
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

    // 1. Insert expense
    const { data: expense, error: expenseError } = await supabase
      .from('group_expenses')
      .insert({
        group_id: groupId,
        description,
        amount,
        currency,
        paid_by_participant_id: finalPaidByParticipantId,
        expense_date: expenseDate
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

    // 2. CRITICAL: Create expense splits (equal division)
    const splits = participantIds.map((participantId) => ({
      expense_id: expense.id,
      participant_id: participantId
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splits);

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
