-- =====================================================
-- Migration: Backfill expense_splits.amount for existing data
-- =====================================================
-- Description: Calcula y rellena expense_splits.amount para gastos existentes
-- Author: Sistema
-- Date: 2025-11-01
-- Version: 1.0.0
-- Dependencies: 
--   - 20251101000001_add_amount_to_expense_splits.sql
--   - 20251101000002_add_split_type_to_group_expenses.sql
--
-- OBJETIVO:
--   Calcular el monto de cada split para gastos existentes (legacy)
--   que actualmente tienen amount = NULL. Esto permite:
--   - Migrar suavemente al nuevo sistema
--   - Mantener consistencia de datos
--   - Simplificar función calculate_group_debts()
--
-- ESTRATEGIA:
--   Para cada gasto con splits que tienen amount = NULL:
--   1. Calcular división equitativa: total / count(splits)
--   2. Manejar redondeos (el primer split se lleva el remainder)
--   3. Validar que la suma sea exacta
--   4. Actualizar todos los splits del gasto
--
-- SEGURIDAD:
--   - Solo actualiza splits con amount = NULL (no toca divisiones flexibles)
--   - Validación de suma antes de commit
--   - Transacción atómica con posibilidad de rollback
--   - Backup de estado previo en tabla temporal
--
-- ROLLBACK:
--   Ver sección al final del archivo
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFICAR PRERREQUISITOS
-- =====================================================

DO $$
BEGIN
  -- Verificar que las columnas existen
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_splits'
    AND column_name = 'amount'
  ) THEN
    RAISE EXCEPTION 'Columna expense_splits.amount no existe. Ejecuta migración 20251101000001 primero.';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'group_expenses'
    AND column_name = 'split_type'
  ) THEN
    RAISE EXCEPTION 'Columna group_expenses.split_type no existe. Ejecuta migración 20251101000002 primero.';
  END IF;
END $$;

-- =====================================================
-- 2. CREAR TABLA TEMPORAL DE BACKUP (para rollback)
-- =====================================================

CREATE TEMP TABLE expense_splits_backup AS
SELECT 
  id,
  expense_id,
  participant_id,
  amount,
  created_at
FROM expense_splits
WHERE amount IS NULL;

-- Log del backup
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM expense_splits_backup;
  RAISE NOTICE 'Backup creado: % splits con amount = NULL', backup_count;
END $$;

-- =====================================================
-- 3. CREAR FUNCIÓN: Calcular y actualizar splits de un gasto
-- =====================================================

CREATE OR REPLACE FUNCTION backfill_expense_splits_for_expense(expense_uuid UUID)
RETURNS TABLE(
  split_id UUID,
  split_amount BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  total_amount BIGINT;
  splits_count INTEGER;
  equal_amount BIGINT;
  remainder BIGINT;
  split_record RECORD;
  index_counter INTEGER := 0;
BEGIN
  -- Obtener monto del gasto
  SELECT amount INTO total_amount
  FROM group_expenses
  WHERE id = expense_uuid;
  
  IF total_amount IS NULL THEN
    RAISE EXCEPTION 'Gasto no encontrado: %', expense_uuid;
  END IF;
  
  -- Contar splits con amount = NULL
  SELECT COUNT(*) INTO splits_count
  FROM expense_splits
  WHERE expense_id = expense_uuid
  AND amount IS NULL;
  
  IF splits_count = 0 THEN
    -- No hay splits para actualizar
    RETURN;
  END IF;
  
  -- Calcular división equitativa
  equal_amount := total_amount / splits_count;
  remainder := total_amount - (equal_amount * splits_count);
  
  -- Actualizar cada split
  FOR split_record IN 
    SELECT id 
    FROM expense_splits 
    WHERE expense_id = expense_uuid 
    AND amount IS NULL
    ORDER BY created_at ASC
  LOOP
    DECLARE
      calculated_amount BIGINT;
    BEGIN
      -- El primer split se lleva el remainder (para evitar pérdida por redondeo)
      IF index_counter = 0 THEN
        calculated_amount := equal_amount + remainder;
      ELSE
        calculated_amount := equal_amount;
      END IF;
      
      -- Actualizar split
      UPDATE expense_splits
      SET amount = calculated_amount
      WHERE id = split_record.id;
      
      -- Retornar para logging
      split_id := split_record.id;
      split_amount := calculated_amount;
      RETURN NEXT;
      
      index_counter := index_counter + 1;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION backfill_expense_splits_for_expense IS
'Calcula y actualiza expense_splits.amount para un gasto específico.
Usa división equitativa con remainder en el primer split.';

-- =====================================================
-- 4. EJECUTAR BACKFILL PARA TODOS LOS GASTOS
-- =====================================================

DO $$
DECLARE
  expense_record RECORD;
  total_expenses INTEGER := 0;
  updated_splits INTEGER := 0;
  failed_expenses INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO BACKFILL DE DATOS EXISTENTES';
  RAISE NOTICE '========================================';
  
  -- Iterar sobre cada gasto que tiene splits sin amount
  FOR expense_record IN
    SELECT DISTINCT ge.id, ge.description, ge.amount
    FROM group_expenses ge
    JOIN expense_splits es ON es.expense_id = ge.id
    WHERE es.amount IS NULL
    ORDER BY ge.created_at ASC
  LOOP
    BEGIN
      DECLARE
        result_count INTEGER;
      BEGIN
        -- Aplicar backfill a este gasto
        SELECT COUNT(*) INTO result_count
        FROM backfill_expense_splits_for_expense(expense_record.id);
        
        updated_splits := updated_splits + result_count;
        total_expenses := total_expenses + 1;
        
        -- Validar suma de splits
        DECLARE
          calculated_sum BIGINT;
        BEGIN
          SELECT COALESCE(SUM(amount), 0) INTO calculated_sum
          FROM expense_splits
          WHERE expense_id = expense_record.id;
          
          IF calculated_sum != expense_record.amount THEN
            RAISE EXCEPTION 'Validación falló: suma de splits (%) != monto gasto (%) para "%"',
              calculated_sum, expense_record.amount, expense_record.description;
          END IF;
        END;
        
        -- Log cada 10 gastos
        IF total_expenses % 10 = 0 THEN
          RAISE NOTICE 'Procesados % gastos...', total_expenses;
        END IF;
      END;
    EXCEPTION
      WHEN OTHERS THEN
        failed_expenses := failed_expenses + 1;
        RAISE WARNING 'Error en gasto "%": %', expense_record.description, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL COMPLETADO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Gastos procesados: %', total_expenses;
  RAISE NOTICE 'Splits actualizados: %', updated_splits;
  RAISE NOTICE 'Errores: %', failed_expenses;
  
  IF failed_expenses > 0 THEN
    RAISE EXCEPTION 'Backfill falló para % gastos. Revisar logs y revertir migración.', failed_expenses;
  END IF;
END $$;

-- =====================================================
-- 5. VALIDACIÓN FINAL: Verificar que no hay splits con amount = NULL
-- =====================================================

DO $$
DECLARE
  null_splits_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_splits_count
  FROM expense_splits
  WHERE amount IS NULL;
  
  IF null_splits_count > 0 THEN
    RAISE EXCEPTION 'Validación falló: % splits todavía tienen amount = NULL', null_splits_count;
  END IF;
  
  RAISE NOTICE 'Validación exitosa: Todos los splits tienen amount calculado';
END $$;

-- =====================================================
-- 6. VALIDACIÓN FINAL: Verificar suma de cada gasto
-- =====================================================

DO $$
DECLARE
  expense_record RECORD;
  invalid_count INTEGER := 0;
BEGIN
  FOR expense_record IN
    SELECT 
      ge.id,
      ge.description,
      ge.amount as expense_amount,
      COALESCE(SUM(es.amount), 0) as splits_sum
    FROM group_expenses ge
    LEFT JOIN expense_splits es ON es.expense_id = ge.id
    GROUP BY ge.id, ge.description, ge.amount
    HAVING ge.amount != COALESCE(SUM(es.amount), 0)
  LOOP
    RAISE WARNING 'Gasto "%" tiene suma incorrecta: % (gasto) vs % (splits)',
      expense_record.description, 
      expense_record.expense_amount,
      expense_record.splits_sum;
    invalid_count := invalid_count + 1;
  END LOOP;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Validación falló: % gastos con suma incorrecta', invalid_count;
  END IF;
  
  RAISE NOTICE 'Validación exitosa: Todas las sumas coinciden';
END $$;

-- =====================================================
-- 7. HACER amount NOT NULL (ahora que todos tienen valor)
-- =====================================================

ALTER TABLE expense_splits
ALTER COLUMN amount SET NOT NULL;

COMMENT ON COLUMN expense_splits.amount IS 
'Monto que este participante debe pagar en el gasto.
NOT NULL: Todos los splits deben tener monto calculado.
Para división equitativa: monto = total / count(participantes)
Para divisiones flexibles: monto = según tipo (porcentaje, exacto, etc.)';

-- =====================================================
-- 8. LIMPIAR FUNCIONES TEMPORALES
-- =====================================================

DROP FUNCTION IF EXISTS backfill_expense_splits_for_expense(UUID);

-- =====================================================
-- 9. ANÁLISIS DE IMPACTO FINAL
-- =====================================================

DO $$
DECLARE
  total_expenses INTEGER;
  total_splits INTEGER;
  min_amount BIGINT;
  max_amount BIGINT;
  avg_amount NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_expenses FROM group_expenses;
  SELECT COUNT(*) INTO total_splits FROM expense_splits;
  SELECT MIN(amount), MAX(amount), AVG(amount) 
  INTO min_amount, max_amount, avg_amount
  FROM expense_splits;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total gastos: %', total_expenses;
  RAISE NOTICE 'Total splits: %', total_splits;
  RAISE NOTICE 'Monto mínimo por split: % Gs', min_amount;
  RAISE NOTICE 'Monto máximo por split: % Gs', max_amount;
  RAISE NOTICE 'Monto promedio por split: % Gs', ROUND(avg_amount);
  RAISE NOTICE 'Estado: expense_splits.amount es ahora NOT NULL';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- 
-- IMPORTANTE: Este rollback solo funciona si tienes el backup temporal.
-- Si la sesión cerró, necesitarás restaurar desde un dump de BD.
-- 
-- Para revertir esta migración INMEDIATAMENTE después de aplicarla:
-- 
-- BEGIN;
-- 
-- -- 1. Hacer columna nullable nuevamente
-- ALTER TABLE expense_splits ALTER COLUMN amount DROP NOT NULL;
-- 
-- -- 2. Restaurar valores NULL desde backup (si está disponible)
-- UPDATE expense_splits es
-- SET amount = NULL
-- WHERE EXISTS (
--   SELECT 1 FROM expense_splits_backup b
--   WHERE b.id = es.id
-- );
-- 
-- -- 3. Verificar restauración
-- SELECT COUNT(*) as restored_nulls
-- FROM expense_splits
-- WHERE amount IS NULL;
-- 
-- COMMIT;
-- 
-- =====================================================
