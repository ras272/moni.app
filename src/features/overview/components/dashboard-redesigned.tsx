import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { ComparisonCard } from './comparison-card';
import { WalletAccountEnhanced } from './wallet-account-enhanced';
import { RecentTransactionsEnhanced } from './recent-transactions-enhanced';
import { TopExpenseCategories } from './financial-health';
import {
  getMonthlyComparison,
  getWalletAccountsData,
  getTopExpenseCategories,
  getRecentTransactionsEnhanced
} from '@/lib/supabase/dashboard-enhanced-stats';
import {
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  Flame
} from 'lucide-react';

export async function DashboardRedesigned() {
  // Fetch all data
  const comparison = await getMonthlyComparison();
  const walletAccounts = await getWalletAccountsData();
  const topCategories = await getTopExpenseCategories(3);
  const recentTransactions = await getRecentTransactionsEnhanced(7, 10);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            ¡Hola! Bienvenido a tu Dashboard 👋
          </h2>
        </div>

        {/* Main Grid - 2 Columns */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* LEFT COLUMN */}
          <div className='space-y-6'>
            {/* Comparativa Mensual - Grid 2x2 */}
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Resumen del Mes</h3>
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {/* Card 1: Gastos Este vs Anterior */}
                <ComparisonCard
                  title='Gastos del Mes'
                  icon={<TrendingDown className='h-4 w-4' />}
                  currentValue={comparison.expenses.current}
                  previousValue={comparison.expenses.previous}
                  subtitle='Comparado con mes anterior'
                />

                {/* Card 2: Ingresos Este vs Anterior */}
                <ComparisonCard
                  title='Ingresos del Mes'
                  icon={<TrendingUp className='h-4 w-4' />}
                  currentValue={comparison.income.current}
                  previousValue={comparison.income.previous}
                  subtitle='Comparado con mes anterior'
                />

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
            </div>

            {/* Transacciones Recientes */}
            <RecentTransactionsEnhanced transactions={recentTransactions} />
          </div>

          {/* RIGHT COLUMN */}
          <div className='space-y-6'>
            {/* Wallet Accounts */}
            <div>
              <div className='mb-4'>
                <h3 className='text-lg font-semibold'>Wallet Accounts</h3>
              </div>
              <div className='space-y-4'>
                {walletAccounts.map((wallet) => (
                  <WalletAccountEnhanced key={wallet.id} {...wallet} />
                ))}
                {walletAccounts.length === 0 && (
                  <div className='flex min-h-[200px] items-center justify-center rounded-lg border border-dashed'>
                    <div className='text-center'>
                      <p className='text-muted-foreground text-sm'>
                        No hay cuentas disponibles
                      </p>
                      <Button variant='link' className='mt-2'>
                        Crear primera cuenta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Categorías de Gasto */}
            <TopExpenseCategories categories={topCategories} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
