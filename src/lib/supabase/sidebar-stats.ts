/**
 * Sidebar Stats Data Layer
 * Funciones para obtener estadísticas que se muestran en el sidebar
 *
 * NOTA: Usa el esquema real de la base de datos:
 * - transactions usa profile_id (no user_id)
 * - transaction_date es DATE (no timestamp)
 * - money_tag_groups (no money_tags)
 */

import { createClient } from './server';
import { getTotalAccountBalance } from './dashboard-stats';

/**
 * Obtiene el profile_id desde el usuario autenticado
 */
async function getProfileId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Obtener profile_id desde auth_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    return profile?.id || null;
  } catch (error) {
    console.error('Error getting profile_id:', error);
    return null;
  }
}

/**
 * Obtiene los gastos del día actual
 * Usa transaction_date (DATE) para filtrar por día
 */
export async function getTodayExpenses(): Promise<number> {
  try {
    const supabase = await createClient();
    const profileId = await getProfileId();

    if (!profileId) return 0;

    // Usar transaction_date (DATE) en lugar de created_at (TIMESTAMP)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('profile_id', profileId)
      .eq('type', 'expense')
      .eq('status', 'completed')
      .eq('transaction_date', today);

    if (error) {
      console.error('Error fetching today expenses:', error);
      return 0;
    }

    if (!data || data.length === 0) return 0;

    return data.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );
  } catch (error) {
    console.error('Exception in getTodayExpenses:', error);
    return 0;
  }
}

/**
 * Obtiene el total de gastos del mes actual
 */
export async function getCurrentMonthExpenses(): Promise<number> {
  try {
    const supabase = await createClient();
    const profileId = await getProfileId();

    if (!profileId) return 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('profile_id', profileId)
      .eq('type', 'expense')
      .eq('status', 'completed')
      .gte('transaction_date', startOfMonth);

    if (error) {
      console.error('Error fetching current month expenses:', error);
      return 0;
    }

    return data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  } catch (error) {
    console.error('Exception in getCurrentMonthExpenses:', error);
    return 0;
  }
}

/**
 * Obtiene el número de grupos con deudas pendientes
 * Cuenta money_tag_groups no liquidados donde el usuario participa
 */
export async function getPendingPaymentsCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const profileId = await getProfileId();

    if (!profileId) return 0;

    // Contar grupos no liquidados donde el usuario es participante
    const { data, error } = await supabase
      .from('money_tag_groups')
      .select('id', { count: 'exact', head: false })
      .eq('is_settled', false);

    if (error) {
      console.error('Error fetching pending groups:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Exception in getPendingPaymentsCount:', error);
    return 0;
  }
}

/**
 * Obtiene el número de grupos activos (MoneyTags)
 * Cuenta todos los grupos no liquidados donde el usuario es dueño o participa
 */
export async function getMoneyTagsCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const profileId = await getProfileId();

    if (!profileId) return 0;

    // Contar grupos donde el usuario es owner o participante
    const { data: ownedGroups } = await supabase
      .from('money_tag_groups')
      .select('id')
      .eq('owner_profile_id', profileId)
      .eq('is_settled', false);

    const { data: participantGroups } = await supabase
      .from('group_participants')
      .select('group_id')
      .eq('profile_id', profileId);

    if (!participantGroups) return ownedGroups?.length || 0;

    // Combinar ambos (sin duplicados)
    const groupIds = new Set([
      ...(ownedGroups?.map((g) => g.id) || []),
      ...(participantGroups?.map((g) => g.group_id) || [])
    ]);

    return groupIds.size;
  } catch (error) {
    console.error('Exception in getMoneyTagsCount:', error);
    return 0;
  }
}

/**
 * Obtiene el cambio mensual del balance
 * Usa transaction_date (DATE) para filtros
 */
export async function getMonthlyBalanceChange(): Promise<{
  change: number;
  percentage: number;
}> {
  try {
    const supabase = await createClient();
    const profileId = await getProfileId();

    if (!profileId) return { change: 0, percentage: 0 };

    const now = new Date();

    // Mes actual: YYYY-MM-01 a YYYY-MM-DD actual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    // Mes pasado
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0];

    // Query para mes actual
    const { data: currentMonthTransactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .gte('transaction_date', startOfMonth);

    // Query para mes pasado
    const { data: lastMonthTransactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .gte('transaction_date', startOfLastMonth)
      .lte('transaction_date', endOfLastMonth);

    // Calcular balance mes actual
    const currentIncome =
      currentMonthTransactions
        ?.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const currentExpenses =
      currentMonthTransactions
        ?.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const currentBalance = currentIncome - currentExpenses;

    // Calcular balance mes pasado
    const lastIncome =
      lastMonthTransactions
        ?.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const lastExpenses =
      lastMonthTransactions
        ?.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const lastBalance = lastIncome - lastExpenses;

    const change = currentBalance - lastBalance;
    const percentage =
      lastBalance !== 0 ? (change / Math.abs(lastBalance)) * 100 : 0;

    return { change, percentage };
  } catch (error) {
    console.error('Exception in getMonthlyBalanceChange:', error);
    return { change: 0, percentage: 0 };
  }
}

/**
 * Obtiene todas las estadísticas del sidebar en una sola llamada
 */
export async function getSidebarStats() {
  try {
    const [
      totalBalance,
      todayExpenses,
      monthExpenses,
      pendingPayments,
      moneyTagsCount,
      balanceChange
    ] = await Promise.all([
      getTotalAccountBalance(),
      getTodayExpenses(),
      getCurrentMonthExpenses(),
      getPendingPaymentsCount(),
      getMoneyTagsCount(),
      getMonthlyBalanceChange()
    ]);

    return {
      totalBalance,
      monthlyChange: balanceChange.change,
      changePercentage: balanceChange.percentage,
      todayExpenses,
      monthExpenses,
      pendingPayments,
      moneyTagsCount
    };
  } catch (error) {
    console.error('Exception in getSidebarStats:', error);
    // Retornar valores por defecto en caso de error
    return {
      totalBalance: 0,
      monthlyChange: 0,
      changePercentage: 0,
      todayExpenses: 0,
      monthExpenses: 0,
      pendingPayments: 0,
      moneyTagsCount: 0
    };
  }
}
