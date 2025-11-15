'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// ACTION: Update Recurring Transaction
// =====================================================
export async function updateRecurringTransactionAction(
  id: string,
  formData: FormData
) {
  try {
    const supabase = await createClient();

    // Extract only the fields that can be updated
    const updates: Record<string, unknown> = {};

    const description = formData.get('description') as string | null;
    const amount = formData.get('amount') as string | null;
    const category_id = formData.get('category_id') as string | null;
    const account_id = formData.get('account_id') as string | null;
    const merchant = formData.get('merchant') as string | null;
    const notes = formData.get('notes') as string | null;
    const end_date = formData.get('end_date') as string | null;

    if (description) updates.description = description;
    if (amount) updates.amount = parseFloat(amount);
    if (category_id !== undefined) updates.category_id = category_id || null;
    if (account_id) updates.account_id = account_id;
    if (merchant !== undefined) updates.merchant = merchant || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (end_date !== undefined) updates.end_date = end_date || null;

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recurring transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }

    revalidatePath('/dashboard/recurrentes');
    revalidatePath('/dashboard/overview');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar la recurrencia'
    };
  }
}
