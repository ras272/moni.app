'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Wallet, FileText, Clock } from 'lucide-react';
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
    <Card className={cn('relative', className)}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                iconBgClasses[color]
              )}
            >
              <Wallet className={cn('h-5 w-5', iconColorClasses[color])} />
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
          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <Edit2 className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Balance Principal */}
        <div>
          <p className='text-muted-foreground mb-1 text-xs'>Saldo Disponible</p>
          <p className='text-3xl font-bold tabular-nums'>
            {formatCurrencyPY(currentBalance)}
          </p>
        </div>

        {/* Footer con metadata */}
        <div className='text-muted-foreground flex items-center justify-between border-t pt-3 text-xs'>
          <div className='flex items-center gap-1.5'>
            <FileText className='h-3.5 w-3.5' />
            <span>{transactions.toLocaleString()} transacciones</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Clock className='h-3.5 w-3.5' />
            <span>{updatedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
