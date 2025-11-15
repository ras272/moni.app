// =====================================================
// TYPES: Categories
// =====================================================

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  profile_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

// =====================================================
// TYPES: Accounts
// =====================================================

export type AccountType =
  | 'bank'
  | 'wallet'
  | 'cash'
  | 'credit_card'
  | 'debit_card';

export type Account = {
  id: string;
  profile_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  initial_balance: number;
  current_balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// =====================================================
// TYPES: Transactions
// =====================================================

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export type Transaction = {
  id: string;
  profile_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  merchant: string | null;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  status: TransactionStatus;
  notes: string | null;
  receipt_url: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

export type TransactionWithRelations = Transaction & {
  category: Category | null;
  account: Account;
  to_account: Account | null;
};

// =====================================================
// TYPES: MoneyTags
// =====================================================

export type MoneyTagGroup = {
  id: string;
  owner_profile_id: string;
  name: string;
  description: string | null;
  is_settled: boolean;
  slug: string; // URL-friendly slug
  is_public: boolean; // true = accesible vía link público
  created_at: string;
  updated_at: string;
};

export type GroupParticipant = {
  id: string;
  group_id: string;
  profile_id: string | null;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  invitation_status: 'pending' | 'accepted' | 'rejected';
  invitation_token: string | null; // Token para usuarios no registrados
  created_at: string;
};

export type GroupExpense = {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by_participant_id: string;
  expense_date: string;
  split_type: 'equal' | 'percentage' | 'exact' | 'itemized'; // NUEVO: tipo de división
  created_at: string;
  updated_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number; // NUEVO: monto que debe pagar este participante
  created_at: string;
};

export type GroupExpenseWithRelations = GroupExpense & {
  paid_by: GroupParticipant;
  splits: (ExpenseSplit & { participant: GroupParticipant })[];
};

export type GroupDebt = {
  debtor_id: string;
  debtor_name: string;
  creditor_id: string;
  creditor_name: string;
  debt_amount: number;
};

// =====================================================
// TYPES: Recurring Transactions
// =====================================================

export type RecurrenceFrequency =
  | 'daily' // Diario
  | 'weekly' // Semanal
  | 'biweekly' // Quincenal (cada 2 semanas)
  | 'monthly' // Mensual
  | 'yearly'; // Anual

export type RecurringTransaction = {
  id: string;
  profile_id: string;

  // Detalles de la transacción template
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  merchant: string | null;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  notes: string | null;

  // Configuración de recurrencia
  frequency: RecurrenceFrequency;
  interval_count: number; // Cada cuántos períodos (default: 1)
  day_of_period: number | null; // Día del mes (1-31) o día de semana (1-7)
  start_date: string; // Fecha de inicio (DATE)
  end_date: string | null; // Fecha de fin (DATE) - NULL = sin fin

  // Control de estado
  is_active: boolean;
  last_generated_date: string | null; // Última fecha en que se generó (DATE)
  next_occurrence_date: string; // Próxima fecha de generación (DATE)

  created_at: string;
  updated_at: string;
};

export type RecurringTransactionWithRelations = RecurringTransaction & {
  category: Category | null;
  account: Account;
  to_account: Account | null;
};

export type RecurringTransactionHistory = {
  id: string;
  recurring_transaction_id: string;
  transaction_id: string;
  generated_at: string; // TIMESTAMPTZ
  scheduled_date: string; // DATE - Fecha programada
  actual_date: string; // DATE - Fecha de creación real
  created_at: string;
};

export type RecurringTransactionHistoryWithRelations =
  RecurringTransactionHistory & {
    recurring_transaction: RecurringTransaction;
    transaction: Transaction;
  };
