import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyPY } from '@/lib/utils';
import {
  getMonthlyStats,
  getDailyCashFlow,
  getExpensesByCategory,
  getRecentTransactions
} from '@/lib/supabase/dashboard-stats';

export default async function OverViewPage() {
  // Fetch data from server
  console.log('='.repeat(80));
  console.log('🚀🚀🚀 OVERVIEW PAGE EJECUTANDOSE 🚀🚀🚀');
  console.log('='.repeat(80));

  const stats = await getMonthlyStats();
  console.log('📊 [Overview] Monthly stats:', stats);

  const dailyCashFlow = await getDailyCashFlow(90);
  console.log('📈 [Overview] Daily cash flow length:', dailyCashFlow?.length);

  const categoryExpenses = await getExpensesByCategory();
  console.log(
    '🥧 [Overview] Category expenses length:',
    categoryExpenses?.length
  );

  const recentTransactions = await getRecentTransactions(5);
  console.log(
    '💰 [Overview] Recent transactions length:',
    recentTransactions?.length
  );

  const hasData =
    stats.currentMonth.expenses > 0 || stats.currentMonth.income > 0;
  console.log('✅ [Overview] Has data:', hasData);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            ¡Hola! Bienvenido a tu Dashboard 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Download</Button>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
              {/* Gasto Total (Mes) */}
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Gasto Total (Mes)</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {formatCurrencyPY(stats.currentMonth.expenses)}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      {stats.previousMonth.expenses > 0 &&
                      stats.currentMonth.expenses >
                        stats.previousMonth.expenses ? (
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
                    Mes anterior:{' '}
                    {formatCurrencyPY(stats.previousMonth.expenses)}
                  </div>
                </CardFooter>
              </Card>

              {/* Ahorro Neto (Mes) */}
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
                    {stats.growthPercentage >= 0
                      ? 'Crecimiento'
                      : 'Decrecimiento'}{' '}
                    este mes
                  </div>
                  <div className='text-muted-foreground'>
                    Ingresos: {formatCurrencyPY(stats.currentMonth.income)}
                  </div>
                </CardFooter>
              </Card>

              {/* Saldo Total en Cuentas */}
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

              {/* vs. Mes Pasado */}
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
                  <div className='text-muted-foreground'>
                    Comparación mes a mes
                  </div>
                </CardFooter>
              </Card>
            </div>

            {hasData ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
                <div className='col-span-4'>
                  <BarGraph data={dailyCashFlow} />
                </div>
                <Card className='col-span-4 md:col-span-3'>
                  <RecentSales transactions={recentTransactions} />
                </Card>
                <div className='col-span-4'>
                  <AreaGraph data={dailyCashFlow} />
                </div>
                <div className='col-span-4 md:col-span-3'>
                  <PieGraph data={categoryExpenses} />
                </div>
              </div>
            ) : (
              <div className='flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed'>
                <div className='text-center'>
                  <h3 className='text-lg font-semibold'>
                    No hay datos para mostrar
                  </h3>
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Comienza agregando tus primeras transacciones para ver
                    estadísticas.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
