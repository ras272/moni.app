import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from '@/lib/supabase/accounts';

export function useAccounts(includeInactive = false) {
  return useQuery({
    queryKey: ['accounts', includeInactive],
    queryFn: () => fetchAccounts(includeInactive)
  });
}
