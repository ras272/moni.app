'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// ACTION: Toggle Recurring Transaction Status
// =====================================================
export async function toggleRecurringTransactionAction(
  id: string,
  isActive: boolean
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling recurring transaction:', error);
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
      error: 'Error inesperado al cambiar el estado de la recurrencia'
    };
  }
}
