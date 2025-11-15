import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pauseRecurringTransaction,
  resumeRecurringTransaction
} from '@/lib/supabase/recurring-transactions';

export function useToggleRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pause }: { id: string; pause: boolean }) => {
      return pause
        ? pauseRecurringTransaction(id)
        : resumeRecurringTransaction(id);
    },
    onSuccess: (_, variables) => {
      // Invalidar la recurrencia específica
      queryClient.invalidateQueries({
        queryKey: ['recurring-transactions', variables.id]
      });
      // Invalidar lista
      queryClient.invalidateQueries({
        queryKey: ['recurring-transactions']
      });
    }
  });
}
