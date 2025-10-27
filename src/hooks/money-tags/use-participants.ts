import { useQuery } from '@tanstack/react-query';
import { fetchParticipants } from '@/lib/supabase/money-tags';

export function useParticipants(groupId: string) {
  return useQuery({
    queryKey: ['group-participants', groupId],
    queryFn: () => fetchParticipants(groupId),
    enabled: !!groupId
  });
}
