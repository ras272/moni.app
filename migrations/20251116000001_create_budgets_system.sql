-- Migration: create_budgets_system
-- Description: Implementa sistema de presupuestos (budgets) con alertas y tracking
-- Created: 2025-11-16
-- Version: 1.0
-- Dependencies: 20251027000002_create_accounts_transactions.sql

BEGIN;

-- =====================================================
-- 1. CREAR ENUM: budget_period_type
-- =====================================================

CREATE TYPE budget_period_type AS ENUM (
  'weekly',     -- Semanal (7 días)
  'biweekly',   -- Quincenal (14 días)
  'monthly',    -- Mensual (mes calendario)
  'yearly'      -- Anual
);

-- =====================================================
-- 2. CREAR ENUM: budget_alert_type
-- =====================================================

CREATE TYPE budget_alert_type AS ENUM (
  'warning_80',    -- Alerta al 80% del presupuesto
  'warning_90',    -- Alerta al 90% del presupuesto
  'limit_reached', -- Límite alcanzado (100%)
  'limit_exceeded' -- Límite excedido (>100%)
);

-- =====================================================
-- 3. CREAR TABLA: budgets
-- =====================================================

CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Scope del budget
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  -- NULL = budget general (para todos los gastos)
  -- NOT NULL = budget específico para una categoría

  -- Configuración del período
  period_type budget_period_type NOT NULL DEFAULT 'monthly',
  amount BIGINT NOT NULL,  -- Monto del presupuesto en unidades mínimas
  currency TEXT NOT NULL DEFAULT 'PYG',

  -- Configuración de comportamiento
  rollover_unused BOOLEAN NOT NULL DEFAULT false,
  -- TRUE: el monto no gastado pasa al próximo período
  -- FALSE: cada período empieza desde cero

  -- Configuración de alertas
  alert_at_80 BOOLEAN NOT NULL DEFAULT true,
  alert_at_90 BOOLEAN NOT NULL DEFAULT true,
  alert_at_100 BOOLEAN NOT NULL DEFAULT true,

  -- Vigencia del budget
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,  -- NULL = sin fin

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- =====================================================
  -- CONSTRAINTS
  -- =====================================================

  -- Monto positivo
  CONSTRAINT positive_amount CHECK (amount > 0),

  -- Fecha de fin debe ser posterior a fecha de inicio
  CONSTRAINT end_date_after_start CHECK (
    end_date IS NULL OR end_date >= start_date
  ),

  -- Solo un budget activo por categoría por usuario
  -- (se controla con unique index partial más abajo)

  -- NOTA: La validación de que category_id sea tipo 'expense' se hace en la app
  -- PostgreSQL no permite subqueries en CHECK constraints
);

-- =====================================================
-- 4. CREAR TABLA: budget_periods
-- =====================================================
-- Snapshots de cada período de presupuesto para tracking histórico

CREATE TABLE public.budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

  -- Definición del período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Montos del período
  budget_amount BIGINT NOT NULL,  -- Presupuesto asignado (puede incluir rollover)
  rollover_from_previous BIGINT NOT NULL DEFAULT 0,  -- Monto que vino del período anterior
  spent_amount BIGINT NOT NULL DEFAULT 0,  -- Monto gastado (calculado)
  remaining_amount BIGINT NOT NULL DEFAULT 0,  -- Monto restante (calculado)

  -- Metadata
  is_current BOOLEAN NOT NULL DEFAULT false,  -- TRUE si es el período actual

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- =====================================================
  -- CONSTRAINTS
  -- =====================================================

  -- Montos no negativos
  CONSTRAINT non_negative_budget_amount CHECK (budget_amount >= 0),
  CONSTRAINT non_negative_rollover CHECK (rollover_from_previous >= 0),
  CONSTRAINT non_negative_spent CHECK (spent_amount >= 0),

  -- Período válido
  CONSTRAINT valid_period CHECK (period_end >= period_start),

  -- Solo un período activo por budget
  -- (se controla con unique index partial más abajo)

  -- Remaining amount = budget_amount - spent_amount
  CONSTRAINT valid_remaining CHECK (
    remaining_amount = (budget_amount - spent_amount)
  )
);

-- =====================================================
-- 5. CREAR TABLA: budget_alerts
-- =====================================================
-- Log de alertas enviadas para evitar duplicados

CREATE TABLE public.budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,

  -- Tipo de alerta
  alert_type budget_alert_type NOT NULL,

  -- Contexto al momento de la alerta
  spent_amount BIGINT NOT NULL,
  budget_amount BIGINT NOT NULL,
  percentage_used NUMERIC(5,2) NOT NULL,  -- Ej: 85.50

  -- Estado
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- =====================================================
  -- CONSTRAINTS
  -- =====================================================

  -- Solo una alerta de cada tipo por período
  CONSTRAINT unique_alert_per_period UNIQUE (budget_id, period_id, alert_type)
);

-- =====================================================
-- 6. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Búsqueda de budgets activos por usuario
CREATE INDEX idx_budgets_profile_active
ON budgets(profile_id, is_active)
WHERE is_active = TRUE;

-- Búsqueda de budgets por categoría
CREATE INDEX idx_budgets_category
ON budgets(category_id)
WHERE category_id IS NOT NULL;

-- Solo un budget activo por categoría por usuario
CREATE UNIQUE INDEX idx_budgets_unique_active_category
ON budgets(profile_id, category_id)
WHERE is_active = TRUE AND category_id IS NOT NULL;

-- Solo un budget general activo por usuario
CREATE UNIQUE INDEX idx_budgets_unique_active_general
ON budgets(profile_id)
WHERE is_active = TRUE AND category_id IS NULL;

-- Búsqueda de períodos por budget
CREATE INDEX idx_budget_periods_budget
ON budget_periods(budget_id);

-- Solo un período activo (is_current) por budget
CREATE UNIQUE INDEX idx_budget_periods_unique_current
ON budget_periods(budget_id)
WHERE is_current = TRUE;

-- Búsqueda de períodos actuales
CREATE INDEX idx_budget_periods_current
ON budget_periods(is_current)
WHERE is_current = TRUE;

-- Búsqueda de alertas por budget
CREATE INDEX idx_budget_alerts_budget
ON budget_alerts(budget_id);

-- Búsqueda de alertas no leídas
CREATE INDEX idx_budget_alerts_unread
ON budget_alerts(budget_id, is_read)
WHERE is_read = FALSE;

-- =====================================================
-- 7. FUNCIÓN: calculate_period_dates()
-- =====================================================
-- Calcula las fechas de inicio y fin del período actual según el tipo

CREATE OR REPLACE FUNCTION calculate_period_dates(
  period_type budget_period_type,
  reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
BEGIN
  CASE period_type
    -- SEMANAL: Lunes a Domingo
    WHEN 'weekly' THEN
      period_start := reference_date - EXTRACT(DOW FROM reference_date)::INTEGER + 1;
      IF EXTRACT(DOW FROM reference_date) = 0 THEN  -- Domingo
        period_start := period_start - 7;
      END IF;
      period_end := period_start + 6;

    -- QUINCENAL: 1-14 o 15-fin de mes
    WHEN 'biweekly' THEN
      IF EXTRACT(DAY FROM reference_date) <= 14 THEN
        period_start := DATE_TRUNC('month', reference_date)::DATE;
        period_end := DATE_TRUNC('month', reference_date)::DATE + 13;
      ELSE
        period_start := DATE_TRUNC('month', reference_date)::DATE + 14;
        period_end := (DATE_TRUNC('month', reference_date) + INTERVAL '1 month - 1 day')::DATE;
      END IF;

    -- MENSUAL: Mes calendario completo
    WHEN 'monthly' THEN
      period_start := DATE_TRUNC('month', reference_date)::DATE;
      period_end := (DATE_TRUNC('month', reference_date) + INTERVAL '1 month - 1 day')::DATE;

    -- ANUAL: Año calendario completo
    WHEN 'yearly' THEN
      period_start := DATE_TRUNC('year', reference_date)::DATE;
      period_end := (DATE_TRUNC('year', reference_date) + INTERVAL '1 year - 1 day')::DATE;

    ELSE
      RAISE EXCEPTION 'Tipo de período no reconocido: %', period_type;
  END CASE;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 8. FUNCIÓN: get_or_create_current_budget_period()
-- =====================================================
-- Obtiene el período actual de un budget o lo crea si no existe

CREATE OR REPLACE FUNCTION get_or_create_current_budget_period(
  p_budget_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_budget RECORD;
  v_current_period_id UUID;
  v_period_start DATE;
  v_period_end DATE;
  v_previous_period RECORD;
  v_rollover_amount BIGINT := 0;
  v_budget_amount BIGINT;
BEGIN
  -- 1. Obtener datos del budget
  SELECT * INTO v_budget
  FROM budgets
  WHERE id = p_budget_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget no encontrado o inactivo';
  END IF;

  -- 2. Calcular fechas del período actual
  SELECT * INTO v_period_start, v_period_end
  FROM calculate_period_dates(v_budget.period_type, CURRENT_DATE);

  -- 3. Buscar si ya existe el período actual
  SELECT id INTO v_current_period_id
  FROM budget_periods
  WHERE budget_id = p_budget_id
    AND period_start = v_period_start
    AND period_end = v_period_end;

  -- 4. Si existe, retornarlo
  IF FOUND THEN
    RETURN v_current_period_id;
  END IF;

  -- 5. Si no existe, crearlo

  -- 5.1 Marcar todos los períodos anteriores como no actuales
  UPDATE budget_periods
  SET is_current = FALSE
  WHERE budget_id = p_budget_id AND is_current = TRUE;

  -- 5.2 Calcular rollover si está habilitado
  IF v_budget.rollover_unused THEN
    SELECT * INTO v_previous_period
    FROM budget_periods
    WHERE budget_id = p_budget_id
      AND period_end < v_period_start
    ORDER BY period_end DESC
    LIMIT 1;

    IF FOUND AND v_previous_period.remaining_amount > 0 THEN
      v_rollover_amount := v_previous_period.remaining_amount;
    END IF;
  END IF;

  -- 5.3 Calcular budget_amount total
  v_budget_amount := v_budget.amount + v_rollover_amount;

  -- 5.4 Crear el nuevo período
  INSERT INTO budget_periods (
    budget_id,
    period_start,
    period_end,
    budget_amount,
    rollover_from_previous,
    spent_amount,
    remaining_amount,
    is_current
  )
  VALUES (
    p_budget_id,
    v_period_start,
    v_period_end,
    v_budget_amount,
    v_rollover_amount,
    0,  -- spent_amount inicial
    v_budget_amount,  -- remaining_amount inicial
    TRUE
  )
  RETURNING id INTO v_current_period_id;

  RETURN v_current_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCIÓN: update_budget_period_spent()
-- =====================================================
-- Actualiza el gasto de un período y crea alertas si es necesario

CREATE OR REPLACE FUNCTION update_budget_period_spent(
  p_period_id UUID,
  p_new_spent_amount BIGINT
)
RETURNS VOID AS $$
DECLARE
  v_period RECORD;
  v_budget RECORD;
  v_percentage_used NUMERIC;
BEGIN
  -- 1. Obtener datos del período
  SELECT * INTO v_period
  FROM budget_periods
  WHERE id = p_period_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Período no encontrado';
  END IF;

  -- 2. Obtener datos del budget
  SELECT * INTO v_budget
  FROM budgets
  WHERE id = v_period.budget_id;

  -- 3. Actualizar spent_amount y remaining_amount
  UPDATE budget_periods
  SET
    spent_amount = p_new_spent_amount,
    remaining_amount = budget_amount - p_new_spent_amount,
    updated_at = NOW()
  WHERE id = p_period_id;

  -- 4. Calcular porcentaje usado
  IF v_period.budget_amount > 0 THEN
    v_percentage_used := (p_new_spent_amount::NUMERIC / v_period.budget_amount) * 100;
  ELSE
    v_percentage_used := 0;
  END IF;

  -- 5. Crear alertas según configuración

  -- Alerta 80%
  IF v_budget.alert_at_80 AND v_percentage_used >= 80 AND v_percentage_used < 90 THEN
    INSERT INTO budget_alerts (
      budget_id,
      period_id,
      alert_type,
      spent_amount,
      budget_amount,
      percentage_used
    )
    VALUES (
      v_budget.id,
      p_period_id,
      'warning_80',
      p_new_spent_amount,
      v_period.budget_amount,
      v_percentage_used
    )
    ON CONFLICT (budget_id, period_id, alert_type) DO NOTHING;
  END IF;

  -- Alerta 90%
  IF v_budget.alert_at_90 AND v_percentage_used >= 90 AND v_percentage_used < 100 THEN
    INSERT INTO budget_alerts (
      budget_id,
      period_id,
      alert_type,
      spent_amount,
      budget_amount,
      percentage_used
    )
    VALUES (
      v_budget.id,
      p_period_id,
      'warning_90',
      p_new_spent_amount,
      v_period.budget_amount,
      v_percentage_used
    )
    ON CONFLICT (budget_id, period_id, alert_type) DO NOTHING;
  END IF;

  -- Alerta 100%
  IF v_budget.alert_at_100 AND v_percentage_used >= 100 AND v_percentage_used < 110 THEN
    INSERT INTO budget_alerts (
      budget_id,
      period_id,
      alert_type,
      spent_amount,
      budget_amount,
      percentage_used
    )
    VALUES (
      v_budget.id,
      p_period_id,
      'limit_reached',
      p_new_spent_amount,
      v_period.budget_amount,
      v_percentage_used
    )
    ON CONFLICT (budget_id, period_id, alert_type) DO NOTHING;
  END IF;

  -- Alerta >100%
  IF v_percentage_used >= 110 THEN
    INSERT INTO budget_alerts (
      budget_id,
      period_id,
      alert_type,
      spent_amount,
      budget_amount,
      percentage_used
    )
    VALUES (
      v_budget.id,
      p_period_id,
      'limit_exceeded',
      p_new_spent_amount,
      v_period.budget_amount,
      v_percentage_used
    )
    ON CONFLICT (budget_id, period_id, alert_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNCIÓN: refresh_all_budget_periods()
-- =====================================================
-- Recalcula los gastos de todos los períodos activos

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
    FROM budget_periods
    WHERE budget_id = v_budget.id AND is_current = TRUE;

    -- Calcular gasto del período
    IF v_budget.category_id IS NULL THEN
      -- Budget general: sumar todos los gastos
      SELECT COALESCE(SUM(amount), 0) INTO v_spent
      FROM transactions
      WHERE profile_id = v_budget.profile_id
        AND type = 'expense'
        AND status = 'completed'
        AND transaction_date >= v_period.period_start
        AND transaction_date <= v_period.period_end;
    ELSE
      -- Budget por categoría: solo gastos de esa categoría
      SELECT COALESCE(SUM(amount), 0) INTO v_spent
      FROM transactions
      WHERE profile_id = v_budget.profile_id
        AND type = 'expense'
        AND status = 'completed'
        AND category_id = v_budget.category_id
        AND transaction_date >= v_period.period_start
        AND transaction_date <= v_period.period_end;
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

-- =====================================================
-- 11. FUNCIÓN: get_budget_status()
-- =====================================================
-- RPC para obtener el estado actual de todos los budgets del usuario

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
        'budget_id', b.id,
        'category_id', b.category_id,
        'category_name', c.name,
        'category_icon', c.icon,
        'category_color', c.color,
        'period_type', b.period_type,
        'budget_amount', bp.budget_amount,
        'spent_amount', bp.spent_amount,
        'remaining_amount', bp.remaining_amount,
        'percentage_used', CASE
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
          FROM budget_alerts
          WHERE budget_id = b.id
            AND period_id = bp.id
            AND is_read = FALSE
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

-- =====================================================
-- 12. TRIGGER: Auto-refresh budget en cambio de transacciones
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_refresh_budgets_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar transacciones de tipo 'expense' completadas
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND
     NEW.type = 'expense' AND
     NEW.status = 'completed' THEN
    PERFORM refresh_all_budget_periods();
  ELSIF TG_OP = 'DELETE' AND
        OLD.type = 'expense' AND
        OLD.status = 'completed' THEN
    PERFORM refresh_all_budget_periods();
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_budgets_on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_budgets_on_transaction();

-- =====================================================
-- 13. TRIGGER: Actualizar updated_at automáticamente
-- =====================================================

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_periods_updated_at
  BEFORE UPDATE ON budget_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 15. RLS POLICIES: budgets
-- =====================================================

CREATE POLICY budgets_all_own ON budgets
  FOR ALL
  USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- =====================================================
-- 16. RLS POLICIES: budget_periods
-- =====================================================

CREATE POLICY budget_periods_select_own ON budget_periods
  FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- INSERT/UPDATE/DELETE: Solo via funciones (SECURITY DEFINER)

-- =====================================================
-- 17. RLS POLICIES: budget_alerts
-- =====================================================

CREATE POLICY budget_alerts_select_own ON budget_alerts
  FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Permitir marcar alertas como leídas
CREATE POLICY budget_alerts_update_own ON budget_alerts
  FOR UPDATE
  USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    budget_id IN (
      SELECT id FROM budgets
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- 18. GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION calculate_period_dates(budget_period_type, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_current_budget_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_budget_period_spent(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_budget_periods() TO authenticated;
GRANT EXECUTE ON FUNCTION get_budget_status() TO authenticated;

-- =====================================================
-- 19. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE budgets IS
'Presupuestos configurados por el usuario. Pueden ser generales (todos los gastos)
o específicos por categoría. Soporta rollover de presupuesto no gastado.';

COMMENT ON TABLE budget_periods IS
'Snapshots de cada período de presupuesto. Permite tracking histórico y análisis.
El período actual tiene is_current = TRUE.';

COMMENT ON TABLE budget_alerts IS
'Log de alertas de presupuesto enviadas al usuario. Previene alertas duplicadas
y permite marcarlas como leídas.';

COMMENT ON FUNCTION get_budget_status() IS
'RPC que devuelve el estado actual de todos los budgets del usuario autenticado.
Incluye: spent, remaining, percentage, alerts. Auto-refresca los períodos.';

COMMENT ON FUNCTION refresh_all_budget_periods() IS
'Recalcula los gastos de todos los períodos activos basándose en las transacciones.
Crea alertas automáticamente según los umbrales configurados (80%, 90%, 100%).';

COMMIT;
