import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrencyPY } from '@/lib/utils';
import { ArrowLeft, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddExpenseDialog } from '../components/add-expense-dialog';
import { AddParticipantDialog } from '../components/add-participant-dialog';
import { SettleDebtDialog } from '../components/settle-debt-dialog';
import {
  fetchMoneyTagGroupByIdServer,
  fetchGroupExpensesServer,
  calculateGroupDebtsServer
} from '@/lib/supabase/moneytags-server';
import { createClient } from '@/lib/supabase/server';
import { ShareGroupLink } from '@/components/monitags';

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage(props: PageProps) {
  const params = await props.params;

  // Fetch all data with Server-Side functions
  const group = await fetchMoneyTagGroupByIdServer(params.groupId);

  if (!group) {
    notFound();
  }

  const expenses = await fetchGroupExpensesServer(params.groupId);
  const debts = await calculateGroupDebtsServer(params.groupId);

  // Calculate total spent
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get current user profile to check ownership
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let isOwner = false;
  let currentUserParticipantId: string | undefined;
  let ownerMonitag: string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profile) {
      isOwner = profile.id === group.owner_profile_id;

      // Find current user's participant ID in this group
      const currentParticipant = group.participants?.find(
        (p: any) => p.profile_id === profile.id
      );
      currentUserParticipantId = currentParticipant?.id;
    }

    // Get owner's monitag if group is public
    if (group.is_public) {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('monitag')
        .eq('id', group.owner_profile_id)
        .single();

      ownerMonitag = ownerProfile?.monitag || undefined;
    }
  }

  return (
    <PageContainer scrollable>
      <div className='mx-auto w-full max-w-7xl space-y-4 px-4 sm:space-y-6 sm:px-6'>
        {/* Header */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4'>
          <Link href='/dashboard/moneytags'>
            <Button
              variant='ghost'
              size='icon'
              className='h-9 w-9 sm:h-10 sm:w-10'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div className='flex-1 space-y-2 sm:space-y-1'>
            <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
              <h1 className='text-xl font-bold tracking-tight sm:text-2xl md:text-3xl'>
                {group.name}
              </h1>
              {group.is_settled ? (
                <Badge variant='secondary' className='gap-1 text-xs sm:gap-1.5'>
                  <CheckCircle2 className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                  Liquidado
                </Badge>
              ) : (
                <Badge variant='default' className='gap-1 text-xs sm:gap-1.5'>
                  <AlertCircle className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                  Activo
                </Badge>
              )}
            </div>
            {group.description && (
              <p className='text-muted-foreground text-xs sm:text-sm'>
                {group.description}
              </p>
            )}
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />
              <span className='text-muted-foreground text-xs sm:text-sm'>
                {group.participant_count} participante(s)
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Share Link si el grupo es público */}
        {group.is_public && ownerMonitag && group.slug && (
          <ShareGroupLink
            ownerMonitag={ownerMonitag}
            groupSlug={group.slug}
            groupName={group.name}
          />
        )}

        {/* Grid Layout: Gastos | Deudas | Participantes */}
        <div className='grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {/* Columna 1: Gastos */}
          <Card className='md:col-span-2 xl:col-span-1'>
            <CardHeader className='p-4 sm:p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle className='text-base sm:text-lg'>
                    Gastos del Grupo
                  </CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    {expenses.length} gasto(s) registrado(s)
                  </CardDescription>
                </div>
                <AddExpenseDialog
                  groupId={group.id}
                  participants={group.participants || []}
                />
              </div>
            </CardHeader>
            <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
              <div className='bg-muted/50 mb-4 rounded-lg border p-3 sm:p-4'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  Total Gastado
                </p>
                <p className='mt-1 text-2xl font-bold sm:text-3xl'>
                  {formatCurrencyPY(totalSpent)}
                </p>
              </div>

              {expenses.length === 0 ? (
                <div className='flex min-h-[150px] items-center justify-center rounded-lg border border-dashed sm:min-h-[200px]'>
                  <div className='text-center'>
                    <p className='text-muted-foreground text-xs sm:text-sm'>
                      No hay gastos registrados
                    </p>
                    <p className='text-muted-foreground mt-1 text-[10px] sm:text-xs'>
                      Agrega el primer gasto del grupo
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-2 sm:space-y-3'>
                  {expenses.map((expense: any) => (
                    <div
                      key={expense.id}
                      className='flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3'
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium sm:text-base'>
                          {expense.description}
                        </p>
                        <div className='mt-1 space-y-0.5'>
                          <p className='text-muted-foreground text-[10px] sm:text-xs'>
                            Pagado por{' '}
                            <span className='font-medium'>
                              {expense.paid_by?.name || 'Desconocido'}
                            </span>
                          </p>
                          <p className='text-muted-foreground text-[10px] sm:text-xs'>
                            Dividido entre {expense.splits?.length || 0}{' '}
                            persona(s)
                          </p>
                          <p className='text-muted-foreground text-[10px] sm:text-xs'>
                            {new Date(expense.expense_date).toLocaleDateString(
                              'es-PY'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-baseline justify-between border-t pt-2 sm:block sm:border-t-0 sm:pt-0 sm:text-right'>
                        <span className='text-muted-foreground text-xs sm:hidden'>
                          Total:
                        </span>
                        <p className='text-base font-bold sm:text-lg'>
                          {formatCurrencyPY(expense.amount)}
                        </p>
                        <p className='text-muted-foreground text-[10px] sm:mt-1 sm:text-xs'>
                          {formatCurrencyPY(
                            expense.splits?.length
                              ? expense.amount / expense.splits.length
                              : expense.amount
                          )}{' '}
                          c/u
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Columna 2: Deudas */}
          <Card className='md:col-span-1 xl:col-span-1'>
            <CardHeader className='p-4 sm:p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle className='text-base sm:text-lg'>
                    ¿Quién debe a quién?
                  </CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Resumen de deudas del grupo
                  </CardDescription>
                </div>
                {!group.is_settled && debts.length > 0 && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full text-xs sm:w-auto sm:text-sm'
                  >
                    <CheckCircle2 className='mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4' />
                    Liquidar Deudas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
              {debts.length === 0 ? (
                <div className='flex min-h-[150px] items-center justify-center rounded-lg border border-dashed sm:min-h-[200px]'>
                  <div className='text-center'>
                    <CheckCircle2 className='text-muted-foreground mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8' />
                    <p className='text-sm font-medium sm:text-base'>
                      ¡Todo está en orden!
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs sm:text-sm'>
                      No hay deudas pendientes
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-2 sm:space-y-3'>
                  {debts.map((debt: any, index: number) => (
                    <div
                      key={index}
                      className='bg-muted/50 flex flex-col gap-3 rounded-lg border p-3 sm:p-4'
                    >
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium sm:text-sm'>
                            <span className='text-destructive break-words'>
                              {debt.debtor_name || 'Desconocido'}
                            </span>
                            <span className='text-muted-foreground mx-1 sm:mx-2'>
                              debe a
                            </span>
                            <span className='break-words text-green-600'>
                              {debt.creditor_name || 'Desconocido'}
                            </span>
                          </p>
                        </div>
                        <div className='text-left sm:text-right'>
                          <p className='text-lg font-bold sm:text-xl'>
                            {formatCurrencyPY(debt.debt_amount)}
                          </p>
                        </div>
                      </div>
                      <SettleDebtDialog
                        groupId={group.id}
                        debtorId={debt.debtor_id}
                        debtorName={debt.debtor_name}
                        creditorId={debt.creditor_id}
                        creditorName={debt.creditor_name}
                        debtAmount={debt.debt_amount}
                        currentUserId={currentUserParticipantId}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Instrucciones */}
              {debts.length > 0 && (
                <div className='mt-3 rounded-lg bg-blue-50 p-3 sm:mt-4 sm:p-4 dark:bg-blue-950/20'>
                  <p className='text-xs font-medium text-blue-900 sm:text-sm dark:text-blue-100'>
                    💡 Cómo liquidar
                  </p>
                  <p className='text-muted-foreground mt-1 text-[10px] sm:text-xs'>
                    Cada persona debe transferir el monto indicado. Una vez
                    todos paguen, marca el grupo como &quot;Liquidado&quot;.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Columna 3: Participantes */}
          <Card className='md:col-span-1 xl:col-span-1'>
            <CardHeader className='p-4 sm:p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle className='text-base sm:text-lg'>
                    Participantes
                  </CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    {group.participant_count} miembro(s)
                  </CardDescription>
                </div>
                {/* Solo mostrar botón manual en grupos privados */}
                {isOwner && !group.is_public && (
                  <AddParticipantDialog
                    groupId={group.id}
                    groupName={group.name}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
              <div className='space-y-2'>
                {(group.participants || []).map((participant: any) => (
                  <div
                    key={participant.id}
                    className='flex items-center gap-2 rounded-lg border p-2.5 sm:gap-3 sm:p-3'
                  >
                    <Avatar className='h-9 w-9 shrink-0 sm:h-10 sm:w-10'>
                      <AvatarImage
                        src={participant.avatar_url || ''}
                        alt={participant.name}
                      />
                      <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold sm:text-sm'>
                        {participant.name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium sm:text-base'>
                        {participant.name}
                      </p>
                      {participant.phone && (
                        <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>
                          {participant.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
