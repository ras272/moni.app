/**
 * Tipos compartidos para acciones de participantes de grupo
 */

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
