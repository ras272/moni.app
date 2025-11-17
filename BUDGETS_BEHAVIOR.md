# Sistema de Presupuestos - Comportamiento y Consideraciones

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Presupuesto General Huérfano (CRÍTICO)**
**Problema:** Existe un presupuesto general sin período actual que bloquea la creación de nuevos presupuestos generales.

**Síntomas:**
- Error: "Ya tenés un presupuesto general activo"
- El presupuesto no aparece en la lista (porque no tiene `current_period`)

**Solución temporal:**
- Solo crear presupuestos por categoría específica
- Ejecutar: `POST /api/budgets/fix-orphaned` (ya creado pero devolvió 0 resultados)

**Solución definitiva necesaria:**
- Agregar comando para listar TODOS los presupuestos (incluso sin período)
- Permitir eliminar presupuestos sin período desde la UI

---

### 2. **Performance: Trigger Recalcula TODOS los Presupuestos**
**Problema:** Cada vez que creás una transacción, el trigger ejecuta `refresh_all_budget_periods()` que recalcula TODOS los presupuestos activos del sistema.

**Impacto:**
- Con 1 presupuesto: ~800ms por transacción ✅ Aceptable
- Con 10+ presupuestos: Puede superar 3-5 segundos ❌ Lento
- Con 100+ presupuestos: Timeout probable ❌ Crítico

**Solución necesaria:**
- Modificar trigger para solo recalcular presupuestos afectados:
  - Si transacción tiene categoría → solo presupuesto de esa categoría + presupuesto general
  - Si transacción sin categoría → solo presupuesto general

---

### 3. **Períodos Automáticos vs Start Date**
**Comportamiento actual:**
- El presupuesto tiene `start_date` y `end_date` (opcionales)
- Los períodos se crean automáticamente basados en la fecha actual
- **PROBLEMA:** El primer período puede NO coincidir con el `start_date` del presupuesto

**Ejemplo:**
```
Presupuesto mensual creado el 15 de Noviembre
start_date: 2025-11-15
Período creado: 2025-11-01 a 2025-11-30 (mes calendario completo)
```

**Resultado:** Se contabilizan gastos desde el 1 de Noviembre aunque el presupuesto "empezó" el 15.

**¿Es esto correcto?** Depende del caso de uso:
- ✅ Si querés controlar el mes completo
- ❌ Si querés solo desde cierta fecha

**Decisión pendiente:** ¿Usar `start_date` para calcular el primer período?

---

### 4. **Rollover No Probado**
**Estado:** Implementado en la base de datos pero NO probado.

**Cómo funciona (teóricamente):**
1. Al crear nuevo período, verifica si `rollover_unused = true`
2. Calcula `remaining_amount` del período anterior
3. Si es positivo, lo suma al nuevo `budget_amount`

**Escenarios sin probar:**
- ✅ Crear presupuesto con rollover habilitado
- ❌ Cambio automático de período (semanal → siguiente semana)
- ❌ Rollover con múltiples períodos consecutivos
- ❌ Rollover cuando cambiás el monto del presupuesto

**Riesgo:** Puede haber bugs cuando el período cambie automáticamente.

---

### 5. **Alertas Creadas Pero No Mostradas**
**Problema:** Las alertas se crean en `budget_alerts` pero NO hay UI para mostrarlas.

**Comportamiento actual:**
- Cuando alcanzás 80%, 90%, 100% del presupuesto → se crea alerta
- La alerta se guarda en la base de datos
- **NO se muestra en ningún lado**

**Pendiente:**
- [ ] Agregar widget de notificaciones en el header
- [ ] Mostrar badge con cantidad de alertas sin leer
- [ ] Página para ver historial de alertas

---

### 6. **Eliminación No Funciona Correctamente**
**Problema:** Soft delete (`is_active = false`) pero los períodos quedan.

**Comportamiento actual:**
```javascript
deleteBudget(id) → UPDATE budgets SET is_active = false
```

**Resultado:**
- El presupuesto no aparece en la lista ✅
- Los períodos siguen existiendo ⚠️
- El constraint de "único general activo" se libera ✅
- Pero si reactivás el presupuesto, quedan períodos viejos ❌

**Solución necesaria:**
- Al eliminar presupuesto, marcar sus períodos como no actuales
- O documentar que eliminación es permanente y usar DELETE

---

### 7. **Sin Validación de Fechas de Transacciones**
**Problema:** Podés crear transacciones con `transaction_date` en el futuro.

**Impacto en presupuestos:**
- Una transacción con fecha futura puede contar en el período actual
- Esto puede hacer que el presupuesto se vea excedido cuando no debería

**Ejemplo:**
```
Presupuesto mensual: 500,000 Gs
Gasto del 1-15 Nov: 300,000 Gs (60%)
Gasto con fecha 30 Nov pero creado hoy: 300,000 Gs
Total: 600,000 Gs (120% excedido) ❌
```

**Solución:** Agregar validación `transaction_date <= CURRENT_DATE` en el formulario.

---

### 8. **Cambio de Período NO es Automático**
**Problema CRÍTICO:** Los períodos NO se renuevan automáticamente.

**Comportamiento actual:**
- Período mensual de Noviembre: `2025-11-01` a `2025-11-30`
- Cuando llega el 1 de Diciembre, el período sigue siendo de Noviembre
- El período de Diciembre solo se crea cuando:
  1. Creás una transacción (trigger llama a `get_or_create_current_budget_period`)
  2. Manualmente llamás al endpoint

**Consecuencias:**
- Si no creás transacciones en Diciembre, el presupuesto sigue mostrando datos de Noviembre
- Los rollover solo pasan cuando se crea el nuevo período

**Solución necesaria:**
- Agregar cron job / scheduled function que ejecute `get_or_create_current_budget_period` diariamente
- O documentar que el período se actualiza al crear transacciones

---

### 9. **Categorías Eliminadas Rompen Presupuestos**
**Problema:** Si eliminás una categoría que tiene presupuesto, el presupuesto se elimina en cascada.

```sql
category_id UUID REFERENCES categories(id) ON DELETE CASCADE
```

**Consecuencia:**
- Eliminás categoría "Alimentación"
- Se elimina el presupuesto de Alimentación
- Se eliminan todos sus períodos
- Se pierde el historial completo ❌

**Solución necesaria:**
- Cambiar a `ON DELETE SET NULL`
- O cambiar a `ON DELETE RESTRICT` (no permitir eliminar categoría con presupuesto)
- O usar soft delete en categorías

---

### 10. **Inconsistencia en Filtro de Presupuestos**
**Problema:** `getBudgetStatus()` filtra presupuestos sin período actual.

```typescript
return budgets
  .filter((budget: any) => budget.current_period?.[0]) // ❌ Oculta presupuestos sin período
```

**Resultado:**
- Presupuestos recién creados que fallaron en crear período → invisible
- Presupuestos con períodos vencidos → invisible
- Presupuestos con errores → invisible

**Usuario ve:** "No tienes presupuestos" aunque sí tiene.

**Solución:**
- Mostrar presupuestos sin período con estado "Error: sin período activo"
- Agregar botón "Reparar" que llame a `get_or_create_current_budget_period`

---

## 🔧 COMPORTAMIENTOS IMPORTANTES A CONOCER

### Presupuesto General vs Por Categoría

**General (category_id = null):**
- Solo podés tener 1 presupuesto general activo
- Suma TODAS las transacciones de tipo 'expense' del período
- Útil para: Control de gasto mensual total

**Por Categoría (category_id = UUID):**
- Podés tener 1 presupuesto por categoría
- Solo suma transacciones de esa categoría
- Útil para: "Máximo 200k en entretenimiento al mes"

**NO podés:**
- Tener 2 presupuestos generales activos simultáneos
- Tener 2 presupuestos para la misma categoría

---

### Cálculo de Períodos

**Semanal:** Lunes a Domingo
- Siempre inicia en Lunes
- Si hoy es miércoles, el período es desde el lunes pasado

**Quincenal:** 1-14 o 15-último día del mes
- Primera quincena: 1 al 14
- Segunda quincena: 15 al último día (28, 29, 30, o 31)

**Mensual:** Mes calendario completo
- Siempre del 1 al último día del mes
- Noviembre: 1-30, Febrero: 1-28/29

**Anual:** Año calendario
- Enero 1 a Diciembre 31

---

### Recálculo de Gastos

**Se recalcula automáticamente:**
- ✅ Al crear transacción
- ✅ Al editar transacción
- ✅ Al eliminar transacción
- ✅ Al cambiar estado de transacción a 'completed'

**NO se recalcula:**
- ❌ Cuando cambia el día (paso de mes)
- ❌ Cuando editás el monto del presupuesto
- ❌ Cuando cambiás configuración de rollover

---

### Alertas

**Se crean cuando:**
- Alcanzás 80% del presupuesto (si `alert_at_80 = true`)
- Alcanzás 90% del presupuesto (si `alert_at_90 = true`)
- Alcanzás 100% del presupuesto (si `alert_at_100 = true`)
- Superás 110% del presupuesto (siempre, tipo 'limit_exceeded')

**Comportamiento:**
- Solo se crea 1 alerta por tipo por período
- Si ya existe, no se duplica (`ON CONFLICT DO NOTHING`)
- Las alertas NO se eliminan si el gasto baja

---

## 📋 TAREAS PENDIENTES RECOMENDADAS

### Alta Prioridad
1. [ ] **Solucionar presupuesto general huérfano**
   - Agregar endpoint para listar todos los presupuestos (incluye sin período)
   - Agregar botón de "forzar eliminación" en la UI

2. [ ] **Optimizar trigger de recálculo**
   - Solo recalcular presupuestos afectados por la transacción
   - Reducir de "todos los presupuestos" a "1-2 presupuestos"

3. [ ] **Agregar cron job para renovación de períodos**
   - Ejecutar diariamente
   - Crear períodos nuevos cuando corresponda

### Media Prioridad
4. [ ] **Implementar UI de alertas**
   - Widget en header con badge
   - Página de historial de alertas
   - Marcar como leídas

5. [ ] **Validación de fechas de transacciones**
   - No permitir fechas futuras
   - O agregar opción "transacción programada"

6. [ ] **Mejorar manejo de presupuestos sin período**
   - Mostrar en lista con estado de error
   - Botón "Reparar" que cree el período

### Baja Prioridad
7. [ ] **Decidir comportamiento de start_date**
   - ¿Usar para calcular primer período?
   - ¿O solo informativo?

8. [ ] **Probar funcionalidad de rollover**
   - Crear test con cambio de período
   - Verificar que el saldo pase correctamente

9. [ ] **Revisar ON DELETE CASCADE de categorías**
   - Cambiar a SET NULL o RESTRICT
   - Evitar pérdida de historial

---

## 🧪 CÓMO PROBAR ROLLOVER

```sql
-- 1. Crear presupuesto mensual con rollover
INSERT INTO budgets (profile_id, period_type, amount, rollover_unused)
VALUES ('tu-profile-id', 'monthly', 500000, true);

-- 2. Crear período de Noviembre con gasto
-- (se crea automáticamente)

-- 3. Simular que sobró dinero
UPDATE budget_periods
SET spent_amount = 300000, remaining_amount = 200000
WHERE budget_id = 'id-del-presupuesto' AND period_start = '2025-11-01';

-- 4. Forzar creación del período de Diciembre
SELECT get_or_create_current_budget_period('id-del-presupuesto');

-- 5. Verificar que el período de Diciembre tenga:
-- budget_amount = 500000 + 200000 = 700000
-- rollover_from_previous = 200000
SELECT * FROM budget_periods WHERE budget_id = 'id-del-presupuesto' ORDER BY period_start;
```

---

## 🐛 BUGS CONOCIDOS

1. **Presupuesto general huérfano** - Bloquea creación de nuevos generales
2. **Períodos no se renuevan automáticamente** - Manual o al crear transacción
3. **Performance degradada con muchos presupuestos** - Trigger recalcula todo
4. **Alertas no visibles** - Se crean pero no se muestran
5. **Eliminación de categoría elimina presupuesto** - Pérdida de historial

---

## ✅ LO QUE SÍ FUNCIONA BIEN

- ✅ Creación de presupuestos por categoría
- ✅ Cálculo automático de gastos
- ✅ Visualización de progreso con barras
- ✅ Ordenamiento por prioridad (excedidos primero)
- ✅ Soft delete de presupuestos
- ✅ Widget en dashboard con top 3
- ✅ Restricciones de unicidad (1 general, 1 por categoría)
- ✅ Filtrado por tipo de transacción (solo 'expense')
- ✅ Filtrado por estado (solo 'completed')
