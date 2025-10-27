-- Migration: add_comments
-- Description: Agrega comentarios de documentación a tablas y columnas
-- Created: 2025-10-27
-- Version: 1.0
-- Dependencies: 20251027000001, 20251027000002, 20251027000003

BEGIN;

-- =====================================================
-- COMENTARIOS: profiles
-- =====================================================

COMMENT ON TABLE profiles IS 
'Perfiles de usuario vinculados a Supabase Auth mediante auth_id';

COMMENT ON COLUMN profiles.id IS 
'UUID único del perfil - PK interna de la aplicación';

COMMENT ON COLUMN profiles.auth_id IS 
'UUID que vincula a auth.users.id - Usado para autenticación y RLS';

COMMENT ON COLUMN profiles.default_currency IS 
'Moneda predeterminada del usuario (PYG, USD, etc.)';

COMMENT ON COLUMN profiles.timezone IS 
'Zona horaria para cálculos de fechas (default: America/Asuncion)';

-- =====================================================
-- COMENTARIOS: categories
-- =====================================================

COMMENT ON TABLE categories IS 
'Categorías de transacciones: sistema (is_system=true) y personalizadas por usuario';

COMMENT ON COLUMN categories.is_system IS 
'TRUE para categorías predefinidas del sistema, FALSE para categorías de usuario';

COMMENT ON COLUMN categories.profile_id IS 
'NULL para categorías del sistema, UUID del usuario para categorías personalizadas';

COMMENT ON COLUMN categories.type IS 
'Tipo de categoría: income (ingreso) o expense (gasto)';

COMMENT ON CONSTRAINT system_no_owner ON categories IS 
'Garantiza que categorías del sistema no tengan owner y viceversa';

-- =====================================================
-- COMENTARIOS: accounts
-- =====================================================

COMMENT ON TABLE accounts IS 
'Cuentas financieras del usuario: bancarias, billeteras digitales, efectivo, tarjetas';

COMMENT ON COLUMN accounts.type IS 
'Tipo de cuenta: bank, wallet, cash, credit_card, debit_card';

COMMENT ON COLUMN accounts.initial_balance IS 
'Balance inicial al crear la cuenta (en unidades mínimas: centavos para USD, guaraníes para PYG)';

COMMENT ON COLUMN accounts.current_balance IS 
'Balance actual - Se actualiza automáticamente con triggers al crear/eliminar transacciones';

COMMENT ON COLUMN accounts.icon IS 
'Nombre del icono Lucide: wallet, banknote, smartphone, credit-card, dollar-sign';

-- =====================================================
-- COMENTARIOS: transactions
-- =====================================================

COMMENT ON TABLE transactions IS 
'Transacciones financieras: gastos, ingresos y transferencias entre cuentas';

COMMENT ON COLUMN transactions.type IS 
'expense: gasto | income: ingreso | transfer: transferencia entre cuentas del usuario';

COMMENT ON COLUMN transactions.amount IS 
'Monto en unidades mínimas (BIGINT): centavos para USD, guaraníes para PYG. Siempre positivo';

COMMENT ON COLUMN transactions.to_account_id IS 
'Cuenta destino - Solo para type=transfer. Debe pertenecer al mismo usuario';

COMMENT ON COLUMN transactions.status IS 
'pending: no afecta balance | completed: afecta balance | cancelled: revertido';

COMMENT ON COLUMN transactions.transaction_date IS 
'Fecha de la transacción (solo DATE para agrupación). Puede ser diferente de created_at';

COMMENT ON CONSTRAINT transfer_requires_to_account ON transactions IS 
'Las transferencias DEBEN tener to_account_id, gastos/ingresos NO';

COMMENT ON CONSTRAINT no_self_transfer ON transactions IS 
'Previene transferir de una cuenta a sí misma';

-- =====================================================
-- COMENTARIOS: money_tag_groups
-- =====================================================

COMMENT ON TABLE money_tag_groups IS 
'Grupos de gastos compartidos (ej: "Asado del Sábado", "Viaje a Encarnación")';

COMMENT ON COLUMN money_tag_groups.owner_profile_id IS 
'Usuario que creó el grupo. Tiene permisos completos de administración';

COMMENT ON COLUMN money_tag_groups.is_settled IS 
'TRUE cuando todas las deudas del grupo han sido liquidadas';

-- =====================================================
-- COMENTARIOS: group_participants
-- =====================================================

COMMENT ON TABLE group_participants IS 
'Participantes en grupos de gastos compartidos. Pueden ser usuarios registrados o invitados externos';

COMMENT ON COLUMN group_participants.profile_id IS 
'UUID del usuario registrado. NULL para invitados externos sin cuenta';

COMMENT ON COLUMN group_participants.name IS 
'Nombre del participante. Se sincroniza automáticamente desde profiles.full_name si profile_id existe';

COMMENT ON COLUMN group_participants.phone IS 
'Teléfono para participantes externos (sin cuenta). Usado para invitaciones';

COMMENT ON CONSTRAINT unique_profile_per_group ON group_participants IS 
'Un usuario registrado solo puede aparecer una vez por grupo';

-- =====================================================
-- COMENTARIOS: group_expenses
-- =====================================================

COMMENT ON TABLE group_expenses IS 
'Gastos individuales dentro de un grupo compartido';

COMMENT ON COLUMN group_expenses.amount IS 
'Monto total del gasto en unidades mínimas (BIGINT)';

COMMENT ON COLUMN group_expenses.paid_by_participant_id IS 
'Participante que realizó el pago. Será acreedor en el cálculo de deudas';

COMMENT ON COLUMN group_expenses.expense_date IS 
'Fecha en que ocurrió el gasto (puede ser diferente de created_at)';

-- =====================================================
-- COMENTARIOS: expense_splits
-- =====================================================

COMMENT ON TABLE expense_splits IS 
'Junction table: Define qué participantes comparten un gasto específico';

COMMENT ON COLUMN expense_splits.participant_id IS 
'Participante que debe su parte proporcional del gasto';

COMMENT ON CONSTRAINT unique_participant_per_expense ON expense_splits IS 
'Un participante solo puede aparecer una vez por gasto';

-- =====================================================
-- COMENTARIOS: FUNCIONES
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column() IS 
'Trigger function: Actualiza automáticamente updated_at al modificar una fila';

COMMENT ON FUNCTION validate_transaction_accounts() IS 
'Trigger function: Valida que account_id y to_account_id pertenezcan al usuario';

COMMENT ON FUNCTION update_account_balance() IS 
'Trigger function: Actualiza current_balance de cuentas al crear/modificar/eliminar transacciones';

COMMENT ON FUNCTION sync_participant_name() IS 
'Trigger function: Sincroniza nombre del participante desde profiles si profile_id existe';

COMMENT ON FUNCTION calculate_group_debts(UUID) IS 
'Calcula deudas optimizadas de un grupo usando algoritmo greedy. Retorna quién debe a quién y cuánto';

COMMIT;
