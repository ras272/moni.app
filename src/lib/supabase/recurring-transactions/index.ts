// =====================================================
// PUBLIC API
// =====================================================
// Barrel file para importaciones limpias:
// import { fetchRecurringTransactions, createRecurringTransaction } from '@/lib/supabase/recurring-transactions'

// Types
export type * from './types';

// Queries (lectura)
export {
  fetchRecurringTransactions,
  fetchRecurringTransaction,
  fetchActiveRecurringTransactions,
  fetchRecurringTransactionHistory,
  fetchUpcomingRecurringTransactions,
  countActiveRecurringTransactions
} from './queries';

// Mutations (escritura)
export {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransactionStatus,
  pauseRecurringTransaction,
  resumeRecurringTransaction
} from './mutations';

// Utils
export {
  calculateInitialNextOccurrence,
  calculateNextOccurrence,
  formatFrequency,
  formatNextOccurrence,
  getFrequencyOptions,
  validateDayOfPeriod,
  isRecurringDue,
  hasRecurringEnded
} from './utils';
