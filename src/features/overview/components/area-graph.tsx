'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import * as React from 'react';

type DailyExpense = {
  date: string;
  expenses: number;
  income: number;
};

const chartConfig = {
  visitors: {
    label: 'Visitors'
  },
  income: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-2))'
  },
  expenses: {
    label: 'Gastos',
    color: 'hsl(var(--chart-1))'
  }
} satisfies ChartConfig;

type AreaGraphProps = {
  data: DailyExpense[];
};

export function AreaGraph({ data }: AreaGraphProps) {
  // Agrupar datos por mes para el area chart
  const monthlyData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const monthMap = new Map<
      string,
      { month: string; income: number; expenses: number }
    >();

    data.forEach((item) => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('es-PY', {
        month: 'long',
        year: 'numeric'
      });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthLabel,
          income: 0,
          expenses: 0
        });
      }

      const current = monthMap.get(monthKey)!;
      current.income += item.income;
      current.expenses += item.expenses;
    });

    return Array.from(monthMap.values());
  }, [data]);

  const totalIncome = React.useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.income, 0);
  }, [monthlyData]);

  const totalExpenses = React.useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.expenses, 0);
  }, [monthlyData]);

  const growthPercentage = React.useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const lastMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData[monthlyData.length - 2];
    const lastFlow = lastMonth.income - lastMonth.expenses;
    const prevFlow = prevMonth.income - prevMonth.expenses;
    if (prevFlow === 0) return 0;
    return ((lastFlow - prevFlow) / Math.abs(prevFlow)) * 100;
  }, [monthlyData]);

  if (monthlyData.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Flujo de Caja</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className='flex min-h-[250px] items-center justify-center'>
          <p className='text-muted-foreground text-sm'>
            Agrega transacciones para ver el flujo de caja
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Flujo de Caja (Ingresos vs. Gastos)</CardTitle>
        <CardDescription>
          Mostrando el flujo de los últimos {monthlyData.length} meses
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={monthlyData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillIncome' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-income)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-income)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillExpenses' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-expenses)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-expenses)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const parts = value.split(' ');
                return parts[0].slice(0, 3);
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='expenses'
              type='natural'
              fill='url(#fillExpenses)'
              stroke='var(--color-expenses)'
              stackId='a'
            />
            <Area
              dataKey='income'
              type='natural'
              fill='url(#fillIncome)'
              stroke='var(--color-income)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {growthPercentage >= 0 ? 'Mejorando' : 'Decreciendo'} por{' '}
              {Math.abs(growthPercentage).toFixed(1)}% este mes{' '}
              {growthPercentage >= 0 && <IconTrendingUp className='h-4 w-4' />}
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Total: Ingresos ₲{totalIncome.toLocaleString('es-PY')} | Gastos ₲
              {totalExpenses.toLocaleString('es-PY')}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
