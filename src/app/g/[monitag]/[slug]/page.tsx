import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, ExternalLink, LogIn } from 'lucide-react';
import Link from 'next/link';
import { MonitagBadge, PublicGroupView } from '@/components/monitags';
import {
  getPublicGroup,
  getPublicGroupParticipants,
  getPublicGroupExpenses,
  getPublicGroupDebts
} from '@/lib/actions/public-groups';
import { joinPublicGroup } from '@/lib/actions';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ monitag: string; slug: string }>;
}

export default async function PublicGroupPage(props: PageProps) {
  const params = await props.params;
  // Decodificar URL encoding (@ se convierte en %40)
  let monitag = decodeURIComponent(params.monitag);
  const slug = decodeURIComponent(params.slug);

  // Quitar el @ si viene en el monitag
  if (monitag.startsWith('@')) {
    monitag = monitag.substring(1);
  }

  // Verificar si el usuario está autenticado
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Obtener información pública del grupo primero (para verificar que existe)
  const publicGroupResult = await getPublicGroup({
    ownerMonitag: monitag,
    groupSlug: slug
  });

  // Si el usuario está autenticado, gestionar acceso al grupo
  console.log('[AUTO-JOIN DEBUG] Usuario autenticado:', !!user);

  if (user && publicGroupResult.success) {
    const groupId = publicGroupResult.data.group_id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    console.log('[AUTO-JOIN DEBUG] Perfil encontrado:', !!profile, profile?.id);

    if (profile) {
      // Verificar si ya es participante
      const { data: participant } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('profile_id', profile.id)
        .single();

      console.log('[AUTO-JOIN DEBUG] Es participante:', !!participant);

      if (participant) {
        // Ya es participante, redirigir a la vista privada
        console.log(
          '[AUTO-JOIN DEBUG] Redirigiendo a vista privada (ya es participante)'
        );
        redirect(`/dashboard/moneytags/${groupId}`);
      } else {
        // No es participante, verificar si el grupo es público
        const { data: group } = await supabase
          .from('money_tag_groups')
          .select('is_public')
          .eq('id', groupId)
          .single();

        console.log('[AUTO-JOIN DEBUG] Grupo es público:', group?.is_public);

        if (group?.is_public) {
          // Usuario autenticado accediendo a grupo público: auto-unir
          console.log('[AUTO-JOIN DEBUG] Intentando auto-unir...');
          const joinResult = await joinPublicGroup(groupId);
          console.log(
            '[AUTO-JOIN DEBUG] Resultado de joinPublicGroup:',
            joinResult
          );

          if (joinResult.success) {
            // Unido exitosamente, redirigir a vista privada
            console.log(
              '[AUTO-JOIN DEBUG] Redirigiendo a vista privada (auto-join exitoso)'
            );
            redirect(`/dashboard/moneytags/${groupId}`);
          } else {
            console.log(
              '[AUTO-JOIN DEBUG] Error en auto-join:',
              joinResult.error
            );
          }
          // Si falla, continuar mostrando vista pública (fallback)
        } else {
          console.log(
            '[AUTO-JOIN DEBUG] Grupo no es público, mostrando vista pública'
          );
        }
      }
    }
  }

  // Verificar que el grupo existe (ya se obtuvo arriba)
  console.log('[DEBUG] Params raw:', params);
  console.log('[DEBUG] Después de decode:', { monitag, slug });
  console.log(
    '[DEBUG] Monitag length:',
    monitag.length,
    'chars:',
    monitag.split('').map((c) => c.charCodeAt(0))
  );

  console.log('[DEBUG] Resultado:', JSON.stringify(publicGroupResult, null, 2));

  if (!publicGroupResult.success || !publicGroupResult.data) {
    console.log('[DEBUG] Grupo no encontrado, llamando notFound()');
    notFound();
  }

  const group = publicGroupResult.data;
  console.log('[DEBUG] Grupo encontrado:', group);

  // Obtener owner_profile_id del grupo
  const { data: groupData } = await supabase
    .from('money_tag_groups')
    .select('owner_profile_id')
    .eq('id', group.group_id)
    .single();

  const ownerProfileId = groupData?.owner_profile_id;

  if (!ownerProfileId) {
    notFound();
  }

  // Obtener datos completos del grupo para vista pública
  const [participantsResult, expensesResult, debtsResult] = await Promise.all([
    getPublicGroupParticipants(group.group_id),
    getPublicGroupExpenses(group.group_id),
    getPublicGroupDebts(group.group_id)
  ]);

  // Si hay errores, usar arrays vacíos como fallback
  const participants = participantsResult.success
    ? participantsResult.data
    : [];
  const expenses = expensesResult.success ? expensesResult.data : [];
  const debts = debtsResult.success ? debtsResult.data : [];

  return (
    <div className='bg-muted/40 min-h-screen'>
      {/* Header simple */}
      <header className='bg-card border-b shadow-sm'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4'>
          <Link href='/' className='flex items-center gap-2'>
            <span className='text-xl font-bold'>MONI</span>
          </Link>
          {!user && (
            <div className='flex gap-2'>
              <Link href='/auth/sign-in'>
                <Button variant='ghost' size='sm'>
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href='/auth/sign-up'>
                <Button size='sm'>Crear Cuenta</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className='mx-auto max-w-7xl p-4 md:p-6'>
        {/* Info del grupo */}
        <div className='bg-card mb-6 rounded-xl border p-6 shadow-sm'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <h1 className='text-3xl font-bold'>{group.group_name}</h1>
              {group.is_settled ? (
                <Badge variant='secondary' className='gap-1.5'>
                  <CheckCircle2 className='h-3.5 w-3.5' />
                  Liquidado
                </Badge>
              ) : (
                <Badge variant='default' className='gap-1.5'>
                  <AlertCircle className='h-3.5 w-3.5' />
                  Activo
                </Badge>
              )}
            </div>

            {group.group_description && (
              <p className='text-muted-foreground text-lg'>
                {group.group_description}
              </p>
            )}

            <div className='flex items-center gap-2'>
              <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
                <span className='text-xs font-semibold'>
                  {group.owner_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <span className='text-muted-foreground text-sm'>
                Creado por {group.owner_name}
              </span>
              <MonitagBadge
                monitag={monitag.toLowerCase()}
                variant='secondary'
                size='sm'
              />
            </div>
          </div>
        </div>

        {/* Vista pública completa con gestión de invitados */}
        <PublicGroupView
          groupId={group.group_id}
          groupName={group.group_name}
          ownerProfileId={ownerProfileId}
          participants={participants}
          expenses={expenses}
          debts={debts}
        />
      </main>
    </div>
  );
}
