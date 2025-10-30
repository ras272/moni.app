import { z } from 'zod';

// =====================================================
// REGEX PATTERNS
// =====================================================

/**
 * Regex para validar formato de @monitag
 * - 3-20 caracteres
 * - Solo lowercase, números y guiones bajos
 * - No puede empezar ni terminar con guión bajo
 * - No puede tener guiones bajos consecutivos
 */
export const MONITAG_REGEX = /^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/;

/**
 * Palabras reservadas (misma lista que en SQL)
 */
export const RESERVED_MONITAGS = [
  'admin',
  'administrator',
  'moni',
  'monitag',
  'moneytag',
  'support',
  'help',
  'api',
  'app',
  'www',
  'root',
  'system',
  'moderator',
  'mod',
  'official',
  'staff',
  'team',
  'bot',
  'null',
  'undefined',
  'test',
  'demo'
] as const;

// =====================================================
// ZOD SCHEMAS
// =====================================================

/**
 * Schema base para @monitag
 */
export const monitagSchema = z
  .string()
  .min(3, '@monitag debe tener al menos 3 caracteres (a-z, 0-9, _)')
  .max(20, '@monitag debe tener máximo 20 caracteres')
  .regex(
    MONITAG_REGEX,
    '@monitag inválido: debe tener 3-20 caracteres (a-z, 0-9, _), no puede empezar/terminar con _ ni tener __ consecutivos'
  )
  .refine((val) => !RESERVED_MONITAGS.includes(val as any), {
    message: 'Este @monitag está reservado por el sistema'
  })
  .refine((val) => !val.includes('__'), {
    message: '@monitag no puede contener guiones bajos consecutivos (__)'
  })
  .transform((val) => val.toLowerCase().trim());

/**
 * Schema para input de búsqueda (más permisivo)
 */
export const monitagSearchSchema = z
  .string()
  .min(1, 'Ingresa al menos 1 carácter')
  .max(30, 'Búsqueda demasiado larga')
  .transform((val) => val.toLowerCase().trim().replace(/^@/, ''));

/**
 * Schema para slug de grupo
 */
export const groupSlugSchema = z
  .string()
  .min(3, 'Slug debe tener al menos 3 caracteres')
  .max(50, 'Slug debe tener máximo 50 caracteres')
  .regex(
    /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/,
    'Slug solo puede contener lowercase, números y guiones'
  )
  .refine((val) => !val.includes('--'), {
    message: 'Slug no puede tener guiones consecutivos'
  });

// =====================================================
// REQUEST/RESPONSE SCHEMAS
// =====================================================

/**
 * Schema para crear @monitag
 */
export const createMonitagSchema = z.object({
  monitag: monitagSchema
});

export type CreateMonitagInput = z.infer<typeof createMonitagSchema>;

/**
 * Schema para buscar @monitags
 */
export const searchMonitagsSchema = z.object({
  query: monitagSearchSchema,
  limit: z.number().int().min(1).max(50).default(10)
});

export type SearchMonitagsInput = z.infer<typeof searchMonitagsSchema>;

/**
 * Schema para validar disponibilidad
 */
export const checkMonitagAvailabilitySchema = z.object({
  monitag: monitagSchema
});

export type CheckMonitagAvailabilityInput = z.infer<
  typeof checkMonitagAvailabilitySchema
>;

/**
 * Schema para sugerir @monitags
 */
export const suggestMonitagsSchema = z.object({
  desiredTag: z.string().min(1).max(20),
  limit: z.number().int().min(1).max(10).default(5)
});

export type SuggestMonitagsInput = z.infer<typeof suggestMonitagsSchema>;

/**
 * Schema para obtener grupo público
 */
export const getPublicGroupSchema = z.object({
  ownerMonitag: z
    .string()
    .transform((val) => val.replace(/^@/, ''))
    .pipe(monitagSchema),
  groupSlug: groupSlugSchema
});

export type GetPublicGroupInput = z.infer<typeof getPublicGroupSchema>;

/**
 * Schema para agregar participante por @monitag
 */
export const addParticipantByMonitagSchema = z.object({
  groupId: z.string().uuid('ID de grupo inválido'),
  monitag: monitagSchema
});

export type AddParticipantByMonitagInput = z.infer<
  typeof addParticipantByMonitagSchema
>;

// =====================================================
// RESPONSE TYPES (para uso en cliente)
// =====================================================

/**
 * Response de validación de disponibilidad
 */
export const monitagAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  reserved: z.boolean(),
  suggestions: z.array(z.string()).optional()
});

export type MonitagAvailabilityResponse = z.infer<
  typeof monitagAvailabilityResponseSchema
>;

/**
 * Response de búsqueda de @monitags
 */
export const monitagSearchResultSchema = z.object({
  profile_id: z.string().uuid(),
  monitag: z.string(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  similarity: z.number().min(0).max(1)
});

export type MonitagSearchResult = z.infer<typeof monitagSearchResultSchema>;

/**
 * Response de grupo público
 */
export const publicGroupInfoSchema = z.object({
  group_id: z.string().uuid(),
  group_name: z.string(),
  group_description: z.string().nullable(),
  is_settled: z.boolean(),
  owner_name: z.string(),
  owner_avatar: z.string().nullable(),
  created_at: z.string()
});

export type PublicGroupInfo = z.infer<typeof publicGroupInfoSchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Valida si un @monitag tiene formato correcto (solo formato, no disponibilidad)
 */
export function isValidMonitagFormat(monitag: string): boolean {
  try {
    monitagSchema.parse(monitag);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida si un @monitag está en la lista de reservados
 */
export function isReservedMonitag(monitag: string): boolean {
  return RESERVED_MONITAGS.includes(
    monitag.toLowerCase() as (typeof RESERVED_MONITAGS)[number]
  );
}

/**
 * Limpia un @monitag removiendo @ y espacios
 */
export function cleanMonitag(input: string): string {
  return input.toLowerCase().trim().replace(/^@/, '');
}

/**
 * Formatea un @monitag para display (agrega @)
 */
export function formatMonitag(monitag: string): string {
  return `@${cleanMonitag(monitag)}`;
}

/**
 * Obtiene los errores de validación de un @monitag
 */
export function getMonitagErrors(monitag: string): string[] {
  const result = monitagSchema.safeParse(monitag);

  if (result.success) {
    return [];
  }

  return result.error.issues.map((err) => err.message);
}
