import type {
  RecurrenceFrequency,
  RecurringTransaction,
  RecurringTransactionWithRelations,
  RecurringTransactionHistory
} from '@/types/database';

// =====================================================
// INPUT TYPES (para crear/actualizar)
// =====================================================

export type CreateRecurringTransactionInput = {
  type: 'expense' | 'income';
  amount: number;
  currency?: string;
  description: string;
  merchant?: string;
  category_id?: string;
  account_id: string;
  notes?: string;

  // Configuración de recurrencia
  frequency: RecurrenceFrequency;
  interval_count?: number; // Default: 1
  day_of_period?: number; // Para monthly/weekly
  start_date: string; // ISO date string
  end_date?: string; // ISO date string, opcional
};

export type UpdateRecurringTransactionInput = Partial<
  Omit<
    CreateRecurringTransactionInput,
    'frequency' | 'start_date' | 'interval_count'
  >
> & {
  // Campos que SÍ se pueden cambiar después de crear
  description?: string;
  amount?: number;
  category_id?: string;
  account_id?: string;
  merchant?: string;
  notes?: string;
  end_date?: string;
};

// =====================================================
// FILTER TYPES (para queries)
// =====================================================

export type RecurringTransactionFilters = {
  is_active?: boolean;
  frequency?: RecurrenceFrequency;
  account_id?: string;
  category_id?: string;
  type?: 'expense' | 'income';
};

// =====================================================
// RESULT TYPES (respuestas de funciones)
// =====================================================

export type GenerateRecurringResult = {
  generated_count: number;
  processed_recurring_ids: string[];
};

// =====================================================
// RE-EXPORTS (para conveniencia)
// =====================================================

export type {
  RecurrenceFrequency,
  RecurringTransaction,
  RecurringTransactionWithRelations,
  RecurringTransactionHistory
};
