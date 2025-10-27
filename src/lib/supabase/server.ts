import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente de Supabase para Server Components
 * Maneja cookies automáticamente para mantener sesión
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Set cookie called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Remove cookie called from Server Component
          }
        }
      }
    }
  );
}

/**
 * Helper para obtener el usuario actual en Server Components
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Helper para obtener la sesión actual en Server Components
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session;
}
