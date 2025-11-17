/**
 * Budget Utilities - Helper functions
 * Funciones puras para cálculos y transformaciones
 */

import type { BudgetPeriodType, BudgetStatus, PeriodDates } from './types';

/**
 * Format currency amount (converts from smallest unit to readable format)
 */
export function formatBudgetAmount(
  amount: number,
  currency: string = 'PYG'
): string {
  if (currency === 'PYG') {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency
  }).format(amount / 100); // USD, EUR, etc. usan centavos
}

/**
 * Get status color based on percentage used
 */
export function getBudgetStatusColor(percentageUsed: number): string {
  if (percentageUsed >= 100) return 'destructive';
  if (percentageUsed >= 90) return 'destructive';
  if (percentageUsed >= 80) return 'warning';
  return 'success';
}

/**
 * Get status variant for UI components
 */
export function getBudgetStatusVariant(
  percentageUsed: number
): 'default' | 'success' | 'warning' | 'destructive' {
  if (percentageUsed >= 100) return 'destructive';
  if (percentageUsed >= 90) return 'warning';
  if (percentageUsed >= 80) return 'warning';
  return 'success';
}

/**
 * Get human-readable period type label
 */
export function getPeriodTypeLabel(periodType: BudgetPeriodType): string {
  const labels: Record<BudgetPeriodType, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    yearly: 'Anual'
  };
  return labels[periodType];
}

/**
 * Calculate period dates based on type
 * Client-side version (server has SQL function)
 */
export function calculatePeriodDates(
  periodType: BudgetPeriodType,
  referenceDate: Date = new Date()
): PeriodDates {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const date = referenceDate.getDate();

  switch (periodType) {
    case 'weekly': {
      // Lunes a Domingo
      const dayOfWeek = referenceDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajustar para domingo = 0
      const monday = new Date(referenceDate);
      monday.setDate(date + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        period_start: monday.toISOString().split('T')[0],
        period_end: sunday.toISOString().split('T')[0]
      };
    }

    case 'biweekly': {
      // 1-14 o 15-fin de mes
      if (date <= 14) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month, 14);
        return {
          period_start: start.toISOString().split('T')[0],
          period_end: end.toISOString().split('T')[0]
        };
      } else {
        const start = new Date(year, month, 15);
        const end = new Date(year, month + 1, 0); // Último día del mes
        return {
          period_start: start.toISOString().split('T')[0],
          period_end: end.toISOString().split('T')[0]
        };
      }
    }

    case 'monthly': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        period_start: start.toISOString().split('T')[0],
        period_end: end.toISOString().split('T')[0]
      };
    }

    case 'yearly': {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return {
        period_start: start.toISOString().split('T')[0],
        period_end: end.toISOString().split('T')[0]
      };
    }
  }
}

/**
 * Calculate days remaining in period
 */
export function getDaysRemainingInPeriod(periodEnd: string): number {
  const end = new Date(periodEnd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate days elapsed in period
 */
export function getDaysElapsedInPeriod(
  periodStart: string,
  periodEnd: string
): number {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // Asegurar que today esté dentro del período
  const currentDate = today > end ? end : today < start ? start : today;

  const diffTime = currentDate.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate total days in period
 */
export function getTotalDaysInPeriod(
  periodStart: string,
  periodEnd: string
): number {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días

  return diffDays;
}

/**
 * Calculate projected spending at end of period
 */
export function calculateProjectedSpending(budget: BudgetStatus): number {
  const daysElapsed = getDaysElapsedInPeriod(
    budget.current_period.period_start,
    budget.current_period.period_end
  );
  const totalDays = getTotalDaysInPeriod(
    budget.current_period.period_start,
    budget.current_period.period_end
  );

  if (daysElapsed === 0 || totalDays === 0) return 0;

  const dailyAverage = budget.current_period.spent / daysElapsed;
  return Math.round(dailyAverage * totalDays);
}

/**
 * Format period date range for display
 */
export function formatPeriodRange(
  periodStart: string,
  periodEnd: string
): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const formatter = new Intl.DateTimeFormat('es-PY', {
    day: 'numeric',
    month: 'short'
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

/**
 * Check if budget is close to limit
 */
export function isBudgetCloseToLimit(percentageUsed: number): boolean {
  return percentageUsed >= 80;
}

/**
 * Check if budget is over limit
 */
export function isBudgetOverLimit(percentageUsed: number): boolean {
  return percentageUsed >= 100;
}

/**
 * Get alert message based on percentage
 */
export function getBudgetAlertMessage(percentageUsed: number): string {
  if (percentageUsed >= 110) {
    return `Has excedido tu presupuesto en ${Math.round(percentageUsed - 100)}%`;
  }
  if (percentageUsed >= 100) {
    return 'Has alcanzado el límite de tu presupuesto';
  }
  if (percentageUsed >= 90) {
    return `Quedan solo ${Math.round(100 - percentageUsed)}% de tu presupuesto`;
  }
  if (percentageUsed >= 80) {
    return `Has usado ${Math.round(percentageUsed)}% de tu presupuesto`;
  }
  return '';
}

/**
 * Sort budgets by priority (over budget first, then by percentage)
 */
export function sortBudgetsByPriority(budgets: BudgetStatus[]): BudgetStatus[] {
  return [...budgets].sort((a, b) => {
    // Primero los que están sobre budget
    if (a.current_period.is_over_budget && !b.current_period.is_over_budget)
      return -1;
    if (!a.current_period.is_over_budget && b.current_period.is_over_budget)
      return 1;

    // Luego por porcentaje usado (mayor a menor)
    return b.current_period.percentage_used - a.current_period.percentage_used;
  });
}
