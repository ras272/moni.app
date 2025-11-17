-- Fix ambiguous column reference in get_budget_status function

CREATE OR REPLACE FUNCTION get_budget_status()
RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_result JSON;
BEGIN
  -- Obtener profile_id del usuario autenticado
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE auth_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user';
  END IF;

  -- Refrescar todos los períodos del usuario
  PERFORM refresh_all_budget_periods();

  -- Construir resultado
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'category_id', b.category_id,
        'category_name', c.name,
        'category_icon', c.icon,
        'category_color', c.color,
        'period_type', b.period_type,
        'amount', b.amount,
        'currency', b.currency,
        'rollover_unused', b.rollover_unused,
        'alert_at_80', b.alert_at_80,
        'alert_at_90', b.alert_at_90,
        'alert_at_100', b.alert_at_100,
        'start_date', b.start_date,
        'end_date', b.end_date,
        'is_active', b.is_active,
        'budget_amount', bp.budget_amount,
        'spent_amount', bp.spent_amount,
        'remaining_amount', bp.remaining_amount,
        'percentage_used',
        CASE
          WHEN bp.budget_amount > 0
          THEN ROUND((bp.spent_amount::NUMERIC / bp.budget_amount) * 100, 1)
          ELSE 0
        END,
        'period_start', bp.period_start,
        'period_end', bp.period_end,
        'rollover_amount', bp.rollover_from_previous,
        'is_over_budget', bp.spent_amount > bp.budget_amount,
        'unread_alerts_count', (
          SELECT COUNT(*)
          FROM budget_alerts ba
          WHERE ba.budget_id = b.id
            AND ba.period_id = bp.id
            AND ba.is_read = FALSE
        )
      )
    ),
    '[]'::json
  )
  INTO v_result
  FROM budgets b
  LEFT JOIN budget_periods bp ON b.id = bp.budget_id AND bp.is_current = TRUE
  LEFT JOIN categories c ON b.category_id = c.id
  WHERE b.profile_id = v_profile_id
    AND b.is_active = TRUE
  ORDER BY
    CASE WHEN b.category_id IS NULL THEN 0 ELSE 1 END,  -- General primero
    c.name ASC NULLS FIRST;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
