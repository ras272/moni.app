import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRecurringTransaction,
  type CreateRecurringTransactionInput
} from '@/lib/supabase/recurring-transactions';

export function useCreateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecurringTransactionInput) =>
      createRecurringTransaction(input),
    onSuccess: () => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({
        queryKey: ['recurring-transactions']
      });
    }
  });
}
