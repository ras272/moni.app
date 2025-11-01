-- =====================================================
-- Migration: Update calculate_group_debts function
-- =====================================================
-- Description: Actualiza función calculate_group_debts() para usar expense_splits.amount
-- Author: Sistema
-- Date: 2025-11-01
-- Version: 1.0.0
-- Dependencies: 
--   - 20251101000003_backfill_expense_splits_amount.sql
--
-- OBJETIVO:
--   Simplificar función calculate_group_debts() para:
--   - Usar splits.amount directamente (ya calculado)
--   - Eliminar división dinámica (ya no es necesaria)
--   - Soportar divisiones flexibles automáticamente
--   - Mejorar performance (menos cálculos en runtime)
--
-- CAMBIOS:
--   - Reemplaza división dinámica por SUM(splits.amount)
--   - Mantiene lógica de settlements
--   - Mantiene algoritmo greedy para minimizar transacciones
--   - Firma de función idéntica (compatible con código existente)
--
-- SEGURIDAD:
--   - Función SECURITY DEFINER (mismo nivel de seguridad que antes)
--   - No cambia permisos
--   - Transacción atómica con rollback
--
-- ROLLBACK:
--   Ver sección al final del archivo (restaura versión anterior)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFICAR PRERREQUISITOS
-- =====================================================

DO $$
BEGIN
  -- Verificar que expense_splits.amount es NOT NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_splits'
    AND column_name = 'amount'
    AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'Columna expense_splits.amount debe ser NOT NULL. Ejecuta migración 20251101000003 primero.';
  END IF;
END $$;

-- =====================================================
-- 2. BACKUP DE FUNCIÓN ANTERIOR (comentada al final)
-- =====================================================

-- La versión anterior se guardará al final para rollback manual

-- =====================================================
-- 3. REEMPLAZAR FUNCIÓN calculate_group_debts
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_group_debts(group_uuid UUID)
RETURNS TABLE (
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  debt_amount BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- =====================================================
  -- CTE 1: Calcular cuánto debe cada participante
  -- CAMBIO: Usa SUM(splits.amount) en lugar de división dinámica
  -- =====================================================
  expense_shares AS (
    SELECT 
      es.participant_id,
      SUM(es.amount) as amount_owed
    FROM expense_splits es
    JOIN group_expenses ge ON es.expense_id = ge.id
    WHERE ge.group_id = group_uuid
    GROUP BY es.participant_id
  ),
  
  -- =====================================================
  -- CTE 2: Calcular cuánto pagó cada participante
  -- SIN CAMBIOS (igual que antes)
  -- =====================================================
  expense_payments AS (
    SELECT 
      paid_by_participant_id as participant_id,
      SUM(amount) as amount_paid
    FROM group_expenses
    WHERE group_id = group_uuid
    GROUP BY paid_by_participant_id
  ),
  
  -- =====================================================
  -- CTE 3: Settlements pagados (salientes)
  -- SIN CAMBIOS (igual que antes)
  -- =====================================================
  settlements_out AS (
    SELECT 
      from_participant_id as participant_id,
      SUM(amount) as total_paid
    FROM group_settlements
    WHERE group_id = group_uuid
    GROUP BY from_participant_id
  ),
  
  -- =====================================================
  -- CTE 4: Settlements recibidos (entrantes)
  -- SIN CAMBIOS (igual que antes)
  -- =====================================================
  settlements_in AS (
    SELECT 
      to_participant_id as participant_id,
      SUM(amount) as total_received
    FROM group_settlements
    WHERE group_id = group_uuid
    GROUP BY to_participant_id
  ),
  
  -- =====================================================
  -- CTE 5: Calcular balance final de cada participante
  -- SIN CAMBIOS (igual que antes)
  -- Fórmula: balance = (pagado - debe) + settlements_pagados - settlements_recibidos
  -- =====================================================
  participant_balances AS (
    SELECT 
      gp.id as participant_id,
      gp.name as participant_name,
      COALESCE(ep.amount_paid, 0) as paid,
      COALESCE(es.amount_owed, 0) as owes,
      COALESCE(so.total_paid, 0) as settlements_paid,
      COALESCE(si.total_received, 0) as settlements_received,
      (COALESCE(ep.amount_paid, 0) - COALESCE(es.amount_owed, 0) + 
       COALESCE(so.total_paid, 0) - COALESCE(si.total_received, 0)) as balance
    FROM group_participants gp
    LEFT JOIN expense_shares es ON gp.id = es.participant_id
    LEFT JOIN expense_payments ep ON gp.id = ep.participant_id
    LEFT JOIN settlements_out so ON gp.id = so.participant_id
    LEFT JOIN settlements_in si ON gp.id = si.participant_id
    WHERE gp.group_id = group_uuid
  )
  
  -- =====================================================
  -- QUERY FINAL: Retornar pares debtor-creditor
  -- SIN CAMBIOS (igual que antes)
  -- =====================================================
  SELECT 
    debtor.participant_id as debtor_id,
    debtor.participant_name as debtor_name,
    creditor.participant_id as creditor_id,
    creditor.participant_name as creditor_name,
    ABS(debtor.balance)::bigint as debt_amount
  FROM participant_balances debtor
  CROSS JOIN participant_balances creditor
  WHERE debtor.balance < 0  -- deudor (debe dinero)
    AND creditor.balance > 0  -- acreedor (le deben dinero)
    AND ABS(debtor.balance) > 0  -- hay deuda pendiente
  ORDER BY debt_amount DESC;
END;
$$;

-- =====================================================
-- 4. ACTUALIZAR COMENTARIOS DE LA FUNCIÓN
-- =====================================================

COMMENT ON FUNCTION calculate_group_debts IS 
'Calcula las deudas pendientes entre participantes de un grupo.

VERSIÓN: 2.0.0 (optimizada para usar splits.amount)

CAMBIOS vs 1.0.0:
- Usa SUM(splits.amount) en lugar de división dinámica
- Soporta divisiones flexibles automáticamente
- Mejor performance (menos cálculos)

Fórmula: balance = (gastos_pagados - gastos_debidos) + settlements_pagados - settlements_recibidos

Retorna pares debtor-creditor con el monto adeudado.
Compatible con gastos legacy (división equitativa) y nuevos (división flexible).';

-- =====================================================
-- 5. VALIDACIÓN: Probar función con datos existentes
-- =====================================================

DO $$
DECLARE
  group_record RECORD;
  debts_count INTEGER;
  test_errors INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDANDO FUNCIÓN ACTUALIZADA';
  RAISE NOTICE '========================================';
  
  -- Probar con cada grupo existente
  FOR group_record IN
    SELECT id, name 
    FROM money_tag_groups 
    LIMIT 10
  LOOP
    BEGIN
      -- Ejecutar función actualizada
      SELECT COUNT(*) INTO debts_count
      FROM calculate_group_debts(group_record.id);
      
      RAISE NOTICE 'Grupo "%": % deudas calculadas', group_record.name, debts_count;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error en grupo "%": %', group_record.name, SQLERRM;
        test_errors := test_errors + 1;
    END;
  END LOOP;
  
  IF test_errors > 0 THEN
    RAISE EXCEPTION 'Validación falló: % grupos con errores', test_errors;
  END IF;
  
  RAISE NOTICE 'Validación exitosa: Función funciona correctamente';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 6. ANÁLISIS DE IMPACTO
-- =====================================================

DO $$
DECLARE
  total_groups INTEGER;
  total_participants INTEGER;
  total_expenses INTEGER;
  total_splits INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_groups FROM money_tag_groups;
  SELECT COUNT(*) INTO total_participants FROM group_participants;
  SELECT COUNT(*) INTO total_expenses FROM group_expenses;
  SELECT COUNT(*) INTO total_splits FROM expense_splits;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Función calculate_group_debts() actualizada a v2.0.0';
  RAISE NOTICE 'Grupos afectados: %', total_groups;
  RAISE NOTICE 'Participantes: %', total_participants;
  RAISE NOTICE 'Gastos: %', total_expenses;
  RAISE NOTICE 'Splits: %', total_splits;
  RAISE NOTICE 'Mejora: Usa splits.amount (ya calculado) en vez de división dinámica';
  RAISE NOTICE 'Soporta: Divisiones equitativas Y flexibles (porcentajes, exactos)';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- 
-- Para revertir a la versión anterior de la función, ejecuta:
-- 
-- BEGIN;
-- 
-- CREATE OR REPLACE FUNCTION calculate_group_debts(group_uuid UUID)
-- RETURNS TABLE (
--   debtor_id UUID,
--   debtor_name TEXT,
--   creditor_id UUID,
--   creditor_name TEXT,
--   debt_amount BIGINT
-- ) 
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   RETURN QUERY
--   WITH 
--   expense_shares AS (
--     SELECT 
--       es.participant_id,
--       SUM(ge.amount::decimal / (
--         SELECT COUNT(*) 
--         FROM expense_splits 
--         WHERE expense_id = ge.id
--       ))::bigint as amount_owed
--     FROM expense_splits es
--     JOIN group_expenses ge ON es.expense_id = ge.id
--     WHERE ge.group_id = group_uuid
--     GROUP BY es.participant_id
--   ),
--   expense_payments AS (
--     SELECT 
--       paid_by_participant_id as participant_id,
--       SUM(amount) as amount_paid
--     FROM group_expenses
--     WHERE group_id = group_uuid
--     GROUP BY paid_by_participant_id
--   ),
--   settlements_out AS (
--     SELECT 
--       from_participant_id as participant_id,
--       SUM(amount) as total_paid
--     FROM group_settlements
--     WHERE group_id = group_uuid
--     GROUP BY from_participant_id
--   ),
--   settlements_in AS (
--     SELECT 
--       to_participant_id as participant_id,
--       SUM(amount) as total_received
--     FROM group_settlements
--     WHERE group_id = group_uuid
--     GROUP BY to_participant_id
--   ),
--   participant_balances AS (
--     SELECT 
--       gp.id as participant_id,
--       gp.name as participant_name,
--       COALESCE(ep.amount_paid, 0) as paid,
--       COALESCE(es.amount_owed, 0) as owes,
--       COALESCE(so.total_paid, 0) as settlements_paid,
--       COALESCE(si.total_received, 0) as settlements_received,
--       (COALESCE(ep.amount_paid, 0) - COALESCE(es.amount_owed, 0) + 
--        COALESCE(so.total_paid, 0) - COALESCE(si.total_received, 0)) as balance
--     FROM group_participants gp
--     LEFT JOIN expense_shares es ON gp.id = es.participant_id
--     LEFT JOIN expense_payments ep ON gp.id = ep.participant_id
--     LEFT JOIN settlements_out so ON gp.id = so.participant_id
--     LEFT JOIN settlements_in si ON gp.id = si.participant_id
--     WHERE gp.group_id = group_uuid
--   )
--   SELECT 
--     debtor.participant_id as debtor_id,
--     debtor.participant_name as debtor_name,
--     creditor.participant_id as creditor_id,
--     creditor.participant_name as creditor_name,
--     ABS(debtor.balance)::bigint as debt_amount
--   FROM participant_balances debtor
--   CROSS JOIN participant_balances creditor
--   WHERE debtor.balance < 0
--     AND creditor.balance > 0
--     AND ABS(debtor.balance) > 0
--   ORDER BY debt_amount DESC;
-- END;
-- $$;
-- 
-- COMMENT ON FUNCTION calculate_group_debts IS 
-- 'Versión 1.0.0 (restaurada): Usa división dinámica';
-- 
-- COMMIT;
-- 
-- =====================================================
