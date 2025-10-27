-- =====================================================
-- Migration: Create group_settlements table
-- Date: 2025-10-27
-- =====================================================
-- Purpose: Register debt settlements between group members
-- When a member pays another, we record it here
-- The calculate_group_debts function will subtract these settlements
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE TABLE: group_settlements
-- =====================================================

CREATE TABLE public.group_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES money_tag_groups(id) ON DELETE CASCADE,
  
  -- Quien paga (deudor)
  from_participant_id UUID NOT NULL REFERENCES group_participants(id) ON DELETE CASCADE,
  
  -- Quien recibe (acreedor)
  to_participant_id UUID NOT NULL REFERENCES group_participants(id) ON DELETE CASCADE,
  
  -- Monto pagado
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PYG',
  
  -- Metadatos
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_settlement_amount CHECK (amount > 0),
  CONSTRAINT different_participants CHECK (from_participant_id != to_participant_id)
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_settlements_group ON group_settlements(group_id, settlement_date DESC);
CREATE INDEX idx_settlements_from ON group_settlements(from_participant_id);
CREATE INDEX idx_settlements_to ON group_settlements(to_participant_id);

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================

ALTER TABLE group_settlements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- SELECT: Ver settlements de tus grupos
CREATE POLICY settlements_select ON group_settlements
  FOR SELECT 
  USING (
    is_group_member(
      group_id,
      (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- INSERT: Solo participantes pueden registrar settlements (validado en Server Action)
CREATE POLICY settlements_insert ON group_settlements
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- DELETE: Solo owner del grupo puede eliminar settlements (por si hay error)
CREATE POLICY settlements_delete_owner ON group_settlements
  FOR DELETE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON TABLE group_settlements IS 
  'Registra los pagos/liquidaciones entre participantes de un grupo';

COMMENT ON COLUMN group_settlements.from_participant_id IS 
  'Participante que realiza el pago (deudor)';

COMMENT ON COLUMN group_settlements.to_participant_id IS 
  'Participante que recibe el pago (acreedor)';

COMMENT ON COLUMN group_settlements.amount IS 
  'Monto pagado en la moneda especificada';

COMMENT ON COLUMN group_settlements.settlement_date IS 
  'Fecha en que se realizó el pago';

-- =====================================================
-- 6. UPDATE calculate_group_debts FUNCTION
-- =====================================================
-- Modificar la función para restar los settlements del balance

DROP FUNCTION IF EXISTS calculate_group_debts(UUID);

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
      total_settlements_paid BIGINT;
      total_settlements_received BIGINT;
      net_balance BIGINT;
    BEGIN
      -- Cuánto pagó este participante en gastos
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
      
      -- Cuánto pagó en settlements (esto reduce su deuda)
      SELECT COALESCE(SUM(amount), 0) INTO total_settlements_paid
      FROM group_settlements
      WHERE group_id = group_uuid
        AND from_participant_id = participant.id;
      
      -- Cuánto recibió en settlements (esto reduce lo que le deben)
      SELECT COALESCE(SUM(amount), 0) INTO total_settlements_received
      FROM group_settlements
      WHERE group_id = group_uuid
        AND to_participant_id = participant.id;
      
      -- Balance neto: (pagó - debe) + (pagos recibidos - pagos realizados)
      net_balance := (total_paid - total_owes) + (total_settlements_received - total_settlements_paid);
      
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
  
  -- 2. Algoritmo greedy para minimizar transacciones
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
      temp_amount := LEAST(debtor_balance, creditor_balance);
      
      IF temp_amount > 0 THEN
        RETURN QUERY SELECT 
          balance.pid,
          balance.pname,
          creditor.cid,
          creditor.cname,
          temp_amount;
        
        debtor_balance := debtor_balance - temp_amount;
        creditor_balance := creditor_balance - temp_amount;
        
        balances := jsonb_set(
          balances,
          ARRAY[creditor.cid::text, 'balance'],
          to_jsonb(creditor_balance)
        );
      END IF;
      
      EXIT WHEN debtor_balance <= 0;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION calculate_group_debts IS 
  'Calcula las deudas minimizadas considerando gastos Y settlements pagados';

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
-- Test the updated function:
-- SELECT * FROM calculate_group_debts('your-group-id');
--
-- Register a settlement:
-- INSERT INTO group_settlements (group_id, from_participant_id, to_participant_id, amount)
-- VALUES ('group-id', 'debtor-id', 'creditor-id', 50000);
--
-- Check debts again - should be reduced by 50000
