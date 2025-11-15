import { useQuery } from '@tanstack/react-query';
import { fetchRecurringTransaction } from '@/lib/supabase/recurring-transactions';

export function useRecurringTransaction(id: string) {
  return useQuery({
    queryKey: ['recurring-transactions', id],
    queryFn: () => fetchRecurringTransaction(id),
    enabled: !!id
  });
}
