'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

type DailyExpense = {
  date: string;
  expenses: number;
  income: number;
};

const chartConfig = {
  views: {
    label: 'Transacciones'
  },
  expenses: {
    label: 'Gastos',
    color: 'hsl(var(--chart-1))'
  },
  income: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-2))'
  }
} satisfies ChartConfig;

type BarGraphProps = {
  data: DailyExpense[];
};

export function BarGraph({ data }: BarGraphProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('expenses');

  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item) => ({
      date: item.date,
      expenses: item.expenses,
      income: item.income
    }));
  }, [data]);

  const total = React.useMemo(
    () => ({
      expenses: chartData.reduce((acc, curr) => acc + curr.expenses, 0),
      income: chartData.reduce((acc, curr) => acc + curr.income, 0)
    }),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Tendencia de Gastos</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className='flex min-h-[250px] items-center justify-center'>
          <p className='text-muted-foreground text-sm'>
            Agrega transacciones para ver el gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Tendencia de Gastos (Últimos 90 días)</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              Total de los últimos 90 días
            </span>
            <span className='@[540px]/card:hidden'>Últimos 90 días</span>
          </CardDescription>
        </div>
        <div className='flex'>
          {(['expenses', 'income'] as const).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                onClick={() => setActiveChart(chart)}
              >
                <span className='text-muted-foreground text-xs'>
                  {chartConfig[chart].label}
                </span>
                <span className='text-lg leading-none font-bold sm:text-3xl'>
                  ₲ {total[key]?.toLocaleString('es-PY')}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillExpenses' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='hsl(var(--chart-1))'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='hsl(var(--chart-1))'
                  stopOpacity={0.2}
                />
              </linearGradient>
              <linearGradient id='fillIncome' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='hsl(var(--chart-2))'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='hsl(var(--chart-2))'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('es-PY', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='views'
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('es-PY', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={
                activeChart === 'expenses'
                  ? 'url(#fillExpenses)'
                  : 'url(#fillIncome)'
              }
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
