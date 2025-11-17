'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Edit,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  formatBudgetAmount,
  getBudgetStatusVariant,
  formatPeriodRange,
  getDaysRemainingInPeriod,
  calculateProjectedSpending,
  type BudgetStatus
} from '@/lib/supabase/budgets';

interface BudgetCardProps {
  budget: BudgetStatus;
  onEdit?: (budgetId: string) => void;
  onDelete?: (budgetId: string) => void;
  className?: string;
}

export function BudgetCard({
  budget,
  onEdit,
  onDelete,
  className
}: BudgetCardProps) {
  const period = budget.current_period;
  const variant = getBudgetStatusVariant(period.percentage_used);
  const daysRemaining = period.days_remaining;
  const projectedSpending = calculateProjectedSpending({
    ...budget,
    percentage_used: period.percentage_used,
    period_end: period.period_end,
    budget_amount: period.budget_amount,
    spent_amount: period.spent,
    remaining_amount: period.remaining,
    is_over_budget: period.is_over_budget,
    rollover_amount: period.rollover_from_previous
  } as any);
  const willExceedBudget = projectedSpending > period.budget_amount;

  const categoryName = budget.category_name || 'General';
  const categoryIcon = budget.category_icon || 'wallet';
  const categoryColor = budget.category_color || '#3B82F6';

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Color strip */}
      <div
        className='absolute top-0 left-0 h-full w-1'
        style={{ backgroundColor: categoryColor }}
      />

      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2 pl-4'>
        <div className='flex items-center gap-2'>
          <div
            className='flex h-8 w-8 items-center justify-center rounded-lg'
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <span className='text-lg'>{categoryIcon}</span>
          </div>
          <div>
            <CardTitle className='text-base font-medium'>
              {categoryName}
            </CardTitle>
            <p className='text-muted-foreground text-xs'>
              {formatPeriodRange(period.period_start, period.period_end)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit?.(budget.id)}>
              <Edit className='mr-2 h-4 w-4' />
              Editar presupuesto
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(budget.id)}
              className='text-destructive'
            >
              <AlertCircle className='mr-2 h-4 w-4' />
              Eliminar presupuesto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className='space-y-4 pl-4'>
        {/* Amounts */}
        <div className='space-y-1'>
          <div className='flex items-baseline justify-between'>
            <span className='text-2xl font-bold'>
              {formatBudgetAmount(period.spent, 'PYG')}
            </span>
            <span className='text-muted-foreground text-sm'>
              de {formatBudgetAmount(period.budget_amount, 'PYG')}
            </span>
          </div>

          {/* Progress bar */}
          <Progress
            value={Math.min(period.percentage_used, 100)}
            className={cn(
              'h-2',
              variant === 'destructive' &&
                '[&>div]:bg-destructive bg-destructive/20',
              variant === 'warning' && 'bg-yellow-500/20 [&>div]:bg-yellow-500',
              variant === 'success' && '[&>div]:bg-green-500'
            )}
          />

          <div className='flex items-center justify-between text-xs'>
            <span
              className={cn(
                'font-medium',
                variant === 'destructive' && 'text-destructive',
                variant === 'warning' && 'text-yellow-600',
                variant === 'success' && 'text-green-600'
              )}
            >
              {period.percentage_used.toFixed(1)}% usado
            </span>
            <span className='text-muted-foreground'>
              {formatBudgetAmount(period.remaining, 'PYG')} restante
            </span>
          </div>
        </div>

        {/* Alerts and info */}
        <div className='space-y-2'>
          {/* Days remaining */}
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <Calendar className='h-3 w-3' />
            <span>
              {daysRemaining === 0
                ? 'Último día del período'
                : daysRemaining === 1
                  ? 'Queda 1 día'
                  : `Quedan ${daysRemaining} días`}
            </span>
          </div>

          {/* Projection warning */}
          {willExceedBudget && !period.is_over_budget && (
            <div className='flex items-start gap-2 rounded-lg bg-yellow-50 p-2 text-xs dark:bg-yellow-950'>
              <TrendingUp className='mt-0.5 h-3 w-3 flex-shrink-0 text-yellow-600' />
              <div>
                <p className='font-medium text-yellow-900 dark:text-yellow-100'>
                  Proyección: {formatBudgetAmount(projectedSpending, 'PYG')}
                </p>
                <p className='text-yellow-700 dark:text-yellow-300'>
                  A este ritmo, excederás tu presupuesto
                </p>
              </div>
            </div>
          )}

          {/* Over budget alert */}
          {period.is_over_budget && (
            <div className='bg-destructive/10 flex items-start gap-2 rounded-lg p-2 text-xs'>
              <AlertCircle className='text-destructive mt-0.5 h-3 w-3 flex-shrink-0' />
              <div>
                <p className='text-destructive font-medium'>
                  Presupuesto excedido
                </p>
                <p className='text-destructive/80'>
                  Has gastado{' '}
                  {formatBudgetAmount(
                    period.spent - period.budget_amount,
                    'PYG'
                  )}{' '}
                  por encima del límite
                </p>
              </div>
            </div>
          )}

          {/* Unread alerts badge */}
          {budget.unread_alerts_count > 0 && (
            <Badge variant='outline' className='w-fit text-xs'>
              {budget.unread_alerts_count}{' '}
              {budget.unread_alerts_count === 1
                ? 'alerta nueva'
                : 'alertas nuevas'}
            </Badge>
          )}

          {/* Rollover amount */}
          {period.rollover_from_previous > 0 && (
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <TrendingDown className='h-3 w-3' />
              <span>
                +{formatBudgetAmount(period.rollover_from_previous, 'PYG')} del
                mes anterior
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
