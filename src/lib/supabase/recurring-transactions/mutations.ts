import { supabase, getCurrentProfileId } from '../client';
import type {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput
} from './types';
import { calculateInitialNextOccurrence } from './utils';

// =====================================================
// CREATE RECURRING TRANSACTION
// =====================================================

export async function createRecurringTransaction(
  input: CreateRecurringTransactionInput
): Promise<RecurringTransaction> {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado');

  // Calcular la próxima fecha de ocurrencia
  const nextOccurrenceDate = calculateInitialNextOccurrence(
    input.start_date,
    input.frequency,
    input.interval_count || 1,
    input.day_of_period
  );

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      profile_id: profileId,
      type: input.type,
      amount: input.amount,
      currency: input.currency || 'PYG',
      description: input.description,
      merchant: input.merchant || null,
      category_id: input.category_id || null,
      account_id: input.account_id,
      to_account_id: null, // MVP: no transferencias recurrentes
      notes: input.notes || null,
      frequency: input.frequency,
      interval_count: input.interval_count || 1,
      day_of_period: input.day_of_period || null,
      start_date: input.start_date,
      end_date: input.end_date || null,
      is_active: true,
      last_generated_date: null,
      next_occurrence_date: nextOccurrenceDate
    })
    .select()
    .single();

  if (error) throw error;
  return data as RecurringTransaction;
}

// =====================================================
// UPDATE RECURRING TRANSACTION
// =====================================================

export async function updateRecurringTransaction(
  id: string,
  updates: UpdateRecurringTransactionInput
): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .update({
      ...(updates.description && { description: updates.description }),
      ...(updates.amount && { amount: updates.amount }),
      ...(updates.category_id !== undefined && {
        category_id: updates.category_id || null
      }),
      ...(updates.account_id && { account_id: updates.account_id }),
      ...(updates.merchant !== undefined && {
        merchant: updates.merchant || null
      }),
      ...(updates.notes !== undefined && { notes: updates.notes || null }),
      ...(updates.end_date !== undefined && {
        end_date: updates.end_date || null
      })
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RecurringTransaction;
}

// =====================================================
// DELETE RECURRING TRANSACTION
// =====================================================

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// TOGGLE ACTIVE STATUS (Pausar/Reanudar)
// =====================================================

export async function toggleRecurringTransactionStatus(
  id: string,
  isActive: boolean
): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RecurringTransaction;
}

// =====================================================
// PAUSE RECURRING TRANSACTION
// =====================================================

export async function pauseRecurringTransaction(
  id: string
): Promise<RecurringTransaction> {
  return toggleRecurringTransactionStatus(id, false);
}

// =====================================================
// RESUME RECURRING TRANSACTION
// =====================================================

export async function resumeRecurringTransaction(
  id: string
): Promise<RecurringTransaction> {
  return toggleRecurringTransactionStatus(id, true);
}
