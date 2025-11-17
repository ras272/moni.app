// Types for Budget System
// Synced with database schema from migration 20251116000001_create_budgets_system

export type BudgetPeriodType = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type BudgetAlertType =
  | 'warning_80'
  | 'warning_90'
  | 'limit_reached'
  | 'limit_exceeded';

export interface Budget {
  id: string;
  profile_id: string;
  category_id: string | null; // null = budget general
  period_type: BudgetPeriodType;
  amount: number; // en unidades mínimas (guaraníes, centavos, etc.)
  currency: string;
  rollover_unused: boolean;
  alert_at_80: boolean;
  alert_at_90: boolean;
  alert_at_100: boolean;
  start_date: string; // ISO date string
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetPeriod {
  id: string;
  budget_id: string;
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  budget_amount: number;
  rollover_from_previous: number;
  spent_amount: number;
  remaining_amount: number;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetAlert {
  id: string;
  budget_id: string;
  period_id: string;
  alert_type: BudgetAlertType;
  spent_amount: number;
  budget_amount: number;
  percentage_used: number;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Budget status response type
export interface BudgetStatus extends Budget {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  current_period: {
    id: string;
    budget_id: string;
    period_start: string;
    period_end: string;
    budget_amount: number;
    spent: number;
    remaining: number;
    rollover_from_previous: number;
    percentage_used: number;
    is_over_budget: boolean;
    days_remaining: number;
    is_current: boolean;
  };
  unread_alerts_count: number;
}

// Form types
export interface CreateBudgetInput {
  category_id?: string | null;
  period_type: BudgetPeriodType;
  amount: number;
  currency?: string;
  rollover_unused?: boolean;
  alert_at_80?: boolean;
  alert_at_90?: boolean;
  alert_at_100?: boolean;
  start_date?: string;
  end_date?: string | null;
}

export interface UpdateBudgetInput {
  id: string;
  amount?: number;
  period_type?: BudgetPeriodType;
  rollover_unused?: boolean;
  alert_at_80?: boolean;
  alert_at_90?: boolean;
  alert_at_100?: boolean;
  end_date?: string | null;
  is_active?: boolean;
}

// UI Helper types
export interface BudgetWithCategory extends Budget {
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

export interface BudgetCardData {
  budgetId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  periodType: BudgetPeriodType;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  periodStart: string;
  periodEnd: string;
  isOverBudget: boolean;
  hasUnreadAlerts: boolean;
  unreadAlertsCount: number;
}

// Period calculation types
export interface PeriodDates {
  period_start: string;
  period_end: string;
}
