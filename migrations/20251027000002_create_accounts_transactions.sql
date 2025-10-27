-- Migration: create_accounts_transactions
-- Description: Crea tablas de cuentas y transacciones con triggers automáticos de balance
-- Created: 2025-10-27
-- Version: 1.0
-- Dependencies: 20251027000001_create_base_schema.sql

BEGIN;

-- =====================================================
-- 1. CREAR ENUMS
-- =====================================================

CREATE TYPE account_type AS ENUM ('bank', 'wallet', 'cash', 'credit_card', 'debit_card');
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');

-- =====================================================
-- 2. CREAR TABLA: accounts
-- =====================================================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  institution TEXT,
  currency TEXT NOT NULL DEFAULT 'PYG',
  initial_balance BIGINT NOT NULL DEFAULT 0,
  current_balance BIGINT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'wallet',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_initial_balance CHECK (initial_balance >= 0)
);

-- =====================================================
-- 3. CREAR TABLA: transactions
-- =====================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PYG',
  description TEXT NOT NULL,
  merchant TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  status transaction_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  receipt_url TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT transfer_requires_to_account CHECK (
    (type = 'transfer' AND to_account_id IS NOT NULL) OR
    (type IN ('expense', 'income') AND to_account_id IS NULL)
  ),
  CONSTRAINT no_self_transfer CHECK (
    type != 'transfer' OR account_id != to_account_id
  )
);

-- =====================================================
-- 4. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Accounts
CREATE INDEX idx_accounts_profile ON accounts(profile_id, is_active);
CREATE INDEX idx_accounts_currency ON accounts(currency, is_active);

-- Transactions (Críticos para queries frecuentes)
CREATE INDEX idx_transactions_profile_date ON transactions(
  profile_id, 
  transaction_date DESC
);

CREATE INDEX idx_transactions_account_status ON transactions(
  account_id, 
  status
) WHERE status = 'completed';

CREATE INDEX idx_transactions_category ON transactions(category_id) 
WHERE category_id IS NOT NULL;

CREATE INDEX idx_transactions_to_account ON transactions(to_account_id) 
WHERE to_account_id IS NOT NULL;

-- =====================================================
-- 5. FUNCIÓN: Validar cuentas de transacción
-- =====================================================

CREATE OR REPLACE FUNCTION validate_transaction_accounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que account_id pertenece al usuario
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = NEW.account_id 
    AND profile_id = NEW.profile_id
  ) THEN
    RAISE EXCEPTION 'La cuenta seleccionada no pertenece al usuario';
  END IF;
  
  -- Si es transferencia, validar to_account_id
  IF NEW.type = 'transfer' THEN
    IF NEW.to_account_id IS NULL THEN
      RAISE EXCEPTION 'Las transferencias requieren una cuenta destino';
    END IF;
    
    IF NEW.account_id = NEW.to_account_id THEN
      RAISE EXCEPTION 'No puedes transferir a la misma cuenta';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM accounts 
      WHERE id = NEW.to_account_id 
      AND profile_id = NEW.profile_id
    ) THEN
      RAISE EXCEPTION 'La cuenta destino no pertenece al usuario';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCIÓN: Actualizar balance de cuentas (CRÍTICO)
-- =====================================================

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- ========== INSERT: Nueva transacción completada ==========
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    
    -- Caso: EXPENSE (gasto)
    IF NEW.type = 'expense' THEN
      UPDATE accounts 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    
    -- Caso: INCOME (ingreso)
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    
    -- Caso: TRANSFER (transferencia)
    ELSIF NEW.type = 'transfer' THEN
      -- Restar de cuenta origen
      UPDATE accounts 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
      
      -- Sumar a cuenta destino
      UPDATE accounts 
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.to_account_id;
    END IF;
  
  -- ========== DELETE: Eliminar transacción completada ==========
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    
    -- Revertir el efecto de la transacción eliminada
    IF OLD.type = 'expense' THEN
      UPDATE accounts 
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    
    ELSIF OLD.type = 'transfer' THEN
      UPDATE accounts 
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
      
      UPDATE accounts 
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.to_account_id;
    END IF;
  
  -- ========== UPDATE: Cambio de status ==========
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    
    -- De no-completado a completado: APLICAR balance
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      IF NEW.type = 'expense' THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
      
      ELSIF NEW.type = 'income' THEN
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
      
      ELSIF NEW.type = 'transfer' THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
        
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.to_account_id;
      END IF;
    
    -- De completado a no-completado: REVERTIR balance
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      IF NEW.type = 'expense' THEN
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
      
      ELSIF NEW.type = 'income' THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
      
      ELSIF NEW.type = 'transfer' THEN
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
        
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.to_account_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Validar cuentas de transacción
CREATE TRIGGER validate_transaction_accounts_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_accounts();

-- Trigger: Actualizar balance automáticamente (CRÍTICO)
CREATE TRIGGER transaction_balance_update
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

COMMIT;
