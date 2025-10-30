// =====================================================
// TYPES: MoniTags System (Fase 1 - Base de Datos)
// =====================================================

/**
 * Profile con @monitag
 */
export type Profile = {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  country_code: string;
  default_currency: string;
  timezone: string;
  monitag: string | null; // @monitag único (3-20 chars, lowercase, alfanumérico + _)
  created_at: string;
  updated_at: string;
};

/**
 * Resultado de búsqueda de @monitag
 */
export type MonittagSearchResult = {
  profile_id: string;
  monitag: string;
  full_name: string;
  avatar_url: string | null;
  similarity: number; // Score de similitud (0-1)
};

/**
 * Grupo público (visto desde URL pública)
 */
export type PublicGroupInfo = {
  group_id: string;
  group_name: string;
  group_description: string | null;
  is_settled: boolean;
  owner_name: string;
  owner_avatar: string | null;
  created_at: string;
};

/**
 * Log de auditoría de @monitag
 */
export type MonitagAuditLog = {
  id: string;
  profile_id: string;
  monitag: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

// =====================================================
// HELPER TYPES
// =====================================================

/**
 * Validación de @monitag
 */
export type MonitagValidation = {
  isValid: boolean;
  isAvailable: boolean;
  isReserved: boolean;
  errors: string[];
  suggestions?: string[];
};

/**
 * Estado de invitación
 */
export type InvitationStatus = 'pending' | 'accepted' | 'rejected';
