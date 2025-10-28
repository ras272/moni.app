import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import React from 'react';
import { formatCurrencyPY } from '@/lib/utils';
import { getMonthlyStats } from '@/lib/supabase/dashboard-stats';

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const stats = await getMonthlyStats();

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            ¡Hola! Bienvenido a tu Dashboard 👋
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Gasto Total (Mes)</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatCurrencyPY(stats.currentMonth.expenses)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.previousMonth.expenses > 0 &&
                  stats.currentMonth.expenses > stats.previousMonth.expenses ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  {stats.previousMonth.expenses > 0
                    ? `${(((stats.currentMonth.expenses - stats.previousMonth.expenses) / stats.previousMonth.expenses) * 100).toFixed(1)}%`
                    : 'N/A'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {stats.currentMonth.expenses > stats.previousMonth.expenses
                  ? 'Mayor'
                  : 'Menor'}{' '}
                que el mes pasado
              </div>
              <div className='text-muted-foreground'>
                Mes anterior: {formatCurrencyPY(stats.previousMonth.expenses)}
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Ahorro Neto (Mes)</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatCurrencyPY(stats.currentMonth.savings)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.growthPercentage >= 0 ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  {stats.growthPercentage.toFixed(1)}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {stats.growthPercentage >= 0 ? 'Crecimiento' : 'Decrecimiento'}{' '}
                este mes
              </div>
              <div className='text-muted-foreground'>
                Ingresos: {formatCurrencyPY(stats.currentMonth.income)}
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Saldo Total en Cuentas</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatCurrencyPY(stats.totalBalance)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.totalBalance >= 0 ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  Activo
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Balance de todas tus cuentas
              </div>
              <div className='text-muted-foreground'>
                Actualizado en tiempo real
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>vs. Mes Pasado</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {stats.growthPercentage >= 0 ? '+' : ''}
                {stats.growthPercentage.toFixed(1)}%
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.growthPercentage >= 0 ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  {stats.growthPercentage >= 0 ? 'Mejora' : 'Baja'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {stats.growthPercentage >= 0
                  ? 'Crecimiento constante'
                  : 'Necesita atención'}
              </div>
              <div className='text-muted-foreground'>Comparación mes a mes</div>
            </CardFooter>
          </Card>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {sales}
          </div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
