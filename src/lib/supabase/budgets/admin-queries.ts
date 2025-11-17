/**
 * Admin Queries for Budget Management
 * Administrative functions for managing budgets
 */

import { createClient } from '@/lib/supabase/server';
import type {
  BudgetWithDetails,
  ListAllBudgetsResponse,
  BudgetHealth,
  BudgetHealthStatus
} from './admin-types';

/**
 * Get all budgets for current user, including those without periods
 * This is an admin function to diagnose and fix budget issues
 */
export async function getAllBudgetsWithDetails(): Promise<ListAllBudgetsResponse> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Get all budgets with category info
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select(
      `
      *,
      category:categories(name, icon)
    `
    )
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (budgetsError) throw budgetsError;
  if (!budgets) return { budgets: [], total_count: 0, orphaned_count: 0 };

  // For each budget, get period count and current period status
  const budgetsWithDetails: BudgetWithDetails[] = await Promise.all(
    budgets.map(async (budget: any) => {
      // Count total periods
      const { count: periodsCount } = await supabase
        .from('budget_periods')
        .select('*', { count: 'exact', head: true })
        .eq('budget_id', budget.id);

      // Check if has current period
      const { count: currentPeriodCount } = await supabase
        .from('budget_periods')
        .select('*', { count: 'exact', head: true })
        .eq('budget_id', budget.id)
        .eq('is_current', true);

      return {
        ...budget,
        category_name: budget.category?.name || null,
        category_icon: budget.category?.icon || null,
        periods_count: periodsCount || 0,
        has_current_period: (currentPeriodCount || 0) > 0
      };
    })
  );

  // Count orphaned budgets (without periods)
  const orphanedCount = budgetsWithDetails.filter(
    (b) => b.periods_count === 0
  ).length;

  return {
    budgets: budgetsWithDetails,
    total_count: budgetsWithDetails.length,
    orphaned_count: orphanedCount
  };
}

/**
 * Get budget health status
 * Analyzes budgets and identifies issues
 */
export async function getBudgetsHealth(): Promise<BudgetHealth[]> {
  const { budgets } = await getAllBudgetsWithDetails();

  return budgets.map((budget) => {
    let health_status: BudgetHealthStatus;
    let health_message: string | undefined;

    if (budget.periods_count === 0) {
      health_status = 'orphaned';
      health_message =
        'Presupuesto sin períodos. No aparecerá en la lista principal.';
    } else if (!budget.has_current_period) {
      health_status = 'expired';
      health_message = 'Sin período actual. Requiere renovación.';
    } else {
      health_status = 'healthy';
    }

    return {
      ...budget,
      health_status,
      health_message
    };
  });
}

/**
 * Force delete a budget and all related data
 * WARNING: This is a hard delete, cannot be undone
 */
export async function forceDeleteBudget(budgetId: string): Promise<{
  deleted_budget_id: string;
  deleted_periods_count: number;
  deleted_alerts_count: number;
}> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Verify budget belongs to user
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, profile_id')
    .eq('id', budgetId)
    .single();

  if (budgetError || !budget) throw new Error('Budget not found');
  if (budget.profile_id !== profile.id) {
    throw new Error('Unauthorized: Budget does not belong to user');
  }

  // Count periods and alerts before deleting
  const { count: periodsCount } = await supabase
    .from('budget_periods')
    .select('*', { count: 'exact', head: true })
    .eq('budget_id', budgetId);

  const { count: alertsCount } = await supabase
    .from('budget_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('budget_id', budgetId);

  // Delete alerts first (foreign key to periods)
  const { error: alertsError } = await supabase
    .from('budget_alerts')
    .delete()
    .eq('budget_id', budgetId);

  if (alertsError) throw alertsError;

  // Delete periods
  const { error: periodsError } = await supabase
    .from('budget_periods')
    .delete()
    .eq('budget_id', budgetId);

  if (periodsError) throw periodsError;

  // Delete budget
  const { error: deleteBudgetError } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId);

  if (deleteBudgetError) throw deleteBudgetError;

  return {
    deleted_budget_id: budgetId,
    deleted_periods_count: periodsCount || 0,
    deleted_alerts_count: alertsCount || 0
  };
}
