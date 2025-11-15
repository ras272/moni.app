'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// ACTION: Delete Recurring Transaction
// =====================================================
export async function deleteRecurringTransactionAction(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recurring transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }

    revalidatePath('/dashboard/recurrentes');
    revalidatePath('/dashboard/overview');

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Error inesperado al eliminar la recurrencia'
    };
  }
}
