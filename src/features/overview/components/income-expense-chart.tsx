'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyPY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import * as RechartsPrimitive from 'recharts';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';

interface IncomeExpenseChartProps {
  currentIncome: number;
  previousIncome: number;
  currentExpenses: number;
  previousExpenses: number;
}

export function IncomeExpenseChart({
  currentIncome,
  previousIncome,
  currentExpenses,
  previousExpenses
}: IncomeExpenseChartProps) {
  // Calcular cambios porcentuales
  const incomeChange =
    previousIncome > 0
      ? ((currentIncome - previousIncome) / previousIncome) * 100
      : 0;

  const expenseChange =
    previousExpenses > 0
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
      : 0;

  const balance = currentIncome - currentExpenses;
  const previousBalance = previousIncome - previousExpenses;
  const balanceChange =
    previousBalance !== 0
      ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100
      : 0;

  // Generar datos para los mini charts mostrando la tendencia mes anterior -> mes actual
  const generateChartData = (previousValue: number, currentValue: number) => {
    const points = 12;
    const data = [];

    for (let i = 0; i < points; i++) {
      // Interpolación suave de mes anterior a mes actual
      const progress = i / (points - 1);
      const value = previousValue + (currentValue - previousValue) * progress;
      // Agregar pequeña variación aleatoria para hacerlo más realista
      const noise = value * 0.05 * (Math.random() - 0.5);
      data.push({
        value: Math.max(0, value + noise)
      });
    }
    return data;
  };

  const incomeData = generateChartData(previousIncome, currentIncome);
  const expenseData = generateChartData(previousExpenses, currentExpenses);
  const balanceData = generateChartData(previousBalance, balance);

  // Helper para formatear el cambio porcentual
  const formatChange = (
    current: number,
    previous: number,
    percentChange: number
  ) => {
    if (previous === 0 && current === 0) return '0.0%';
    if (previous === 0 && current > 0) return '+100%';
    if (previous === 0 && current < 0) return '-100%';
    return `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  };

  const summary = [
    {
      name: 'Ingresos',
      subtitle: 'Mes actual',
      value: formatCurrencyPY(currentIncome),
      previousValue: formatCurrencyPY(previousIncome),
      change: formatChange(currentIncome, previousIncome, incomeChange),
      changeType: incomeChange >= 0 ? 'positive' : 'negative',
      data: incomeData,
      color: '#10B981' // Siempre verde para ingresos
    },
    {
      name: 'Gastos',
      subtitle: 'Mes actual',
      value: formatCurrencyPY(currentExpenses),
      previousValue: formatCurrencyPY(previousExpenses),
      change: formatChange(currentExpenses, previousExpenses, expenseChange),
      changeType: expenseChange <= 0 ? 'positive' : 'negative',
      data: expenseData,
      color: '#EF4444' // Siempre rojo para gastos
    },
    {
      name: 'Balance',
      subtitle: 'Mes actual',
      value: formatCurrencyPY(balance),
      previousValue: formatCurrencyPY(previousBalance),
      change: formatChange(balance, previousBalance, balanceChange),
      changeType: balanceChange >= 0 ? 'positive' : 'negative',
      data: balanceData,
      color: balance >= 0 ? '#10B981' : '#EF4444' // Verde si positivo, rojo si negativo
    }
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Ingresos vs Gastos</h3>
      </div>

      <dl className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {summary.map((item) => {
          const sanitizedName = item.name.toLowerCase().replace(/\s+/g, '-');
          const gradientId = `gradient-${sanitizedName}`;

          return (
            <Card key={item.name} className='p-0'>
              <CardContent className='p-4 pb-0'>
                <div>
                  <dt className='text-muted-foreground text-sm font-medium'>
                    {item.name}
                  </dt>
                  <div className='mt-1 flex items-baseline justify-between'>
                    <dd className='font-numbers text-foreground text-2xl font-semibold'>
                      {item.value}
                    </dd>
                    <dd
                      className={cn(
                        'text-sm font-medium',
                        item.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-red-600 dark:text-red-500'
                      )}
                    >
                      {item.change}
                    </dd>
                  </div>
                  {item.previousValue && (
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      Anterior: {item.previousValue}
                    </p>
                  )}
                </div>

                <div className='mt-2 h-16 overflow-hidden'>
                  <ChartContainer
                    className='h-full w-full'
                    config={
                      {
                        [item.name]: {
                          label: item.name,
                          color: item.color
                        }
                      } as ChartConfig
                    }
                  >
                    <RechartsPrimitive.AreaChart data={item.data}>
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1='0'
                          y1='0'
                          x2='0'
                          y2='1'
                        >
                          <stop
                            offset='5%'
                            stopColor={item.color}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset='95%'
                            stopColor={item.color}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <RechartsPrimitive.XAxis dataKey='value' hide={true} />
                      <RechartsPrimitive.Area
                        dataKey='value'
                        stroke={item.color}
                        fill={`url(#${gradientId})`}
                        fillOpacity={0.4}
                        strokeWidth={1.5}
                        type='monotone'
                      />
                    </RechartsPrimitive.AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </dl>
    </div>
  );
}
