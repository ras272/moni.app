-- =====================================================
-- Migration: Fix calculate_group_debts function
-- Date: 2025-10-27
-- =====================================================
-- Problem: Column "amount" is ambiguous in function
--   - RETURNS TABLE declares "amount"
--   - group_expenses table has "amount" column
--   - PostgreSQL can't determine which one to use
--
-- Solution: Rename return column to "debt_amount"
-- =====================================================

BEGIN;

DROP FUNCTION IF EXISTS calculate_group_debts(UUID);

CREATE OR REPLACE FUNCTION calculate_group_debts(group_uuid UUID)
RETURNS TABLE (
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  debt_amount BIGINT  -- Changed from "amount" to "debt_amount"
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant RECORD;
  balances JSONB := '{}';
  balance RECORD;
  creditor RECORD;
  temp_amount BIGINT;
  debtor_balance BIGINT;
  creditor_balance BIGINT;
BEGIN
  -- 1. Calcular balance de cada participante
  FOR participant IN 
    SELECT id, name 
    FROM group_participants 
    WHERE group_id = group_uuid
  LOOP
    DECLARE
      total_paid BIGINT;
      total_owes BIGINT;
      net_balance BIGINT;
    BEGIN
      -- Cuánto pagó este participante
      SELECT COALESCE(SUM(ge.amount), 0) INTO total_paid
      FROM group_expenses ge
      WHERE ge.group_id = group_uuid 
        AND ge.paid_by_participant_id = participant.id;
      
      -- Cuánto debe (su parte en cada gasto donde participó)
      SELECT COALESCE(SUM(
        ge.amount / (
          SELECT COUNT(*) 
          FROM expense_splits 
          WHERE expense_id = ge.id
        )::NUMERIC
      ), 0)::BIGINT INTO total_owes
      FROM group_expenses ge
      JOIN expense_splits es ON es.expense_id = ge.id
      WHERE ge.group_id = group_uuid 
        AND es.participant_id = participant.id;
      
      net_balance := total_paid - total_owes;
      
      -- Almacenar balance en JSONB
      balances := jsonb_set(
        balances, 
        ARRAY[participant.id::text], 
        jsonb_build_object(
          'name', participant.name,
          'balance', net_balance
        )
      );
    END;
  END LOOP;
  
  -- 2. Algoritmo greedy simplificado para minimizar transacciones
  -- Iterar sobre deudores (balance negativo)
  FOR balance IN 
    SELECT 
      key::uuid as pid,
      (value->>'name')::text as pname,
      (value->>'balance')::bigint as bal
    FROM jsonb_each(balances)
    WHERE (value->>'balance')::bigint < 0
    ORDER BY (value->>'balance')::bigint ASC
  LOOP
    debtor_balance := ABS(balance.bal);
    
    -- Buscar acreedores (balance positivo) para saldar deuda
    FOR creditor IN 
      SELECT 
        key::uuid as cid,
        (value->>'name')::text as cname,
        (value->>'balance')::bigint as cbal
      FROM jsonb_each(balances)
      WHERE (value->>'balance')::bigint > 0
      ORDER BY (value->>'balance')::bigint DESC
    LOOP
      creditor_balance := creditor.cbal;
      
      -- Calcular monto a transferir (el menor entre deuda y crédito)
      temp_amount := LEAST(debtor_balance, creditor_balance);
      
      IF temp_amount > 0 THEN
        -- Retornar la deuda
        RETURN QUERY SELECT 
          balance.pid,
          balance.pname,
          creditor.cid,
          creditor.cname,
          temp_amount;
        
        -- Actualizar balances en JSONB
        debtor_balance := debtor_balance - temp_amount;
        creditor_balance := creditor_balance - temp_amount;
        
        -- Actualizar balance del acreedor en JSONB
        balances := jsonb_set(
          balances,
          ARRAY[creditor.cid::text, 'balance'],
          to_jsonb(creditor_balance)
        );
      END IF;
      
      -- Si la deuda está saldada, salir del loop
      EXIT WHEN debtor_balance <= 0;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION calculate_group_debts IS 
  'Calcula las deudas minimizadas entre participantes de un grupo';

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
-- Test with your group:
-- SELECT * FROM calculate_group_debts('your-group-id');
--
-- Expected result:
--   debtor_id | debtor_name | creditor_id | creditor_name | debt_amount
--   ----------+-------------+-------------+---------------+-------------
--   ...       | John        | ...         | Mary          | 50000
