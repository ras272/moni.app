import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/lib/supabase/categories';
import type { CategoryType } from '@/types/database';

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => fetchCategories(type)
  });
}
