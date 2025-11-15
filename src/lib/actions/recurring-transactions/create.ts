'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { RecurrenceFrequency } from '@/types/database';

// =====================================================
// HELPER: Get current profile_id
// =====================================================
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

// =====================================================
// HELPER: Calculate next occurrence
// =====================================================
function calculateNextOccurrence(
  startDate: string,
  frequency: RecurrenceFrequency,
  intervalCount: number,
  dayOfPeriod?: number
): string {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Si la fecha de inicio es hoy o futura, usar esa fecha
  if (start >= today) {
    return startDate;
  }

  // Si ya pasó, calcular la próxima ocurrencia
  // Por simplicidad, usar la fecha de inicio
  // (el cron job calculará la próxima después de generar)
  return startDate;
}

// =====================================================
// ACTION: Create Recurring Transaction
// =====================================================
export async function createRecurringTransactionAction(formData: FormData) {
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
    const type = formData.get('type') as 'expense' | 'income';
    const amount = parseFloat(formData.get('amount') as string);
    const currency = (formData.get('currency') as string) || 'PYG';
    const description = formData.get('description') as string;
    const merchant = formData.get('merchant') as string | null;
    const category_id = formData.get('category_id') as string | null;
    const account_id = formData.get('account_id') as string;
    const notes = formData.get('notes') as string | null;

    const frequency = formData.get('frequency') as RecurrenceFrequency;
    const interval_count = parseInt(
      (formData.get('interval_count') as string) || '1'
    );
    const day_of_period = formData.get('day_of_period')
      ? parseInt(formData.get('day_of_period') as string)
      : null;
    const start_date = formData.get('start_date') as string;
    const end_date = (formData.get('end_date') as string) || null;

    // Calculate next occurrence
    const next_occurrence_date = calculateNextOccurrence(
      start_date,
      frequency,
      interval_count,
      day_of_period || undefined
    );

    // Insert into database
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        profile_id: profileId,
        type,
        amount,
        currency,
        description,
        merchant,
        category_id,
        account_id,
        to_account_id: null,
        notes,
        frequency,
        interval_count,
        day_of_period,
        start_date,
        end_date,
        is_active: true,
        last_generated_date: null,
        next_occurrence_date
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring transaction:', error);
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
      error: 'Error inesperado al crear la recurrencia'
    };
  }
}
