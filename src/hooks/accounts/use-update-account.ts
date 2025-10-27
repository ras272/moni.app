import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccount } from '@/lib/supabase/accounts';
import type { AccountType } from '@/types/database';

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: {
        name?: string;
        type?: AccountType;
        institution?: string;
        color?: string;
        icon?: string;
        is_active?: boolean;
      };
    }) => updateAccount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
