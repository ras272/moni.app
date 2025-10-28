-- Migration: create_rpc_daily_cash_flow
-- Description: Función RPC para obtener flujo de caja diario (ingresos vs gastos)
-- Created: 2025-10-27
-- Purpose: Dashboard - Bar Graph / Area Graph

BEGIN;

CREATE OR REPLACE FUNCTION get_daily_cash_flow(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  income_amount BIGINT,
  expense_amount BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE auth_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      p_start_date,
      p_end_date,
      '1 day'::interval
    )::DATE AS date
  ),
  daily_transactions AS (
    SELECT
      transaction_date::DATE AS date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE 
      profile_id = v_profile_id
      AND transaction_date BETWEEN p_start_date AND p_end_date
      AND status = 'completed'
    GROUP BY transaction_date::DATE
  )
  SELECT
    ds.date,
    COALESCE(dt.income, 0) AS income_amount,
    COALESCE(dt.expense, 0) AS expense_amount
  FROM date_series ds
  LEFT JOIN daily_transactions dt ON ds.date = dt.date
  ORDER BY ds.date ASC;
END;
$$;

COMMENT ON FUNCTION get_daily_cash_flow IS 'Obtiene el flujo de caja diario para Dashboard';

COMMIT;
