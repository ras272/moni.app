import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createGroup,
  updateGroup,
  deleteGroup
} from '@/lib/supabase/money-tags';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      participant_ids?: string[];
      external_participants?: { name: string; phone?: string }[];
    }) => createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-tag-groups'] });
    }
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: {
        name?: string;
        description?: string;
        is_settled?: boolean;
      };
    }) => updateGroup(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['money-tag-groups'] });
      queryClient.invalidateQueries({
        queryKey: ['money-tag-groups', variables.id]
      });
    }
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-tag-groups'] });
    }
  });
}
