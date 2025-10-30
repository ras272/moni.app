import { useQuery } from '@tanstack/react-query';
import {
  getPublicGroup,
  getPublicGroupParticipants,
  getPublicGroupExpenses,
  getPublicGroupDebts,
  getVisitorDebtSummary,
  type GetPublicGroupInput
} from '@/lib/actions';

// =====================================================
// QUERY KEYS
// =====================================================

export const publicGroupKeys = {
  all: ['public-group'] as const,
  group: (monitag: string, slug: string) =>
    [...publicGroupKeys.all, monitag, slug] as const,
  participants: (groupId: string) =>
    [...publicGroupKeys.all, 'participants', groupId] as const,
  expenses: (groupId: string) =>
    [...publicGroupKeys.all, 'expenses', groupId] as const,
  debts: (groupId: string) =>
    [...publicGroupKeys.all, 'debts', groupId] as const,
  visitorDebt: (groupId: string, visitorName: string) =>
    [...publicGroupKeys.all, 'visitor-debt', groupId, visitorName] as const
};

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook para obtener información de un grupo público
 *
 * @param ownerMonitag - @monitag del owner
 * @param groupSlug - Slug del grupo
 * @returns Query con información del grupo
 */
export function usePublicGroup(ownerMonitag: string, groupSlug: string) {
  return useQuery({
    queryKey: publicGroupKeys.group(ownerMonitag, groupSlug),
    queryFn: async () => {
      const input: GetPublicGroupInput = {
        ownerMonitag,
        groupSlug
      };

      const result = await getPublicGroup(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

/**
 * Hook para obtener participantes de un grupo público
 *
 * @param groupId - ID del grupo
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query con lista de participantes
 */
export function usePublicGroupParticipants(
  groupId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: publicGroupKeys.participants(groupId),
    queryFn: async () => {
      const result = await getPublicGroupParticipants(groupId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

/**
 * Hook para obtener gastos de un grupo público
 *
 * @param groupId - ID del grupo
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query con lista de gastos
 */
export function usePublicGroupExpenses(
  groupId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: publicGroupKeys.expenses(groupId),
    queryFn: async () => {
      const result = await getPublicGroupExpenses(groupId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled,
    staleTime: 30 * 1000, // 30 segundos (más frecuente porque puede cambiar)
    gcTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });
}

/**
 * Hook para obtener deudas de un grupo público
 *
 * @param groupId - ID del grupo
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query con lista de deudas
 */
export function usePublicGroupDebts(groupId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: publicGroupKeys.debts(groupId),
    queryFn: async () => {
      const result = await getPublicGroupDebts(groupId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });
}

/**
 * Hook para obtener resumen de deuda de un visitante
 *
 * @param groupId - ID del grupo
 * @param visitorName - Nombre del visitante
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query con resumen de deuda
 */
export function useVisitorDebtSummary(
  groupId: string,
  visitorName: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: publicGroupKeys.visitorDebt(groupId, visitorName),
    queryFn: async () => {
      const result = await getVisitorDebtSummary(groupId, visitorName);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && visitorName.trim().length > 0,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });
}

/**
 * Hook combinado para vista pública completa
 * Obtiene toda la información necesaria para la página pública
 *
 * @param ownerMonitag - @monitag del owner
 * @param groupSlug - Slug del grupo
 * @param visitorName - Nombre del visitante (opcional)
 * @returns Objeto con todas las queries
 */
export function usePublicGroupFullView(
  ownerMonitag: string,
  groupSlug: string,
  visitorName?: string
) {
  const group = usePublicGroup(ownerMonitag, groupSlug);
  const groupId = group.data?.group_id;

  // Queries dependientes (solo si tenemos groupId)
  const participants = usePublicGroupParticipants(groupId ?? '', !!groupId);
  const expenses = usePublicGroupExpenses(groupId ?? '', !!groupId);
  const debts = usePublicGroupDebts(groupId ?? '', !!groupId);
  const visitorDebt = useVisitorDebtSummary(
    groupId ?? '',
    visitorName ?? '',
    !!groupId && !!visitorName
  );

  return {
    // Información del grupo
    group: group.data,
    isLoadingGroup: group.isLoading,
    groupError: group.error?.message,

    // Participantes
    participants: participants.data ?? [],
    isLoadingParticipants: participants.isLoading,
    participantsError: participants.error?.message,

    // Gastos
    expenses: expenses.data ?? [],
    isLoadingExpenses: expenses.isLoading,
    expensesError: expenses.error?.message,

    // Deudas
    debts: debts.data ?? [],
    isLoadingDebts: debts.isLoading,
    debtsError: debts.error?.message,

    // Deuda del visitante
    visitorDebt: visitorDebt.data,
    isLoadingVisitorDebt: visitorDebt.isLoading,
    visitorDebtError: visitorDebt.error?.message,

    // Estados combinados
    isLoading:
      group.isLoading ||
      participants.isLoading ||
      expenses.isLoading ||
      debts.isLoading,
    hasError: !!(
      group.error ||
      participants.error ||
      expenses.error ||
      debts.error
    ),
    isEmpty: !group.isLoading && !group.data
  };
}
