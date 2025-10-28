'use client';

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import * as React from 'react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';

interface BalanceWidgetProps {
  totalBalance: number;
  monthlyChange: number;
  changePercentage: number;
}

export function BalanceWidget({
  totalBalance,
  monthlyChange,
  changePercentage
}: BalanceWidgetProps) {
  const isPositive = monthlyChange >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 h-auto cursor-default py-3'
        >
          <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-9 items-center justify-center rounded-lg'>
            <Wallet className='size-4' />
          </div>
          <div className='flex min-w-0 flex-1 flex-col gap-1 leading-none'>
            <span className='text-muted-foreground text-xs font-semibold'>
              Balance Total
            </span>
            <span className='truncate text-base font-bold'>
              Gs. {formatCurrency(totalBalance)}
            </span>
            <div className='mt-0.5 flex items-center gap-1'>
              {isPositive ? (
                <TrendingUp className='size-3 text-green-500' />
              ) : (
                <TrendingDown className='size-3 text-red-500' />
              )}
              <span
                className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}
              >
                {isPositive ? '+' : ''}
                {changePercentage.toFixed(1)}% este mes
              </span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
