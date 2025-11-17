-- =====================================================
-- Migration: Auto-Renewal of Budget Periods (Cron Job)
-- Description: Renovar automáticamente períodos de presupuestos que expiraron
-- Created: 2025-11-16
-- Version: 1.0
-- =====================================================
--
-- PROBLEMA:
-- Cuando termina un período (ej: fin de mes), el presupuesto queda sin período actual
-- El usuario tiene que esperar a crear una transacción para que se genere el nuevo período
--
-- SOLUCIÓN:
-- Cron job que corre diariamente (2:00 AM) y renueva períodos expirados
--
-- FUNCIONAMIENTO:
-- 1. Busca presupuestos activos sin período actual
-- 2. Crea el nuevo período usando get_or_create_current_budget_period()
-- 3. Registra logs para debugging
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Crear función para renovar períodos expirados
-- =====================================================

CREATE OR REPLACE FUNCTION renew_expired_budget_periods()
RETURNS TABLE(
  renewed_count INTEGER,
  budget_ids UUID[]
) AS $$
DECLARE
  v_budget RECORD;
  v_renewed_count INTEGER := 0;
  v_budget_ids UUID[] := ARRAY[]::UUID[];
  v_period_id UUID;
BEGIN
  -- Iterar sobre presupuestos activos
  FOR v_budget IN
    SELECT b.id, b.name, b.category_id, b.period_type
    FROM budgets b
    WHERE b.is_active = TRUE
    ORDER BY b.created_at
  LOOP
    -- Verificar si tiene período actual
    -- Un período es "actual" si period_end >= CURRENT_DATE
    IF NOT EXISTS (
      SELECT 1
      FROM budget_periods bp
      WHERE bp.budget_id = v_budget.id
        AND bp.period_end >= CURRENT_DATE
    ) THEN
      -- No tiene período actual, crear uno nuevo
      BEGIN
        -- Usar la función existente para crear/obtener período
        SELECT get_or_create_current_budget_period(v_budget.id)
        INTO v_period_id;

        -- Si se creó exitosamente, contar
        IF v_period_id IS NOT NULL THEN
          v_renewed_count := v_renewed_count + 1;
          v_budget_ids := array_append(v_budget_ids, v_budget.id);

          RAISE NOTICE 'Renewed period for budget: % (%, %)',
            v_budget.id,
            v_budget.name,
            v_budget.period_type;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error pero continuar con otros presupuestos
          RAISE WARNING 'Failed to renew budget %: %',
            v_budget.id,
            SQLERRM;
      END;
    END IF;
  END LOOP;

  -- Retornar resumen
  RETURN QUERY SELECT v_renewed_count, v_budget_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION renew_expired_budget_periods IS
'Renueva períodos de presupuestos que expiraron.
Se ejecuta diariamente por pg_cron a las 2:00 AM.
Retorna la cantidad de períodos renovados y sus IDs.';

-- =====================================================
-- 2. Crear tabla de logs para tracking (opcional pero útil)
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_renewal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  renewed_count INTEGER NOT NULL,
  budget_ids UUID[],
  duration_ms INTEGER,
  error TEXT
);

COMMENT ON TABLE budget_renewal_logs IS
'Logs de ejecución del cron job de renovación de presupuestos.
Útil para debugging y monitoreo.';

-- =====================================================
-- 3. Crear función wrapper para el cron (con logging)
-- =====================================================

CREATE OR REPLACE FUNCTION cron_renew_budget_periods()
RETURNS void AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration_ms INTEGER;
  v_renewed_count INTEGER;
  v_budget_ids UUID[];
BEGIN
  v_start_time := clock_timestamp();

  -- Ejecutar renovación
  SELECT renewed_count, budget_ids
  INTO v_renewed_count, v_budget_ids
  FROM renew_expired_budget_periods();

  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;

  -- Registrar en logs
  INSERT INTO budget_renewal_logs (
    renewed_count,
    budget_ids,
    duration_ms
  ) VALUES (
    v_renewed_count,
    v_budget_ids,
    v_duration_ms
  );

  RAISE NOTICE 'Budget renewal completed: % periods renewed in %ms',
    v_renewed_count,
    v_duration_ms;

EXCEPTION
  WHEN OTHERS THEN
    -- Registrar error
    INSERT INTO budget_renewal_logs (
      renewed_count,
      budget_ids,
      duration_ms,
      error
    ) VALUES (
      0,
      ARRAY[]::UUID[],
      0,
      SQLERRM
    );

    RAISE WARNING 'Budget renewal failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cron_renew_budget_periods IS
'Wrapper para pg_cron que ejecuta la renovación y registra logs.
Esta es la función que debe llamar el cron job.';

-- =====================================================
-- 4. Configurar pg_cron job
-- =====================================================

-- Habilitar extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar job anterior si existe
DO $$
BEGIN
  PERFORM cron.unschedule('renew-budget-periods');
EXCEPTION
  WHEN OTHERS THEN
    -- Job no existe, continuar
    NULL;
END $$;

-- Crear nuevo job que corre diariamente a las 2:00 AM
SELECT cron.schedule(
  'renew-budget-periods',           -- Nombre del job
  '0 2 * * *',                      -- Cron schedule: 2:00 AM todos los días
  $$SELECT cron_renew_budget_periods();$$  -- Comando a ejecutar
);

COMMENT ON EXTENSION pg_cron IS
'pg_cron extension enabled for scheduled budget period renewals.';

COMMIT;

-- =====================================================
-- VERIFICACIÓN (ejecutar después de la migración)
-- =====================================================

-- Ver el cron job creado:
-- SELECT * FROM cron.job WHERE jobname = 'renew-budget-periods';

-- Ver logs de ejecución:
-- SELECT * FROM budget_renewal_logs ORDER BY executed_at DESC LIMIT 10;

-- Ejecutar manualmente para testear (NO esperar hasta las 2 AM):
-- SELECT cron_renew_budget_periods();

-- Ver presupuestos sin período actual:
-- SELECT b.id, b.name, b.period_type,
--   (SELECT COUNT(*) FROM budget_periods bp WHERE bp.budget_id = b.id AND bp.period_end >= CURRENT_DATE) as current_periods
-- FROM budgets b
-- WHERE b.is_active = TRUE
-- ORDER BY b.created_at;

-- =====================================================
-- ROLLBACK (si algo sale mal)
-- =====================================================

-- Para eliminar el cron job:
-- SELECT cron.unschedule('renew-budget-periods');

-- Para eliminar las funciones:
-- DROP FUNCTION IF EXISTS cron_renew_budget_periods();
-- DROP FUNCTION IF EXISTS renew_expired_budget_periods();
-- DROP TABLE IF EXISTS budget_renewal_logs;
