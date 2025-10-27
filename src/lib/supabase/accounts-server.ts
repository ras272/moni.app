import { createClient } from './server';
import type { Account } from '@/types/database';

/**
 * Fetch accounts from server-side
 * Para usar en Server Components
 */
export async function fetchAccountsServer(includeInactive = false) {
  const supabase = await createClient();

  let query = supabase
    .from('accounts')
    .select('*')
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }

  return (data || []) as Account[];
}
