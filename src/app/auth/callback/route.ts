import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/auth/verified';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirigir a página de verificación exitosa
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Si hay error, redirigir a login con mensaje de error
  return NextResponse.redirect(
    new URL('/auth/sign-in?error=auth_callback_error', request.url)
  );
}
