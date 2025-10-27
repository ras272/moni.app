import { useQuery } from '@tanstack/react-query';
import { fetchExpenses } from '@/lib/supabase/money-tags';

export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: ['group-expenses', groupId],
    queryFn: () => fetchExpenses(groupId),
    enabled: !!groupId
  });
}
