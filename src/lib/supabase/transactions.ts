import { supabase, getCurrentProfileId } from './client';
import type {
  Transaction,
  TransactionWithRelations,
  TransactionType,
  TransactionStatus
} from '@/types/database';

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
};

export async function fetchTransactions(filters?: TransactionFilters) {
  let query = supabase
    .from('transactions')
    .select(
      `
      *,
      category:categories(*),
      account:accounts!transactions_account_id_fkey(*),
      to_account:accounts!transactions_to_account_id_fkey(*)
    `
    )
    .order('transaction_date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }
  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId);
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as TransactionWithRelations[];
}

export async function fetchTransaction(id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
      *,
      category:categories(*),
      account:accounts!transactions_account_id_fkey(*),
      to_account:accounts!transactions_to_account_id_fkey(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as TransactionWithRelations;
}

export async function createTransaction(input: {
  type: TransactionType;
  amount: number;
  currency?: string;
  description: string;
  merchant?: string;
  category_id?: string;
  account_id: string;
  to_account_id?: string;
  status?: TransactionStatus;
  notes?: string;
  receipt_url?: string;
  transaction_date: string;
}) {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      profile_id: profileId,
      type: input.type,
      amount: input.amount,
      currency: input.currency || 'PYG',
      description: input.description,
      merchant: input.merchant || null,
      category_id: input.category_id || null,
      account_id: input.account_id,
      to_account_id: input.to_account_id || null,
      status: input.status || 'completed',
      notes: input.notes || null,
      receipt_url: input.receipt_url || null,
      transaction_date: input.transaction_date
    })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(
  id: string,
  updates: Partial<{
    description: string;
    amount: number;
    category_id: string;
    account_id: string;
    merchant: string;
    notes: string;
    status: TransactionStatus;
  }>
) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
