import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMonitag,
  checkMonitagAvailability,
  getCurrentUserMonitag,
  type CreateMonitagInput,
  type CheckMonitagAvailabilityInput,
  type MonitagAvailabilityResponse
} from '@/lib/actions';
import { toast } from 'sonner';

// =====================================================
// QUERY KEYS
// =====================================================

export const monitagKeys = {
  all: ['monitag'] as const,
  current: () => [...monitagKeys.all, 'current'] as const,
  availability: (monitag: string) =>
    [...monitagKeys.all, 'availability', monitag] as const
};

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook para obtener el @monitag del usuario actual
 *
 * @returns Query con el @monitag o null
 */
export function useCurrentMonitag() {
  return useQuery({
    queryKey: monitagKeys.current(),
    queryFn: async () => {
      const result = await getCurrentUserMonitag();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.monitag;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos (antes cacheTime)
  });
}

/**
 * Hook para verificar disponibilidad de un @monitag
 *
 * @param monitag - @monitag a verificar
 * @param enabled - Si la query está habilitada (default: true)
 * @returns Query con disponibilidad y sugerencias
 */
export function useMonitagAvailability(
  monitag: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: monitagKeys.availability(monitag),
    queryFn: async () => {
      const input: CheckMonitagAvailabilityInput = { monitag };
      const result = await checkMonitagAvailability(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && monitag.length >= 3, // Solo verificar si tiene 3+ chars
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 60 * 1000, // 1 minuto
    retry: 1
  });
}

/**
 * Hook para crear un @monitag
 *
 * @returns Mutation para crear @monitag
 */
export function useCreateMonitag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMonitagInput) => {
      const result = await createMonitag(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Invalidar query del monitag actual
      queryClient.invalidateQueries({
        queryKey: monitagKeys.current()
      });

      toast.success('¡@monitag creado!', {
        description: `Tu @monitag es: @${data.monitag}`
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear @monitag', {
        description: error.message
      });
    }
  });
}

/**
 * Hook combinado para crear monitag con validación en tiempo real
 *
 * @returns Objeto con query de disponibilidad y mutation de creación
 */
export function useMonitagWithValidation(monitag: string) {
  const availability = useMonitagAvailability(monitag);
  const createMutation = useCreateMonitag();

  return {
    // Disponibilidad
    isChecking: availability.isLoading,
    isAvailable: availability.data?.available ?? false,
    isReserved: availability.data?.reserved ?? false,
    suggestions: availability.data?.suggestions ?? [],
    availabilityError: availability.error?.message,

    // Creación
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message
  };
}
