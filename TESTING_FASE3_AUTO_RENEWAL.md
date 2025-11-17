# Testing FASE 3 - Auto-Renovación de Períodos

## 📋 Resumen

FASE 3 implementa un **cron job** que corre automáticamente todos los días a las **2:00 AM** para renovar períodos de presupuestos que expiraron.

**Componentes creados:**
1. `renew_expired_budget_periods()` - Función que busca y renueva períodos expirados
2. `cron_renew_budget_periods()` - Wrapper con logging
3. `budget_renewal_logs` - Tabla para guardar logs de ejecución
4. Cron job `renew-budget-periods` - Scheduled para las 2:00 AM diarias

---

## ✅ PASO 1: Ejecutar la Migración

1. Andá a Supabase Dashboard → SQL Editor
2. Pegá el contenido de: `migrations/20251116000006_auto_renew_budget_periods.sql`
3. Click "Run"

**Resultado esperado:**
```
Success. No rows returned
```

---

## 🔍 PASO 2: Verificar que el Cron Job se Creó

Ejecutá este query en Supabase SQL Editor:

```sql
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'renew-budget-periods';
```

**Resultado esperado:**
```
jobid | jobname              | schedule    | command                                  | active
------|---------------------|-------------|------------------------------------------|-------
1     | renew-budget-periods | 0 2 * * *   | SELECT cron_renew_budget_periods();      | true
```

✅ Verificá que:
- `schedule` = `0 2 * * *` (2:00 AM todos los días)
- `active` = `true`

---

## 🧪 PASO 3: Testear Manualmente (SIN esperar hasta las 2 AM)

### Opción A: Ejecutar el Cron Manualmente

En Supabase SQL Editor:

```sql
-- Ejecutar la renovación ahora
SELECT cron_renew_budget_periods();

-- Ver el resultado en los logs
SELECT
  executed_at,
  renewed_count,
  budget_ids,
  duration_ms,
  error
FROM budget_renewal_logs
ORDER BY executed_at DESC
LIMIT 1;
```

**Resultado esperado:**

Si **NO** hay presupuestos con períodos expirados:
```
renewed_count | budget_ids | duration_ms
--------------|------------|------------
0             | {}         | 50-100
```

Si **SÍ** hay presupuestos con períodos expirados:
```
renewed_count | budget_ids                                        | duration_ms
--------------|--------------------------------------------------|------------
2             | {uuid-1, uuid-2}                                  | 200-500
```

---

### Opción B: Simular un Presupuesto Expirado

Para testear mejor, podés crear un escenario donde un presupuesto necesite renovación:

**1. Crear un presupuesto con período que "ya expiró":**

```sql
-- Insertar presupuesto de prueba
INSERT INTO budgets (
  profile_id,
  name,
  period_type,
  budget_amount,
  category_id,
  is_active
)
VALUES (
  (SELECT id FROM profiles LIMIT 1),  -- Tu profile
  'Test Auto-Renewal',
  'monthly',
  500000,
  NULL,  -- General budget
  true
)
RETURNING id;
-- Guardá el ID que retorna
```

**2. Crear un período "expirado" (que terminó ayer):**

```sql
INSERT INTO budget_periods (
  budget_id,
  period_start,
  period_end,
  budget_amount,
  spent_amount
)
VALUES (
  'BUDGET-ID-AQUI',  -- Reemplazá con el ID del paso 1
  CURRENT_DATE - INTERVAL '30 days',  -- Empezó hace 30 días
  CURRENT_DATE - INTERVAL '1 day',    -- Terminó AYER
  500000,
  0
);
```

**3. Ejecutar la renovación:**

```sql
SELECT cron_renew_budget_periods();
```

**4. Verificar que se creó el nuevo período:**

```sql
SELECT
  bp.period_start,
  bp.period_end,
  bp.budget_amount,
  bp.spent_amount,
  CASE
    WHEN bp.period_end >= CURRENT_DATE THEN '✅ ACTUAL'
    ELSE '❌ EXPIRADO'
  END as status
FROM budget_periods bp
WHERE bp.budget_id = 'BUDGET-ID-AQUI'
ORDER BY bp.period_start DESC
LIMIT 5;
```

**Resultado esperado:**
```
period_start | period_end   | budget_amount | status
-------------|--------------|---------------|------------
2025-11-01   | 2025-11-30   | 500000        | ✅ ACTUAL      (nuevo, creado por el cron)
2025-10-17   | 2025-11-15   | 500000        | ❌ EXPIRADO    (el viejo)
```

---

## 📊 PASO 4: Monitorear el Cron Job en Producción

### Ver Historial de Ejecuciones

```sql
SELECT
  executed_at AT TIME ZONE 'America/Asuncion' as executed_at_local,
  renewed_count,
  duration_ms,
  CASE
    WHEN error IS NULL THEN '✅ OK'
    ELSE '❌ ERROR: ' || error
  END as status
FROM budget_renewal_logs
ORDER BY executed_at DESC
LIMIT 20;
```

### Ver Presupuestos Activos y sus Períodos

```sql
SELECT
  b.id,
  b.name,
  b.period_type,
  COUNT(bp.id) as total_periods,
  COUNT(bp.id) FILTER (WHERE bp.period_end >= CURRENT_DATE) as current_periods,
  MAX(bp.period_end) as last_period_end
FROM budgets b
LEFT JOIN budget_periods bp ON bp.budget_id = b.id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.period_type
ORDER BY b.created_at DESC;
```

**Interpretación:**
- `current_periods = 0` → El cron debería crear un período nuevo
- `current_periods = 1` → ✅ Todo bien
- `current_periods > 1` → ⚠️ Algo raro (no debería pasar)

---

## 🎯 PASO 5: Verificar en la UI

1. Andá a `/dashboard/presupuestos`
2. Verificá que todos los presupuestos tengan un período actual visible
3. Si había presupuestos sin período, ahora deberían tenerlo

---

## ⏰ Configuración del Horario del Cron

El cron está configurado para correr a las **2:00 AM** (horario del servidor de Supabase, probablemente UTC).

**Para cambiar el horario:**

```sql
-- Ver el cron actual
SELECT * FROM cron.job WHERE jobname = 'renew-budget-periods';

-- Cambiar el horario (ejemplo: 3:00 AM)
SELECT cron.unschedule('renew-budget-periods');
SELECT cron.schedule(
  'renew-budget-periods',
  '0 3 * * *',  -- Minuto Hora Día Mes DiaSemana
  'SELECT cron_renew_budget_periods();'
);
```

**Formatos de cron comunes:**
```
0 2 * * *     → Diario a las 2:00 AM
0 */6 * * *   → Cada 6 horas
0 0 1 * *     → Primer día de cada mes a medianoche
*/30 * * * *  → Cada 30 minutos
```

---

## 🐛 TROUBLESHOOTING

### El cron no aparece en la lista

**Causa:** pg_cron no está habilitado

**Solución:**
1. Andá a Supabase Dashboard → Database → Extensions
2. Buscá "pg_cron"
3. Click "Enable"
4. Ejecutá la migración de nuevo

---

### El cron ejecuta pero no renueva nada

**Diagnóstico:**

```sql
-- Ver si hay presupuestos que necesitan renovación
SELECT
  b.id,
  b.name,
  (SELECT MAX(period_end) FROM budget_periods WHERE budget_id = b.id) as last_period_end,
  CASE
    WHEN (SELECT MAX(period_end) FROM budget_periods WHERE budget_id = b.id) < CURRENT_DATE
    THEN '❌ NECESITA RENOVACIÓN'
    ELSE '✅ TIENE PERÍODO ACTUAL'
  END as status
FROM budgets b
WHERE b.is_active = true;
```

Si todos muestran "✅ TIENE PERÍODO ACTUAL", entonces el cron está funcionando correctamente (no hay nada que renovar).

---

### Error en los logs

```sql
SELECT error
FROM budget_renewal_logs
WHERE error IS NOT NULL
ORDER BY executed_at DESC
LIMIT 5;
```

Si hay errores, compartí el mensaje para debuggear.

---

## 📝 LIMPIEZA (Opcional)

### Eliminar el presupuesto de prueba

```sql
-- Eliminar presupuesto de prueba
DELETE FROM budget_periods WHERE budget_id = 'BUDGET-ID-AQUI';
DELETE FROM budgets WHERE id = 'BUDGET-ID-AQUI';
```

### Ver todos los cron jobs activos

```sql
SELECT * FROM cron.job ORDER BY jobname;
```

---

## ✅ CHECKLIST FINAL

- [ ] Migración ejecutada exitosamente
- [ ] Cron job aparece en `cron.job` con `active = true`
- [ ] Ejecutaste `cron_renew_budget_periods()` manualmente
- [ ] Los logs en `budget_renewal_logs` muestran ejecución exitosa
- [ ] Presupuestos sin período actual ahora tienen uno
- [ ] La UI muestra períodos actualizados

Una vez que todo esté ✅, FASE 3 está completa.
