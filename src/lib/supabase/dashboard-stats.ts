/**
 * Dashboard Statistics Module
 *
 * Funciones server-side para obtener estadísticas del dashboard.
 * Todas las funciones respetan RLS y son optimizadas con RPC cuando es posible.
 */

import { cache } from 'react';
import { createClient } from './server';

// =====================================================
// TYPES
// =====================================================

export type DashboardStats = {
  currentMonth: {
    expenses: number;
    income: number;
    savings: number;
  };
  previousMonth: {
    expenses: number;
    income: number;
  };
  totalBalance: number;
  growthPercentage: number;
};

// Types removidos: DailyExpense, CategoryExpense (ya no se usan)

// =====================================================
// ACCOUNT BALANCE
// =====================================================

/**
 * Obtiene el saldo total de todas las cuentas activas del usuario.
 * CACHED: Se ejecuta solo 1 vez por request, aunque se llame múltiples veces
 */
export const getTotalAccountBalance = cache(async (): Promise<number> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching total account balance:', error);
    return 0;
  }

  const totalBalance = data.reduce(
    (sum, account) => sum + (account.current_balance || 0),
    0
  );

  return totalBalance;
});

// =====================================================
// MONTHLY STATISTICS
// =====================================================

/**
 * Obtiene estadísticas comparativas del mes actual vs mes anterior.
 * Usa RPC optimizada para mejor performance.
 * CACHED: Se ejecuta solo 1 vez por request, aunque se llame múltiples veces
 */
export const getMonthlyStats = cache(async (): Promise<DashboardStats> => {
  const supabase = await createClient();

  // Debug: verificar sesión
  const {
    data: { user }
  } = await supabase.auth.getUser();
  console.log('🔍 Dashboard Stats - User:', user?.id, user?.email);

  const { data, error } = (await supabase
    .rpc('get_monthly_stats')
    .single()) as { data: any; error: any };

  console.log('📊 RPC get_monthly_stats result:', { data, error });

  if (error || !data) {
    console.error('Error fetching monthly stats:', error);

    // Fallback: retornar valores en cero
    return {
      currentMonth: { expenses: 0, income: 0, savings: 0 },
      previousMonth: { expenses: 0, income: 0 },
      totalBalance: await getTotalAccountBalance(),
      growthPercentage: 0
    };
  }

  // Mapear resultado RPC al tipo DashboardStats
  return {
    currentMonth: {
      expenses: Number(data.current_month_expenses) || 0,
      income: Number(data.current_month_income) || 0,
      savings: Number(data.current_month_savings) || 0
    },
    previousMonth: {
      expenses: Number(data.previous_month_expenses) || 0,
      income: Number(data.previous_month_income) || 0
    },
    totalBalance: await getTotalAccountBalance(),
    growthPercentage: Number(data.growth_percentage) || 0
  };
});

// =====================================================
// NOTA: Funciones legacy eliminadas
// =====================================================
// Las siguientes funciones fueron removidas porque ya no se usan:
// - getDailyCashFlow() -> Era para gráficos del dashboard viejo
// - getExpensesByCategory() -> Era para pie chart del dashboard viejo
// - getRecentTransactions() -> Reemplazada por getRecentTransactionsEnhanced()
//
// Si las necesitas en el futuro, están en el historial de Git.
