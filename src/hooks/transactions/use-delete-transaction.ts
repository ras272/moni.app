import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTransaction } from '@/lib/supabase/transactions';

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
