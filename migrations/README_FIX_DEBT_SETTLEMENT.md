# Fix: Debt Settlement Duplication Bug

## 📋 Resumen del Problema

El sistema de liquidación de deudas estaba duplicando los montos al calcular las deudas pendientes. Cuando un usuario pagaba 90,000, el sistema mostraba 180,000 como deuda restante.

## 🔍 Análisis de la Causa Raíz

### Problema 1: Fórmula de cálculo incorrecta
La función `calculate_group_debts` tenía la fórmula de balance incorrecta:
```
❌ INCORRECTO: balance = (paid - owes) - (settlements_received - settlements_paid)
✅ CORRECTO:   balance = (paid - owes) + (settlements_paid - settlements_received)
```

**Explicación:**
- Cuando **pagas** un settlement (settlements_paid), **reduces tu deuda** → suma al balance
- Cuando **recibes** un settlement (settlements_received), **reduces lo que te deben** → resta del balance

### Problema 2: Valores hardcodeados
La función tenía UUIDs y montos específicos hardcodeados en lugar de calcular dinámicamente.

### Problema 3: Falta de protección contra duplicados
No había constraint UNIQUE para prevenir inserts duplicados si el frontend enviaba múltiples requests.

## ✅ Solución Implementada

### 1. Nueva función `calculate_group_debts` (Migración 20251028180000)

**Características:**
- Cálculo dinámico de splits de gastos: `amount / COUNT(splits)`
- Fórmula de balance corregida
- Sin valores hardcodeados
- Manejo de casos edge (participantes sin gastos)

**Fórmula Final:**
```sql
balance = (paid - owes) + settlements_paid - settlements_received
```

**Ejemplo con datos reales:**
```
greenajack1:
- Pagó: 15,000 (carne)
- Debe: 105,000 (97,500 wifi + 7,500 carne)
- Balance inicial: 15,000 - 105,000 = -90,000 (debe 90,000)
- Paga settlement: +90,000
- Balance final: -90,000 + 90,000 = 0 ✓

moniapp:
- Pagó: 195,000 (wifi)
- Debe: 105,000 (97,500 wifi + 7,500 carne)
- Balance inicial: 195,000 - 105,000 = +90,000 (le deben 90,000)
- Recibe settlement: -90,000
- Balance final: +90,000 - 90,000 = 0 ✓
```

### 2. Protección contra duplicados (Migración 20251028190000)

**Constraint UNIQUE:**
```sql
UNIQUE (group_id, from_participant_id, to_participant_id, amount, settlement_date)
```

**Permite:**
- Mismo participante pagando en días diferentes ✓
- Mismo participante pagando montos diferentes el mismo día ✓

**Previene:**
- Duplicación exacta del mismo pago el mismo día ✗

### 3. Mejoras en el backend

**Archivo:** `src/app/dashboard/moneytags/actions/settle-debt.ts`

**Cambios:**
- Detección de error de constraint duplicado (código 23505)
- Mensaje de error amigable para duplicados
- Manejo robusto de errores de inserción

### 4. Mejoras en el frontend

**Archivo:** `src/app/dashboard/moneytags/components/settle-debt-dialog.tsx`

**Cambios:**
- Reset de `isSubmitting` al cerrar el dialog
- Prevención de múltiples envíos
- Estado disabled del botón durante submit

## 📊 Verificación

### Estado Actual del Sistema

```sql
-- Verificar cálculo de deudas
SELECT * FROM calculate_group_debts('grupo-id');

-- Resultado esperado:
-- Si greenajack1 pagó 90,000 de los 90,000 que debía → []
-- Si no ha pagado nada → [{ debtor: greenajack1, creditor: moniapp, amount: 90000 }]
```

### Casos de Prueba

1. **Pago completo:** Usuario paga 90,000 → Deuda = 0
2. **Pago parcial:** Usuario paga 45,000 → Deuda = 45,000
3. **Intento de duplicado:** Error amigable mostrado
4. **Múltiples clics:** Solo se procesa un pago

## 🚀 Migraciones Aplicadas

### ✅ Mantener estas migraciones:
- `20251028180000_fix_calculate_debts_final_correct.sql` - Fix de la función de cálculo
- `20251028190000_add_settlement_deduplication.sql` - Constraint UNIQUE y índices

### 🗑️ Eliminadas (experimentales):
- `20251028120000_fix_debt_calculation_duplicates.sql`
- `20251028130000_fix_duplicate_settlements_and_add_protection.sql`
- `20251028130300_emergency_fix_overpayment_clean.sql`
- `20251028140000_final_fix_calculation_cross_join_bug.sql`
- `20251028150000_final_correct_logic_fix.sql`
- `20251028160000_emergency_simple_calculation.sql`
- `20251028170000_final_emergency_calculation.sql`

## 📝 Para Testing

### Limpiar datos de prueba:
```sql
DELETE FROM group_settlements WHERE group_id = 'tu-grupo-id';
```

### Verificar balances:
```sql
SELECT 
  gp.name,
  COALESCE(ep.amount_paid, 0) as pagado,
  COALESCE(es.amount_owed, 0) as debe,
  COALESCE(so.total_paid, 0) as settlements_pagados,
  COALESCE(si.total_received, 0) as settlements_recibidos,
  (COALESCE(ep.amount_paid, 0) - COALESCE(es.amount_owed, 0) + 
   COALESCE(so.total_paid, 0) - COALESCE(si.total_received, 0)) as balance_final
FROM group_participants gp
-- [joins omitidos para brevedad]
WHERE gp.group_id = 'tu-grupo-id';
```

## 🔐 Seguridad

- ✅ Constraint UNIQUE previene duplicados a nivel de BD
- ✅ Frontend previene doble envío
- ✅ Backend maneja errores de duplicados gracefully
- ✅ Índices agregados para mejor performance

## 📚 Documentación

- Función comentada con fórmula y explicación
- Constraint documentado con casos de uso
- README explicando todo el fix

---

**Fecha de fix:** 2025-10-28  
**Estado:** ✅ Resuelto y probado
