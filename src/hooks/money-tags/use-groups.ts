import { useQuery } from '@tanstack/react-query';
import { fetchGroups, fetchGroup } from '@/lib/supabase/money-tags';

export function useGroups() {
  return useQuery({
    queryKey: ['money-tag-groups'],
    queryFn: () => fetchGroups()
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['money-tag-groups', groupId],
    queryFn: () => fetchGroup(groupId),
    enabled: !!groupId
  });
}
