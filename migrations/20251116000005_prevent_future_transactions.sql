-- =====================================================
-- Migration: Prevent Future Transaction Dates
-- Description: Evitar que se creen transacciones con fechas en el futuro
-- Created: 2025-11-16
-- Version: 1.0
-- =====================================================
--
-- PROBLEMA:
-- Los usuarios pueden crear transacciones con fechas futuras
-- Esto causa problemas en los cálculos de presupuestos y estadísticas
--
-- SOLUCIÓN:
-- 1. CHECK constraint en la tabla transactions
-- 2. Validación en el frontend (Zod schema)
--
-- EXCEPCIÓN:
-- Permitimos transacciones del día de mañana (útil para gastos de medianoche)
-- Pero bloqueamos fechas más allá de eso
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Agregar CHECK constraint para prevenir fechas futuras
-- =====================================================

-- Nota: CURRENT_DATE en PostgreSQL es la fecha del servidor en UTC
-- Permitimos hasta 1 día en el futuro para casos de medianoche
ALTER TABLE transactions
ADD CONSTRAINT chk_transaction_date_not_future
CHECK (transaction_date <= CURRENT_DATE + INTERVAL '1 day');

COMMENT ON CONSTRAINT chk_transaction_date_not_future ON transactions IS
'Previene que se creen transacciones con fechas más de 1 día en el futuro.
Permite transacciones de hoy y mañana para casos de medianoche.';

-- =====================================================
-- 2. Verificar que el constraint se creó correctamente
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_date_not_future'
  ) THEN
    RAISE EXCEPTION 'Constraint chk_transaction_date_not_future was not created!';
  END IF;

  RAISE NOTICE 'Constraint created successfully';
END $$;

COMMIT;

-- =====================================================
-- TESTING MANUAL (ejecutar después de la migración)
-- =====================================================

-- 1. Intentar crear transacción con fecha de hoy (DEBE FUNCIONAR):
-- INSERT INTO transactions (profile_id, type, amount, transaction_date, status)
-- VALUES ('tu-profile-id', 'expense', 10000, CURRENT_DATE, 'completed');

-- 2. Intentar crear transacción con fecha de mañana (DEBE FUNCIONAR):
-- INSERT INTO transactions (profile_id, type, amount, transaction_date, status)
-- VALUES ('tu-profile-id', 'expense', 10000, CURRENT_DATE + INTERVAL '1 day', 'completed');

-- 3. Intentar crear transacción con fecha de pasado mañana (DEBE FALLAR):
-- INSERT INTO transactions (profile_id, type, amount, transaction_date, status)
-- VALUES ('tu-profile-id', 'expense', 10000, CURRENT_DATE + INTERVAL '2 days', 'completed');
-- ERROR: new row for relation "transactions" violates check constraint "chk_transaction_date_not_future"

-- =====================================================
-- ROLLBACK (si algo sale mal, ejecutar esto)
-- =====================================================

-- Para remover el constraint:
-- ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transaction_date_not_future;
