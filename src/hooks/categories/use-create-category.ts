import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '@/lib/supabase/categories';
import type { CategoryType } from '@/types/database';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      icon: string;
      color?: string;
      type?: CategoryType;
    }) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
}
