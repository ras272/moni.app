import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAccount } from '@/lib/supabase/accounts';
import type { AccountType } from '@/types/database';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      type: AccountType;
      institution?: string;
      currency?: string;
      initial_balance?: number;
      color?: string;
      icon?: string;
    }) => createAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
