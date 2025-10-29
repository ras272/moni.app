/**
 * WhatsApp Bot - Account Linking
 * 
 * Sistema de vinculación segura entre números de WhatsApp y usuarios MONI
 * Usa JWT tokens con expiración de 15 minutos
 */

import { createClient } from '@/lib/supabase/server';
import type { WhatsAppConnection } from '../types';

// =====================================================
// GENERAR TOKEN DE VINCULACIÓN
// =====================================================

/**
 * Genera un token único de 8 caracteres para vincular WhatsApp
 * Formato: ABC12XYZ (mayúsculas y números)
 * Expira en 15 minutos
 */
export async function generateLinkToken(
  profileId: string
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = await createClient();

  // Generar token aleatorio de 8 caracteres
  const token = generateRandomToken(8);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Buscar si ya existe una conexión para este perfil
  const { data: existing } = await supabase
    .from('whatsapp_connections')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (existing) {
    // Actualizar conexión existente con nuevo token y resetear estado
    const { error } = await supabase
      .from('whatsapp_connections')
      .update({
        verification_token: token,
        token_expires_at: expiresAt.toISOString(),
        is_active: false // Resetear a false para permitir re-vinculación
      })
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error updating link token:', error);
      throw new Error('Failed to generate link token');
    }
  } else {
    // Crear nueva conexión con token
    const { error } = await supabase
      .from('whatsapp_connections')
      .insert({
        profile_id: profileId,
        phone_number: `pending_${profileId.substring(0, 8)}`, // Único temporal
        is_active: false,
        verification_token: token,
        token_expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to generate link token');
    }
  }

  return { token, expiresAt };
}

/**
 * Genera un string aleatorio alfanumérico
 */
function generateRandomToken(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin O, 0, I, 1 para evitar confusión
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// =====================================================
// VERIFICAR Y USAR TOKEN
// =====================================================

/**
 * Verifica un token de vinculación y retorna el profile_id asociado
 */
export async function verifyLinkToken(token: string): Promise<{
  valid: boolean;
  profileId?: string;
  error?: string;
}> {
  const supabase = await createClient();

  // Buscar token en la base de datos
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('profile_id, token_expires_at')
    .eq('verification_token', token)
    .eq('is_active', false) // Solo tokens no usados
    .single();

  if (error || !data) {
    return {
      valid: false,
      error: 'Token inválido o ya usado'
    };
  }

  // Verificar expiración
  const expiresAt = new Date(data.token_expires_at!);
  const now = new Date();

  if (now > expiresAt) {
    return {
      valid: false,
      error: 'Token expirado. Genera uno nuevo desde el dashboard.'
    };
  }

  return {
    valid: true,
    profileId: data.profile_id
  };
}

// =====================================================
// VINCULAR TELÉFONO A PERFIL
// =====================================================

/**
 * Vincula un número de WhatsApp a un perfil de usuario
 * Valida que el token sea correcto y no haya expirado
 */
export async function linkPhoneToProfile(
  phoneNumber: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Verificar token
  const verification = await verifyLinkToken(token);
  if (!verification.valid || !verification.profileId) {
    return {
      success: false,
      error: verification.error
    };
  }

  // 2. Verificar si el teléfono ya está vinculado a otra cuenta
  const { data: existing } = await supabase
    .from('whatsapp_connections')
    .select('id, profile_id, phone_number')
    .eq('phone_number', phoneNumber)
    .eq('is_active', true)
    .neq('phone_number', 'pending')
    .single();

  if (existing && existing.profile_id !== verification.profileId) {
    return {
      success: false,
      error: 'Este número ya está vinculado a otra cuenta MONI'
    };
  }

  // 3. Actualizar o crear conexión
  const { error } = await supabase
    .from('whatsapp_connections')
    .update({
      phone_number: phoneNumber,
      is_active: true,
      linked_at: new Date().toISOString(),
      verification_token: null,
      token_expires_at: null
    })
    .eq('profile_id', verification.profileId);

  if (error) {
    console.error('Error linking phone:', error);
    return {
      success: false,
      error: 'Error al vincular número. Intenta de nuevo.'
    };
  }

  return { success: true };
}

// =====================================================
// DESVINCULAR TELÉFONO
// =====================================================

/**
 * Desvincula el WhatsApp de un usuario
 */
export async function unlinkPhone(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('whatsapp_connections')
    .update({ is_active: false })
    .eq('profile_id', profileId);

  if (error) {
    return { success: false, error: 'Error al desvincular' };
  }

  return { success: true };
}

// =====================================================
// OBTENER CONEXIÓN POR TELÉFONO
// =====================================================

/**
 * Busca una conexión activa por número de teléfono
 */
export async function getConnectionByPhone(
  phoneNumber: string
): Promise<WhatsAppConnection | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as WhatsAppConnection;
}

// =====================================================
// OBTENER CONEXIÓN POR PROFILE ID
// =====================================================

/**
 * Busca la conexión activa de un usuario
 */
export async function getConnectionByProfileId(
  profileId: string
): Promise<WhatsAppConnection | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as WhatsAppConnection;
}

// =====================================================
// ACTUALIZAR ÚLTIMA ACTIVIDAD
// =====================================================

/**
 * Actualiza el timestamp de último mensaje
 * Útil para detectar usuarios inactivos
 */
export async function updateLastMessage(connectionId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('whatsapp_connections')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', connectionId);
}
