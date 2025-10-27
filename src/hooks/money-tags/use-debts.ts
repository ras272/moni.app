import { useQuery } from '@tanstack/react-query';
import { calculateDebts } from '@/lib/supabase/money-tags';

export function useDebts(groupId: string) {
  return useQuery({
    queryKey: ['group-debts', groupId],
    queryFn: () => calculateDebts(groupId),
    enabled: !!groupId
  });
}
