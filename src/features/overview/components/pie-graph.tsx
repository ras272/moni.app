'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

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

type CategoryExpense = {
  name: string;
  amount: number;
  color: string;
  icon: string;
};

type PieGraphProps = {
  data: CategoryExpense[];
};

export function PieGraph({ data }: PieGraphProps) {
  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item, index) => ({
      category: item.name,
      amount: item.amount,
      fill: item.color
    }));
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      amount: {
        label: 'Monto'
      }
    };
    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        config[item.name.toLowerCase().replace(/\s+/g, '_')] = {
          label: item.name,
          color: item.color
        };
      });
    }
    return config;
  }, [data]);

  const totalAmount = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  const topCategory = React.useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[0];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className='flex min-h-[250px] items-center justify-center'>
          <p className='text-muted-foreground text-sm'>
            Agrega gastos para ver la distribución
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Gastos por Categoría</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Distribución de gastos por categoría en los últimos 6 meses
          </span>
          <span className='@[540px]/card:hidden'>
            Distribución por categoría
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey='amount'
              nameKey='category'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          ₲{(totalAmount / 1000).toFixed(0)}k
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Gastos
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        {topCategory && (
          <>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {topCategory.category} lidera con{' '}
              {((topCategory.amount / totalAmount) * 100).toFixed(1)}%{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground leading-none'>
              ₲{topCategory.amount.toLocaleString('es-PY')} de ₲
              {totalAmount.toLocaleString('es-PY')} total
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
