'use client';

import * as React from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { TrendingDown, Target, AlertCircle } from 'lucide-react';

interface QuickStatsSidebarProps {
  todayExpenses: number;
  monthExpenses: number;
  pendingPayments: number;
}

export function QuickStatsSidebar({
  todayExpenses,
  monthExpenses,
  pendingPayments
}: QuickStatsSidebarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = [
    {
      icon: TrendingDown,
      label: 'Gastos hoy',
      value: `Gs. ${formatCurrency(todayExpenses)}`,
      color: 'text-orange-500'
    },
    {
      icon: Target,
      label: 'Gastos del mes',
      value: `Gs. ${formatCurrency(monthExpenses)}`,
      color: 'text-blue-500'
    },
    {
      icon: AlertCircle,
      label: 'Pagos pendientes',
      value: `${pendingPayments}`,
      color: pendingPayments > 0 ? 'text-yellow-500' : 'text-green-500'
    }
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Resumen Rápido</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <SidebarMenuItem key={index}>
                <div className='flex items-center gap-3 px-2 py-1.5 text-sm'>
                  <Icon className={`size-4 ${stat.color}`} />
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <span className='text-muted-foreground text-xs'>
                      {stat.label}
                    </span>
                    <span className='truncate text-sm font-semibold'>
                      {stat.value}
                    </span>
                  </div>
                </div>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
