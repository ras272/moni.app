import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Landing page - Redirect optimizado
 * Redirige a dashboard si está autenticado, a sign-in si no
 */
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  redirect('/dashboard/overview');
}
