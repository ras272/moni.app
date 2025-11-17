# Plan para Arreglar Problemas Críticos de Presupuestos

## 🎯 Objetivos

1. ✅ Resolver presupuesto general huérfano
2. ✅ Optimizar performance del trigger (de segundos a milisegundos)
3. ✅ Automatizar renovación de períodos
4. ✅ Prevenir fechas futuras en transacciones

---

## 📝 FASE 1: Presupuesto Huérfano (30 min)

### Paso 1.1: Crear endpoint para listar TODOS los presupuestos
**Archivo:** `src/app/api/budgets/list-all/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all budgets (even without periods)
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(name, icon),
        periods:budget_periods(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
```

**Testing:**
```bash
curl http://localhost:3000/api/budgets/list-all
```

---

### Paso 1.2: Crear endpoint para forzar eliminación
**Archivo:** `src/app/api/budgets/force-delete/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const supabase = await createClient();

    // Hard delete budget and all periods
    const { error: periodsError } = await supabase
      .from('budget_periods')
      .delete()
      .eq('budget_id', id);

    if (periodsError) throw periodsError;

    const { error: budgetError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (budgetError) throw budgetError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
```

**Testing:**
```bash
# 1. Listar todos
curl http://localhost:3000/api/budgets/list-all

# 2. Copiar el ID del presupuesto huérfano

# 3. Eliminarlo
curl -X POST http://localhost:3000/api/budgets/force-delete \
  -H "Content-Type: application/json" \
  -d '{"id":"el-id-que-copiaste"}'
```

---

### Paso 1.3: Ejecutar limpieza
```bash
# Listar presupuestos
curl http://localhost:3000/api/budgets/list-all | jq

# Identificar el huérfano (el que tiene periods.count = 0)

# Eliminar
curl -X POST http://localhost:3000/api/budgets/force-delete \
  -H "Content-Type: application/json" \
  -d '{"id":"UUID-AQUI"}'
```

**Resultado esperado:** Ahora podés crear presupuestos generales sin error.

---

## ⚡ FASE 2: Optimizar Performance del Trigger (45 min)

### Problema Actual
```sql
-- Trigger actual: recalcula TODOS los presupuestos
CREATE TRIGGER refresh_budgets_on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_budgets_on_transaction();

-- Esta función llama a:
PERFORM refresh_all_budget_periods(); -- ❌ Recalcula TODO
```

### Paso 2.1: Crear nueva función optimizada
**Archivo:** `migrations/20251116000004_optimize_budget_trigger.sql`

```sql
-- Nueva función que solo recalcula presupuestos afectados
CREATE OR REPLACE FUNCTION refresh_affected_budget_periods(
  p_profile_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_transaction_date DATE DEFAULT CURRENT_DATE
)
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
BEGIN
  -- Solo procesar budgets del mismo perfil
  FOR v_budget IN
    SELECT b.*
    FROM budgets b
    WHERE b.profile_id = p_profile_id
      AND b.is_active = TRUE
      AND (
        -- Budget general (afectado por todas las transacciones)
        b.category_id IS NULL
        OR
        -- Budget de la categoría específica
        (p_category_id IS NOT NULL AND b.category_id = p_category_id)
      )
  LOOP
    -- Obtener o crear el período actual
    PERFORM get_or_create_current_budget_period(v_budget.id);

    -- Obtener el período que contiene la fecha de la transacción
    SELECT * INTO v_period
    FROM budget_periods bp
    WHERE bp.budget_id = v_budget.id
      AND p_transaction_date >= bp.period_start
      AND p_transaction_date <= bp.period_end
    LIMIT 1;

    -- Si no hay período para esta fecha, skip
    CONTINUE WHEN v_period IS NULL;

    -- Calcular gasto del período
    IF v_budget.category_id IS NULL THEN
      -- Budget general: todos los gastos
      SELECT COALESCE(SUM(t.amount), 0) INTO v_spent
      FROM transactions t
      WHERE t.profile_id = v_budget.profile_id
        AND t.type = 'expense'
        AND t.status = 'completed'
        AND t.transaction_date >= v_period.period_start
        AND t.transaction_date <= v_period.period_end;
    ELSE
      -- Budget por categoría
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

-- Actualizar trigger para usar la nueva función
CREATE OR REPLACE FUNCTION trigger_refresh_budgets_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_category_id UUID;
  v_transaction_date DATE;
BEGIN
  -- Determinar qué datos usar según la operación
  IF TG_OP = 'DELETE' THEN
    v_profile_id := OLD.profile_id;
    v_category_id := OLD.category_id;
    v_transaction_date := OLD.transaction_date;
  ELSE
    v_profile_id := NEW.profile_id;
    v_category_id := NEW.category_id;
    v_transaction_date := NEW.transaction_date;
  END IF;

  -- Solo procesar transacciones de gasto completadas
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND
     NEW.type = 'expense' AND
     NEW.status = 'completed' THEN
    -- Recalcular solo presupuestos afectados
    PERFORM refresh_affected_budget_periods(
      v_profile_id,
      v_category_id,
      v_transaction_date
    );
  ELSIF TG_OP = 'DELETE' AND
        OLD.type = 'expense' AND
        OLD.status = 'completed' THEN
    -- Recalcular solo presupuestos afectados
    PERFORM refresh_affected_budget_periods(
      v_profile_id,
      v_category_id,
      v_transaction_date
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Paso 2.2: Ejecutar migración
```bash
# En Supabase SQL Editor, ejecutar el archivo:
# migrations/20251116000004_optimize_budget_trigger.sql
```

### Paso 2.3: Testing
```bash
# Crear transacción y medir tiempo
time curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 50000,
    "description": "Test",
    "category_id": "...",
    "account_id": "...",
    "transaction_date": "2025-11-16"
  }'
```

**Resultado esperado:**
- Antes: ~800ms (con 1 presupuesto)
- Después: ~200-300ms ✅

**Con 10 presupuestos:**
- Antes: 3-5 segundos ❌
- Después: ~200-300ms ✅ (solo recalcula 1-2 presupuestos)

---

## 🔄 FASE 3: Renovación Automática de Períodos (1 hora)

### Paso 3.1: Crear función de renovación global
**Archivo:** `migrations/20251116000005_create_renew_periods_function.sql`

```sql
-- Función que renueva todos los períodos que hayan expirado
CREATE OR REPLACE FUNCTION renew_expired_budget_periods()
RETURNS JSON AS $$
DECLARE
  v_budget RECORD;
  v_renewed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_period_id UUID;
BEGIN
  -- Iterar sobre todos los presupuestos activos
  FOR v_budget IN
    SELECT id FROM budgets WHERE is_active = TRUE
  LOOP
    BEGIN
      -- Intentar crear/obtener período actual
      -- Si el período actual expiró, esto creará uno nuevo
      SELECT get_or_create_current_budget_period(v_budget.id) INTO v_period_id;

      IF v_period_id IS NOT NULL THEN
        v_renewed_count := v_renewed_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE WARNING 'Error renovando período para budget %: %', v_budget.id, SQLERRM;
    END;
  END LOOP;

  RETURN json_build_object(
    'renewed_count', v_renewed_count,
    'error_count', v_error_count,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 3.2: Crear Edge Function para Cron
**Archivo:** `supabase/functions/renew-budget-periods/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  try {
    // Verificar que es un cron job (autorización)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Crear cliente de Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Llamar a la función de renovación
    const { data, error } = await supabase.rpc('renew_expired_budget_periods');

    if (error) throw error;

    console.log('Budget periods renewed:', data);

    return new Response(
      JSON.stringify({
        success: true,
        result: data,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error renewing budget periods:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Paso 3.3: Configurar Cron en Supabase
**Opción A: Supabase Cron (pg_cron)**

```sql
-- En Supabase SQL Editor
-- Ejecutar diariamente a las 00:05 AM
SELECT cron.schedule(
  'renew-budget-periods-daily',
  '5 0 * * *', -- Cada día a las 00:05
  $$
  SELECT renew_expired_budget_periods();
  $$
);

-- Verificar que el cron está configurado
SELECT * FROM cron.job;
```

**Opción B: Supabase Edge Function + External Cron**

Si no tenés acceso a pg_cron, usar un servicio externo:

1. **Configurar en cron-job.org:**
   - URL: `https://tu-proyecto.supabase.co/functions/v1/renew-budget-periods`
   - Schedule: `0 0 * * *` (diario a medianoche)
   - Headers: `Authorization: Bearer TU_CRON_SECRET`

2. **O usar GitHub Actions:**

```yaml
# .github/workflows/renew-budgets.yml
name: Renew Budget Periods

on:
  schedule:
    - cron: '0 0 * * *' # Diario a medianoche UTC

jobs:
  renew:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-proyecto.supabase.co/functions/v1/renew-budget-periods
```

### Paso 3.4: Testing Manual
```bash
# Ejecutar manualmente para probar
curl -X POST \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-proyecto.supabase.co/functions/v1/renew-budget-periods
```

**O en SQL:**
```sql
SELECT renew_expired_budget_periods();
```

---

## 🛡️ FASE 4: Validación de Fechas Futuras (15 min)

### Paso 4.1: Actualizar schema de validación
**Archivo:** `src/lib/schemas.ts`

```typescript
export const transactionSchema = z.object({
  tipo: z.enum(['EXPENSE', 'INGRESS']),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  fecha: z.date().max(new Date(), 'La fecha no puede ser futura'), // ✅ NUEVO
  categoria: z.string(),
  cuenta: z.string(),
});
```

### Paso 4.2: Actualizar componente DatePicker
**Archivo:** `src/components/forms/form-date-picker.tsx`

Buscar la línea donde se configura `maxDate` y asegurarse que esté:

```typescript
config={{
  placeholder: 'Seleccionar fecha',
  maxDate: new Date(), // ✅ No permitir fechas futuras
}}
```

### Paso 4.3: Testing
```bash
# Intentar crear transacción con fecha futura
# Debería mostrar error: "La fecha no puede ser futura"
```

---

## 📊 RESUMEN DE MEJORAS

| Problema | Antes | Después | Mejora |
|----------|-------|---------|--------|
| Presupuesto huérfano | ❌ Bloqueado | ✅ Eliminado | 100% |
| Performance (1 presupuesto) | 800ms | 200-300ms | 60-70% |
| Performance (10 presupuestos) | 3-5s | 200-300ms | 90%+ |
| Renovación de períodos | ❌ Manual | ✅ Automática diaria | 100% |
| Fechas futuras | ✅ Permitidas | ❌ Bloqueadas | Seguridad |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Presupuesto Huérfano (30 min)
- [ ] Crear `src/app/api/budgets/list-all/route.ts`
- [ ] Crear `src/app/api/budgets/force-delete/route.ts`
- [ ] Ejecutar `curl` para listar presupuestos
- [ ] Identificar y eliminar presupuesto huérfano
- [ ] Verificar que se puede crear presupuesto general

### Fase 2: Optimizar Trigger (45 min)
- [ ] Crear migración `20251116000004_optimize_budget_trigger.sql`
- [ ] Ejecutar migración en Supabase SQL Editor
- [ ] Crear transacción de prueba
- [ ] Verificar que tarda <300ms (antes 800ms)
- [ ] Verificar que presupuestos se actualizan correctamente

### Fase 3: Renovación Automática (1 hora)
- [ ] Crear migración `20251116000005_create_renew_periods_function.sql`
- [ ] Ejecutar migración en Supabase
- [ ] Crear Edge Function `supabase/functions/renew-budget-periods/index.ts`
- [ ] Configurar cron (Opción A o B)
- [ ] Probar ejecución manual
- [ ] Verificar logs al día siguiente

### Fase 4: Validar Fechas (15 min)
- [ ] Actualizar `src/lib/schemas.ts`
- [ ] Verificar `form-date-picker.tsx` tiene `maxDate`
- [ ] Probar crear transacción con fecha futura
- [ ] Verificar que muestra error

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

```bash
# DÍA 1 (1.5 horas)
1. Fase 1: Limpiar presupuesto huérfano (30 min)
2. Fase 4: Validar fechas futuras (15 min)
3. Fase 2: Optimizar trigger (45 min)

# DÍA 2 (1 hora)
4. Fase 3: Configurar renovación automática (1 hora)
```

---

## 🧪 TESTING COMPLETO

Después de implementar todo, probar:

```bash
# 1. Crear presupuesto general
# Debe funcionar sin error ✅

# 2. Crear transacción
# Debe tardar <300ms ✅

# 3. Verificar presupuesto actualizado
# Debe reflejar el gasto ✅

# 4. Intentar fecha futura
# Debe mostrar error ✅

# 5. Ejecutar renovación manual
SELECT renew_expired_budget_periods();
# Debe retornar JSON con renewed_count ✅
```

---

**¿Querés que empiece a implementar alguna fase?**
