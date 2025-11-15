import { useQuery } from '@tanstack/react-query';
import { fetchRecurringTransactionHistory } from '@/lib/supabase/recurring-transactions';

export function useRecurringHistory(recurringTransactionId: string) {
  return useQuery({
    queryKey: ['recurring-history', recurringTransactionId],
    queryFn: () => fetchRecurringTransactionHistory(recurringTransactionId),
    enabled: !!recurringTransactionId
  });
}
