# Migration: Recurring Transactions (Gastos Recurrentes)

## Archivo
`20251115000001_create_recurring_transactions.sql`

## Descripción
Implementa el sistema completo de transacciones recurrentes (gastos/ingresos automáticos) en Moni.

---

## ✅ Lo que incluye esta migration:

### 1. **ENUM: `recurrence_frequency`**
Define las frecuencias soportadas:
- `daily` - Diario
- `weekly` - Semanal
- `biweekly` - Quincenal (cada 2 semanas)
- `monthly` - Mensual
- `yearly` - Anual

### 2. **Tabla: `recurring_transactions`**
Almacena la configuración de cada recurrencia:
- Template de la transacción (monto, descripción, cuenta, categoría)
- Configuración de frecuencia y fechas
- Estado (activo/pausado)
- Control de próxima generación

**Constraints importantes:**
- ✅ Solo gastos e ingresos (NO transferencias por ahora - MVP)
- ✅ Validación de día del período según frecuencia
- ✅ Validación de cuentas del usuario
- ✅ End date debe ser posterior a start date

### 3. **Tabla: `recurring_transaction_history`**
Auditoría de transacciones generadas:
- Qué recurrencia generó qué transacción
- Fecha programada vs fecha real de creación
- Timestamp de generación

### 4. **Función: `calculate_next_occurrence()`**
Calcula la próxima fecha de ejecución basada en:
- Frecuencia (daily, weekly, biweekly, monthly, yearly)
- Intervalo (cada cuántos períodos)
- Día del período (para mensual y semanal)

**Edge cases manejados:**
- Meses con diferente cantidad de días (ej: 31 → 30 días)
- Último día del mes
- Años bisiestos (manejado por PostgreSQL)

### 5. **Función: `generate_recurring_transactions()`**
Función principal que:
1. Busca recurrencias activas con `next_occurrence_date <= CURRENT_DATE`
2. Crea la transacción correspondiente (marcada como "completada")
3. Registra en historial
4. Actualiza la recurrencia con la próxima fecha

**Retorna:**
- `generated_count`: Número de transacciones generadas
- `processed_recurring_ids`: Array de IDs de recurrencias procesadas

### 6. **Triggers**
- `update_recurring_transactions_updated_at` - Actualiza `updated_at` automáticamente
- `validate_recurring_transaction_accounts_trigger` - Valida que las cuentas pertenezcan al usuario

### 7. **Índices de performance**
- `idx_recurring_transactions_profile_active` - Búsqueda por usuario y estado
- `idx_recurring_transactions_next_occurrence` - **CRÍTICO** para el cron job
- `idx_recurring_transactions_account` - Búsqueda por cuenta
- `idx_recurring_transactions_category` - Búsqueda por categoría
- `idx_recurring_history_recurring` - Historial por recurrencia
- `idx_recurring_history_transaction` - Historial por transacción

### 8. **RLS Policies**
- `recurring_transactions_all_own` - Solo ver/editar tus propias recurrencias
- `recurring_history_select_own` - Solo ver historial de tus recurrencias
- No permite INSERT/UPDATE/DELETE manual del historial (solo via función)

---

## 🚀 Cómo aplicar la migration

### Opción 1: Supabase CLI (Recomendado)
```bash
# Navegar a la carpeta del proyecto
cd /path/to/moni

# Aplicar migration
supabase db push --include-all

# O aplicar solo esta migration
supabase migration up --include-all
```

### Opción 2: Supabase Dashboard
1. Ir a **SQL Editor** en Supabase Dashboard
2. Copiar todo el contenido de `20251115000001_create_recurring_transactions.sql`
3. Pegar y ejecutar
4. Verificar que no haya errores

### Opción 3: psql
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/20251115000001_create_recurring_transactions.sql
```

---

## 🧪 Testing manual de la migration

### 1. Verificar que las tablas se crearon
```sql
-- Ver tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%recurring%';

-- Debería retornar:
-- recurring_transactions
-- recurring_transaction_history
```

### 2. Verificar funciones
```sql
-- Ver funciones creadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%recurring%';

-- Debería retornar:
-- calculate_next_occurrence
-- generate_recurring_transactions
-- validate_recurring_transaction_accounts
```

### 3. Test de cálculo de próxima fecha
```sql
-- Test: Próxima fecha mensual (día 15)
SELECT calculate_next_occurrence('monthly'::recurrence_frequency, '2025-11-15'::DATE, 1, 15);
-- Debería retornar: 2025-12-15

-- Test: Próxima fecha quincenal
SELECT calculate_next_occurrence('biweekly'::recurrence_frequency, '2025-11-15'::DATE, 1, NULL);
-- Debería retornar: 2025-11-29

-- Test: Edge case - Día 31 en mes de 30 días
SELECT calculate_next_occurrence('monthly'::recurrence_frequency, '2025-01-31'::DATE, 1, 31);
-- Debería retornar: 2025-02-28 (último día de febrero)
```

### 4. Test de creación de recurrencia (desde tu app o SQL)
```sql
-- Insertar recurrencia de prueba (reemplaza los UUIDs con valores reales)
INSERT INTO recurring_transactions (
  profile_id,
  type,
  amount,
  currency,
  description,
  account_id,
  category_id,
  frequency,
  interval_count,
  day_of_period,
  start_date,
  next_occurrence_date,
  is_active
)
VALUES (
  'tu-profile-id-aqui',
  'expense',
  50000,
  'PYG',
  'Netflix mensual',
  'tu-account-id-aqui',
  'tu-category-id-aqui',
  'monthly',
  1,
  5,  -- Día 5 de cada mes
  CURRENT_DATE,
  CURRENT_DATE,
  TRUE
);
```

### 5. Test de generación manual
```sql
-- Ejecutar generación de recurrencias manualmente
SELECT * FROM generate_recurring_transactions();

-- Verificar que se crearon transacciones
SELECT * FROM transactions
WHERE description LIKE '%recurrente%'
ORDER BY created_at DESC
LIMIT 5;

-- Verificar historial
SELECT * FROM recurring_transaction_history
ORDER BY generated_at DESC
LIMIT 5;
```

---

## ⚙️ Configuración de Cron (SIGUIENTE PASO)

La migration NO configura el cron automáticamente. Debes hacerlo manualmente:

### Opción A: pg_cron (Supabase)
```sql
-- Habilitar extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar ejecución diaria a las 00:05 UTC
SELECT cron.schedule(
  'generate-recurring-transactions',
  '5 0 * * *',
  $$SELECT generate_recurring_transactions();$$
);

-- Ver cron jobs activos
SELECT * FROM cron.job;

-- Desactivar cron (si necesitas)
SELECT cron.unschedule('generate-recurring-transactions');
```

### Opción B: Vercel Cron
Crear archivo `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/recurring-transactions",
    "schedule": "0 0 * * *"
  }]
}
```

Crear API route en `src/app/api/cron/recurring-transactions/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('generate_recurring_transactions');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
```

---

## 📊 Schema visual

```
recurring_transactions
├── id (UUID)
├── profile_id (UUID) → profiles.id
├── type (transaction_type)
├── amount (BIGINT)
├── currency (TEXT)
├── description (TEXT)
├── merchant (TEXT nullable)
├── category_id (UUID nullable) → categories.id
├── account_id (UUID) → accounts.id
├── to_account_id (UUID nullable) → accounts.id
├── notes (TEXT nullable)
├── frequency (recurrence_frequency)
├── interval_count (INTEGER)
├── day_of_period (INTEGER nullable)
├── start_date (DATE)
├── end_date (DATE nullable)
├── is_active (BOOLEAN)
├── last_generated_date (DATE nullable)
├── next_occurrence_date (DATE)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

recurring_transaction_history
├── id (UUID)
├── recurring_transaction_id (UUID) → recurring_transactions.id
├── transaction_id (UUID) → transactions.id
├── generated_at (TIMESTAMPTZ)
├── scheduled_date (DATE)
├── actual_date (DATE)
└── created_at (TIMESTAMPTZ)
```

---

## 🔒 Seguridad (RLS)

- ✅ Solo puedes ver/editar tus propias recurrencias
- ✅ Solo puedes ver el historial de tus recurrencias
- ✅ No puedes modificar el historial manualmente (solo via función)
- ✅ Las cuentas y categorías se validan automáticamente
- ✅ La función usa SECURITY DEFINER para generar transacciones

---

## 📝 Notas importantes

1. **Las transferencias NO están soportadas** en esta versión (MVP)
   - El constraint `no_recurring_transfers` lo previene
   - Se puede agregar en v2

2. **Las transacciones se generan como "completed"**
   - Inmediatamente afectan el balance de cuentas
   - Los triggers existentes de `update_account_balance()` funcionan normalmente

3. **La descripción se marca automáticamente**
   - Se agrega " (recurrente)" al final
   - Facilita identificar transacciones auto-generadas

4. **Edge case de días del mes**
   - Si configuras día 31 y el mes tiene 30 días, usa día 30
   - Si configuras día 31 en febrero, usa día 28 (o 29 en bisiesto)

5. **No hay validación de balance**
   - Las transacciones se crean aunque la cuenta tenga balance negativo
   - Considera agregar validación en v2

---

## 🐛 Troubleshooting

### Error: "relation recurring_transactions does not exist"
- La migration no se aplicó correctamente
- Ejecuta la migration manualmente

### Error: "function calculate_next_occurrence does not exist"
- Verifica que la migration se ejecutó completamente
- Revisa logs de Supabase

### Las transacciones no se generan automáticamente
- Verifica que configuraste el cron job
- Ejecuta manualmente: `SELECT * FROM generate_recurring_transactions();`
- Revisa que `next_occurrence_date <= CURRENT_DATE`
- Verifica que `is_active = TRUE`

### Error: "La cuenta seleccionada no pertenece al usuario"
- El trigger de validación está funcionando correctamente
- Verifica que el `account_id` sea del usuario autenticado

---

## ✅ Checklist de verificación

Después de aplicar la migration:

- [ ] Tablas creadas: `recurring_transactions`, `recurring_transaction_history`
- [ ] ENUM creado: `recurrence_frequency`
- [ ] Funciones creadas: `calculate_next_occurrence`, `generate_recurring_transactions`
- [ ] Triggers creados y funcionando
- [ ] Índices creados (verificar con `\di` en psql)
- [ ] RLS policies activas (verificar con `\d+ recurring_transactions`)
- [ ] Tipos TypeScript actualizados en `src/types/database.ts`
- [ ] Test manual de `calculate_next_occurrence()` exitoso
- [ ] Test manual de `generate_recurring_transactions()` exitoso

---

## 📚 Próximos pasos (FASE 2)

Una vez verificada la migration, continuar con:

1. **Backend**
   - Crear `src/lib/supabase/recurring-transactions.ts`
   - Crear hooks de React Query
   - Crear server actions

2. **Frontend**
   - Modificar `TransactionForm`
   - Crear componente `RecurringConfig`
   - Crear página `/dashboard/recurrentes`

3. **Testing**
   - Tests unitarios de funciones PL/pgSQL
   - Tests de integración del cron
   - Tests E2E del flujo completo
