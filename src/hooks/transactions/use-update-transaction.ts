import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTransaction } from '@/lib/supabase/transactions';
import type { TransactionStatus } from '@/types/database';

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<{
        description: string;
        amount: number;
        category_id: string;
        account_id: string;
        merchant: string;
        notes: string;
        status: TransactionStatus;
      }>;
    }) => updateTransaction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
