'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyPY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface IncomeExpenseChartProps {
  currentIncome: number;
  previousIncome: number;
  currentExpenses: number;
  previousExpenses: number;
}

// Función para formatear números compactos
function formatCompactNumber(num: number): string {
  const absNum = Math.abs(num);
  const isNegative = num < 0;

  if (absNum >= 1000000) {
    const millions = absNum / 1000000;
    const formatted =
      millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `${isNegative ? '-' : ''}${formatted}M`;
  } else if (absNum >= 1000) {
    const thousands = absNum / 1000;
    const formatted =
      thousands >= 100
        ? thousands.toFixed(0)
        : thousands >= 10
          ? thousands.toFixed(0)
          : thousands.toFixed(1);
    return `${isNegative ? '-' : ''}${formatted}K`;
  }
  return `${isNegative ? '-' : ''}${absNum.toFixed(0)}`;
}

export function IncomeExpenseChartRecharts({
  currentIncome,
  previousIncome,
  currentExpenses,
  previousExpenses
}: IncomeExpenseChartProps) {
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Ingresos vs Gastos</h3>
      </div>

      {/* Grid de 2 cards limpias */}
      <div className='grid grid-cols-2 gap-4 md:gap-6'>
        {/* Card Mes Anterior */}
        <Card className='group shadow-modern hover:shadow-modern-lg overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-bold md:text-lg'>
              Mes Anterior
            </CardTitle>
            <Badge
              variant='secondary'
              className={cn(
                'w-fit px-2.5 py-1 text-xs font-semibold',
                previousIncome > previousExpenses
                  ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                  : 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]'
              )}
            >
              {previousIncome > previousExpenses ? (
                <>
                  <TrendingUp className='mr-1 h-3.5 w-3.5' />
                  <span>Positivo</span>
                </>
              ) : (
                <>
                  <TrendingDown className='mr-1 h-3.5 w-3.5' />
                  <span>Negativo</span>
                </>
              )}
            </Badge>
          </CardHeader>

          <CardContent className='space-y-4 px-4 pb-5 md:px-6'>
            {/* Stats de Ingresos */}
            <div className='flex items-center justify-between rounded-xl border-2 border-[#10B981]/20 bg-[#10B981]/5 p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/20'>
                  <ArrowUpRight className='h-6 w-6 text-[#10B981]' />
                </div>
                <div>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Ingresos
                  </p>
                  <p className='font-numbers text-2xl font-extrabold text-[#10B981]'>
                    {formatCompactNumber(previousIncome)}K
                  </p>
                </div>
              </div>
            </div>

            {/* Stats de Gastos */}
            <div className='flex items-center justify-between rounded-xl border-2 border-[#EF4444]/20 bg-[#EF4444]/5 p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#EF4444]/20'>
                  <ArrowDownRight className='h-6 w-6 text-[#EF4444]' />
                </div>
                <div>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Gastos
                  </p>
                  <p className='font-numbers text-2xl font-extrabold text-[#EF4444]'>
                    {formatCompactNumber(previousExpenses)}K
                  </p>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className='bg-muted/30 rounded-xl p-4 text-center'>
              <p className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
                Balance
              </p>
              <p className='font-numbers text-xl font-extrabold text-[#01674f] sm:text-2xl'>
                {formatCurrencyPY(previousIncome - previousExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Mes Actual */}
        <Card className='group shadow-modern hover:shadow-modern-lg overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-bold md:text-lg'>
              Mes Actual
            </CardTitle>
            <Badge
              variant='secondary'
              className={cn(
                'w-fit px-2.5 py-1 text-xs font-semibold',
                currentIncome > currentExpenses
                  ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                  : 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]'
              )}
            >
              {currentIncome > currentExpenses ? (
                <>
                  <TrendingUp className='mr-1 h-3.5 w-3.5' />
                  <span>Positivo</span>
                </>
              ) : (
                <>
                  <TrendingDown className='mr-1 h-3.5 w-3.5' />
                  <span>Negativo</span>
                </>
              )}
            </Badge>
          </CardHeader>

          <CardContent className='space-y-4 px-4 pb-5 md:px-6'>
            {/* Stats de Ingresos */}
            <div className='flex items-center justify-between rounded-xl border-2 border-[#10B981]/20 bg-[#10B981]/5 p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/20'>
                  <ArrowUpRight className='h-6 w-6 text-[#10B981]' />
                </div>
                <div>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Ingresos
                  </p>
                  <p className='font-numbers text-2xl font-extrabold text-[#10B981]'>
                    {formatCompactNumber(currentIncome)}K
                  </p>
                </div>
              </div>
            </div>

            {/* Stats de Gastos */}
            <div className='flex items-center justify-between rounded-xl border-2 border-[#EF4444]/20 bg-[#EF4444]/5 p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#EF4444]/20'>
                  <ArrowDownRight className='h-6 w-6 text-[#EF4444]' />
                </div>
                <div>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Gastos
                  </p>
                  <p className='font-numbers text-2xl font-extrabold text-[#EF4444]'>
                    {formatCompactNumber(currentExpenses)}K
                  </p>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className='bg-muted/30 rounded-xl p-4 text-center'>
              <p className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
                Balance
              </p>
              <p className='font-numbers text-xl font-extrabold text-[#01674f] sm:text-2xl'>
                {formatCurrencyPY(currentIncome - currentExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
