-- Migration: create_rpc_expenses_by_category
-- Description: Función RPC para gastos por categoría
-- Created: 2025-10-27
-- Purpose: Dashboard - Pie Graph

BEGIN;

CREATE OR REPLACE FUNCTION get_expenses_by_category(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  total_amount BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE auth_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  v_start_date := COALESCE(p_start_date, (CURRENT_DATE - interval '6 months')::DATE);
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  SELECT
    COALESCE(c.name, 'Sin Categoría') AS category_name,
    COALESCE(c.icon, 'help-circle') AS category_icon,
    COALESCE(c.color, '#94a3b8') AS category_color,
    SUM(t.amount) AS total_amount
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE 
    t.profile_id = v_profile_id
    AND t.type = 'expense'
    AND t.status = 'completed'
    AND t.transaction_date BETWEEN v_start_date AND v_end_date
  GROUP BY c.name, c.icon, c.color
  HAVING SUM(t.amount) > 0
  ORDER BY total_amount DESC;
END;
$$;

COMMENT ON FUNCTION get_expenses_by_category IS 'Obtiene gastos agrupados por categoría para Dashboard';

COMMIT;
