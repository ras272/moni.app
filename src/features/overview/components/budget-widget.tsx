import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getBudgetStatus } from '@/lib/supabase/budgets';
import {
  formatBudgetAmount,
  getBudgetStatusVariant,
  sortBudgetsByPriority
} from '@/lib/supabase/budgets/utils';
import { AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function BudgetWidget() {
  const allBudgets = await getBudgetStatus();

  // Get top 3 critical budgets
  const topBudgets = sortBudgetsByPriority(allBudgets).slice(0, 3);

  if (topBudgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <TrendingUp className='h-5 w-5' />
            Presupuestos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <p className='text-muted-foreground mb-4 text-sm'>
              No tienes presupuestos configurados
            </p>
            <Link href='/dashboard/presupuestos'>
              <Button size='sm'>Crear presupuesto</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <TrendingUp className='h-5 w-5' />
          Presupuestos
        </CardTitle>
        <Link href='/dashboard/presupuestos'>
          <Button variant='ghost' size='sm' className='h-8 text-xs'>
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent className='space-y-4'>
        {topBudgets.map((budget) => {
          const percentageUsed =
            budget.current_period.budget_amount > 0
              ? (budget.current_period.spent /
                  budget.current_period.budget_amount) *
                100
              : 0;

          const variant = getBudgetStatusVariant(percentageUsed);
          const isOverBudget = percentageUsed > 100;
          const isWarning = percentageUsed >= 80;

          return (
            <div key={budget.id} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    {budget.category_name || 'General'}
                  </span>
                  {isOverBudget && (
                    <AlertCircle className='text-destructive h-4 w-4' />
                  )}
                  {!isOverBudget && !isWarning && (
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                  )}
                </div>
                <div className='text-right'>
                  <p className='text-muted-foreground text-xs'>
                    {formatBudgetAmount(budget.current_period.spent)} /{' '}
                    {formatBudgetAmount(budget.current_period.budget_amount)}
                  </p>
                </div>
              </div>

              <div className='space-y-1'>
                <Progress
                  value={Math.min(percentageUsed, 100)}
                  className='h-2'
                  indicatorClassName={
                    variant === 'destructive'
                      ? 'bg-destructive'
                      : variant === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }
                />
                <div className='flex items-center justify-between'>
                  <p className='text-muted-foreground text-xs'>
                    {percentageUsed.toFixed(0)}% usado
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {budget.current_period.days_remaining} días restantes
                  </p>
                </div>
              </div>

              {isOverBudget && (
                <p className='text-destructive text-xs'>
                  Excedido por{' '}
                  {formatBudgetAmount(
                    budget.current_period.spent -
                      budget.current_period.budget_amount
                  )}
                </p>
              )}
            </div>
          );
        })}

        {allBudgets.length > 3 && (
          <div className='pt-2 text-center'>
            <Link href='/dashboard/presupuestos'>
              <Button variant='link' size='sm' className='h-8 text-xs'>
                Ver {allBudgets.length - 3} presupuesto
                {allBudgets.length - 3 > 1 ? 's' : ''} más
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
