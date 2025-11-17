/**
 * Budget Mutations - Database write operations
 * Todas las operaciones que modifican datos
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetAlert
} from './types';

/**
 * Create a new budget
 */
export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const supabase = await createClient();

  // Get profile_id from authenticated user
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      profile_id: profile.id,
      category_id: input.category_id ?? null,
      period_type: input.period_type,
      amount: input.amount,
      currency: input.currency ?? 'PYG',
      rollover_unused: input.rollover_unused ?? false,
      alert_at_80: input.alert_at_80 ?? true,
      alert_at_90: input.alert_at_90 ?? true,
      alert_at_100: input.alert_at_100 ?? true,
      start_date: input.start_date ?? new Date().toISOString().split('T')[0],
      end_date: input.end_date ?? null
    })
    .select()
    .single();

  if (error) throw error;

  // Create the initial budget period
  const { error: periodError } = await supabase.rpc(
    'get_or_create_current_budget_period',
    { p_budget_id: data.id }
  );

  if (periodError) {
    console.error('Error creating initial budget period:', periodError);
    // Don't throw - the budget was created successfully
  }

  return data;
}

/**
 * Update an existing budget
 */
export async function updateBudget(input: UpdateBudgetInput): Promise<Budget> {
  const supabase = await createClient();

  const updateData: Partial<Budget> = {};

  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.period_type !== undefined)
    updateData.period_type = input.period_type;
  if (input.rollover_unused !== undefined)
    updateData.rollover_unused = input.rollover_unused;
  if (input.alert_at_80 !== undefined)
    updateData.alert_at_80 = input.alert_at_80;
  if (input.alert_at_90 !== undefined)
    updateData.alert_at_90 = input.alert_at_90;
  if (input.alert_at_100 !== undefined)
    updateData.alert_at_100 = input.alert_at_100;
  if (input.end_date !== undefined) updateData.end_date = input.end_date;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('budgets')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a budget (soft delete by setting is_active = false)
 */
export async function deleteBudget(budgetId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('budgets')
    .update({ is_active: false })
    .eq('id', budgetId);

  if (error) throw error;
}

/**
 * Hard delete a budget (permanent)
 */
export async function hardDeleteBudget(budgetId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('budgets').delete().eq('id', budgetId);

  if (error) throw error;
}

/**
 * Mark an alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<BudgetAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budget_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all alerts for a budget as read
 */
export async function markAllBudgetAlertsAsRead(
  budgetId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('budget_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('budget_id', budgetId)
    .eq('is_read', false);

  if (error) throw error;
}
