import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '@/lib/supabase/categories';

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
}
