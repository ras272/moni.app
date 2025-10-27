-- Migration: create_money_tags
-- Description: Crea estructura completa de MoneyTags para gastos compartidos
-- Created: 2025-10-27
-- Version: 1.0
-- Dependencies: 20251027000001_create_base_schema.sql

BEGIN;

-- =====================================================
-- 1. CREAR TABLA: money_tag_groups
-- =====================================================

CREATE TABLE public.money_tag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. CREAR TABLA: group_participants
-- =====================================================

CREATE TABLE public.group_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES money_tag_groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_profile_per_group UNIQUE(group_id, profile_id)
);

-- =====================================================
-- 3. CREAR TABLA: group_expenses
-- =====================================================

CREATE TABLE public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES money_tag_groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PYG',
  paid_by_participant_id UUID NOT NULL REFERENCES group_participants(id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_expense_amount CHECK (amount > 0)
);

-- =====================================================
-- 4. CREAR TABLA: expense_splits
-- =====================================================

CREATE TABLE public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES group_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_participant_per_expense UNIQUE(expense_id, participant_id)
);

-- =====================================================
-- 5. ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX idx_groups_owner ON money_tag_groups(owner_profile_id, is_settled);
CREATE INDEX idx_groups_created ON money_tag_groups(created_at DESC);

CREATE INDEX idx_participants_group ON group_participants(group_id);
CREATE INDEX idx_participants_profile ON group_participants(profile_id) 
WHERE profile_id IS NOT NULL;

-- Índice único parcial para phone (solo cuando phone no es NULL)
CREATE UNIQUE INDEX unique_phone_per_group ON group_participants(group_id, phone) 
WHERE phone IS NOT NULL;

CREATE INDEX idx_expenses_group ON group_expenses(group_id, expense_date DESC);
CREATE INDEX idx_expenses_paid_by ON group_expenses(paid_by_participant_id);

CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_splits_participant ON expense_splits(participant_id);

-- =====================================================
-- 6. FUNCIÓN: Sincronizar nombre de participante registrado
-- =====================================================

CREATE OR REPLACE FUNCTION sync_participant_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el participante está vinculado a un perfil, usar su nombre
  IF NEW.profile_id IS NOT NULL THEN
    SELECT full_name INTO NEW.name
    FROM profiles
    WHERE id = NEW.profile_id;
    
    -- Si no se encuentra el perfil, mantener el nombre proporcionado
    IF NEW.name IS NULL THEN
      RAISE EXCEPTION 'Perfil no encontrado para profile_id: %', NEW.profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCIÓN: Calcular deudas de grupo
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_group_debts(group_uuid UUID)
RETURNS TABLE(
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  amount BIGINT
) AS $$
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
      split_count INTEGER;
    BEGIN
      -- Cuánto pagó este participante
      SELECT COALESCE(SUM(amount), 0) INTO total_paid
      FROM group_expenses
      WHERE group_id = group_uuid 
        AND paid_by_participant_id = participant.id;
      
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON money_tag_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON group_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Sincronizar nombre de participante registrado
CREATE TRIGGER sync_participant_name_trigger
  BEFORE INSERT OR UPDATE ON group_participants
  FOR EACH ROW
  WHEN (NEW.profile_id IS NOT NULL)
  EXECUTE FUNCTION sync_participant_name();

COMMIT;
