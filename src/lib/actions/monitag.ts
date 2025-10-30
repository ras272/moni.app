'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createMonitagSchema,
  checkMonitagAvailabilitySchema,
  searchMonitagsSchema,
  suggestMonitagsSchema,
  type CreateMonitagInput,
  type CheckMonitagAvailabilityInput,
  type SearchMonitagsInput,
  type SuggestMonitagsInput,
  type MonitagAvailabilityResponse,
  type MonitagSearchResult
} from '@/lib/validations/monitag';
import { z } from 'zod';

// =====================================================
// RESPONSE TYPES
// =====================================================

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =====================================================
// CREATE MONITAG
// =====================================================

/**
 * Crea un @monitag para el usuario autenticado
 *
 * @throws Error si el usuario no está autenticado
 * @throws Error si el usuario ya tiene un @monitag
 * @throws Error si el @monitag no está disponible
 *
 * @returns Promise con el @monitag creado o error
 */
export async function createMonitag(
  input: CreateMonitagInput
): Promise<ActionResponse<{ monitag: string }>> {
  try {
    // Limpiar y validar input
    const cleanedInput = {
      monitag: input.monitag
        .toLowerCase()
        .trim()
        .replace(/^@+/, '')
        .replace(/[^a-z0-9_]/g, '')
    };

    console.log('[DEBUG] Input original:', input.monitag);
    console.log('[DEBUG] Input limpio:', cleanedInput.monitag);
    console.log('[DEBUG] Longitud:', cleanedInput.monitag.length);
    console.log('[DEBUG] Tiene __?:', cleanedInput.monitag.includes('__'));
    console.log('[DEBUG] Empieza con _?:', cleanedInput.monitag[0] === '_');
    console.log(
      '[DEBUG] Termina con _?:',
      cleanedInput.monitag[cleanedInput.monitag.length - 1] === '_'
    );

    const validated = createMonitagSchema.parse(cleanedInput);
    const { monitag } = validated;

    console.log('[DEBUG] Monitag validado:', monitag);

    // Obtener cliente y usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear un @monitag'
      };
    }

    // Obtener profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, monitag')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'No se encontró tu perfil'
      };
    }

    // Verificar que no tenga monitag ya
    if (profile.monitag) {
      return {
        success: false,
        error: 'Ya tienes un @monitag creado. No se puede cambiar.'
      };
    }

    // Verificar disponibilidad (doble check, también está en constraint)
    const { data: isAvailable } = await supabase.rpc('is_monitag_available', {
      desired_tag: monitag
    });

    if (!isAvailable) {
      return {
        success: false,
        error: 'Este @monitag no está disponible'
      };
    }

    // Crear @monitag
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ monitag })
      .eq('id', profile.id);

    if (updateError) {
      // Verificar si es error de unicidad
      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'Este @monitag fue tomado recientemente'
        };
      }

      // Verificar si es error de constraint (palabra reservada)
      if (updateError.message.includes('monitag_not_reserved')) {
        return {
          success: false,
          error: 'Este @monitag está reservado por el sistema'
        };
      }

      console.error('Error creating monitag:', updateError);
      return {
        success: false,
        error: 'Error al crear @monitag. Intenta nuevamente.'
      };
    }

    return {
      success: true,
      data: { monitag }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Formato de @monitag inválido'
      };
    }

    console.error('Unexpected error in createMonitag:', error);
    return {
      success: false,
      error: 'Error inesperado al crear @monitag'
    };
  }
}

// =====================================================
// CHECK AVAILABILITY
// =====================================================

/**
 * Verifica si un @monitag está disponible
 * Incluye sugerencias si no está disponible
 *
 * @returns Promise con disponibilidad y sugerencias
 */
export async function checkMonitagAvailability(
  input: CheckMonitagAvailabilityInput
): Promise<ActionResponse<MonitagAvailabilityResponse>> {
  try {
    // Validar input
    const validated = checkMonitagAvailabilitySchema.parse(input);
    const { monitag } = validated;

    // Obtener cliente
    const supabase = await createClient();

    // Verificar disponibilidad
    const { data: isAvailable, error: availabilityError } = await supabase.rpc(
      'is_monitag_available',
      { desired_tag: monitag }
    );

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      return {
        success: false,
        error: 'Error al verificar disponibilidad'
      };
    }

    // Verificar si está reservado
    const { data: isReserved, error: reservedError } = await supabase.rpc(
      'is_monitag_reserved',
      { tag: monitag }
    );

    if (reservedError) {
      console.error('Error checking reserved:', reservedError);
      return {
        success: false,
        error: 'Error al verificar palabra reservada'
      };
    }

    // Si no está disponible, obtener sugerencias
    let suggestions: string[] | undefined;

    if (!isAvailable) {
      const { data: suggestionsData } = await supabase.rpc('suggest_monitags', {
        desired_tag: monitag,
        limit_results: 5
      });

      suggestions = suggestionsData?.map((s: any) => s.suggestion) || [];
    }

    return {
      success: true,
      data: {
        available: isAvailable ?? false,
        reserved: isReserved ?? false,
        suggestions
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Formato de @monitag inválido'
      };
    }

    console.error('Unexpected error in checkMonitagAvailability:', error);
    return {
      success: false,
      error: 'Error inesperado al verificar disponibilidad'
    };
  }
}

// =====================================================
// SEARCH MONITAGS
// =====================================================

/**
 * Busca @monitags con fuzzy search
 *
 * @returns Promise con resultados de búsqueda
 */
export async function searchMonitags(
  input: SearchMonitagsInput
): Promise<ActionResponse<MonitagSearchResult[]>> {
  try {
    // Validar input
    const validated = searchMonitagsSchema.parse(input);
    const { query, limit } = validated;

    // Obtener cliente
    const supabase = await createClient();

    // Buscar monitags
    const { data, error } = await supabase.rpc('search_monitags', {
      search_query: query,
      limit_results: limit
    });

    if (error) {
      console.error('Error searching monitags:', error);
      return {
        success: false,
        error: 'Error al buscar @monitags'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Parámetros de búsqueda inválidos'
      };
    }

    console.error('Unexpected error in searchMonitags:', error);
    return {
      success: false,
      error: 'Error inesperado al buscar @monitags'
    };
  }
}

// =====================================================
// SUGGEST MONITAGS
// =====================================================

/**
 * Sugiere @monitags alternativos
 *
 * @returns Promise con lista de sugerencias
 */
export async function suggestMonitags(
  input: SuggestMonitagsInput
): Promise<ActionResponse<string[]>> {
  try {
    // Validar input
    const validated = suggestMonitagsSchema.parse(input);
    const { desiredTag, limit } = validated;

    // Obtener cliente
    const supabase = await createClient();

    // Obtener sugerencias
    const { data, error } = await supabase.rpc('suggest_monitags', {
      desired_tag: desiredTag,
      limit_results: limit
    });

    if (error) {
      console.error('Error suggesting monitags:', error);
      return {
        success: false,
        error: 'Error al generar sugerencias'
      };
    }

    const suggestions = data?.map((s: any) => s.suggestion) || [];

    return {
      success: true,
      data: suggestions
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Parámetros inválidos'
      };
    }

    console.error('Unexpected error in suggestMonitags:', error);
    return {
      success: false,
      error: 'Error inesperado al generar sugerencias'
    };
  }
}

// =====================================================
// GET CURRENT USER MONITAG
// =====================================================

/**
 * Obtiene el @monitag del usuario autenticado
 *
 * @returns Promise con el @monitag o null si no tiene
 */
export async function getCurrentUserMonitag(): Promise<
  ActionResponse<{ monitag: string | null }>
> {
  try {
    // Obtener cliente y usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Debes estar autenticado'
      };
    }

    // Obtener profile con monitag
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monitag')
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return {
        success: false,
        error: 'Error al obtener perfil'
      };
    }

    return {
      success: true,
      data: { monitag: profile?.monitag || null }
    };
  } catch (error) {
    console.error('Unexpected error in getCurrentUserMonitag:', error);
    return {
      success: false,
      error: 'Error inesperado'
    };
  }
}
