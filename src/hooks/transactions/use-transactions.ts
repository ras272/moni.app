import { useQuery } from '@tanstack/react-query';
import {
  fetchTransactions,
  type TransactionFilters
} from '@/lib/supabase/transactions';

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters)
  });
}
