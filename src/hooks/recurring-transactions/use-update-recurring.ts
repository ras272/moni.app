import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateRecurringTransaction,
  type UpdateRecurringTransactionInput
} from '@/lib/supabase/recurring-transactions';

export function useUpdateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: UpdateRecurringTransactionInput;
    }) => updateRecurringTransaction(id, updates),
    onSuccess: (_, variables) => {
      // Invalidar la recurrencia específica
      queryClient.invalidateQueries({
        queryKey: ['recurring-transactions', variables.id]
      });
      // Invalidar la lista completa
      queryClient.invalidateQueries({
        queryKey: ['recurring-transactions']
      });
    }
  });
}
