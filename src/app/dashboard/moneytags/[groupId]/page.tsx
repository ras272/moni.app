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
import { formatCurrencyPY } from '@/lib/utils';
import { ArrowLeft, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddExpenseDialog } from '../components/add-expense-dialog';
import {
  fetchMoneyTagGroupByIdServer,
  fetchGroupExpensesServer,
  calculateGroupDebtsServer
} from '@/lib/supabase/moneytags-server';

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

  return (
    <PageContainer scrollable>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
          <Link href='/dashboard/moneytags'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div className='flex-1 space-y-1'>
            <div className='flex flex-wrap items-center gap-3'>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
                {group.name}
              </h1>
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
            {group.description && (
              <p className='text-muted-foreground text-sm'>
                {group.description}
              </p>
            )}
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground text-sm'>
                {group.participant_count} participante(s)
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Grid Layout: Gastos | Deudas | Participantes */}
        <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {/* Columna 1: Gastos */}
          <Card className='md:col-span-2 xl:col-span-1'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Gastos del Grupo</CardTitle>
                  <CardDescription>
                    {expenses.length} gasto(s) registrado(s)
                  </CardDescription>
                </div>
                <AddExpenseDialog
                  groupId={group.id}
                  participants={group.participants || []}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted/50 mb-4 rounded-lg border p-4'>
                <p className='text-muted-foreground text-sm'>Total Gastado</p>
                <p className='mt-1 text-3xl font-bold'>
                  {formatCurrencyPY(totalSpent)}
                </p>
              </div>

              {expenses.length === 0 ? (
                <div className='flex min-h-[200px] items-center justify-center rounded-lg border border-dashed'>
                  <div className='text-center'>
                    <p className='text-muted-foreground text-sm'>
                      No hay gastos registrados
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Agrega el primer gasto del grupo
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-3'>
                  {expenses.map((expense: any) => (
                    <div
                      key={expense.id}
                      className='flex items-start justify-between rounded-lg border p-3'
                    >
                      <div className='flex-1'>
                        <p className='font-medium'>{expense.description}</p>
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Pagado por{' '}
                          <span className='font-medium'>
                            {expense.paid_by?.name || 'Desconocido'}
                          </span>
                        </p>
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Dividido entre {expense.splits?.length || 0}{' '}
                          persona(s)
                        </p>
                        <p className='text-muted-foreground mt-1 text-xs'>
                          {new Date(expense.expense_date).toLocaleDateString(
                            'es-PY'
                          )}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold'>
                          {formatCurrencyPY(expense.amount)}
                        </p>
                        <p className='text-muted-foreground mt-1 text-xs'>
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
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>¿Quién debe a quién?</CardTitle>
                  <CardDescription>Resumen de deudas del grupo</CardDescription>
                </div>
                {!group.is_settled && debts.length > 0 && (
                  <Button variant='outline' size='sm'>
                    <CheckCircle2 className='mr-2 h-4 w-4' />
                    Liquidar Deudas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {debts.length === 0 ? (
                <div className='flex min-h-[200px] items-center justify-center rounded-lg border border-dashed'>
                  <div className='text-center'>
                    <CheckCircle2 className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                    <p className='font-medium'>¡Todo está en orden!</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      No hay deudas pendientes
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-3'>
                  {debts.map((debt: any, index: number) => (
                    <div
                      key={index}
                      className='bg-muted/50 flex items-center justify-between rounded-lg border p-4'
                    >
                      <div className='flex-1'>
                        <p className='font-medium'>
                          <span className='text-destructive'>
                            {debt.debtor_name || 'Desconocido'}
                          </span>
                          <span className='text-muted-foreground mx-2'>
                            debe a
                          </span>
                          <span className='text-green-600'>
                            {debt.creditor_name || 'Desconocido'}
                          </span>
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xl font-bold'>
                          {formatCurrencyPY(debt.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Instrucciones */}
              {debts.length > 0 && (
                <div className='mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20'>
                  <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                    💡 Cómo liquidar
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Cada persona debe transferir el monto indicado. Una vez
                    todos paguen, marca el grupo como &quot;Liquidado&quot;.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Columna 3: Participantes */}
          <Card className='md:col-span-1 xl:col-span-1'>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {(group.participants || []).map((participant: any) => (
                  <div
                    key={participant.id}
                    className='flex items-center gap-3 rounded-lg border p-3'
                  >
                    <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                      <span className='text-primary text-sm font-semibold'>
                        {participant.name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || '??'}
                      </span>
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium'>{participant.name}</p>
                      {participant.phone && (
                        <p className='text-muted-foreground text-xs'>
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
