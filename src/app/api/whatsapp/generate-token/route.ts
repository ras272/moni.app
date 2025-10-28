import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLinkToken } from '@/lib/whatsapp/auth/linking';

export async function POST() {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener profile_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generar token
    const { token, expiresAt } = await generateLinkToken(profile.id);

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error generating link token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
