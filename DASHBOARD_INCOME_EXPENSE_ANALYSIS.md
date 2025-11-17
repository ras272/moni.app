# Análisis de Cards de Ingresos y Gastos - Dashboard

## 📋 Resumen del Análisis

Análisis completo de los componentes de Ingresos y Gastos del dashboard para identificar irregularidades, cálculos incorrectos y áreas de mejora.

**Fecha:** 2025-11-16
**Componentes analizados:**
- `IncomeExpenseChartEnhanced` (frontend)
- `getDashboardData()` (RPC unificado)
- `getDailyStats()` (estadísticas diarias)
- `get_dashboard_data()` (función SQL)

---

## 🐛 IRREGULARIDADES ENCONTRADAS

### 1. ❌ **CRÍTICO: Cálculo de Porcentaje de Categorías es INCORRECTO**

**Ubicación:** `supabase/migrations/20251031_create_get_dashboard_data.sql:254-279`

**Problema:**
El cálculo del porcentaje de las categorías de gasto usa un "budget" calculado extrañamente:

```sql
budget_calc AS (
  SELECT
    GREATEST(
      v_current_month_income,
      v_total_balance + v_current_month_expenses
    ) as budget
)
```

**¿Qué hace esto?**
- Compara los ingresos del mes con `balance_total + gastos_del_mes`
- Usa el mayor de los dos como "budget"

**¿Por qué está MAL?**
1. **No tiene sentido lógico**: ¿Por qué usar el balance total de las cuentas + gastos del mes?
2. **Porcentajes engañosos**: Si tenés 10M en el banco pero gastaste 1M, cada categoría mostrará porcentajes bajísimos
3. **Inconsistencia**: El "budget" no refleja límites reales de presupuesto

**Ejemplo:**
- Ingresos del mes: 5,000,000 Gs
- Gastos del mes: 3,000,000 Gs
- Balance total en cuentas: 20,000,000 Gs

Budget calculado = GREATEST(5,000,000, 20,000,000 + 3,000,000) = **23,000,000 Gs**

Si gastaste 1,000,000 en "Comida":
- Porcentaje mostrado: 1,000,000 / 23,000,000 = **4.3%**
- Porcentaje REAL respecto a gastos: 1,000,000 / 3,000,000 = **33.3%**

**IMPACTO:** 🔴 Alto - Los usuarios ven porcentajes completamente incorrectos

---

### 2. ⚠️ **MEDIO: Proyección del Mes usa División por Día Actual**

**Ubicación:** `src/features/overview/components/income-expense-chart-enhanced.tsx:76-86`

**Problema:**
```typescript
const currentDay = today.getDate();
const incomeProjection = (currentIncome / currentDay) * daysInMonth;
const expensesProjection = (currentExpenses / currentDay) * daysInMonth;
```

**¿Por qué puede ser problemático?**
1. **Asume distribución uniforme**: Si ganaste todo tu salario el día 5, proyecta que ganarás 6x más
2. **Gastos irregulares**: Si pagaste todas tus cuentas el día 1, proyecta gastos altísimos
3. **Primeros días del mes**: El día 1-3, la proyección es MUY imprecisa

**Ejemplo:**
- Hoy es 5 de noviembre
- Ingresos hasta hoy: 8,000,000 Gs (recibiste tu salario completo)
- Días en noviembre: 30

Proyección = (8,000,000 / 5) * 30 = **48,000,000 Gs**

¡Proyecta que ganarás 6x tu salario! 😱

**IMPACTO:** 🟡 Medio - Puede confundir usuarios, especialmente a principio de mes

---

### 3. ⚠️ **MEDIO: Balance Acumulado en DailyStats está MAL**

**Ubicación:** `src/lib/supabase/daily-stats.ts:67-84`

**Problema:**
```typescript
let cumulativeBalance = 0;
sortedDates.forEach((date) => {
  const dayData = dailyMap.get(date)!;
  cumulativeBalance += dayData.income - dayData.expenses;

  dailyData.push({
    date,
    income: dayData.income,
    expenses: dayData.expenses,
    balance: cumulativeBalance  // ❌ ESTO ES ACUMULADO, NO BALANCE REAL
  });
});
```

**¿Por qué está mal?**
- El "balance" que retorna es **balance acumulado desde el día 1 del mes**
- NO es el balance real de las cuentas en ese día
- NO considera el balance inicial que tenías antes del mes

**Ejemplo:**
- Día 1: +5M ingresos, -1M gastos → balance mostrado: 4M
- Día 2: +0 ingresos, -500K gastos → balance mostrado: 3.5M
- Día 3: +0 ingresos, -200K gastos → balance mostrado: 3.3M

Pero si tu balance real en el banco era 10M al empezar el mes:
- Día 3 real: 10M + 5M - 1M - 500K - 200K = **13.3M** (no 3.3M)

**IMPACTO:** 🟡 Medio - El gráfico de Balance es engañoso

---

### 4. ⚠️ **BAJO: Selector de Período de Comparación no Funciona**

**Ubicación:** `src/features/overview/components/income-expense-chart-enhanced.tsx:225-244`

**Problema:**
```typescript
const [comparisonPeriod, setComparisonPeriod] = React.useState<ComparisonPeriod>('previous-month');

// ... selector
<Select value={comparisonPeriod} onValueChange={...}>
  <SelectItem value='previous-month'>vs Mes anterior</SelectItem>
  <SelectItem value='same-month-last-year'>vs Mismo mes 2024</SelectItem>
  <SelectItem value='average-3-months'>vs Promedio 3 meses</SelectItem>
</Select>
```

**¿Por qué no funciona?**
- El estado `comparisonPeriod` cambia, pero **nunca se usa**
- Los datos siempre son del mes anterior (hardcoded desde el RPC)
- Las opciones "vs Mismo mes 2024" y "vs Promedio 3 meses" no hacen nada

**IMPACTO:** 🟢 Bajo - Feature no implementada, pero no causa errores

---

### 5. ⚠️ **BAJO: Tasa de Ahorro puede ser Negativa pero se muestra como Positiva**

**Ubicación:** `src/features/overview/components/income-expense-chart-enhanced.tsx:72-74`

**Problema:**
```typescript
const savingsRate = currentIncome > 0
  ? ((balance / currentIncome) * 100).toFixed(1)
  : '0.0';
```

**¿Qué pasa si gastaste más de lo que ganaste?**
- balance = -2,000,000 (gastos > ingresos)
- currentIncome = 5,000,000
- savingsRate = (-2,000,000 / 5,000,000) * 100 = **-40%**

Pero el componente muestra:
```typescript
isGood: parseFloat(savingsRate) >= 20  // -40 >= 20 = false (correcto)
```

Esto está bien, pero podría ser más claro mostrando "Déficit: 40%" en vez de "Tasa de ahorro: -40%"

**IMPACTO:** 🟢 Bajo - Solo UX, no es un error

---

### 6. ℹ️ **INFO: Sparklines usan Datos Interpolados (no reales)**

**Ubicación:** `src/features/overview/components/income-expense-chart-enhanced.tsx:90-116`

**Comportamiento actual:**
```typescript
if (dailyData.length > 0) {
  return dailyData.map((day) => ({
    value: day[type],
    date: day.date
  }));
}

// Fallback: interpolación suave
const points = 12;
// ... genera 12 puntos con ruido random
```

**¿Es un problema?**
- Si hay datos diarios, usa datos reales ✅
- Si NO hay datos, genera curva interpolada con ruido random ⚠️

**¿Cuándo puede confundir?**
- Usuario nuevo sin transacciones → ve gráficos "inventados"
- Mes sin muchas transacciones → interpolación puede no reflejar realidad

**IMPACTO:** 🟢 Bajo - Es un fallback razonable, pero podría ser más claro

---

### 7. ⚠️ **MEDIO: Pagos Pendientes cuenta TODOS los MoneyTags**

**Ubicación:** `supabase/migrations/20251031_create_get_dashboard_data.sql:133-137`

**Problema:**
```sql
SELECT COUNT(*)
INTO v_pending_payments
FROM money_tag_groups
WHERE is_settled = false;
```

**¿Por qué está mal?**
- Cuenta TODOS los money_tag_groups no liquidados
- NO filtra por profile_id del usuario
- Está contando grupos de OTROS usuarios también

**IMPACTO:** 🟡 Medio - Dato completamente incorrecto si hay múltiples usuarios

---

### 8. ℹ️ **INFO: Growth Percentage puede ser Infinito**

**Ubicación:** `supabase/migrations/20251031_create_get_dashboard_data.sql:101-108`

**Código:**
```sql
IF v_previous_month_savings > 0 THEN
  v_growth_percentage := ((v_current_month_savings - v_previous_month_savings) / v_previous_month_savings) * 100;
ELSIF v_previous_month_savings < 0 THEN
  v_growth_percentage := ((v_current_month_savings - v_previous_month_savings) / ABS(v_previous_month_savings)) * 100;
ELSE
  v_growth_percentage := 0;
END IF;
```

**Casos edge:**
- Mes anterior: -5M (déficit)
- Mes actual: +3M (ahorro)
- Growth = (3M - (-5M)) / 5M = 160%

Esto está matemáticamente correcto, pero puede ser confuso.

**IMPACTO:** 🟢 Bajo - Matemáticamente correcto, solo UX

---

## ✅ COSAS QUE ESTÁN BIEN

1. ✅ **Cálculos de Ingresos y Gastos son correctos**
   - Suman correctamente transacciones por tipo
   - Filtran por status = 'completed'
   - Usan rangos de fechas correctos

2. ✅ **Balance Total es correcto**
   - Suma current_balance de todas las cuentas activas
   - Filtra por is_active = true

3. ✅ **Transacciones Recientes son correctas**
   - Ordenadas por fecha descendente
   - Limita a 10 resultados
   - Incluye categoría y cuenta correctamente

4. ✅ **Optimización de Performance**
   - 1 query unificada en vez de 12+
   - React cache() previene llamadas duplicadas
   - ~500ms en vez de ~4s

5. ✅ **Manejo de Errores**
   - Retorna valores por defecto si hay error
   - Logs detallados en consola
   - No rompe la UI si falla la query

---

## 🔧 RECOMENDACIONES DE FIX (Priorizadas)

### 🔴 PRIORIDAD ALTA

1. **Fix cálculo de porcentaje de categorías**
   - Cambiar a: `percentage = (category_amount / v_current_month_expenses) * 100`
   - Eliminar el "budget_calc" confuso

2. **Fix pagos pendientes - agregar filtro de usuario**
   - Cambiar a: `WHERE is_settled = false AND (owner_profile_id = v_profile_id OR ...)`

### 🟡 PRIORIDAD MEDIA

3. **Fix balance diario - incluir balance inicial**
   - Obtener balance total al inicio del mes
   - Sumar transacciones acumuladas sobre ese balance

4. **Mejorar proyección del mes**
   - Opción 1: Usar promedio de últimos 7 días en vez de todos los días del mes
   - Opción 2: Mostrar rango (mínimo-máximo) en vez de proyección única
   - Opción 3: Agregar disclaimer: "Proyección basada en promedio diario"

### 🟢 PRIORIDAD BAJA

5. **Implementar selector de período de comparación**
   - Crear RPCs para "same-month-last-year" y "average-3-months"
   - O remover el selector si no se va a implementar

6. **Mejorar UX de tasa de ahorro negativa**
   - Mostrar "Déficit: 40%" en vez de "Tasa de ahorro: -40%"

---

## 📊 TESTING RECOMENDADO

### Casos de prueba críticos:

1. **Usuario nuevo (sin transacciones)**
   - ¿Se muestra 0 en todas las cards?
   - ¿Los gráficos manejan data vacía?

2. **Primer día del mes**
   - ¿La proyección es razonable?
   - ¿Los datos del mes anterior se muestran correctamente?

3. **Usuario con déficit (gastos > ingresos)**
   - ¿Los porcentajes son correctos?
   - ¿El balance negativo se muestra bien?

4. **Múltiples cuentas**
   - ¿El balance total suma todas las cuentas?
   - ¿Las transacciones de todas las cuentas se cuentan?

5. **MoneyTags de otros usuarios**
   - ¿Los pagos pendientes solo cuentan los del usuario actual?

---

## 🎯 IMPACTO TOTAL

| Severidad | Cantidad | Impacto en Usuario |
|-----------|----------|-------------------|
| 🔴 Crítico | 1 | Datos incorrectos mostrados |
| 🟡 Medio   | 3 | Datos confusos o imprecisos |
| 🟢 Bajo    | 3 | UX mejorable, no crítico |
| ℹ️ Info    | 1 | Solo informativo |

**Recomendación:** Priorizar fixes de categorías y pagos pendientes (críticos), luego abordar los de prioridad media.
