/**
 * Budgets Module - Public API
 * Single entry point for all budget-related functionality
 */

// Types
export type * from './types';
export type * from './admin-types';

// Queries (server-side)
export {
  getBudgets,
  getBudgetById,
  getBudgetsWithPeriods,
  getBudgetStatus,
  getBudgetPeriods,
  getCurrentBudgetPeriod,
  getUnreadAlerts,
  getPeriodAlerts
} from './queries';

// Mutations (server-side)
export {
  createBudget,
  updateBudget,
  deleteBudget,
  hardDeleteBudget,
  markAlertAsRead,
  markAllBudgetAlertsAsRead
} from './mutations';

// Utilities (client & server)
export {
  formatBudgetAmount,
  getBudgetStatusColor,
  getBudgetStatusVariant,
  getPeriodTypeLabel,
  calculatePeriodDates,
  getDaysRemainingInPeriod,
  getDaysElapsedInPeriod,
  getTotalDaysInPeriod,
  calculateProjectedSpending,
  formatPeriodRange,
  isBudgetCloseToLimit,
  isBudgetOverLimit,
  getBudgetAlertMessage,
  sortBudgetsByPriority
} from './utils';

// Admin Functions (server-side only)
export {
  getAllBudgetsWithDetails,
  getBudgetsHealth,
  forceDeleteBudget
} from './admin-queries';
