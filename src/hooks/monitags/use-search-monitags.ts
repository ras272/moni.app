import { useQuery, useMutation } from '@tanstack/react-query';
import {
  searchMonitags,
  suggestMonitags,
  type SearchMonitagsInput,
  type SuggestMonitagsInput,
  type MonitagSearchResult
} from '@/lib/actions';
import { useDebounce } from '@/hooks/use-debounce';

// =====================================================
// QUERY KEYS
// =====================================================

export const searchKeys = {
  all: ['monitag-search'] as const,
  search: (query: string) => [...searchKeys.all, query] as const,
  suggestions: (tag: string) => [...searchKeys.all, 'suggestions', tag] as const
};

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook para buscar @monitags con debounce
 *
 * @param query - Query de búsqueda
 * @param limit - Límite de resultados (default: 10)
 * @param debounceMs - Milliseconds de debounce (default: 300)
 * @returns Query con resultados de búsqueda
 */
export function useSearchMonitags(
  query: string,
  limit: number = 10,
  debounceMs: number = 300
) {
  // Debounce del query para evitar búsquedas excesivas
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: searchKeys.search(debouncedQuery),
    queryFn: async () => {
      const input: SearchMonitagsInput = {
        query: debouncedQuery,
        limit
      };

      const result = await searchMonitags(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: debouncedQuery.length >= 2, // Solo buscar con 2+ chars
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 60 * 1000, // 1 minuto
    retry: 1
  });
}

/**
 * Hook para obtener sugerencias de @monitags
 *
 * @param desiredTag - @monitag deseado
 * @param limit - Límite de sugerencias (default: 5)
 * @returns Query con lista de sugerencias
 */
export function useSuggestMonitags(desiredTag: string, limit: number = 5) {
  return useQuery({
    queryKey: searchKeys.suggestions(desiredTag),
    queryFn: async () => {
      const input: SuggestMonitagsInput = {
        desiredTag,
        limit
      };

      const result = await suggestMonitags(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: desiredTag.length >= 3, // Solo sugerir con 3+ chars
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 2 * 60 * 1000, // 2 minutos
    retry: 1
  });
}

/**
 * Hook combinado para búsqueda con sugerencias
 * Útil para componentes de búsqueda complejos
 *
 * @param query - Query de búsqueda
 * @returns Objeto con resultados y sugerencias
 */
export function useSmartMonitagSearch(query: string) {
  const searchResults = useSearchMonitags(query);

  // Si no hay resultados, obtener sugerencias
  const shouldSuggest =
    !searchResults.isLoading &&
    searchResults.data?.length === 0 &&
    query.length >= 3;

  const suggestions = useSuggestMonitags(query, 5);

  return {
    // Resultados de búsqueda
    results: searchResults.data ?? [],
    isSearching: searchResults.isLoading,
    searchError: searchResults.error?.message,

    // Sugerencias (solo si no hay resultados)
    suggestions: shouldSuggest ? (suggestions.data ?? []) : [],
    isSuggesting: shouldSuggest && suggestions.isLoading,

    // Estados combinados
    isEmpty:
      !searchResults.isLoading && (searchResults.data?.length ?? 0) === 0,
    hasResults: (searchResults.data?.length ?? 0) > 0
  };
}
