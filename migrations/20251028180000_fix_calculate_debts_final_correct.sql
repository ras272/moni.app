-- Migración: Corregir cálculo de deudas con fórmula correcta
-- Fecha: 2025-10-28
-- 
-- PROBLEMA: La función actual tiene valores hardcodeados y la fórmula incorrecta
-- para calcular el balance después de settlements.
-- 
-- SOLUCIÓN: Reescribir con lógica dinámica:
-- balance = (pagado - debe) + settlements_pagados - settlements_recibidos
--
-- Explicación:
-- - Si pagas un settlement, reduces tu deuda → suma
-- - Si recibes un settlement, reduces lo que te deben → resta

CREATE OR REPLACE FUNCTION calculate_group_debts(group_uuid UUID)
RETURNS TABLE (
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  debt_amount BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Calcular cuánto debe cada participante (su parte de los gastos)
  expense_shares AS (
    SELECT 
      es.participant_id,
      SUM(ge.amount::decimal / (
        SELECT COUNT(*) 
        FROM expense_splits 
        WHERE expense_id = ge.id
      ))::bigint as amount_owed
    FROM expense_splits es
    JOIN group_expenses ge ON es.expense_id = ge.id
    WHERE ge.group_id = group_uuid
    GROUP BY es.participant_id
  ),
  -- Calcular cuánto pagó cada participante (gastos que cubrió)
  expense_payments AS (
    SELECT 
      paid_by_participant_id as participant_id,
      SUM(amount) as amount_paid
    FROM group_expenses
    WHERE group_id = group_uuid
    GROUP BY paid_by_participant_id
  ),
  -- Settlements pagados (salientes) - reduce mi deuda
  settlements_out AS (
    SELECT 
      from_participant_id as participant_id,
      SUM(amount) as total_paid
    FROM group_settlements
    WHERE group_id = group_uuid
    GROUP BY from_participant_id
  ),
  -- Settlements recibidos (entrantes) - reduce lo que me deben
  settlements_in AS (
    SELECT 
      to_participant_id as participant_id,
      SUM(amount) as total_received
    FROM group_settlements
    WHERE group_id = group_uuid
    GROUP BY to_participant_id
  ),
  -- Calcular balance final de cada participante
  participant_balances AS (
    SELECT 
      gp.id as participant_id,
      gp.name as participant_name,
      COALESCE(ep.amount_paid, 0) as paid,
      COALESCE(es.amount_owed, 0) as owes,
      COALESCE(so.total_paid, 0) as settlements_paid,
      COALESCE(si.total_received, 0) as settlements_received,
      -- Balance = (pagado - debe) + settlements_pagados - settlements_recibidos
      (COALESCE(ep.amount_paid, 0) - COALESCE(es.amount_owed, 0) + 
       COALESCE(so.total_paid, 0) - COALESCE(si.total_received, 0)) as balance
    FROM group_participants gp
    LEFT JOIN expense_shares es ON gp.id = es.participant_id
    LEFT JOIN expense_payments ep ON gp.id = ep.participant_id
    LEFT JOIN settlements_out so ON gp.id = so.participant_id
    LEFT JOIN settlements_in si ON gp.id = si.participant_id
    WHERE gp.group_id = group_uuid
  )
  -- Retornar solo las deudas (balance negativo debe a balance positivo)
  SELECT 
    debtor.participant_id as debtor_id,
    debtor.participant_name as debtor_name,
    creditor.participant_id as creditor_id,
    creditor.participant_name as creditor_name,
    ABS(debtor.balance)::bigint as debt_amount
  FROM participant_balances debtor
  CROSS JOIN participant_balances creditor
  WHERE debtor.balance < 0  -- deudor (debe dinero)
    AND creditor.balance > 0  -- acreedor (le deben dinero)
    AND ABS(debtor.balance) > 0  -- hay deuda pendiente
  ORDER BY debt_amount DESC;
END;
$$;

COMMENT ON FUNCTION calculate_group_debts IS 
'Calcula las deudas pendientes entre participantes de un grupo.
Fórmula: balance = (gastos_pagados - gastos_debidos) + settlements_pagados - settlements_recibidos
Retorna pares debtor-creditor con el monto adeudado.';
