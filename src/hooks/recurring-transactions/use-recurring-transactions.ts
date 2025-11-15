import { useQuery } from '@tanstack/react-query';
import {
  fetchRecurringTransactions,
  type RecurringTransactionFilters
} from '@/lib/supabase/recurring-transactions';

export function useRecurringTransactions(
  filters?: RecurringTransactionFilters
) {
  return useQuery({
    queryKey: ['recurring-transactions', filters],
    queryFn: () => fetchRecurringTransactions(filters)
  });
}
