'use server';

import { createClient } from '@/lib/supabase/server';
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
