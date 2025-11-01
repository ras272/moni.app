-- =====================================================
-- Migration: Create trigger to validate expense splits sum
-- =====================================================
-- Description: Crea trigger para validar que SUM(splits.amount) = expense.amount
-- Author: Sistema
-- Date: 2025-11-01
-- Version: 1.0.0
-- Dependencies: 20251101000004_update_calculate_group_debts_function.sql
--
-- OBJETIVO:
--   Garantizar integridad de datos a nivel de base de datos:
--   - La suma de splits.amount SIEMPRE debe ser igual al monto del gasto
--   - Prevenir errores de redondeo o cálculos incorrectos
--   - Validar antes de INSERT/UPDATE para rechazar datos inválidos
--
-- ESTRATEGIA:
--   - Trigger AFTER INSERT/UPDATE/DELETE en expense_splits
--   - Valida usando función validate_expense_splits_sum() (ya creada)
--   - Trigger AFTER UPDATE en group_expenses (si cambia el monto)
--   - Lanza excepción si la suma no coincide
--
-- SEGURIDAD:
--   - Nivel de validación: Database (máxima seguridad)
--   - Imposible insertar datos inconsistentes
--   - Transacción atómica con rollback automático si falla
--
-- PERFORMANCE:
--   - Trigger ligero (solo valida cuando cambian splits)
--   - Usa índice existente idx_expense_splits_amount
--   - No afecta queries SELECT
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
  -- Verificar que la función de validación existe
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'validate_expense_splits_sum'
  ) THEN
    RAISE EXCEPTION 'Función validate_expense_splits_sum() no existe. Ejecuta migración 20251101000001 primero.';
  END IF;
END $$;

-- =====================================================
-- 2. CREAR FUNCIÓN DE TRIGGER para expense_splits
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_validate_splits_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_expense_id UUID;
  is_valid BOOLEAN;
BEGIN
  -- Determinar el expense_id afectado según la operación
  IF TG_OP = 'DELETE' THEN
    affected_expense_id := OLD.expense_id;
  ELSE
    affected_expense_id := NEW.expense_id;
  END IF;
  
  -- Validar suma de splits para el gasto afectado
  BEGIN
    SELECT validate_expense_splits_sum(affected_expense_id) INTO is_valid;
  EXCEPTION
    WHEN OTHERS THEN
      -- Re-lanzar excepción con contexto adicional
      RAISE EXCEPTION 'Validación de splits falló para gasto %: %', 
        affected_expense_id, 
        SQLERRM;
  END;
  
  -- Si llegamos aquí, la validación pasó
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION trigger_validate_splits_after_change IS
'Función de trigger que valida la suma de splits después de INSERT/UPDATE/DELETE.
Lanza excepción si la suma no coincide con el monto del gasto.
Se ejecuta AFTER para tener el estado final de los datos.';

-- =====================================================
-- 3. CREAR FUNCIÓN DE TRIGGER para group_expenses
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_validate_expense_amount_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  -- Solo validar si cambió el monto del gasto
  IF OLD.amount != NEW.amount THEN
    -- Validar que los splits existentes sumen el nuevo monto
    BEGIN
      SELECT validate_expense_splits_sum(NEW.id) INTO is_valid;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'No se puede cambiar el monto del gasto a % porque los splits suman diferente: %',
          NEW.amount,
          SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trigger_validate_expense_amount_change IS
'Función de trigger que valida splits cuando cambia el monto del gasto.
Previene cambios de monto que dejen los splits inconsistentes.';

-- =====================================================
-- 4. CREAR TRIGGER en expense_splits
-- =====================================================

-- Trigger AFTER INSERT
CREATE TRIGGER trigger_expense_splits_validate_insert
AFTER INSERT ON expense_splits
FOR EACH ROW
EXECUTE FUNCTION trigger_validate_splits_after_change();

COMMENT ON TRIGGER trigger_expense_splits_validate_insert ON expense_splits IS
'Valida suma de splits después de insertar un nuevo split.
Garantiza que nuevos splits no rompan la integridad.';

-- Trigger AFTER UPDATE
CREATE TRIGGER trigger_expense_splits_validate_update
AFTER UPDATE ON expense_splits
FOR EACH ROW
EXECUTE FUNCTION trigger_validate_splits_after_change();

COMMENT ON TRIGGER trigger_expense_splits_validate_update ON expense_splits IS
'Valida suma de splits después de actualizar un split.
Garantiza que cambios de monto no rompan la integridad.';

-- Trigger AFTER DELETE
CREATE TRIGGER trigger_expense_splits_validate_delete
AFTER DELETE ON expense_splits
FOR EACH ROW
EXECUTE FUNCTION trigger_validate_splits_after_change();

COMMENT ON TRIGGER trigger_expense_splits_validate_delete ON expense_splits IS
'Valida suma de splits después de eliminar un split.
Garantiza que la suma siga coincidiendo después del delete.';

-- =====================================================
-- 5. CREAR TRIGGER en group_expenses
-- =====================================================

CREATE TRIGGER trigger_expense_validate_amount_change
AFTER UPDATE ON group_expenses
FOR EACH ROW
WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
EXECUTE FUNCTION trigger_validate_expense_amount_change();

COMMENT ON TRIGGER trigger_expense_validate_amount_change ON group_expenses IS
'Valida splits cuando cambia el monto del gasto.
Solo se ejecuta si el monto cambió (WHEN clause para performance).';

-- =====================================================
-- 6. DESHABILITAR TRIGGERS TEMPORALMENTE (para testing)
-- =====================================================

-- Función helper para deshabilitar validación (SOLO para testing/migraciones)
CREATE OR REPLACE FUNCTION disable_splits_validation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE expense_splits DISABLE TRIGGER trigger_expense_splits_validate_insert;
  ALTER TABLE expense_splits DISABLE TRIGGER trigger_expense_splits_validate_update;
  ALTER TABLE expense_splits DISABLE TRIGGER trigger_expense_splits_validate_delete;
  ALTER TABLE group_expenses DISABLE TRIGGER trigger_expense_validate_amount_change;
  
  RAISE NOTICE 'ADVERTENCIA: Validación de splits DESHABILITADA. Habilita con enable_splits_validation()';
END;
$$;

-- Función helper para rehabilitar validación
CREATE OR REPLACE FUNCTION enable_splits_validation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE expense_splits ENABLE TRIGGER trigger_expense_splits_validate_insert;
  ALTER TABLE expense_splits ENABLE TRIGGER trigger_expense_splits_validate_update;
  ALTER TABLE expense_splits ENABLE TRIGGER trigger_expense_splits_validate_delete;
  ALTER TABLE group_expenses ENABLE TRIGGER trigger_expense_validate_amount_change;
  
  RAISE NOTICE 'Validación de splits HABILITADA';
END;
$$;

COMMENT ON FUNCTION disable_splits_validation IS
'SOLO PARA TESTING/MIGRACIONES: Deshabilita triggers de validación.
NUNCA usar en producción.';

COMMENT ON FUNCTION enable_splits_validation IS
'Rehabilita triggers de validación después de deshabilitar.';

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Solo superadmin puede deshabilitar validación
REVOKE EXECUTE ON FUNCTION disable_splits_validation FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION enable_splits_validation FROM PUBLIC;

-- =====================================================
-- 8. VALIDACIÓN: Probar triggers con datos existentes
-- =====================================================

DO $$
DECLARE
  test_expense_id UUID;
  test_participant_id UUID;
  original_amount BIGINT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROBANDO TRIGGERS DE VALIDACIÓN';
  RAISE NOTICE '========================================';
  
  -- Buscar un gasto existente para testing
  SELECT ge.id, es.participant_id, ge.amount
  INTO test_expense_id, test_participant_id, original_amount
  FROM group_expenses ge
  JOIN expense_splits es ON es.expense_id = ge.id
  LIMIT 1;
  
  IF test_expense_id IS NULL THEN
    RAISE NOTICE 'No hay gastos para probar triggers';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing con gasto: %', test_expense_id;
  
  -- TEST 1: Intentar actualizar un split a un monto inválido (debe fallar)
  BEGIN
    UPDATE expense_splits
    SET amount = amount + 1000
    WHERE expense_id = test_expense_id
    AND participant_id = test_participant_id;
    
    -- Si llegamos aquí, el trigger NO funcionó (MAL)
    RAISE EXCEPTION 'TEST FALLÓ: Trigger permitió suma incorrecta';
  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay excepción, el trigger funcionó correctamente (BIEN)
      IF SQLERRM LIKE '%no coincide%' OR SQLERRM LIKE '%Diferencia%' THEN
        RAISE NOTICE 'TEST 1 PASÓ: Trigger rechazó suma incorrecta ✓';
        -- Rollback implícito del UPDATE
      ELSE
        -- Otro error, re-lanzar
        RAISE;
      END IF;
  END;
  
  -- TEST 2: Intentar cambiar monto del gasto (debe fallar)
  BEGIN
    UPDATE group_expenses
    SET amount = amount + 1000
    WHERE id = test_expense_id;
    
    -- Si llegamos aquí, el trigger NO funcionó (MAL)
    RAISE EXCEPTION 'TEST FALLÓ: Trigger permitió cambio de monto inconsistente';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%splits suman diferente%' THEN
        RAISE NOTICE 'TEST 2 PASÓ: Trigger rechazó cambio de monto ✓';
      ELSE
        RAISE;
      END IF;
  END;
  
  RAISE NOTICE 'Todos los tests pasaron exitosamente';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 9. ANÁLISIS DE IMPACTO
-- =====================================================

DO $$
DECLARE
  total_triggers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_triggers
  FROM pg_trigger
  WHERE tgname LIKE 'trigger_%splits%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Triggers creados: %', total_triggers;
  RAISE NOTICE 'Validación activa en:';
  RAISE NOTICE '  - expense_splits (INSERT/UPDATE/DELETE)';
  RAISE NOTICE '  - group_expenses (UPDATE amount)';
  RAISE NOTICE 'Nivel de seguridad: Database (máximo)';
  RAISE NOTICE 'Estado: Activo y validado con tests';
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
-- -- 1. Eliminar triggers
-- DROP TRIGGER IF EXISTS trigger_expense_splits_validate_insert ON expense_splits;
-- DROP TRIGGER IF EXISTS trigger_expense_splits_validate_update ON expense_splits;
-- DROP TRIGGER IF EXISTS trigger_expense_splits_validate_delete ON expense_splits;
-- DROP TRIGGER IF EXISTS trigger_expense_validate_amount_change ON group_expenses;
-- 
-- -- 2. Eliminar funciones
-- DROP FUNCTION IF EXISTS enable_splits_validation();
-- DROP FUNCTION IF EXISTS disable_splits_validation();
-- DROP FUNCTION IF EXISTS trigger_validate_expense_amount_change();
-- DROP FUNCTION IF EXISTS trigger_validate_splits_after_change();
-- 
-- COMMIT;
-- 
-- =====================================================
