'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AuthResult = {
  error?: string;
  success?: boolean;
};

/**
 * Sign Up con Email y Password
 */
export async function signUp(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0]
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });

  if (error) {
    return { error: error.message };
  }

  // NO redirigir automáticamente, dejar que el componente maneje la UI
  return { success: true };
}

/**
 * Sign In con Email y Password
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: 'Credenciales inválidas' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Sign Out
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/sign-in');
}

/**
 * Sign In con Magic Link (email sin password)
 */
export async function signInWithMagicLink(
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email es requerido' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Reset Password Request
 */
export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email es requerido' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
