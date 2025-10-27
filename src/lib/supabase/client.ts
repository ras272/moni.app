import { createBrowserClient } from '@supabase/ssr';

// Configuración del cliente de Supabase
// Para Next.js App Router con SSR, usamos createBrowserClient

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Cliente de Supabase para uso en componentes cliente (Client Components)
 * Usa @supabase/ssr para manejar cookies correctamente en Next.js
 * La sesión se sincroniza automáticamente desde las cookies del navegador
 * RLS se encarga de la seguridad a nivel de base de datos
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper para obtener el usuario actual
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
}

/**
 * Helper para obtener el perfil del usuario actual
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (error) {
    console.error('Error getting current profile:', error);
    return null;
  }

  return data;
}

/**
 * Helper para obtener el profile_id del usuario autenticado
 * CRÍTICO: Usado para inserts en otras tablas que requieren profile_id
 */
export async function getCurrentProfileId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (error) {
    console.error('Error getting current profile id:', error);
    return null;
  }

  return data?.id || null;
}
