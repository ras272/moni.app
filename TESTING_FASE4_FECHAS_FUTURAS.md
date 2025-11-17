# Testing FASE 4 - Validación de Fechas Futuras

## 📋 Resumen

FASE 4 implementa validación en 2 capas para prevenir transacciones con fechas futuras:

1. **Frontend (Zod)** - Validación inmediata con feedback al usuario
2. **Base de datos (CHECK constraint)** - Seguridad total, no se puede bypassear

---

## ✅ PASO 1: Ejecutar la Migración

1. Andá a Supabase Dashboard → SQL Editor
2. Pegá el contenido de: `migrations/20251116000005_prevent_future_transactions.sql`
3. Click "Run"

**Resultado esperado:**
```
Success. No rows returned
```

---

## 🧪 PASO 2: Testear desde la UI (Frontend)

### Caso 1: Transacción de HOY (debe funcionar ✅)

1. Andá a `/dashboard/transacciones`
2. Click "Agregar Transacción"
3. Completá el formulario:
   - Descripción: "Prueba fecha hoy"
   - Monto: 10000
   - Fecha: **HOY** (dejá la fecha por defecto)
   - Categoría: cualquiera
   - Cuenta: cualquiera
4. Click "Guardar"

**Resultado esperado:**
- ✅ Transacción creada exitosamente
- ✅ Aparece en la lista

### Caso 2: Transacción de MAÑANA (debe funcionar ✅)

1. Click "Agregar Transacción"
2. Completá el formulario:
   - Descripción: "Prueba fecha mañana"
   - Monto: 10000
   - Fecha: **MAÑANA** (seleccioná la fecha de mañana)
   - Categoría: cualquiera
   - Cuenta: cualquiera
4. Click "Guardar"

**Resultado esperado:**
- ✅ Transacción creada exitosamente
- ✅ Aparece en la lista

### Caso 3: Transacción en 2 DÍAS (debe fallar ❌)

1. Click "Agregar Transacción"
2. Completá el formulario:
   - Descripción: "Prueba fecha pasado mañana"
   - Monto: 10000
   - Fecha: **PASADO MAÑANA** (2 días en el futuro)
   - Categoría: cualquiera
   - Cuenta: cualquiera
4. Click "Guardar"

**Resultado esperado:**
- ❌ Error de validación
- ❌ Mensaje: "No podés crear transacciones con fechas tan lejanas en el futuro."
- ❌ NO se crea la transacción

### Caso 4: Transacción en 1 SEMANA (debe fallar ❌)

1. Click "Agregar Transacción"
2. Completá el formulario:
   - Descripción: "Prueba fecha semana"
   - Monto: 10000
   - Fecha: **7 días en el futuro**
   - Categoría: cualquiera
   - Cuenta: cualquiera
4. Click "Guardar"

**Resultado esperado:**
- ❌ Error de validación
- ❌ Mensaje: "No podés crear transacciones con fechas tan lejanas en el futuro."
- ❌ NO se crea la transacción

---

## 🔐 PASO 3: Testear la Base de Datos (Backend)

Esta validación es para asegurar que nadie puede bypassear el frontend.

### Opción A: Desde Supabase SQL Editor (Recomendado)

1. Andá a Supabase → SQL Editor
2. Ejecutá este query para obtener tu `profile_id`:

```sql
SELECT id FROM profiles WHERE email = 'tu-email@ejemplo.com';
-- Guardá el UUID que retorna
```

3. **Test 1: Fecha de hoy (debe funcionar ✅)**

```sql
INSERT INTO transactions (
  profile_id,
  type,
  amount,
  transaction_date,
  status,
  description
) VALUES (
  'TU-PROFILE-ID-AQUI',  -- Reemplazá con tu profile_id
  'expense',
  10000,
  CURRENT_DATE,  -- HOY
  'completed',
  'Test fecha hoy'
);
```

**Resultado esperado:**
- ✅ `INSERT 0 1` (insertó correctamente)

4. **Test 2: Fecha de mañana (debe funcionar ✅)**

```sql
INSERT INTO transactions (
  profile_id,
  type,
  amount,
  transaction_date,
  status,
  description
) VALUES (
  'TU-PROFILE-ID-AQUI',
  'expense',
  10000,
  CURRENT_DATE + INTERVAL '1 day',  -- MAÑANA
  'completed',
  'Test fecha mañana'
);
```

**Resultado esperado:**
- ✅ `INSERT 0 1` (insertó correctamente)

5. **Test 3: Fecha en 2 días (debe fallar ❌)**

```sql
INSERT INTO transactions (
  profile_id,
  type,
  amount,
  transaction_date,
  status,
  description
) VALUES (
  'TU-PROFILE-ID-AQUI',
  'expense',
  10000,
  CURRENT_DATE + INTERVAL '2 days',  -- PASADO MAÑANA
  'completed',
  'Test fecha pasado mañana'
);
```

**Resultado esperado:**
- ❌ Error: `new row for relation "transactions" violates check constraint "chk_transaction_date_not_future"`
- ❌ NO se inserta

---

## ✅ VERIFICACIÓN FINAL

Ejecutá este query para verificar que solo se crearon transacciones válidas:

```sql
SELECT
  description,
  transaction_date,
  CASE
    WHEN transaction_date = CURRENT_DATE THEN '✅ HOY'
    WHEN transaction_date = CURRENT_DATE + 1 THEN '✅ MAÑANA'
    WHEN transaction_date > CURRENT_DATE + 1 THEN '❌ FUTURO LEJANO (NO DEBERÍA EXISTIR)'
    ELSE '✅ PASADO'
  END as fecha_status
FROM transactions
WHERE profile_id = 'TU-PROFILE-ID-AQUI'
ORDER BY transaction_date DESC
LIMIT 10;
```

**Resultado esperado:**
- ✅ Solo debe haber transacciones con fecha de HOY, MAÑANA, o el PASADO
- ❌ NO debe haber transacciones con "FUTURO LEJANO"

---

## 🎯 RESUMEN DE VALIDACIONES

| Fecha | Frontend (Zod) | Backend (SQL) | Estado |
|-------|---------------|---------------|--------|
| Hoy | ✅ Permite | ✅ Permite | OK |
| Mañana | ✅ Permite | ✅ Permite | OK |
| Pasado mañana | ❌ Bloquea | ❌ Bloquea | OK |
| Semana futura | ❌ Bloquea | ❌ Bloquea | OK |

---

## 🐛 TROUBLESHOOTING

**Error: "violates check constraint"**
- ✅ Esto es CORRECTO - significa que la validación está funcionando
- ✅ Esto previene que se creen transacciones futuras

**Frontend permite pero base de datos rechaza**
- ⚠️ Verificá que la validación Zod esté aplicada correctamente en `src/lib/schemas.ts`
- ⚠️ Refrescá la página y probá de nuevo

**Validación no aparece en el frontend**
- ⚠️ Verificá que no haya errores de TypeScript
- ⚠️ Ejecutá `npm run dev` para ver errores en consola

---

## 📝 LIMPIEZA (Opcional)

Para eliminar las transacciones de prueba:

```sql
DELETE FROM transactions
WHERE description LIKE 'Test fecha%'
  AND profile_id = 'TU-PROFILE-ID-AQUI';
```
