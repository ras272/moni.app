# Implementación Modular - MONI

## ✅ Fases Completadas: 1, 2 y 5

### 📦 Migraciones SQL (Fase 1)

Las 5 migraciones SQL están listas en `/migrations`:

1. **20251027000001_create_base_schema.sql**
   - Tabla `profiles` (reemplaza users)
   - Tabla `categories` (15 categorías seed)
   - ENUMs: `category_type`
   - Función `update_updated_at_column()`

2. **20251027000002_create_accounts_transactions.sql**
   - Tabla `accounts`
   - Tabla `transactions`
   - ENUMs: `account_type`, `transaction_type`, `transaction_status`
   - Función `validate_transaction_accounts()`
   - **Función `update_account_balance()`** - TRIGGER AUTOMÁTICO DE BALANCE
   - Índices de performance

3. **20251027000003_create_money_tags.sql**
   - Tabla `money_tag_groups`
   - Tabla `group_participants`
   - Tabla `group_expenses`
   - Tabla `expense_splits`
   - Función `sync_participant_name()`
   - Función `calculate_group_debts()`

4. **20251027000004_create_rls_policies.sql**
   - RLS habilitado en todas las tablas
   - Políticas simples usando `auth.uid()` directamente
   - Sin joins complejos

5. **20251027000005_add_comments.sql**
   - Documentación completa de tablas y columnas

---

## 🏗️ Estructura del Frontend (Fase 5)

### 📁 Arquitectura Modular

```
src/
├── types/
│   └── database.ts                   # Todos los tipos centralizados
│
├── lib/
│   └── supabase/
│       ├── client.ts                 # Cliente Supabase + helpers
│       ├── categories.ts             # Queries + Mutations de categorías
│       ├── accounts.ts               # Queries + Mutations de cuentas
│       ├── transactions.ts           # Queries + Mutations de transacciones
│       └── money-tags.ts             # Queries + Mutations de MoneyTags
│
└── hooks/
    ├── categories/
    │   ├── use-categories.ts         # Hook de lectura
    │   ├── use-create-category.ts    # Hook de creación
    │   ├── use-update-category.ts    # Hook de actualización
    │   ├── use-delete-category.ts    # Hook de eliminación
    │   └── index.ts                  # Barrel export
    │
    ├── accounts/
    │   ├── use-accounts.ts
    │   ├── use-create-account.ts
    │   ├── use-update-account.ts
    │   ├── use-delete-account.ts
    │   └── index.ts
    │
    ├── transactions/
    │   ├── use-transactions.ts
    │   ├── use-create-transaction.ts
    │   ├── use-update-transaction.ts
    │   ├── use-delete-transaction.ts
    │   └── index.ts
    │
    └── money-tags/
        ├── use-groups.ts              # Lectura de grupos
        ├── use-create-group.ts        # CRUD de grupos
        ├── use-participants.ts        # Lectura de participantes
        ├── use-expenses.ts            # Lectura de gastos
        ├── use-create-expense.ts      # CRUD de gastos
        ├── use-debts.ts               # Cálculo de deudas
        └── index.ts
```

---

## 🎯 Principios de Diseño

### 1. **Separación de Concerns**
- **Tipos**: Centralizados en `/types/database.ts`
- **Queries/Mutations**: Lógica de BD en `/lib/supabase/*.ts`
- **Hooks**: React Query wrappers en `/hooks/*/*.ts`

### 2. **Modularidad**
- Un archivo por funcionalidad
- Archivos pequeños (<100 líneas)
- Imports limpios con barrel exports

### 3. **Responsabilidad Única**
- Cada hook hace UNA cosa
- Cada archivo de lib maneja UNA entidad
- Fácil de mantener y testear

---

## 📖 Cómo Usar

### Importar Tipos

```typescript
import type { Account, Transaction, Category } from '@/types/database';
```

### Usar Hooks (con barrel exports)

```typescript
// Categories
import { useCategories, useCreateCategory } from '@/hooks/categories';

// Accounts
import { useAccounts, useCreateAccount } from '@/hooks/accounts';

// Transactions
import { useTransactions, useCreateTransaction } from '@/hooks/transactions';

// MoneyTags
import { useGroups, useExpenses, useDebts } from '@/hooks/money-tags';
```

### Ejemplo Completo

```typescript
'use client';

import { useAccounts, useCreateAccount } from '@/hooks/accounts';
import type { AccountType } from '@/types/database';

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();

  const handleCreate = () => {
    createAccount.mutate({
      name: 'Mi Cuenta Nueva',
      type: 'bank' as AccountType,
      initial_balance: 100000,
      currency: 'PYG'
    });
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Crear Cuenta</button>
      {accounts?.map((account) => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
}
```

---

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 2. Instalar Dependencias

```bash
npm install @supabase/supabase-js @tanstack/react-query
```

### 3. Aplicar Migraciones

Usar el MCP de Supabase para aplicar las migraciones en orden:

```bash
# Opción 1: Usando Supabase MCP
supabase___apply_migration(...contenido de migration 1...)
supabase___apply_migration(...contenido de migration 2...)
# etc.

# Opción 2: Usando CLI de Supabase (si está configurado)
supabase db reset
```

---

## ✅ Ventajas de Esta Arquitectura

1. **Fácil de Entender**: Cada archivo tiene un propósito claro
2. **Fácil de Testear**: Funciones pequeñas y aisladas
3. **Fácil de Escalar**: Agregar nuevos hooks es simple
4. **Type-Safe**: TypeScript en todas partes
5. **DRY**: No hay código repetido
6. **Performance**: React Query maneja cache automáticamente

---

## 🚀 Próximos Pasos

1. **Aplicar migraciones SQL** en orden (1 → 2 → 3 → 4 → 5)
2. **Configurar .env.local** con credenciales de Supabase
3. **Actualizar componentes** para usar los nuevos hooks
4. **Testing** de integración Frontend ↔ Backend

---

**Documentación creada**: 27 de Octubre 2025  
**Estado**: ✅ Listo para Implementación
