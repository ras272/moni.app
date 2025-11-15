import type { RecurrenceFrequency } from './types';

// =====================================================
// CALCULATE INITIAL NEXT OCCURRENCE
// =====================================================

export function calculateInitialNextOccurrence(
  startDate: string,
  frequency: RecurrenceFrequency,
  intervalCount: number = 1,
  dayOfPeriod?: number
): string {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Si la fecha de inicio es hoy o futura, usar esa fecha
  if (start >= today) {
    return startDate;
  }

  // Si ya pasó, calcular la próxima ocurrencia
  return calculateNextOccurrence(
    startDate,
    frequency,
    intervalCount,
    dayOfPeriod
  );
}

// =====================================================
// CALCULATE NEXT OCCURRENCE (Client-side)
// =====================================================

export function calculateNextOccurrence(
  fromDate: string,
  frequency: RecurrenceFrequency,
  intervalCount: number = 1,
  dayOfPeriod?: number
): string {
  const current = new Date(fromDate);

  switch (frequency) {
    case 'daily': {
      current.setDate(current.getDate() + intervalCount);
      break;
    }

    case 'weekly': {
      current.setDate(current.getDate() + intervalCount * 7);
      break;
    }

    case 'biweekly': {
      current.setDate(current.getDate() + 14);
      break;
    }

    case 'monthly': {
      const targetMonth = new Date(current);
      targetMonth.setMonth(targetMonth.getMonth() + intervalCount);

      // Si no se especifica día, usar el mismo día del mes
      const targetDay = dayOfPeriod || current.getDate();

      // Obtener el último día del mes objetivo
      const lastDayOfMonth = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0
      ).getDate();

      // Si el día solicitado es mayor al último día del mes, usar el último día
      const finalDay = Math.min(targetDay, lastDayOfMonth);

      targetMonth.setDate(finalDay);
      return targetMonth.toISOString().split('T')[0];
    }

    case 'yearly': {
      current.setFullYear(current.getFullYear() + intervalCount);
      break;
    }

    default:
      throw new Error(`Frecuencia no reconocida: ${frequency}`);
  }

  return current.toISOString().split('T')[0];
}

// =====================================================
// FORMAT FREQUENCY (Para UI)
// =====================================================

export function formatFrequency(
  frequency: RecurrenceFrequency,
  intervalCount: number = 1
): string {
  const labels: Record<RecurrenceFrequency, string> = {
    daily: 'día',
    weekly: 'semana',
    biweekly: 'quincena',
    monthly: 'mes',
    yearly: 'año'
  };

  const label = labels[frequency];

  if (intervalCount === 1) {
    if (frequency === 'biweekly') return 'Cada 2 semanas';
    return `Cada ${label}`;
  }

  return `Cada ${intervalCount} ${label}${intervalCount > 1 ? 's' : ''}`;
}

// =====================================================
// FORMAT NEXT OCCURRENCE DATE
// =====================================================

export function formatNextOccurrence(
  nextDate: string,
  locale: string = 'es-PY'
): string {
  const date = new Date(nextDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Si es hoy
  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  }

  // Si es mañana
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Mañana';
  }

  // Si es en los próximos 7 días
  const daysAhead = Math.floor(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysAhead >= 0 && daysAhead <= 7) {
    return `En ${daysAhead} día${daysAhead !== 1 ? 's' : ''}`;
  }

  // Formato largo
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// =====================================================
// GET FREQUENCY OPTIONS (Para Select)
// =====================================================

export function getFrequencyOptions(): Array<{
  value: RecurrenceFrequency;
  label: string;
}> {
  return [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal (cada 2 semanas)' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' }
  ];
}

// =====================================================
// VALIDATE DAY OF PERIOD
// =====================================================

export function validateDayOfPeriod(
  frequency: RecurrenceFrequency,
  dayOfPeriod?: number
): boolean {
  if (dayOfPeriod === undefined || dayOfPeriod === null) {
    // Es opcional para daily, biweekly, yearly
    return ['daily', 'biweekly', 'yearly'].includes(frequency);
  }

  // Validar según frecuencia
  if (frequency === 'monthly') {
    return dayOfPeriod >= 1 && dayOfPeriod <= 31;
  }

  if (frequency === 'weekly') {
    return dayOfPeriod >= 1 && dayOfPeriod <= 7;
  }

  // Para daily, biweekly, yearly no debería tener day_of_period
  return false;
}

// =====================================================
// CHECK IF RECURRING IS DUE
// =====================================================

export function isRecurringDue(nextOccurrenceDate: string): boolean {
  const nextDate = new Date(nextOccurrenceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return nextDate <= today;
}

// =====================================================
// CHECK IF RECURRING HAS ENDED
// =====================================================

export function hasRecurringEnded(
  endDate: string | null,
  nextOccurrenceDate: string
): boolean {
  if (!endDate) return false;

  const end = new Date(endDate);
  const next = new Date(nextOccurrenceDate);

  return next > end;
}
