import { createClient } from './server';
import type {
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

/**
 * Fetch transactions from server-side
 * Para usar en Server Components
 */
export async function fetchTransactionsServer(filters?: TransactionFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('transactions')
    .select(
      `
      id,
      type,
      amount,
      currency,
      description,
      merchant,
      status,
      notes,
      transaction_date,
      created_at,
      updated_at,
      category:categories(id, name, type, icon, color),
      account:accounts!transactions_account_id_fkey(id, name, type, icon),
      to_account:accounts!transactions_to_account_id_fkey(id, name, type, icon)
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

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  // Transform the data to match TransactionWithRelations type
  const transactions = (data || []).map((item: any) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] : item.category,
    account: Array.isArray(item.account) ? item.account[0] : item.account,
    to_account: Array.isArray(item.to_account)
      ? item.to_account[0]
      : item.to_account
  }));

  return transactions as TransactionWithRelations[];
}
