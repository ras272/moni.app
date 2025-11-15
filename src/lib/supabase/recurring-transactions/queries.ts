import { supabase } from '../client';
import type {
  RecurringTransaction,
  RecurringTransactionWithRelations,
  RecurringTransactionHistory,
  RecurringTransactionFilters
} from './types';

// =====================================================
// FETCH ALL RECURRING TRANSACTIONS
// =====================================================

export async function fetchRecurringTransactions(
  filters?: RecurringTransactionFilters
): Promise<RecurringTransactionWithRelations[]> {
  let query = supabase
    .from('recurring_transactions')
    .select(
      `
      *,
      category:categories(*),
      account:accounts!recurring_transactions_account_id_fkey(*),
      to_account:accounts!recurring_transactions_to_account_id_fkey(*)
    `
    )
    .order('next_occurrence_date', { ascending: true });

  // Aplicar filtros
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.frequency) {
    query = query.eq('frequency', filters.frequency);
  }

  if (filters?.account_id) {
    query = query.eq('account_id', filters.account_id);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as RecurringTransactionWithRelations[];
}

// =====================================================
// FETCH SINGLE RECURRING TRANSACTION
// =====================================================

export async function fetchRecurringTransaction(
  id: string
): Promise<RecurringTransactionWithRelations> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(
      `
      *,
      category:categories(*),
      account:accounts!recurring_transactions_account_id_fkey(*),
      to_account:accounts!recurring_transactions_to_account_id_fkey(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as RecurringTransactionWithRelations;
}

// =====================================================
// FETCH ACTIVE RECURRING TRANSACTIONS
// =====================================================

export async function fetchActiveRecurringTransactions(): Promise<
  RecurringTransactionWithRelations[]
> {
  return fetchRecurringTransactions({ is_active: true });
}

// =====================================================
// FETCH RECURRING TRANSACTION HISTORY
// =====================================================

export async function fetchRecurringTransactionHistory(
  recurring_transaction_id: string
): Promise<RecurringTransactionHistory[]> {
  const { data, error } = await supabase
    .from('recurring_transaction_history')
    .select('*')
    .eq('recurring_transaction_id', recurring_transaction_id)
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data as RecurringTransactionHistory[];
}

// =====================================================
// FETCH UPCOMING RECURRING TRANSACTIONS
// =====================================================

export async function fetchUpcomingRecurringTransactions(
  daysAhead: number = 7
): Promise<RecurringTransactionWithRelations[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(
      `
      *,
      category:categories(*),
      account:accounts!recurring_transactions_account_id_fkey(*),
      to_account:accounts!recurring_transactions_to_account_id_fkey(*)
    `
    )
    .eq('is_active', true)
    .lte('next_occurrence_date', futureDate.toISOString().split('T')[0])
    .order('next_occurrence_date', { ascending: true });

  if (error) throw error;
  return data as RecurringTransactionWithRelations[];
}

// =====================================================
// COUNT ACTIVE RECURRING TRANSACTIONS
// =====================================================

export async function countActiveRecurringTransactions(): Promise<number> {
  const { count, error } = await supabase
    .from('recurring_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) throw error;
  return count || 0;
}
