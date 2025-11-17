-- Fix ambiguous column reference in refresh_all_budget_periods function

CREATE OR REPLACE FUNCTION refresh_all_budget_periods()
RETURNS TABLE(
  budget_id UUID,
  period_id UUID,
  spent_amount BIGINT,
  budget_amount BIGINT,
  percentage_used NUMERIC
) AS $$
DECLARE
  v_period RECORD;
  v_budget RECORD;
  v_spent BIGINT;
  v_period_dates RECORD;
BEGIN
  -- Iterar sobre todos los budgets activos
  FOR v_budget IN
    SELECT * FROM budgets WHERE is_active = TRUE
  LOOP
    -- Obtener o crear el período actual para este budget
    PERFORM get_or_create_current_budget_period(v_budget.id);

    -- Obtener el período actual
    SELECT * INTO v_period
    FROM budget_periods bp
    WHERE bp.budget_id = v_budget.id AND bp.is_current = TRUE;

    -- Calcular gasto del período
    IF v_budget.category_id IS NULL THEN
      -- Budget general: sumar todos los gastos
      SELECT COALESCE(SUM(t.amount), 0) INTO v_spent
      FROM transactions t
      WHERE t.profile_id = v_budget.profile_id
        AND t.type = 'expense'
        AND t.status = 'completed'
        AND t.transaction_date >= v_period.period_start
        AND t.transaction_date <= v_period.period_end;
    ELSE
      -- Budget por categoría: solo gastos de esa categoría
      SELECT COALESCE(SUM(t.amount), 0) INTO v_spent
      FROM transactions t
      WHERE t.profile_id = v_budget.profile_id
        AND t.type = 'expense'
        AND t.status = 'completed'
        AND t.category_id = v_budget.category_id
        AND t.transaction_date >= v_period.period_start
        AND t.transaction_date <= v_period.period_end;
    END IF;

    -- Actualizar el período
    PERFORM update_budget_period_spent(v_period.id, v_spent);

    -- Retornar resultado
    RETURN QUERY
    SELECT
      v_budget.id,
      v_period.id,
      v_spent,
      v_period.budget_amount,
      CASE
        WHEN v_period.budget_amount > 0
        THEN (v_spent::NUMERIC / v_period.budget_amount) * 100
        ELSE 0
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
