# Guía de Testing - Admin Budgets

## ✅ Endpoints Creados

1. **GET** `/api/budgets/admin/list-all` - Lista todos los presupuestos
2. **POST** `/api/budgets/admin/force-delete` - Elimina presupuestos permanentemente

---

## 🧪 PASO 1: Listar Todos los Presupuestos

### Opción A: Desde el Navegador (Recomendado)

1. Abrí el navegador en tu app (debes estar logueado)
2. Abrí la consola de desarrollo (F12)
3. Pegá este código en la consola:

```javascript
// Listar todos los presupuestos
fetch('/api/budgets/admin/list-all')
  .then(res => res.json())
  .then(data => {
    console.log('=== TODOS LOS PRESUPUESTOS ===');
    console.log(`Total: ${data.total_count}`);
    console.log(`Huérfanos: ${data.orphaned_count}`);
    console.table(data.budgets.map(b => ({
      id: b.id.substring(0, 8) + '...',
      categoría: b.category_name || 'GENERAL',
      períodos: b.periods_count,
      tiene_actual: b.has_current_period ? 'SÍ' : 'NO',
      estado: b.periods_count === 0 ? '❌ HUÉRFANO' : '✅ OK'
    })));

    // Guardar en variable global para usar después
    window.budgetsData = data;
  });
```

### Opción B: Con análisis de salud

```javascript
// Listar con análisis de salud
fetch('/api/budgets/admin/list-all?health=true')
  .then(res => res.json())
  .then(data => {
    console.log('=== ANÁLISIS DE SALUD ===');
    console.table(data.budgets.map(b => ({
      id: b.id.substring(0, 8) + '...',
      categoría: b.category_name || 'GENERAL',
      estado: b.health_status,
      mensaje: b.health_message
    })));

    window.budgetsHealth = data;
  });
```

---

## 🗑️ PASO 2: Identificar Presupuesto Huérfano

Ejecutá PASO 1 primero. Luego:

```javascript
// Encontrar presupuesto huérfano
const orphaned = window.budgetsData.budgets.filter(b => b.periods_count === 0);

if (orphaned.length > 0) {
  console.log('=== PRESUPUESTOS HUÉRFANOS ENCONTRADOS ===');
  orphaned.forEach(b => {
    console.log(`
ID: ${b.id}
Categoría: ${b.category_name || 'GENERAL (bloqueando nuevos generales)'}
Períodos: ${b.periods_count}
Creado: ${new Date(b.created_at).toLocaleString()}
    `);
  });

  // Guardar ID del primer huérfano
  window.orphanedId = orphaned[0].id;
  console.log(`\n✅ ID guardado en: window.orphanedId`);
  console.log(`Para eliminar ejecutá: deleteOrphanedBudget()`);
} else {
  console.log('✅ No hay presupuestos huérfanos');
}
```

---

## 🔥 PASO 3: Eliminar Presupuesto Huérfano

⚠️ **ADVERTENCIA:** Esta acción NO se puede deshacer.

```javascript
// Función para eliminar presupuesto huérfano
async function deleteOrphanedBudget() {
  if (!window.orphanedId) {
    console.error('❌ Primero ejecutá el PASO 2 para identificar el huérfano');
    return;
  }

  const confirmDelete = confirm(
    `¿ELIMINAR PERMANENTEMENTE el presupuesto?\n\n` +
    `ID: ${window.orphanedId}\n\n` +
    `Esta acción NO se puede deshacer.`
  );

  if (!confirmDelete) {
    console.log('❌ Eliminación cancelada');
    return;
  }

  console.log('🗑️ Eliminando presupuesto...');

  try {
    const response = await fetch('/api/budgets/admin/force-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: window.orphanedId })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ PRESUPUESTO ELIMINADO CON ÉXITO');
      console.log(`   ID: ${data.deleted_budget_id}`);
      console.log(`   Períodos eliminados: ${data.deleted_periods_count}`);
      console.log(`   Alertas eliminadas: ${data.deleted_alerts_count}`);

      // Limpiar variable
      delete window.orphanedId;
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error eliminando:', error);
  }
}

// Ejecutar ahora
deleteOrphanedBudget();
```

---

## ✅ PASO 4: Verificar Que Se Puede Crear Presupuesto General

Después de eliminar el huérfano:

1. Refrescá la página
2. Andá a `/dashboard/presupuestos`
3. Click en "Nuevo Presupuesto"
4. Dejá "General (Todos los gastos)" seleccionado
5. Completá el formulario:
   - Período: Mensual
   - Monto: 500000
   - Dejá todo lo demás por defecto
6. Click "Crear presupuesto"

**Resultado esperado:**
- ✅ Mensaje: "Presupuesto creado - El presupuesto se creó correctamente"
- ✅ El presupuesto aparece en la lista
- ✅ NO hay error de "Ya tenés un presupuesto general activo"

---

## 🔍 PASO 5: Verificar Todo Está OK

```javascript
// Listar de nuevo para confirmar
fetch('/api/budgets/admin/list-all')
  .then(res => res.json())
  .then(data => {
    console.log('=== VERIFICACIÓN FINAL ===');
    console.log(`Total presupuestos: ${data.total_count}`);
    console.log(`Huérfanos: ${data.orphaned_count}`);

    if (data.orphaned_count === 0) {
      console.log('✅ TODO LIMPIO - No hay presupuestos huérfanos');
    } else {
      console.log('⚠️ Todavía hay presupuestos huérfanos');
    }

    const general = data.budgets.find(b => b.category_id === null);
    if (general && general.has_current_period) {
      console.log('✅ Presupuesto general OK con período actual');
    }
  });
```

---

## 📝 RESUMEN DE COMANDOS

```javascript
// 1. Listar todos
fetch('/api/budgets/admin/list-all').then(r=>r.json()).then(d=>console.table(d.budgets))

// 2. Encontrar huérfanos
fetch('/api/budgets/admin/list-all').then(r=>r.json()).then(d=>{
  const o = d.budgets.filter(b=>b.periods_count===0);
  console.log('Huérfanos:', o);
  if(o[0]) window.orphanedId = o[0].id;
})

// 3. Eliminar (después de confirmar)
fetch('/api/budgets/admin/force-delete', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({id: window.orphanedId})
}).then(r=>r.json()).then(console.log)
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Autenticación Requerida:**
   - Los endpoints solo funcionan si estás logueado
   - Usá la consola del navegador, no curl

2. **Eliminación Permanente:**
   - `force-delete` elimina TODO: budget, períodos, alertas
   - NO se puede deshacer
   - Confirmá que es el presupuesto correcto antes de eliminar

3. **Presupuesto General:**
   - Solo podés tener 1 presupuesto general activo
   - Si hay un huérfano, bloquea crear nuevos
   - Después de limpiar, podés crear uno nuevo

4. **Refrescar Después de Eliminar:**
   - Hacé F5 en la página de presupuestos
   - Esto recarga los datos del servidor

---

## 🐛 TROUBLESHOOTING

**Error: "User not authenticated"**
- Solución: Verificá que estás logueado en la app

**Error: "No autorizado"**
- Solución: Solo podés eliminar tus propios presupuestos

**Error: "Presupuesto no encontrado"**
- Solución: Verificá que el ID es correcto

**No aparece en la lista después de crear**
- Solución: Refrescá la página (F5)
