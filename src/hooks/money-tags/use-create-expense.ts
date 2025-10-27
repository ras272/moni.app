import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExpense, deleteExpense } from '@/lib/supabase/money-tags';

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      group_id: string;
      description: string;
      amount: number;
      currency?: string;
      paid_by_participant_id: string;
      expense_date: string;
      split_participant_ids: string[];
    }) => createExpense(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['group-expenses', variables.group_id]
      });
      queryClient.invalidateQueries({
        queryKey: ['group-debts', variables.group_id]
      });
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expenseId,
      groupId
    }: {
      expenseId: string;
      groupId: string;
    }) => deleteExpense(expenseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['group-expenses', variables.groupId]
      });
      queryClient.invalidateQueries({
        queryKey: ['group-debts', variables.groupId]
      });
    }
  });
}
