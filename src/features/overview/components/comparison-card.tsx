'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyPY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface ComparisonCardProps {
  title: string;
  icon?: React.ReactNode;
  currentValue: number;
  previousValue?: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  showCurrency?: boolean;
  className?: string;
}

export function ComparisonCard({
  title,
  icon,
  currentValue,
  previousValue,
  subtitle,
  trend,
  trendLabel,
  showCurrency = true,
  className
}: ComparisonCardProps) {
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return change;
  };

  const change = calculateChange();

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            {icon && <div className='text-muted-foreground'>{icon}</div>}
            <CardDescription className='text-xs font-medium'>
              {title}
            </CardDescription>
          </div>
        </div>
        <CardTitle className='text-3xl font-bold tabular-nums'>
          {showCurrency ? formatCurrencyPY(currentValue) : currentValue}
          {!showCurrency && trendLabel && (
            <span className='text-muted-foreground ml-1 text-base font-normal'>
              {trendLabel}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 pb-4'>
        {subtitle && (
          <p className='text-muted-foreground text-xs'>{subtitle}</p>
        )}

        {change !== null && previousValue !== undefined && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-xs'>
              Anterior:{' '}
              {showCurrency ? formatCurrencyPY(previousValue) : previousValue}
            </span>
            <Badge
              variant='outline'
              className={cn(
                'gap-1',
                change > 0
                  ? 'border-[var(--card-income-border)] bg-[var(--card-income-bg)] text-[var(--success)]'
                  : change < 0
                    ? 'border-[var(--card-expense-border)] bg-[var(--card-expense-bg)] text-[var(--error)]'
                    : 'bg-muted text-muted-foreground border-border'
              )}
            >
              {change > 0 ? (
                <ArrowUpRight className='h-3 w-3' />
              ) : change < 0 ? (
                <ArrowDownRight className='h-3 w-3' />
              ) : null}
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </Badge>
          </div>
        )}

        {trend && (
          <div className='flex items-center gap-1 pt-1'>
            <TrendingUp
              className={cn(
                'h-3 w-3',
                trend === 'up'
                  ? 'text-[var(--success)]'
                  : trend === 'down'
                    ? 'text-[var(--error)]'
                    : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up'
                  ? 'text-[var(--success)]'
                  : trend === 'down'
                    ? 'text-[var(--error)]'
                    : 'text-muted-foreground'
              )}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
