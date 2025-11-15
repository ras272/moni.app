import { useQuery } from '@tanstack/react-query';
import { fetchUpcomingRecurringTransactions } from '@/lib/supabase/recurring-transactions';

export function useUpcomingRecurring(daysAhead: number = 7) {
  return useQuery({
    queryKey: ['recurring-transactions', 'upcoming', daysAhead],
    queryFn: () => fetchUpcomingRecurringTransactions(daysAhead)
  });
}
