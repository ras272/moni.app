-- Migration: create_rpc_monthly_stats
-- Description: Función RPC para obtener estadísticas mensuales
-- Created: 2025-10-27
-- Purpose: Dashboard - Summary Cards

BEGIN;

CREATE OR REPLACE FUNCTION get_monthly_stats()
RETURNS TABLE (
  current_month_expenses BIGINT,
  current_month_income BIGINT,
  current_month_savings BIGINT,
  previous_month_expenses BIGINT,
  previous_month_income BIGINT,
  previous_month_savings BIGINT,
  growth_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_current_month_start DATE;
  v_current_month_end DATE;
  v_previous_month_start DATE;
  v_previous_month_end DATE;
  v_current_expenses BIGINT := 0;
  v_current_income BIGINT := 0;
  v_previous_expenses BIGINT := 0;
  v_previous_income BIGINT := 0;
  v_current_savings BIGINT;
  v_previous_savings BIGINT;
  v_growth NUMERIC := 0;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE auth_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  v_current_month_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_current_month_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::DATE;
  v_previous_month_start := (date_trunc('month', CURRENT_DATE) - interval '1 month')::DATE;
  v_previous_month_end := (date_trunc('month', CURRENT_DATE) - interval '1 day')::DATE;

  SELECT
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
  INTO v_current_expenses, v_current_income
  FROM transactions
  WHERE 
    profile_id = v_profile_id
    AND transaction_date BETWEEN v_current_month_start AND v_current_month_end
    AND status = 'completed';

  SELECT
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
  INTO v_previous_expenses, v_previous_income
  FROM transactions
  WHERE 
    profile_id = v_profile_id
    AND transaction_date BETWEEN v_previous_month_start AND v_previous_month_end
    AND status = 'completed';

  v_current_savings := v_current_income - v_current_expenses;
  v_previous_savings := v_previous_income - v_previous_expenses;

  IF v_previous_savings != 0 THEN
    v_growth := ((v_current_savings - v_previous_savings)::NUMERIC / ABS(v_previous_savings)) * 100;
  ELSIF v_current_savings > 0 THEN
    v_growth := 100;
  ELSIF v_current_savings < 0 AND v_previous_savings = 0 THEN
    v_growth := -100;
  END IF;

  RETURN QUERY SELECT
    v_current_expenses,
    v_current_income,
    v_current_savings,
    v_previous_expenses,
    v_previous_income,
    v_previous_savings,
    ROUND(v_growth, 2);
END;
$$;

COMMENT ON FUNCTION get_monthly_stats IS 'Obtiene estadísticas comparativas mensuales para Dashboard';

COMMIT;
