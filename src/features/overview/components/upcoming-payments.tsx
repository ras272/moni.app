import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { formatCurrencyPY } from '@/lib/utils';
import { Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RecurringTransactionWithRelations } from '@/lib/supabase/recurring-transactions';

export async function UpcomingPayments() {
  const supabase = await createClient();

  // Traer las próximas 5 transacciones recurrentes activas
  const { data: upcomingPayments, error } = await supabase
    .from('recurring_transactions')
    .select(
      `
      *,
      category:categories(*),
      account:accounts!recurring_transactions_account_id_fkey(*),
      to_account:accounts!recurring_transactions_to_account_id_fkey(*)
    `
    )
    .eq('is_active', true)
    .order('next_occurrence_date', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching upcoming payments:', error);
  }

  const payments =
    (upcomingPayments as RecurringTransactionWithRelations[]) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Próximos Pagos</CardTitle>
        <p className='text-muted-foreground text-xs'>Próximos 14 días</p>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className='flex min-h-[100px] items-center justify-center'>
            <p className='text-muted-foreground text-sm'>
              No hay pagos próximos
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {payments.map((payment) => {
              const nextDate = new Date(payment.next_occurrence_date);
              const isExpense = payment.type === 'expense';

              return (
                <div
                  key={payment.id}
                  className='group hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isExpense
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : 'bg-green-50 dark:bg-green-950/20'
                      }`}
                    >
                      {isExpense ? (
                        <TrendingDown className='h-5 w-5 text-red-600 dark:text-red-400' />
                      ) : (
                        <TrendingUp className='h-5 w-5 text-green-600 dark:text-green-400' />
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-medium'>
                        {payment.description}
                      </p>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {format(nextDate, "d 'de' MMMM", { locale: es })}
                        </span>
                        <span>•</span>
                        <span className='capitalize'>
                          {formatDistanceToNow(nextDate, {
                            locale: es,
                            addSuffix: true
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p
                      className={`font-numbers text-sm font-semibold tabular-nums ${
                        isExpense
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrencyPY(payment.amount)}
                    </p>
                    {payment.category && (
                      <p className='text-muted-foreground text-xs'>
                        {payment.category.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
