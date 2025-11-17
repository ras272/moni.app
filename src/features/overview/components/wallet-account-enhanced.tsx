'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, FileText, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrencyPY } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface WalletAccountEnhancedProps {
  id: string;
  name: string;
  currentBalance: number;
  transactions: number;
  updatedAt: string;
  color: 'primary' | 'info' | 'success' | 'warning';
  className?: string;
}

export function WalletAccountEnhanced({
  name,
  currentBalance,
  transactions,
  updatedAt,
  color,
  className
}: WalletAccountEnhancedProps) {
  const iconBgClasses = {
    primary: 'bg-[var(--card-featured-bg)]',
    info: 'bg-[var(--card-moneytag-bg)]',
    success: 'bg-[var(--card-income-bg)]',
    warning: 'bg-[var(--card-warning-bg)]'
  };

  const iconColorClasses = {
    primary: 'text-[var(--purple)]',
    info: 'text-[var(--info)]',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]'
  };

  const badgeColorClasses = {
    primary:
      'bg-[var(--card-featured-bg)] text-[var(--purple)] border border-[var(--card-featured-border)]',
    info: 'bg-[var(--card-moneytag-bg)] text-[var(--info)] border border-[var(--card-moneytag-border)]',
    success:
      'bg-[var(--card-income-bg)] text-[var(--success)] border border-[var(--card-income-border)]',
    warning:
      'bg-[var(--card-warning-bg)] text-[var(--warning)] border border-[var(--card-warning-border)]'
  };

  return (
    <Card
      className={cn(
        'group shadow-modern hover:shadow-modern-lg relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1',
        className
      )}
    >
      {/* Background gradient on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          iconBgClasses[color]
        )}
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${
            color === 'primary'
              ? 'var(--purple)'
              : color === 'info'
                ? 'var(--info)'
                : color === 'success'
                  ? 'var(--success)'
                  : 'var(--warning)'
          }08 100%)`
        }}
      />

      <CardContent className='relative p-3'>
        <div className='flex items-start gap-2'>
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              iconBgClasses[color]
            )}
          >
            <Wallet className={cn('h-4 w-4', iconColorClasses[color])} />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex items-baseline justify-between gap-2'>
              <p className='truncate text-sm font-medium'>{name}</p>
              <p className='font-numbers text-lg font-bold tracking-tight tabular-nums'>
                {formatCurrencyPY(currentBalance)}
              </p>
            </div>
            <div className='text-muted-foreground flex items-center gap-3 text-xs'>
              <span className='flex items-center gap-1'>
                <FileText className='h-3 w-3' />
                {transactions}
              </span>
              <span className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                {updatedAt}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
