'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { formatCurrencyPY } from '@/lib/utils';
import type { GroupExpenseWithRelations } from '@/types/database';

interface PublicGroupExpensesProps {
  /** Lista de gastos del grupo */
  expenses: GroupExpenseWithRelations[];
  /** Si mostrar el total gastado */
  showTotal?: boolean;
}

/**
 * Componente para mostrar la lista de gastos en la vista pública
 *
 * Características:
 * - Muestra descripción, monto y quién pagó
 * - Indica entre cuántas personas se dividió
 * - Muestra monto por persona
 * - Ordenado por fecha (más reciente primero)
 * - Resumen de total gastado
 *
 * @example
 * ```tsx
 * <PublicGroupExpenses
 *   expenses={expenses}
 *   showTotal
 * />
 * ```
 */
export function PublicGroupExpenses({
  expenses,
  showTotal = true
}: PublicGroupExpensesProps) {
  /**
   * Calcula el total gastado en el grupo
   */
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  /**
   * Formatea la fecha de un gasto
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className='bg-card border shadow-sm'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Receipt className='text-muted-foreground h-5 w-5' />
          <div className='flex-1'>
            <CardTitle>Gastos del Grupo</CardTitle>
            <CardDescription>
              {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}{' '}
              registrado
              {expenses.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Total gastado */}
        {showTotal && (
          <div className='bg-muted/50 rounded-lg border p-4'>
            <p className='text-muted-foreground text-sm'>Total Gastado</p>
            <p className='mt-1 text-3xl font-bold'>
              {formatCurrencyPY(totalSpent)}
            </p>
          </div>
        )}

        {/* Lista de gastos */}
        {expenses.length === 0 ? (
          <div className='flex min-h-[200px] items-center justify-center rounded-lg border border-dashed'>
            <div className='text-center'>
              <Receipt className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>
                No hay gastos registrados
              </p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Sé el primero en agregar un gasto
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            {expenses.map((expense) => {
              const splitCount = expense.splits?.length || 1;
              const amountPerPerson = expense.amount / splitCount;

              return (
                <div
                  key={expense.id}
                  className='hover:bg-muted/50 flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors'
                >
                  {/* Información del gasto */}
                  <div className='min-w-0 flex-1 space-y-1'>
                    <p className='font-medium'>{expense.description}</p>

                    {/* Quién pagó */}
                    <p className='text-muted-foreground text-xs'>
                      Pagado por{' '}
                      <span className='font-medium'>
                        {expense.paid_by?.name || 'Desconocido'}
                      </span>
                    </p>

                    {/* División */}
                    <p className='text-muted-foreground text-xs'>
                      Dividido entre {splitCount} persona
                      {splitCount !== 1 ? 's' : ''}
                    </p>

                    {/* Fecha */}
                    <p className='text-muted-foreground text-xs'>
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>

                  {/* Montos */}
                  <div className='shrink-0 text-right'>
                    {/* Monto total */}
                    <p className='text-lg font-bold'>
                      {formatCurrencyPY(expense.amount)}
                    </p>

                    {/* Monto por persona */}
                    {splitCount > 1 && (
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {formatCurrencyPY(amountPerPerson)} c/u
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
