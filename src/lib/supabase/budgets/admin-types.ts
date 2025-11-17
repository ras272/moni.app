/**
 * Admin Types for Budget Management
 * Types for administrative operations on budgets
 */

import type { Budget } from './types';

/**
 * Extended budget information including period count and category details
 */
export interface BudgetWithDetails extends Budget {
  category_name: string | null;
  category_icon: string | null;
  periods_count: number;
  has_current_period: boolean;
}

/**
 * Response from list-all endpoint
 */
export interface ListAllBudgetsResponse {
  budgets: BudgetWithDetails[];
  total_count: number;
  orphaned_count: number; // Budgets without periods
}

/**
 * Request body for force delete
 */
export interface ForceDeleteBudgetRequest {
  id: string;
}

/**
 * Response from force delete
 */
export interface ForceDeleteBudgetResponse {
  success: boolean;
  deleted_budget_id: string;
  deleted_periods_count: number;
  deleted_alerts_count: number;
}

/**
 * Budget status for admin purposes
 */
export type BudgetHealthStatus = 'healthy' | 'orphaned' | 'expired' | 'error';

/**
 * Budget with health status
 */
export interface BudgetHealth extends BudgetWithDetails {
  health_status: BudgetHealthStatus;
  health_message?: string;
}
