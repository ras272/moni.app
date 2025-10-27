import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCategory } from '@/lib/supabase/categories';

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: { name?: string; icon?: string; color?: string };
    }) => updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
}
