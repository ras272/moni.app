/**
 * Dashboard Statistics Module
 *
 * Funciones server-side para obtener estadísticas del dashboard.
 * Todas las funciones respetan RLS y son optimizadas con RPC cuando es posible.
 */

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

export type DailyExpense = {
  date: string;
  expenses: number;
  income: number;
};

export type CategoryExpense = {
  name: string;
  amount: number;
  color: string;
  icon: string;
};

// =====================================================
// ACCOUNT BALANCE
// =====================================================

/**
 * Obtiene el saldo total de todas las cuentas activas del usuario.
 */
export async function getTotalAccountBalance(): Promise<number> {
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
}

// =====================================================
// MONTHLY STATISTICS
// =====================================================

/**
 * Obtiene estadísticas comparativas del mes actual vs mes anterior.
 * Usa RPC optimizada para mejor performance.
 */
export async function getMonthlyStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // Debug: verificar sesión
  const {
    data: { user }
  } = await supabase.auth.getUser();
  console.log('🔍 Dashboard Stats - User:', user?.id, user?.email);

  const { data, error } = await supabase.rpc('get_monthly_stats').single();

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
}

// =====================================================
// DAILY CASH FLOW
// =====================================================

/**
 * Obtiene el flujo de caja diario (ingresos vs gastos) para los últimos N días.
 * Usa RPC optimizada que incluye días sin transacciones.
 *
 * @param days - Número de días a incluir (default: 90)
 */
export async function getDailyCashFlow(
  days: number = 90
): Promise<DailyExpense[]> {
  const supabase = await createClient();

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = today.toISOString().split('T')[0];

  console.log('📅 Fetching daily cash flow:', { startDateStr, endDateStr });

  const { data, error } = await supabase.rpc('get_daily_cash_flow', {
    p_start_date: startDateStr,
    p_end_date: endDateStr
  });

  console.log('📊 Daily cash flow result:', {
    dataLength: data?.length,
    error
  });

  if (error) {
    console.error('Error fetching daily cash flow:', error);
    return [];
  }

  // Mapear resultado RPC al tipo DailyExpense
  return (data || []).map((row: any) => ({
    date: row.date,
    expenses: Number(row.expense_amount) || 0,
    income: Number(row.income_amount) || 0
  }));
}

// =====================================================
// EXPENSES BY CATEGORY
// =====================================================

/**
 * Obtiene la distribución de gastos por categoría.
 * Usa RPC optimizada con JOIN y GROUP BY.
 *
 * @param startDate - Fecha de inicio (opcional, default: 6 meses atrás)
 * @param endDate - Fecha de fin (opcional, default: hoy)
 */
export async function getExpensesByCategory(
  startDate?: string,
  endDate?: string
): Promise<CategoryExpense[]> {
  const supabase = await createClient();

  console.log('🥧 Fetching expenses by category...');

  const { data, error } = await supabase.rpc('get_expenses_by_category', {
    p_start_date: startDate || null,
    p_end_date: endDate || null
  });

  console.log('🥧 Expenses by category result:', {
    dataLength: data?.length,
    error
  });

  if (error) {
    console.error('Error fetching expenses by category:', error);
    return [];
  }

  // Mapear resultado RPC al tipo CategoryExpense
  return (data || []).map((row: any) => ({
    name: row.category_name,
    icon: row.category_icon,
    color: row.category_color,
    amount: Number(row.total_amount) || 0
  }));
}

// =====================================================
// RECENT TRANSACTIONS
// =====================================================

/**
 * Obtiene las transacciones más recientes del usuario.
 *
 * @param limit - Número máximo de transacciones (default: 5)
 */
export async function getRecentTransactions(limit: number = 5) {
  const supabase = await createClient();

  console.log('💰 Fetching recent transactions...');

  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
      id,
      type,
      amount,
      currency,
      description,
      merchant,
      transaction_date,
      category:categories!category_id(name, icon, color)
    `
    )
    .eq('status', 'completed')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  console.log('💰 Recent transactions result:', {
    dataLength: data?.length,
    error
  });

  if (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }

  return data || [];
}
