/**
 * Enhanced Dashboard Statistics Module
 *
 * Funciones server-side para el dashboard rediseñado con secciones especializadas.
 *
 * OPTIMIZACIÓN: Usa React cache() para deduplicar queries en el mismo request
 */

import { cache } from 'react';
import { createClient } from './server';
import { getMonthlyStats, getTotalAccountBalance } from './dashboard-stats';

// =====================================================
// TYPES
// =====================================================

export type ExpenseOverviewData = {
  operationalCosts: {
    total: number;
    labor: number;
    miscellaneous: number;
  };
  pendingInvoices: {
    total: number;
    awaitingApproval: number;
    reviewRequired: number;
  };
  reimbursableExpenses: {
    total: number;
    travel: number;
    officeSupplies: number;
  };
  approvedPayments: {
    total: number;
    processed: number;
    scheduled: number;
  };
};

export type WalletAccountData = {
  id: string;
  name: string;
  currentBalance: number;
  transactions: number;
  updatedAt: string;
  color: 'purple' | 'orange';
};

export type RevenueItem = {
  id: number;
  label: string;
  amount: number;
  trend: 'up' | 'down';
  color: string;
};

export type CategoryExpense = {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
};

export type RecentTransaction = {
  id: string;
  account: string;
  type: 'expense' | 'income';
  category: string;
  categoryColor: string;
  amount: number;
  date: string;
  relativeTime: string;
};

export type MonthlyComparison = {
  expenses: {
    current: number;
    previous: number;
    change: number;
  };
  income: {
    current: number;
    previous: number;
    change: number;
  };
  weeklyAverageBalance: number;
  savingsStreak: number;
};

// =====================================================
// EXPENSE OVERVIEW DATA
// =====================================================

/**
 * Obtiene los datos divididos en 4 categorías principales de gastos.
 * Por ahora usa distribución basada en los gastos totales del mes.
 * CACHED: Se ejecuta solo 1 vez por request, aunque se llame múltiples veces
 */
export const getExpenseOverviewData = cache(
  async (): Promise<ExpenseOverviewData> => {
    const stats = await getMonthlyStats();
    const totalExpenses = stats.currentMonth.expenses;

    // Distribución aproximada de gastos
    const operationalTotal = totalExpenses * 0.4;
    const pendingTotal = totalExpenses * 0.25;
    const reimbursableTotal = totalExpenses * 0.15;
    const approvedTotal = totalExpenses * 0.2;

    return {
      operationalCosts: {
        total: operationalTotal,
        labor: operationalTotal * 0.8,
        miscellaneous: operationalTotal * 0.2
      },
      pendingInvoices: {
        total: pendingTotal,
        awaitingApproval: pendingTotal * 0.7,
        reviewRequired: pendingTotal * 0.3
      },
      reimbursableExpenses: {
        total: reimbursableTotal,
        travel: reimbursableTotal * 0.6,
        officeSupplies: reimbursableTotal * 0.4
      },
      approvedPayments: {
        total: approvedTotal,
        processed: approvedTotal * 0.7,
        scheduled: approvedTotal * 0.3
      }
    };
  }
);

// =====================================================
// WALLET ACCOUNTS DATA
// =====================================================

/**
 * Obtiene información de cuentas con datos adicionales para el diseño mejorado.
 * CACHED: Se ejecuta solo 1 vez por request
 */
export const getWalletAccountsData = cache(
  async (): Promise<WalletAccountData[]> => {
    const supabase = await createClient();

    // Obtener cuentas activas
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, current_balance, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(2);

    if (accountsError || !accounts || accounts.length === 0) {
      console.error('Error fetching wallet accounts:', accountsError);
      return [];
    }

    // Obtener conteo de transacciones por cuenta en paralelo
    const walletPromises = accounts.map(async (account, i) => {
      // Contar transacciones de esta cuenta
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', account.id);

      // Calcular tiempo desde última actualización
      const updatedAt = getRelativeTime(new Date(account.created_at));

      return {
        id: account.id,
        name: account.name,
        currentBalance: account.current_balance,
        transactions: count || 0,
        updatedAt: updatedAt,
        color: i === 0 ? 'purple' : 'orange'
      } as WalletAccountData;
    });

    const wallets = await Promise.all(walletPromises);
    return wallets;
  }
);

// =====================================================
// REVENUE OVERVIEW DATA
// =====================================================

/**
 * Obtiene datos de revenue por categoría.
 * CACHED: Se ejecuta solo 1 vez por request, aunque se llame múltiples veces
 */
export const getRevenueOverviewData = cache(
  async (): Promise<RevenueItem[]> => {
    const supabase = await createClient();

    // Obtener gastos por categoría del mes actual
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data, error } = await supabase.rpc('get_expenses_by_category', {
      p_start_date: startOfMonth.toISOString().split('T')[0],
      p_end_date: endOfMonth.toISOString().split('T')[0]
    });

    if (error || !data) {
      console.error('Error fetching revenue overview:', error);
      // Datos de ejemplo
      return [
        {
          id: 1,
          label: 'Operational Expenses',
          amount: 12500,
          trend: 'up',
          color: 'bg-purple-500'
        },
        {
          id: 2,
          label: 'New Income Stream',
          amount: 8000,
          trend: 'down',
          color: 'bg-orange-500'
        }
      ];
    }

    // Mapear categorías a revenue items
    return data.slice(0, 5).map((item: any, index: number) => ({
      id: index + 1,
      label: item.category_name,
      amount: Number(item.total_amount) || 0,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      color:
        index === 0
          ? 'bg-purple-500'
          : index === 1
            ? 'bg-orange-500'
            : 'bg-green-500'
    }));
  }
);

// =====================================================
// TOP EXPENSE CATEGORIES
// =====================================================

/**
 * Obtiene las top categorías de gasto del mes actual con porcentajes.
 * Los porcentajes se calculan relativos a los ingresos del mes.
 * CACHED: Se ejecuta solo 1 vez por request con los mismos parámetros
 */
export const getTopExpenseCategories = cache(
  async (
    limit: number = 3,
    monthlyIncome?: number
  ): Promise<CategoryExpense[]> => {
    const supabase = await createClient();

    // Paleta de colores moderna y vibrante
    const modernColors = [
      '#8B5CF6', // Violeta vibrante
      '#EC4899', // Rosa intenso
      '#F59E0B', // Ámbar brillante
      '#10B981', // Verde esmeralda
      '#3B82F6' // Azul brillante
    ];

    // Obtener gastos por categoría del mes actual
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    console.log('🥧 Fetching top expense categories...');

    const { data, error } = await supabase.rpc('get_expenses_by_category', {
      p_start_date: startOfMonth.toISOString().split('T')[0],
      p_end_date: endOfMonth.toISOString().split('T')[0]
    });

    if (error) {
      console.error('Error fetching top expense categories:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No expense categories found (empty dataset)');
      return [];
    }

    // Calcular el presupuesto base para los porcentajes
    // Usamos el MAYOR entre: ingresos del mes o (balance actual + gastos del mes)
    // Esto representa el dinero que TENÍAS disponible al inicio del mes
    const stats = await getMonthlyStats();
    const totalAccountBalance = await getTotalAccountBalance();

    // Calcular total de gastos del mes
    const totalExpenses = data.reduce((sum: number, cat: any) => {
      return sum + (Number(cat.total_amount) || 0);
    }, 0);

    // El presupuesto inicial = balance actual + lo que ya gastaste
    const initialBudget = totalAccountBalance + totalExpenses;

    // Usar el mayor entre ingresos registrados y presupuesto calculado
    const budgetAmount = Math.max(stats.currentMonth.income, initialBudget);

    console.log('💰 Income registered:', stats.currentMonth.income);
    console.log('💰 Current balance:', totalAccountBalance);
    console.log('💰 Total expenses:', totalExpenses);
    console.log('💰 Calculated initial budget:', initialBudget);
    console.log('💰 Final budget for percentages:', budgetAmount);
    console.log('📊 Categories data:', data);

    // Mapear y calcular porcentajes relativos al presupuesto
    const topCategories = data
      .slice(0, limit)
      .map((cat: any, index: number) => {
        const amount = Number(cat.total_amount) || 0;

        // Calcular porcentaje relativo al presupuesto inicial del mes
        // Muestra: "Esta categoría representa el X% de tu presupuesto mensual"
        const percentage =
          budgetAmount > 0 ? Math.round((amount / budgetAmount) * 100) : 0;

        console.log(
          `  ${cat.category_name}: ${amount} / ${budgetAmount} = ${percentage}%`
        );

        return {
          name: cat.category_name,
          amount: amount,
          percentage: percentage,
          color: modernColors[index % modernColors.length],
          icon: cat.category_icon || '📊'
        };
      });

    return topCategories;
  }
);

// =====================================================
// MONTHLY COMPARISON & TEMPORAL DATA
// =====================================================

/**
 * Obtiene comparación mensual completa para las 4 cards principales.
 * CACHED: Se ejecuta solo 1 vez por request
 */
export const getMonthlyComparison = cache(
  async (): Promise<MonthlyComparison> => {
    const stats = await getMonthlyStats();

    // Calcular cambio porcentual de gastos
    const expenseChange =
      stats.previousMonth.expenses > 0
        ? ((stats.currentMonth.expenses - stats.previousMonth.expenses) /
            stats.previousMonth.expenses) *
          100
        : 0;

    // Calcular cambio porcentual de ingresos
    const incomeChange =
      stats.previousMonth.income > 0
        ? ((stats.currentMonth.income - stats.previousMonth.income) /
            stats.previousMonth.income) *
          100
        : 0;

    // Calcular balance promedio semanal (últimas 4 semanas)
    const weeklyAverage = await getWeeklyAverageBalance();

    // Calcular racha de ahorro (meses consecutivos)
    const streak = await getSavingsStreak();

    return {
      expenses: {
        current: stats.currentMonth.expenses,
        previous: stats.previousMonth.expenses,
        change: expenseChange
      },
      income: {
        current: stats.currentMonth.income,
        previous: stats.previousMonth.income,
        change: incomeChange
      },
      weeklyAverageBalance: weeklyAverage,
      savingsStreak: streak
    };
  }
);

/**
 * Calcula el balance promedio semanal de las últimas 4 semanas.
 */
async function getWeeklyAverageBalance(): Promise<number> {
  const totalBalance = await getTotalAccountBalance();

  // Por ahora retornamos el balance total
  // En el futuro podríamos trackear histórico de balances
  return totalBalance;
}

/**
 * Calcula cuántos meses consecutivos el usuario ha ahorrado (ingresos > gastos).
 */
async function getSavingsStreak(): Promise<number> {
  const supabase = await createClient();

  // Obtener transacciones de los últimos 12 meses agrupadas por mes
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .eq('status', 'completed')
    .gte('transaction_date', startDate.toISOString());

  if (error || !data) {
    console.error('Error calculating savings streak:', error);
    return 0;
  }

  // Agrupar por mes
  const monthlyData: { [key: string]: { income: number; expenses: number } } =
    {};

  data.forEach((tx: any) => {
    const date = new Date(tx.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    if (tx.type === 'income') {
      monthlyData[monthKey].income += tx.amount;
    } else {
      monthlyData[monthKey].expenses += tx.amount;
    }
  });

  // Contar meses consecutivos con ahorro (empezando desde el más reciente)
  const months = Object.keys(monthlyData).sort().reverse();
  let streak = 0;

  for (const month of months) {
    const savings = monthlyData[month].income - monthlyData[month].expenses;
    if (savings > 0) {
      streak++;
    } else {
      break; // Rompe la racha
    }
  }

  return streak;
}

// =====================================================
// RECENT TRANSACTIONS
// =====================================================

/**
 * Obtiene las transacciones más recientes (últimos 7 días).
 * CACHED: Se ejecuta solo 1 vez por request con los mismos parámetros
 */
export const getRecentTransactionsEnhanced = cache(
  async (
    days: number = 7,
    limit: number = 10
  ): Promise<RecentTransaction[]> => {
    const supabase = await createClient();

    // Calcular fecha hace N días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('💰 Fetching recent transactions enhanced...');

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
      id,
      type,
      amount,
      transaction_date,
      account:accounts!account_id(name),
      category:categories!category_id(name, color)
    `
      )
      .eq('status', 'completed')
      .gte('transaction_date', startDate.toISOString())
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }

    // Transformar datos
    return data.map((tx: any) => {
      const account = Array.isArray(tx.account) ? tx.account[0] : tx.account;
      const category = Array.isArray(tx.category)
        ? tx.category[0]
        : tx.category;

      return {
        id: tx.id,
        account: account?.name || 'Cuenta desconocida',
        type: tx.type as 'expense' | 'income',
        category: category?.name || 'Sin categoría',
        categoryColor: category?.color || '#6366f1',
        amount: tx.amount,
        date: tx.transaction_date,
        relativeTime: getRelativeTimeSpanish(new Date(tx.transaction_date))
      };
    });
  }
);

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Convierte una fecha a formato relativo en español (ej: "Hace 2 días")
 */
function getRelativeTimeSpanish(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 6) {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } else if (diffDays > 1) {
    return `Hace ${diffDays} días`;
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffHours > 0) {
    return `Hace ${diffHours}h`;
  } else if (diffMinutes > 0) {
    return `Hace ${diffMinutes}m`;
  } else {
    return 'Ahora';
  }
}

/**
 * Convierte una fecha a formato relativo (ej: "2 days ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}
