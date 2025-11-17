/**
 * Budget Queries - Server-side data fetching
 * Solo lectura de datos
 */

import { createClient } from '@/lib/supabase/server';
import type { Budget, BudgetPeriod, BudgetAlert, BudgetStatus } from './types';

/**
 * Get all active budgets for the current user
 */
export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get budget by ID
 */
export async function getBudgetById(budgetId: string): Promise<Budget | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Get budgets with their current periods
 */
export async function getBudgetsWithPeriods() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select(
      `
      *,
      category:categories(id, name, icon, color),
      current_period:budget_periods!inner(*)
    `
    )
    .eq('is_active', true)
    .eq('budget_periods.is_current', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get budget status (recommended)
 * Returns budget data with spent, remaining, percentage, alerts
 */
export async function getBudgetStatus(): Promise<BudgetStatus[]> {
  const supabase = await createClient();

  // Get all active budgets with their current periods and categories
  const { data: budgets, error } = await supabase
    .from('budgets')
    .select(
      `
      *,
      category:categories(id, name, icon, color),
      current_period:budget_periods!left(*)
    `
    )
    .eq('is_active', true)
    .eq('budget_periods.is_current', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!budgets) return [];

  // Transform to BudgetStatus format and filter out budgets without current period
  return budgets
    .filter((budget: any) => budget.current_period?.[0])
    .map((budget: any) => {
      const period = budget.current_period[0];
      const percentageUsed =
        period.budget_amount > 0
          ? Math.round(
              (period.spent_amount / period.budget_amount) * 100 * 10
            ) / 10
          : 0;

      return {
        id: budget.id,
        profile_id: budget.profile_id,
        category_id: budget.category_id,
        category_name: budget.category?.name || null,
        category_icon: budget.category?.icon || null,
        category_color: budget.category?.color || null,
        period_type: budget.period_type,
        amount: budget.amount,
        currency: budget.currency,
        rollover_unused: budget.rollover_unused,
        alert_at_80: budget.alert_at_80,
        alert_at_90: budget.alert_at_90,
        alert_at_100: budget.alert_at_100,
        start_date: budget.start_date,
        end_date: budget.end_date,
        is_active: budget.is_active,
        created_at: budget.created_at,
        updated_at: budget.updated_at,
        current_period: {
          id: period.id,
          budget_id: period.budget_id,
          period_start: period.period_start,
          period_end: period.period_end,
          budget_amount: period.budget_amount,
          spent: period.spent_amount,
          remaining: period.remaining_amount,
          rollover_from_previous: period.rollover_from_previous,
          percentage_used: percentageUsed,
          is_over_budget: period.spent_amount > period.budget_amount,
          days_remaining:
            Math.ceil(
              (new Date(period.period_end).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            ) || 0,
          is_current: period.is_current
        },
        unread_alerts_count: 0 // TODO: Add alert count query if needed
      };
    });
}

/**
 * Get all periods for a specific budget
 */
export async function getBudgetPeriods(
  budgetId: string
): Promise<BudgetPeriod[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budget_periods')
    .select('*')
    .eq('budget_id', budgetId)
    .order('period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get current period for a budget
 */
export async function getCurrentBudgetPeriod(
  budgetId: string
): Promise<BudgetPeriod | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budget_periods')
    .select('*')
    .eq('budget_id', budgetId)
    .eq('is_current', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Get unread alerts for a budget
 */
export async function getUnreadAlerts(
  budgetId?: string
): Promise<BudgetAlert[]> {
  const supabase = await createClient();

  let query = supabase
    .from('budget_alerts')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (budgetId) {
    query = query.eq('budget_id', budgetId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get all alerts for a budget period
 */
export async function getPeriodAlerts(
  periodId: string
): Promise<BudgetAlert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budget_alerts')
    .select('*')
    .eq('period_id', periodId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
