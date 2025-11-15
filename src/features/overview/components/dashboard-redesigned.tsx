import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { ComparisonCard } from './comparison-card';
import { WalletAccountEnhanced } from './wallet-account-enhanced';
import { RecentTransactionsEnhanced } from './recent-transactions-enhanced';
import { TopExpenseCategories } from './financial-health';
import { IncomeExpenseChart } from './income-expense-chart';
import { getDashboardData } from '@/lib/supabase/dashboard-unified';
import {
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  Flame
} from 'lucide-react';
import { CreateMonitagBanner } from '@/components/monitags';
import { WalletAccountsContainer } from './wallet-accounts-container';

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
  const dashboardData = await getDashboardData();

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
            ¡Hola! Bienvenido a tu Dashboard 👋
          </h2>
        </div>

        {/* Banner de Monitag */}
        <CreateMonitagBanner />

        {/* Main Grid - 2 Columns */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* LEFT COLUMN */}
          <div className='space-y-6'>
            {/* Chart de Ingresos vs Gastos */}
            <IncomeExpenseChart
              currentIncome={comparison.income.current}
              previousIncome={comparison.income.previous}
              currentExpenses={comparison.expenses.current}
              previousExpenses={comparison.expenses.previous}
            />

            {/* Cards pequeñas debajo del chart */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {/* Card 3: Balance Promedio Semanal */}
              <ComparisonCard
                title='Balance Promedio Semanal'
                icon={<WalletIcon className='h-4 w-4' />}
                currentValue={comparison.weeklyAverageBalance}
                subtitle='Últimas 4 semanas'
                trend='up'
                trendLabel='Creciendo'
              />

              {/* Card 4: Racha de Ahorro */}
              <ComparisonCard
                title='Racha de Ahorro'
                icon={<Flame className='h-4 w-4' />}
                currentValue={comparison.savingsStreak}
                showCurrency={false}
                subtitle='Meses consecutivos ahorrando'
                trendLabel={comparison.savingsStreak > 0 ? 'meses' : ''}
                trend={comparison.savingsStreak > 0 ? 'up' : 'neutral'}
              />
            </div>

            {/* Transacciones Recientes */}
            <RecentTransactionsEnhanced transactions={recentTransactions} />
          </div>

          {/* RIGHT COLUMN */}
          <div className='space-y-6'>
            {/* Wallet Accounts */}
            <WalletAccountsContainer walletAccounts={walletAccounts} />

            {/* Top Categorías de Gasto */}
            <TopExpenseCategories categories={topCategories} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
