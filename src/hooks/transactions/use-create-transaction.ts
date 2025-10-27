import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction } from '@/lib/supabase/transactions';
import type { TransactionType, TransactionStatus } from '@/types/database';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      type: TransactionType;
      amount: number;
      currency?: string;
      description: string;
      merchant?: string;
      category_id?: string;
      account_id: string;
      to_account_id?: string;
      status?: TransactionStatus;
      notes?: string;
      receipt_url?: string;
      transaction_date: string;
    }) => createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
