-- =====================================================
-- Migration: Add split_type field to group_expenses
-- =====================================================
-- Description: Agrega campo 'split_type' a group_expenses para especificar tipo de división
-- Author: Sistema
-- Date: 2025-11-01
-- Version: 1.0.0
-- Dependencies: 20251101000001_add_amount_to_expense_splits.sql
--
-- OBJETIVO:
--   Registrar el tipo de división usado en cada gasto para:
--   - Mostrar correctamente en UI cómo se dividió
--   - Validar consistencia con expense_splits.amount
--   - Permitir re-cálculos o ajustes futuros
--
-- TIPOS DE DIVISIÓN SOPORTADOS:
--   - 'equal': División equitativa (todos pagan lo mismo)
--   - 'percentage': División por porcentajes (cada uno paga un % del total)
--   - 'exact': División por montos exactos (se especifica cuánto paga cada uno)
--   - 'itemized': División por ítems (futuro, cada uno paga ítems específicos)
--
-- CAMBIOS:
--   - Agrega columna 'split_type' tipo TEXT con valores permitidos
--   - Default 'equal' para backward compatibility
--   - Constraint CHECK para valores válidos
--   - Índice para queries filtradas por tipo
--
-- SEGURIDAD:
--   - RLS policies existentes se mantienen
--   - No afecta datos existentes (default 'equal')
--   - Transacción atómica con BEGIN/COMMIT
--
-- ROLLBACK:
--   Ver sección al final del archivo
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFICAR PRERREQUISITOS
-- =====================================================

-- Verificar que la tabla group_expenses existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'group_expenses'
  ) THEN
    RAISE EXCEPTION 'Tabla group_expenses no existe. Ejecuta migraciones anteriores primero.';
  END IF;
END $$;

-- Verificar que la columna split_type NO existe aún
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'group_expenses'
    AND column_name = 'split_type'
  ) THEN
    RAISE EXCEPTION 'La columna split_type ya existe en group_expenses. Migración ya aplicada.';
  END IF;
END $$;

-- Verificar que la migración anterior fue aplicada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_splits'
    AND column_name = 'amount'
  ) THEN
    RAISE EXCEPTION 'Columna expense_splits.amount no existe. Ejecuta migración 20251101000001 primero.';
  END IF;
END $$;

-- =====================================================
-- 2. AGREGAR COLUMNA split_type
-- =====================================================

-- Agregar columna split_type con default 'equal' (backward compatible)
ALTER TABLE group_expenses 
ADD COLUMN split_type TEXT NOT NULL DEFAULT 'equal';

COMMENT ON COLUMN group_expenses.split_type IS 
'Tipo de división usado en este gasto.
Valores permitidos:
- equal: División equitativa (todos pagan lo mismo)
- percentage: División por porcentajes
- exact: División por montos exactos
- itemized: División por ítems (futuro)
Default: equal (backward compatible con gastos existentes)';

-- =====================================================
-- 3. AGREGAR CONSTRAINT: Valores válidos
-- =====================================================

ALTER TABLE group_expenses
ADD CONSTRAINT valid_split_type 
CHECK (split_type IN ('equal', 'percentage', 'exact', 'itemized'));

COMMENT ON CONSTRAINT valid_split_type ON group_expenses IS
'Garantiza que split_type solo puede ser uno de los tipos soportados.
Agregar nuevos tipos requiere modificar este constraint.';

-- =====================================================
-- 4. CREAR ÍNDICE para optimizar queries por tipo
-- =====================================================

-- Índice para queries que filtren por split_type
CREATE INDEX idx_group_expenses_split_type 
ON group_expenses(group_id, split_type);

COMMENT ON INDEX idx_group_expenses_split_type IS
'Optimiza queries que filtren gastos por tipo de división.
Útil para estadísticas y reportes.';

-- =====================================================
-- 5. CREAR FUNCIÓN: Obtener descripción del tipo de división
-- =====================================================

CREATE OR REPLACE FUNCTION get_split_type_description(type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE type
    WHEN 'equal' THEN 'División equitativa'
    WHEN 'percentage' THEN 'División por porcentajes'
    WHEN 'exact' THEN 'División por montos exactos'
    WHEN 'itemized' THEN 'División por ítems'
    ELSE 'Tipo desconocido'
  END;
END;
$$;

COMMENT ON FUNCTION get_split_type_description IS
'Retorna descripción legible del tipo de división.
Útil para UI y reportes.';

-- =====================================================
-- 6. CREAR FUNCIÓN: Validar consistencia split_type vs splits.amount
-- =====================================================

CREATE OR REPLACE FUNCTION validate_split_type_consistency(expense_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expense_split_type TEXT;
  splits_with_amount INTEGER;
  total_splits INTEGER;
BEGIN
  -- Obtener split_type del gasto
  SELECT split_type INTO expense_split_type
  FROM group_expenses
  WHERE id = expense_uuid;
  
  IF expense_split_type IS NULL THEN
    RAISE EXCEPTION 'Gasto no encontrado: %', expense_uuid;
  END IF;
  
  -- Contar splits con y sin amount
  SELECT 
    COUNT(*),
    COUNT(amount)
  INTO 
    total_splits,
    splits_with_amount
  FROM expense_splits
  WHERE expense_id = expense_uuid;
  
  -- VALIDACIÓN 1: split_type = 'equal' → splits.amount debe ser NULL O todos iguales
  IF expense_split_type = 'equal' THEN
    -- Permitimos NULL (legacy) o todos con amount igual
    IF splits_with_amount > 0 AND splits_with_amount != total_splits THEN
      RAISE EXCEPTION 'split_type=equal pero solo % de % splits tienen amount', 
        splits_with_amount, total_splits;
    END IF;
    
    RETURN TRUE;
  END IF;
  
  -- VALIDACIÓN 2: split_type != 'equal' → TODOS los splits deben tener amount
  IF expense_split_type IN ('percentage', 'exact', 'itemized') THEN
    IF splits_with_amount != total_splits THEN
      RAISE EXCEPTION 'split_type=% requiere que todos los splits tengan amount. Actual: % de %',
        expense_split_type, splits_with_amount, total_splits;
    END IF;
    
    RETURN TRUE;
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION validate_split_type_consistency IS
'Valida consistencia entre split_type y splits.amount.
- equal: puede tener amount NULL o todos iguales
- percentage/exact/itemized: TODOS deben tener amount
Lanza excepción si hay inconsistencia.';

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Permitir SELECT en la nueva columna a usuarios autenticados
GRANT SELECT ON group_expenses TO authenticated;

-- Permitir ejecutar funciones helper
GRANT EXECUTE ON FUNCTION get_split_type_description TO authenticated;
GRANT EXECUTE ON FUNCTION validate_split_type_consistency TO authenticated;

-- =====================================================
-- 8. ANÁLISIS DE IMPACTO
-- =====================================================

DO $$
DECLARE
  total_expenses INTEGER;
  expenses_with_equal INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_expenses FROM group_expenses;
  SELECT COUNT(*) INTO expenses_with_equal 
  FROM group_expenses 
  WHERE split_type = 'equal';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columna group_expenses.split_type agregada';
  RAISE NOTICE 'Total de gastos existentes: %', total_expenses;
  RAISE NOTICE 'Gastos con split_type=equal: % (100%% backward compatible)', expenses_with_equal;
  RAISE NOTICE 'Tipos soportados: equal, percentage, exact, itemized';
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
-- -- 1. Eliminar funciones
-- DROP FUNCTION IF EXISTS validate_split_type_consistency(UUID);
-- DROP FUNCTION IF EXISTS get_split_type_description(TEXT);
-- 
-- -- 2. Eliminar índice
-- DROP INDEX IF EXISTS idx_group_expenses_split_type;
-- 
-- -- 3. Eliminar constraint
-- ALTER TABLE group_expenses DROP CONSTRAINT IF EXISTS valid_split_type;
-- 
-- -- 4. Eliminar columna
-- ALTER TABLE group_expenses DROP COLUMN IF EXISTS split_type;
-- 
-- COMMIT;
-- 
-- =====================================================
