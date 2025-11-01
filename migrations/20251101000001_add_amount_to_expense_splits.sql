-- =====================================================
-- Migration: Add amount field to expense_splits
-- =====================================================
-- Description: Agrega campo 'amount' a expense_splits para soportar divisiones flexibles
-- Author: Sistema
-- Date: 2025-11-01
-- Version: 1.0.0
-- Dependencies: 20251027000003_create_money_tags.sql
--
-- OBJETIVO:
--   Permitir que cada split tenga un monto específico en lugar de calcularlo
--   dinámicamente. Esto habilita divisiones flexibles (porcentajes, montos exactos, etc.)
--
-- CAMBIOS:
--   - Agrega columna 'amount' tipo BIGINT a tabla expense_splits
--   - La columna es NULLABLE inicialmente para backward compatibility
--   - Incluye constraint CHECK para montos positivos
--   - Incluye índice para optimizar queries de suma
--
-- SEGURIDAD:
--   - RLS policies existentes se mantienen
--   - No afecta datos existentes (columna nullable)
--   - Transacción atómica con BEGIN/COMMIT
--
-- ROLLBACK:
--   Ver sección al final del archivo
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFICAR PRERREQUISITOS
-- =====================================================

-- Verificar que la tabla expense_splits existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_splits'
  ) THEN
    RAISE EXCEPTION 'Tabla expense_splits no existe. Ejecuta migraciones anteriores primero.';
  END IF;
END $$;

-- Verificar que la columna amount NO existe aún
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_splits'
    AND column_name = 'amount'
  ) THEN
    RAISE EXCEPTION 'La columna amount ya existe en expense_splits. Migración ya aplicada.';
  END IF;
END $$;

-- =====================================================
-- 2. AGREGAR COLUMNA amount
-- =====================================================

-- Agregar columna amount (NULLABLE inicialmente para backward compatibility)
ALTER TABLE expense_splits 
ADD COLUMN amount BIGINT;

COMMENT ON COLUMN expense_splits.amount IS 
'Monto que este participante debe pagar en el gasto. 
NULL = división equitativa (comportamiento legacy).
NOT NULL = división flexible (porcentaje, monto exacto, etc.)';

-- =====================================================
-- 3. AGREGAR CONSTRAINT: Monto positivo
-- =====================================================

ALTER TABLE expense_splits
ADD CONSTRAINT positive_split_amount 
CHECK (amount IS NULL OR amount > 0);

COMMENT ON CONSTRAINT positive_split_amount ON expense_splits IS
'Garantiza que si se especifica un monto, debe ser positivo.
NULL está permitido para backward compatibility.';

-- =====================================================
-- 4. CREAR ÍNDICE para optimizar queries de suma
-- =====================================================

-- Índice para queries que sumen splits por expense_id
CREATE INDEX idx_expense_splits_amount 
ON expense_splits(expense_id, amount)
WHERE amount IS NOT NULL;

COMMENT ON INDEX idx_expense_splits_amount IS
'Optimiza queries que sumen splits.amount por expense_id.
Solo indexa rows con amount NOT NULL para eficiencia.';

-- =====================================================
-- 5. CREAR FUNCIÓN HELPER: Validar suma de splits
-- =====================================================

-- Esta función será usada por el trigger en la próxima migración
CREATE OR REPLACE FUNCTION validate_expense_splits_sum(expense_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_splits BIGINT;
  expense_total BIGINT;
  splits_count INTEGER;
  splits_with_amount INTEGER;
BEGIN
  -- Obtener monto del gasto
  SELECT amount INTO expense_total
  FROM group_expenses
  WHERE id = expense_uuid;
  
  IF expense_total IS NULL THEN
    RAISE EXCEPTION 'Gasto no encontrado: %', expense_uuid;
  END IF;
  
  -- Contar splits totales y splits con amount
  SELECT 
    COUNT(*),
    COUNT(amount)
  INTO 
    splits_count,
    splits_with_amount
  FROM expense_splits
  WHERE expense_id = expense_uuid;
  
  -- CASO 1: Todos los splits tienen amount (división flexible)
  IF splits_with_amount = splits_count AND splits_count > 0 THEN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_splits
    FROM expense_splits
    WHERE expense_id = expense_uuid;
    
    -- La suma DEBE ser exacta
    IF total_splits != expense_total THEN
      RAISE EXCEPTION 'Suma de splits (%) no coincide con monto del gasto (%). Diferencia: %', 
        total_splits, expense_total, ABS(total_splits - expense_total);
    END IF;
    
    RETURN TRUE;
  END IF;
  
  -- CASO 2: Ningún split tiene amount (división equitativa legacy)
  IF splits_with_amount = 0 THEN
    -- No hay validación necesaria, se calcula dinámicamente
    RETURN TRUE;
  END IF;
  
  -- CASO 3: Estado inconsistente (algunos con amount, otros sin)
  RAISE EXCEPTION 'Estado inconsistente: % de % splits tienen amount. Deben ser todos o ninguno.',
    splits_with_amount, splits_count;
    
  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION validate_expense_splits_sum IS
'Valida que la suma de splits.amount coincida con el monto del gasto.
Soporta 2 casos:
1. Todos los splits con amount (división flexible) → suma debe ser exacta
2. Ningún split con amount (división equitativa legacy) → no valida
Estado mixto lanza excepción.';

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Permitir SELECT en la nueva columna a usuarios autenticados
-- (Las policies RLS existentes controlan el acceso)
GRANT SELECT ON expense_splits TO authenticated;

-- =====================================================
-- 7. ANÁLISIS DE IMPACTO
-- =====================================================

-- Log de cambios para auditoría
DO $$
DECLARE
  total_splits INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_splits FROM expense_splits;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columna expense_splits.amount agregada';
  RAISE NOTICE 'Total de splits existentes: %', total_splits;
  RAISE NOTICE 'Estado: Todos los splits existentes tienen amount = NULL (backward compatible)';
  RAISE NOTICE 'Siguiente paso: Ejecutar backfill si deseas calcular amounts para datos legacy';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- 
-- Para revertir esta migración, ejecuta:
-- 
-- BEGIN;
-- 
-- -- 1. Eliminar función de validación
-- DROP FUNCTION IF EXISTS validate_expense_splits_sum(UUID);
-- 
-- -- 2. Eliminar índice
-- DROP INDEX IF EXISTS idx_expense_splits_amount;
-- 
-- -- 3. Eliminar constraint
-- ALTER TABLE expense_splits DROP CONSTRAINT IF EXISTS positive_split_amount;
-- 
-- -- 4. Eliminar columna
-- ALTER TABLE expense_splits DROP COLUMN IF EXISTS amount;
-- 
-- COMMIT;
-- 
-- =====================================================
