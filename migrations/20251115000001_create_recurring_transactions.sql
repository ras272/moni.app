-- Migration: create_recurring_transactions
-- Description: Implementa sistema de gastos/ingresos recurrentes automáticos
-- Created: 2025-11-15
-- Version: 1.0
-- Dependencies: 20251027000002_create_accounts_transactions.sql

BEGIN;

-- =====================================================
-- 1. CREAR ENUM: recurrence_frequency
-- =====================================================

CREATE TYPE recurrence_frequency AS ENUM (
  'daily',      -- Diario
  'weekly',     -- Semanal
  'biweekly',   -- Quincenal (cada 2 semanas)
  'monthly',    -- Mensual
  'yearly'      -- Anual
);

-- =====================================================
-- 2. CREAR TABLA: recurring_transactions
-- =====================================================

CREATE TABLE public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Detalles de la transacción template (plantilla)
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PYG',
  description TEXT NOT NULL,
  merchant TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  notes TEXT,

  -- Configuración de recurrencia
  frequency recurrence_frequency NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,  -- Cada cuántos períodos (ej: cada 2 semanas)
  day_of_period INTEGER,                      -- Día del mes (1-31) o día de semana (1-7)
  start_date DATE NOT NULL,
  end_date DATE,                              -- NULL = sin fin

  -- Control de estado
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated_date DATE,                   -- Última fecha en que se generó una transacción
  next_occurrence_date DATE NOT NULL,         -- Próxima fecha de generación

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- =====================================================
  -- CONSTRAINTS
  -- =====================================================

  CONSTRAINT positive_amount CHECK (amount > 0),

  -- Validar que el día del período sea correcto según la frecuencia
  CONSTRAINT valid_day_of_period CHECK (
    (frequency = 'monthly' AND day_of_period BETWEEN 1 AND 31) OR
    (frequency = 'weekly' AND day_of_period BETWEEN 1 AND 7) OR
    (frequency IN ('daily', 'biweekly', 'yearly') AND day_of_period IS NULL)
  ),

  -- Validar que end_date sea posterior a start_date
  CONSTRAINT end_date_after_start CHECK (
    end_date IS NULL OR end_date >= start_date
  ),

  -- Validar que interval_count sea positivo
  CONSTRAINT positive_interval_count CHECK (interval_count > 0),

  -- Validar que las transferencias NO sean recurrentes (simplificación MVP)
  CONSTRAINT no_recurring_transfers CHECK (type != 'transfer'),

  -- Validar que las transferencias tengan to_account_id
  CONSTRAINT transfer_requires_to_account CHECK (
    (type = 'transfer' AND to_account_id IS NOT NULL) OR
    (type IN ('expense', 'income') AND to_account_id IS NULL)
  ),

  -- Validar que no sea auto-transferencia
  CONSTRAINT no_self_transfer CHECK (
    type != 'transfer' OR account_id != to_account_id
  )
);

-- =====================================================
-- 3. CREAR TABLA: recurring_transaction_history
-- =====================================================

CREATE TABLE public.recurring_transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_date DATE NOT NULL,    -- Fecha para la que estaba programada
  actual_date DATE NOT NULL,        -- Fecha en que realmente se creó

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índice principal: búsqueda por usuario y estado
CREATE INDEX idx_recurring_transactions_profile_active
ON recurring_transactions(profile_id, is_active);

-- Índice crítico: búsqueda de recurrencias pendientes a generar
CREATE INDEX idx_recurring_transactions_next_occurrence
ON recurring_transactions(next_occurrence_date, is_active)
WHERE is_active = TRUE;

-- Índice para búsqueda por cuenta
CREATE INDEX idx_recurring_transactions_account
ON recurring_transactions(account_id);

-- Índice para búsqueda por categoría
CREATE INDEX idx_recurring_transactions_category
ON recurring_transactions(category_id)
WHERE category_id IS NOT NULL;

-- Índice para historial: búsqueda por recurrencia
CREATE INDEX idx_recurring_history_recurring
ON recurring_transaction_history(recurring_transaction_id);

-- Índice para historial: búsqueda por transacción generada
CREATE INDEX idx_recurring_history_transaction
ON recurring_transaction_history(transaction_id);

-- =====================================================
-- 5. FUNCIÓN: calculate_next_occurrence()
-- =====================================================
-- Calcula la próxima fecha de ocurrencia basada en la frecuencia

CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  freq recurrence_frequency,
  from_date DATE,
  interval_count INTEGER,
  day_of_period INTEGER DEFAULT NULL
)
RETURNS DATE AS $$
DECLARE
  next_date DATE;
  target_month DATE;
  last_day_of_month INTEGER;
BEGIN
  CASE freq
    -- DIARIO: Sumar días
    WHEN 'daily' THEN
      next_date := from_date + (interval_count || ' days')::INTERVAL;

    -- SEMANAL: Sumar semanas (7 días * interval_count)
    WHEN 'weekly' THEN
      next_date := from_date + ((interval_count * 7) || ' days')::INTERVAL;

    -- QUINCENAL: Sumar 14 días (2 semanas)
    WHEN 'biweekly' THEN
      next_date := from_date + '14 days'::INTERVAL;

    -- MENSUAL: Sumar meses y ajustar al día especificado
    WHEN 'monthly' THEN
      -- Calcular el mes objetivo
      target_month := (from_date + (interval_count || ' months')::INTERVAL)::DATE;

      -- Obtener el último día del mes objetivo
      last_day_of_month := EXTRACT(DAY FROM (DATE_TRUNC('month', target_month) + INTERVAL '1 month - 1 day'));

      -- Si day_of_period es NULL, usar el mismo día del mes actual
      IF day_of_period IS NULL THEN
        day_of_period := EXTRACT(DAY FROM from_date);
      END IF;

      -- Si el día solicitado es mayor al último día del mes, usar el último día
      IF day_of_period > last_day_of_month THEN
        next_date := DATE_TRUNC('month', target_month) + ((last_day_of_month - 1) || ' days')::INTERVAL;
      ELSE
        next_date := DATE_TRUNC('month', target_month) + ((day_of_period - 1) || ' days')::INTERVAL;
      END IF;

    -- ANUAL: Sumar años
    WHEN 'yearly' THEN
      next_date := from_date + (interval_count || ' years')::INTERVAL;

    ELSE
      RAISE EXCEPTION 'Frecuencia no reconocida: %', freq;
  END CASE;

  RETURN next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. FUNCIÓN: generate_recurring_transactions()
-- =====================================================
-- Genera automáticamente las transacciones recurrentes pendientes

CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS TABLE(
  generated_count INTEGER,
  processed_recurring_ids UUID[]
) AS $$
DECLARE
  rec RECORD;
  new_transaction_id UUID;
  generated_total INTEGER := 0;
  processed_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Buscar todas las recurrencias activas que necesitan generar transacciones
  FOR rec IN
    SELECT *
    FROM recurring_transactions
    WHERE is_active = TRUE
      AND next_occurrence_date <= CURRENT_DATE
      AND (end_date IS NULL OR next_occurrence_date <= end_date)
    ORDER BY next_occurrence_date ASC
  LOOP
    -- Crear la transacción basada en la plantilla
    INSERT INTO transactions (
      profile_id,
      type,
      amount,
      currency,
      description,
      merchant,
      category_id,
      account_id,
      to_account_id,
      status,
      notes,
      transaction_date
    )
    VALUES (
      rec.profile_id,
      rec.type,
      rec.amount,
      rec.currency,
      rec.description || ' (recurrente)',  -- Marcar como recurrente en la descripción
      rec.merchant,
      rec.category_id,
      rec.account_id,
      rec.to_account_id,
      'completed',  -- Las transacciones recurrentes se crean como completadas
      rec.notes,
      rec.next_occurrence_date  -- Usar la fecha programada como transaction_date
    )
    RETURNING id INTO new_transaction_id;

    -- Registrar en el historial de recurrencias
    INSERT INTO recurring_transaction_history (
      recurring_transaction_id,
      transaction_id,
      scheduled_date,
      actual_date
    )
    VALUES (
      rec.id,
      new_transaction_id,
      rec.next_occurrence_date,
      CURRENT_DATE
    );

    -- Actualizar la recurrencia con la próxima fecha de ocurrencia
    UPDATE recurring_transactions
    SET
      last_generated_date = rec.next_occurrence_date,
      next_occurrence_date = calculate_next_occurrence(
        rec.frequency,
        rec.next_occurrence_date,
        rec.interval_count,
        rec.day_of_period
      ),
      updated_at = NOW()
    WHERE id = rec.id;

    -- Incrementar contador y agregar a lista de procesados
    generated_total := generated_total + 1;
    processed_ids := array_append(processed_ids, rec.id);

    -- Log para debugging (opcional, comentar en producción si no es necesario)
    RAISE NOTICE 'Generada transacción recurrente ID: %, Descripción: %, Monto: %',
      new_transaction_id, rec.description, rec.amount;
  END LOOP;

  -- Retornar resultados
  RETURN QUERY SELECT generated_total, processed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCIÓN: validate_recurring_transaction_accounts()
-- =====================================================
-- Valida que las cuentas de una recurrencia pertenezcan al usuario

CREATE OR REPLACE FUNCTION validate_recurring_transaction_accounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que account_id pertenece al usuario
  IF NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = NEW.account_id
    AND profile_id = NEW.profile_id
  ) THEN
    RAISE EXCEPTION 'La cuenta seleccionada no pertenece al usuario';
  END IF;

  -- Si es transferencia, validar to_account_id
  IF NEW.type = 'transfer' THEN
    IF NEW.to_account_id IS NULL THEN
      RAISE EXCEPTION 'Las transferencias requieren una cuenta destino';
    END IF;

    IF NEW.account_id = NEW.to_account_id THEN
      RAISE EXCEPTION 'No puedes transferir a la misma cuenta';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM accounts
      WHERE id = NEW.to_account_id
      AND profile_id = NEW.profile_id
    ) THEN
      RAISE EXCEPTION 'La cuenta destino no pertenece al usuario';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at automáticamente
CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Validar cuentas de transacción recurrente
CREATE TRIGGER validate_recurring_transaction_accounts_trigger
  BEFORE INSERT OR UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_recurring_transaction_accounts();

-- =====================================================
-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transaction_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS POLICIES: recurring_transactions
-- =====================================================

-- Política ALL simplificada: Solo puedes ver/editar tus propias recurrencias
CREATE POLICY recurring_transactions_all_own ON recurring_transactions
  FOR ALL
  USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- =====================================================
-- 11. RLS POLICIES: recurring_transaction_history
-- =====================================================

-- SELECT: Solo ver historial de tus propias recurrencias
CREATE POLICY recurring_history_select_own ON recurring_transaction_history
  FOR SELECT
  USING (
    recurring_transaction_id IN (
      SELECT id FROM recurring_transactions
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- INSERT: Solo el sistema puede insertar en historial (via función)
-- No creamos política de INSERT para usuarios normales

-- UPDATE/DELETE: No permitido para usuarios
-- No creamos políticas de UPDATE/DELETE

-- =====================================================
-- 12. GRANT EXECUTE PERMISSIONS
-- =====================================================

-- Permitir a usuarios autenticados ejecutar la función de generación
GRANT EXECUTE ON FUNCTION generate_recurring_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_occurrence(freq recurrence_frequency, from_date DATE, interval_count INTEGER, day_of_period INTEGER) TO authenticated;

-- =====================================================
-- 13. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE recurring_transactions IS
'Tabla de transacciones recurrentes (gastos/ingresos que se repiten automáticamente).
Contiene la plantilla de la transacción y la configuración de frecuencia.';

COMMENT ON TABLE recurring_transaction_history IS
'Historial de transacciones generadas automáticamente desde recurring_transactions.
Permite auditar cuándo se generó cada transacción y qué recurrencia la creó.';

COMMENT ON FUNCTION calculate_next_occurrence(freq recurrence_frequency, from_date DATE, interval_count INTEGER, day_of_period INTEGER) IS
'Calcula la próxima fecha de ocurrencia de una recurrencia basada en la frecuencia.
Maneja edge cases como meses con diferente cantidad de días.';

COMMENT ON FUNCTION generate_recurring_transactions() IS
'Función que genera automáticamente las transacciones recurrentes pendientes.
Debe ejecutarse diariamente via pg_cron o Vercel Cron.
Retorna el número de transacciones generadas y los IDs procesados.';

COMMIT;
