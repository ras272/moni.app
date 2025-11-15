import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecurringTransaction } from '@/lib/supabase/recurring-transactions';

export function useDeleteRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringTransaction(id),
    onSuccess: (_, id) => {
      // Remover de cache
      queryClient.removeQueries({
        queryKey: ['recurring-transactions', id]
      });
      // Invalidar lista
      queryClient.invalidateQueries({
        queryKey: ['recurring-transactions']
      });
    }
  });
}
