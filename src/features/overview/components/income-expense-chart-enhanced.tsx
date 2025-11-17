'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyPY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import * as RechartsPrimitive from 'recharts';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Wallet, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface DailyData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

interface IncomeExpenseChartEnhancedProps {
  currentIncome: number;
  previousIncome: number;
  currentExpenses: number;
  previousExpenses: number;
  dailyData?: DailyData[]; // Datos diarios opcionales
}

export function IncomeExpenseChartEnhanced({
  currentIncome,
  previousIncome,
  currentExpenses,
  previousExpenses,
  dailyData = []
}: IncomeExpenseChartEnhancedProps) {
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

  // Calcular tasa de ahorro
  const savingsRate =
    currentIncome > 0 ? ((balance / currentIncome) * 100).toFixed(1) : '0.0';

  // Generar datos para sparkline
  // Usa datos reales si están disponibles, si no muestra tendencia simple
  const generateChartData = (
    previousValue: number,
    currentValue: number,
    type: 'income' | 'expenses'
  ) => {
    // Si tenemos datos reales, usarlos (solo ingresos/gastos, no balance)
    if (dailyData.length > 0) {
      return dailyData.map((day) => ({
        value: day[type],
        date: day.date
      }));
    }

    // Fallback: tendencia simple del mes anterior al actual
    const points = 12;
    const data = [];
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const value = previousValue + (currentValue - previousValue) * progress;
      const noise = value * 0.05 * (Math.random() - 0.5);
      data.push({
        value: Math.max(0, value + noise),
        date: `Día ${i + 1}`
      });
    }
    return data;
  };

  const incomeData = generateChartData(previousIncome, currentIncome, 'income');
  const expenseData = generateChartData(
    previousExpenses,
    currentExpenses,
    'expenses'
  );

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

  // Custom Tooltip para el gráfico
  const CustomTooltip = ({
    active,
    payload,
    label
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload[0]) {
      return (
        <div className='bg-background rounded-lg border p-2 shadow-lg'>
          <p className='text-xs font-medium'>
            {formatCurrencyPY(payload[0].value)}
          </p>
          {label && <p className='text-muted-foreground text-xs'>{label}</p>}
        </div>
      );
    }
    return null;
  };

  const summary = [
    {
      name: 'Ingresos',
      subtitle: 'Este mes',
      value: formatCurrencyPY(currentIncome),
      previousValue: formatCurrencyPY(previousIncome),
      change: formatChange(currentIncome, previousIncome, incomeChange),
      changeType: incomeChange >= 0 ? 'positive' : 'negative',
      data: incomeData,
      color: '#10B981',
      gradient: 'from-green-500 to-emerald-500',
      icon: TrendingUp,
      iconColor: 'text-green-600',
      extraInfo: null
    },
    {
      name: 'Gastos',
      subtitle: 'Este mes',
      value: formatCurrencyPY(currentExpenses),
      previousValue: formatCurrencyPY(previousExpenses),
      change: formatChange(currentExpenses, previousExpenses, expenseChange),
      changeType: expenseChange <= 0 ? 'positive' : 'negative',
      data: expenseData,
      color: '#EF4444',
      gradient: 'from-red-500 to-orange-500',
      icon: TrendingDown,
      iconColor: 'text-red-600',
      extraInfo: null
    },
    {
      name: balance >= 0 ? 'Ahorraste' : 'Déficit',
      subtitle: 'Este mes',
      value: formatCurrencyPY(Math.abs(balance)),
      previousValue: formatCurrencyPY(Math.abs(previousBalance)),
      change: formatChange(balance, previousBalance, balanceChange),
      changeType: balanceChange >= 0 ? 'positive' : 'negative',
      data: incomeData, // Usa datos de ingresos como referencia visual
      color: balance >= 0 ? '#10B981' : '#EF4444',
      gradient:
        balance >= 0
          ? 'from-green-500 to-emerald-600'
          : 'from-red-500 to-red-600',
      icon: Wallet,
      iconColor: balance >= 0 ? 'text-green-600' : 'text-red-600',
      extraInfo:
        balance >= 0
          ? {
              label: 'Tasa de ahorro',
              value: `${savingsRate}%`,
              isGood: parseFloat(savingsRate) >= 20
            }
          : {
              label: balance < 0 ? 'Gastaste más de lo que ganaste' : null,
              value: '',
              isGood: false
            }
    }
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Resumen Financiero</h3>
        <p className='text-muted-foreground text-sm'>vs Mes anterior</p>
      </div>

      <dl className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {summary.map((item) => {
          const sanitizedName = item.name.toLowerCase().replace(/\s+/g, '-');
          const gradientId = `gradient-${sanitizedName}`;
          const Icon = item.icon;

          return (
            <Card
              key={item.name}
              className='group p-0 transition-all hover:scale-[1.02] hover:shadow-lg'
            >
              <CardContent className='p-4 pb-0'>
                <div>
                  {/* Header con icono */}
                  <div className='mb-2 flex items-center justify-between'>
                    <dt className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                      <Icon className={cn('h-4 w-4', item.iconColor)} />
                      {item.name}
                    </dt>

                    {/* Tooltip informativo */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='text-muted-foreground h-3.5 w-3.5 cursor-help' />
                        </TooltipTrigger>
                        <TooltipContent className='max-w-xs'>
                          <p className='text-xs font-medium'>
                            Comparación con mes anterior
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {item.previousValue} → {item.value}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Valor principal y cambio */}
                  <div className='mt-1 flex items-baseline justify-between'>
                    <dd className='font-numbers text-foreground text-2xl font-semibold'>
                      {item.value}
                    </dd>
                    <dd
                      className={cn(
                        'flex items-center gap-1 text-sm font-medium transition-colors',
                        item.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-red-600 dark:text-red-500'
                      )}
                    >
                      {item.changeType === 'positive' ? '↗' : '↘'}
                      {item.change}
                    </dd>
                  </div>

                  {/* Valor anterior */}
                  {item.previousValue && (
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      Mes anterior: {item.previousValue}
                    </p>
                  )}

                  {/* Extra info (tasa de ahorro o mensaje de déficit) */}
                  {item.extraInfo && item.extraInfo.label && (
                    <div
                      className={cn(
                        'mt-2 rounded-md p-2',
                        item.extraInfo.isGood
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : 'bg-yellow-50 dark:bg-yellow-950/20'
                      )}
                    >
                      <p
                        className={cn(
                          'text-xs font-medium',
                          item.extraInfo.isGood
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-yellow-700 dark:text-yellow-400'
                        )}
                      >
                        {item.extraInfo.label}: {item.extraInfo.value}
                        {item.extraInfo.isGood && ' 🎉'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sparkline interactivo */}
                <div className='mt-3 h-16 overflow-hidden'>
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
                      <RechartsPrimitive.XAxis dataKey='date' hide={true} />
                      <RechartsPrimitive.Tooltip content={<CustomTooltip />} />
                      <RechartsPrimitive.Area
                        dataKey='value'
                        stroke={item.color}
                        fill={`url(#${gradientId})`}
                        fillOpacity={0.4}
                        strokeWidth={2}
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
