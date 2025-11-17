import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { ComparisonCard } from './comparison-card';
import { RecentTransactionsEnhanced } from './recent-transactions-enhanced';
import { TopExpenseCategories } from './financial-health';
import { IncomeExpenseChart } from './income-expense-chart';
import { BudgetWidget } from './budget-widget';
import { UpcomingPayments } from './upcoming-payments';
import { getDashboardData } from '@/lib/supabase/dashboard-unified';
import { getDailyStats } from '@/lib/supabase/daily-stats';
import {
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  Flame
} from 'lucide-react';
import { CreateMonitagBanner } from '@/components/monitags';

/**
 * Helper function to convert date to relative time string
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Justo ahora';
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours}h`;
  } else if (diffInDays === 1) {
    return 'Ayer';
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  } else {
    return date.toLocaleDateString('es-PY', {
      day: 'numeric',
      month: 'short'
    });
  }
}

export async function DashboardRedesigned() {
  // ✨ OPTIMIZACIÓN: Obtener TODOS los datos en UNA SOLA QUERY
  // Antes: 4+ queries individuales (~2000ms)
  // Ahora: 1 query optimizada (~500ms)
  const [dashboardData, dailyStats] = await Promise.all([
    getDashboardData(),
    getDailyStats()
  ]);

  // Transformar datos para el formato esperado por los componentes
  const { monthlyStats, walletAccounts } = dashboardData;

  // Mapear topCategories al formato esperado por el componente
  const topCategories = dashboardData.topCategories.map((cat) => ({
    name: cat.category,
    amount: cat.amount,
    percentage: cat.percentage,
    color: cat.color,
    icon: cat.icon
  }));

  // Transformar recentTransactions al formato esperado por el componente
  const recentTransactions = dashboardData.recentTransactions.map((tx) => ({
    id: tx.id,
    account: tx.account.name,
    type: tx.type,
    category: tx.category.name,
    categoryColor: tx.category.color,
    amount: tx.amount,
    date: tx.transactionDate,
    relativeTime: getRelativeTime(tx.transactionDate)
  }));

  // Calcular comparison data desde monthlyStats
  const expenseChange =
    monthlyStats.previousMonth.expenses > 0
      ? ((monthlyStats.currentMonth.expenses -
          monthlyStats.previousMonth.expenses) /
          monthlyStats.previousMonth.expenses) *
        100
      : 0;

  const incomeChange =
    monthlyStats.previousMonth.income > 0
      ? ((monthlyStats.currentMonth.income -
          monthlyStats.previousMonth.income) /
          monthlyStats.previousMonth.income) *
        100
      : 0;

  const comparison = {
    expenses: {
      current: monthlyStats.currentMonth.expenses,
      previous: monthlyStats.previousMonth.expenses,
      change: expenseChange
    },
    income: {
      current: monthlyStats.currentMonth.income,
      previous: monthlyStats.previousMonth.income,
      change: incomeChange
    },
    weeklyAverageBalance: dashboardData.sidebarStats.totalBalance / 4,
    savingsStreak: monthlyStats.currentMonth.savings > 0 ? 1 : 0
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-foreground text-3xl font-extrabold tracking-tight'>
            ¡Hola Jack! Tu resumen financiero 👋
          </h2>
        </div>

        {/* Banner de Monitag */}
        <CreateMonitagBanner />

        {/* Fila 1: INGRESOS | GASTOS | AHORRO | BALANCE */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Card 1: Ingresos */}
          <ComparisonCard
            title='Ingresos'
            icon={<TrendingUp className='h-4 w-4' />}
            currentValue={comparison.income.current}
            previousValue={comparison.income.previous}
            subtitle='vs Mes anterior'
            trend={comparison.income.change >= 0 ? 'up' : 'down'}
            trendLabel={`${comparison.income.change >= 0 ? '+' : ''}${comparison.income.change.toFixed(1)}%`}
          />

          {/* Card 2: Gastos */}
          <ComparisonCard
            title='Gastos'
            icon={<TrendingDown className='h-4 w-4' />}
            currentValue={comparison.expenses.current}
            previousValue={comparison.expenses.previous}
            subtitle='vs Mes anterior'
            trend={comparison.expenses.change <= 0 ? 'up' : 'down'}
            trendLabel={`${comparison.expenses.change >= 0 ? '+' : ''}${comparison.expenses.change.toFixed(1)}%`}
          />

          {/* Card 3: Ahorro */}
          <ComparisonCard
            title={
              monthlyStats.currentMonth.income -
                monthlyStats.currentMonth.expenses >=
              0
                ? 'Ahorraste'
                : 'Déficit'
            }
            icon={<WalletIcon className='h-4 w-4' />}
            currentValue={Math.abs(
              monthlyStats.currentMonth.income -
                monthlyStats.currentMonth.expenses
            )}
            subtitle='Este mes'
            trend={
              monthlyStats.currentMonth.income -
                monthlyStats.currentMonth.expenses >=
              0
                ? 'up'
                : 'down'
            }
            trendLabel={`${(((monthlyStats.currentMonth.income - monthlyStats.currentMonth.expenses) / monthlyStats.currentMonth.income) * 100).toFixed(0)}% tasa`}
          />

          {/* Card 4: Balance Promedio */}
          <ComparisonCard
            title='Balance Promedio'
            icon={<WalletIcon className='h-4 w-4' />}
            currentValue={comparison.weeklyAverageBalance}
            subtitle='Últimas 4 semanas'
            trend='up'
            trendLabel='Creciendo'
          />
        </div>

        {/* Fila 2: RACHA DE AHORRO | TREND MINI-CHART */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Racha de Ahorro */}
          <ComparisonCard
            title='Racha de Ahorro'
            icon={<Flame className='h-4 w-4' />}
            currentValue={comparison.savingsStreak}
            showCurrency={false}
            subtitle='Meses consecutivos ahorrando'
            trendLabel={comparison.savingsStreak > 0 ? 'meses' : ''}
            trend={comparison.savingsStreak > 0 ? 'up' : 'neutral'}
          />

          {/* Trend Chart (Placeholder - podemos mejorarlo después) */}
          <ComparisonCard
            title='Balance Total'
            icon={<WalletIcon className='h-4 w-4' />}
            currentValue={dashboardData.sidebarStats.totalBalance}
            subtitle='Todas tus cuentas'
            trend='up'
            trendLabel='Total'
          />
        </div>

        {/* Fila 3: TRANSACCIONES | PROXIMOS PAGOS */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <RecentTransactionsEnhanced transactions={recentTransactions} />
          <UpcomingPayments />
        </div>

        {/* Fila 4: CATEGORÍAS | PRESUPUESTOS */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <TopExpenseCategories categories={topCategories} />
          <BudgetWidget />
        </div>
      </div>
    </PageContainer>
  );
}
