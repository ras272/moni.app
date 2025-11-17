-- =====================================================
-- Migration: Fix renew_expired_budget_periods function
-- Description: Corregir error de columna b.name que no existe
-- Created: 2025-11-16
-- Version: 1.0
-- =====================================================

BEGIN;

-- Recrear función sin usar b.name
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
    SELECT b.id, b.category_id, b.period_type
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

          RAISE NOTICE 'Renewed period for budget: % (type: %)',
            v_budget.id,
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

COMMIT;
