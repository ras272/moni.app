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

      <CardHeader className='relative pt-5 pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 hover:scale-110 hover:rotate-3',
                iconBgClasses[color]
              )}
            >
              <Wallet className={cn('h-6 w-6', iconColorClasses[color])} />
            </div>
            <div>
              <CardTitle className='text-base font-semibold'>{name}</CardTitle>
              <div className='mt-1 flex items-center gap-2'>
                <Badge
                  variant='secondary'
                  className={cn('text-xs', badgeColorClasses[color])}
                >
                  Activo
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9 rounded-full transition-transform hover:scale-110 active:scale-95'
          >
            <ArrowUpRight className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-4 pb-5'>
        {/* Balance Principal */}
        <div>
          <p className='text-muted-foreground mb-2 text-xs font-medium'>
            Saldo Disponible
          </p>
          <p className='font-numbers text-3xl font-extrabold tracking-tight tabular-nums'>
            {formatCurrencyPY(currentBalance)}
          </p>
        </div>

        {/* Footer con metadata */}
        <div className='text-muted-foreground flex items-center justify-between border-t pt-3 text-xs'>
          <div className='flex items-center gap-1.5 transition-transform hover:scale-105'>
            <FileText className='h-3.5 w-3.5' />
            <span>{transactions.toLocaleString()} transacciones</span>
          </div>
          <div className='flex items-center gap-1.5 transition-transform hover:scale-105'>
            <Clock className='h-3.5 w-3.5' />
            <span>{updatedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
