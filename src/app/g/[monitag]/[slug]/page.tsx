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
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ monitag: string; slug: string }>;
}

export default async function PublicGroupPage(props: PageProps) {
  const params = await props.params;
  // Decodificar URL encoding (@ se convierte en %40)
  const monitag = decodeURIComponent(params.monitag);
  const slug = decodeURIComponent(params.slug);

  // Verificar si el usuario está autenticado
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Si el usuario está autenticado, intentar redirigir a su vista del grupo
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profile) {
      // Buscar si el grupo existe y si el usuario es participante
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('monitag', monitag.toLowerCase())
        .single();

      if (ownerProfile) {
        const { data: group } = await supabase
          .from('money_tag_groups')
          .select('id')
          .eq('slug', slug)
          .eq('owner_profile_id', ownerProfile.id)
          .single();

        if (group) {
          // Verificar si es participante
          const { data: participant } = await supabase
            .from('group_participants')
            .select('id')
            .eq('group_id', group.id)
            .eq('profile_id', profile.id)
            .single();

          if (participant) {
            // Redirigir a la vista privada del grupo
            redirect(`/dashboard/moneytags/${group.id}`);
          }
        }
      }
    }
  }

  // Obtener información pública del grupo
  console.log('[DEBUG] Params raw:', params);
  console.log('[DEBUG] Después de decode:', { monitag, slug });
  console.log(
    '[DEBUG] Monitag length:',
    monitag.length,
    'chars:',
    monitag.split('').map((c) => c.charCodeAt(0))
  );

  const result = await getPublicGroup({
    ownerMonitag: monitag,
    groupSlug: slug
  });

  console.log('[DEBUG] Resultado:', JSON.stringify(result, null, 2));

  if (!result.success || !result.data) {
    console.log('[DEBUG] Grupo no encontrado, llamando notFound()');
    notFound();
  }

  const group = result.data;
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
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900'>
      <div className='mx-auto max-w-7xl px-4 py-12'>
        {/* Header con branding */}
        <div className='mb-8 text-center'>
          <Link href='/'>
            <h1 className='mb-2 text-3xl font-bold text-green-700 dark:text-green-400'>
              MONI
            </h1>
          </Link>
          <p className='text-muted-foreground text-sm'>
            Gestión de gastos compartidos
          </p>
        </div>

        {/* Card principal del grupo */}
        <Card className='mb-6 shadow-xl'>
          <CardHeader className='space-y-4'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div className='flex-1 space-y-2'>
                <div className='flex flex-wrap items-center gap-3'>
                  <h2 className='text-2xl font-bold sm:text-3xl'>
                    {group.group_name}
                  </h2>
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
                  <p className='text-muted-foreground'>
                    {group.group_description}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Información del creador */}
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full'>
                <span className='text-primary text-lg font-semibold'>
                  {group.owner_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Creado por
                </p>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold'>{group.owner_name}</p>
                  <MonitagBadge
                    monitag={monitag.toLowerCase()}
                    variant='secondary'
                    size='sm'
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          {/* CTA para usuarios no autenticados dentro del card */}
          {!user && (
            <CardContent>
              <div className='rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-6 dark:from-green-950/20 dark:to-emerald-950/20'>
                <h3 className='mb-2 flex items-center gap-2 text-lg font-semibold'>
                  <LogIn className='h-5 w-5' />
                  ¿Ya tenés cuenta en MONI?
                </h3>
                <p className='text-muted-foreground mb-4 text-sm'>
                  Iniciá sesión para ver este grupo en tu dashboard y recibir
                  notificaciones.
                </p>
                <div className='flex flex-wrap gap-3'>
                  <Link href='/auth/sign-in'>
                    <Button className='gap-2'>
                      <LogIn className='h-4 w-4' />
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href='/auth/sign-up'>
                    <Button variant='outline' className='gap-2'>
                      Crear Cuenta
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Vista pública completa con gestión de invitados */}
        <PublicGroupView
          groupId={group.group_id}
          groupName={group.group_name}
          ownerProfileId={ownerProfileId}
          participants={participants}
          expenses={expenses}
          debts={debts}
        />

        {/* Footer info */}
        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-xs'>
            Este grupo fue creado con{' '}
            <Link
              href='/'
              className='font-semibold text-green-700 hover:underline dark:text-green-400'
            >
              MONI
            </Link>{' '}
            · Gestión de gastos compartidos
          </p>
        </div>
      </div>
    </div>
  );
}
