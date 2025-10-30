import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addParticipantByMonitag,
  addParticipantManual,
  removeParticipant,
  type AddParticipantByMonitagInput
} from '@/lib/actions';
import { toast } from 'sonner';

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook para agregar participante por @monitag
 *
 * @returns Mutation para agregar participante
 */
export function useAddParticipantByMonitag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddParticipantByMonitagInput) => {
      const result = await addParticipantByMonitag(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con el grupo
      queryClient.invalidateQueries({
        queryKey: ['money-tag-groups', variables.groupId]
      });

      queryClient.invalidateQueries({
        queryKey: ['group-participants', variables.groupId]
      });

      toast.success('Participante agregado', {
        description: `${data.name} fue agregado al grupo`
      });
    },
    onError: (error: Error) => {
      toast.error('Error al agregar participante', {
        description: error.message
      });
    }
  });
}

/**
 * Hook para agregar participante manual (sin cuenta)
 *
 * @returns Mutation para agregar participante manual
 */
export function useAddParticipantManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      phone
    }: {
      groupId: string;
      name: string;
      phone?: string;
    }) => {
      const result = await addParticipantManual(groupId, name, phone);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con el grupo
      queryClient.invalidateQueries({
        queryKey: ['money-tag-groups', variables.groupId]
      });

      queryClient.invalidateQueries({
        queryKey: ['group-participants', variables.groupId]
      });

      toast.success('Participante agregado', {
        description: `${data.name} fue agregado al grupo`
      });
    },
    onError: (error: Error) => {
      toast.error('Error al agregar participante', {
        description: error.message
      });
    }
  });
}

/**
 * Hook para remover participante
 *
 * @returns Mutation para remover participante
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      participantId
    }: {
      groupId: string;
      participantId: string;
    }) => {
      const result = await removeParticipant(groupId, participantId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas con el grupo
      queryClient.invalidateQueries({
        queryKey: ['money-tag-groups', variables.groupId]
      });

      queryClient.invalidateQueries({
        queryKey: ['group-participants', variables.groupId]
      });

      toast.success('Participante removido', {
        description: 'El participante fue removido del grupo'
      });
    },
    onError: (error: Error) => {
      toast.error('Error al remover participante', {
        description: error.message
      });
    }
  });
}

/**
 * Hook combinado para gestión de participantes
 * Útil para componentes que necesitan todas las operaciones
 *
 * @returns Objeto con todas las mutations
 */
export function useGroupParticipantManagement() {
  const addByMonitag = useAddParticipantByMonitag();
  const addManual = useAddParticipantManual();
  const remove = useRemoveParticipant();

  return {
    // Agregar por @monitag
    addByMonitag: addByMonitag.mutate,
    addByMonitagAsync: addByMonitag.mutateAsync,
    isAddingByMonitag: addByMonitag.isPending,
    addByMonitagError: addByMonitag.error?.message,

    // Agregar manual
    addManual: addManual.mutate,
    addManualAsync: addManual.mutateAsync,
    isAddingManual: addManual.isPending,
    addManualError: addManual.error?.message,

    // Remover
    remove: remove.mutate,
    removeAsync: remove.mutateAsync,
    isRemoving: remove.isPending,
    removeError: remove.error?.message,

    // Estados combinados
    isAdding: addByMonitag.isPending || addManual.isPending,
    hasError: !!(addByMonitag.error || addManual.error || remove.error)
  };
}
