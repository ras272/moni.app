# Plan Completo: Base de Datos MONI - Arquitectura Definitiva

**Fecha**: 27 de Octubre 2025  
**Estado**: Planificación para Implementación  
**Versión**: 1.0

---

## 📋 RESUMEN EJECUTIVO

Este documento detalla la arquitectura completa de la base de datos MONI, diseñada desde cero para ser 100% consistente con el frontend actual, siguiendo las mejores prácticas de seguridad, performance y escalabilidad.

### Objetivos Principales

1. ✅ **Consistencia total** Frontend ↔ Backend
2. ✅ **RLS seguro** con políticas simples y efectivas
3. ✅ **Performance optimizado** con índices estratégicos
4. ✅ **Triggers automáticos** para mantener integridad de datos
5. ✅ **Extensibilidad** para futuras features
6. ✅ **Multi-currency** desde el inicio
7. ✅ **Auditoría completa** con timestamps

---

## 🗂️ ESTRUCTURA DE TABLAS

### Diagrama de Relaciones

```
┌─────────────┐
│  profiles   │ (1:N con todo)
└──────┬──────┘
       │
       ├─────────────┬─────────────┬──────────────┐
       │             │             │              │
       ▼             ▼             ▼              ▼
┌────────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────────┐
│ categories │ │  accounts  │ │transactions│ │money_tag_groups  │
└────────────┘ └──────┬─────┘ └─────┬──────┘ └────────┬──────────┘
                      │             │                  │
                      └─────────────┘                  │
                                                       │
                         ┌─────────────────────────────┤
                         │                             │
                         ▼                             ▼
                ┌────────────────┐          ┌──────────────────┐
                │group_participants│          │ group_expenses   │
                └────────┬─────────┘          └────────┬─────────┘
                         │                             │
                         └──────────┬──────────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │expense_splits│
                            └──────────────┘
```

---

## 📊 TABLA 1: profiles

**Propósito**: Perfil del usuario vinculado directamente a Supabase Auth

**Mejora clave**: `id` usa directamente `auth.uid()`, eliminando complejidad en RLS

### Estructura

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'PY',
  default_currency TEXT NOT NULL DEFAULT 'PYG',
  timezone TEXT NOT NULL DEFAULT 'America/Asuncion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
```

### Comentarios

```sql
COMMENT ON TABLE profiles IS 'Perfiles de usuario vinculados a Supabase Auth';
COMMENT ON COLUMN profiles.id IS 'UUID del usuario en auth.users';
COMMENT ON COLUMN profiles.default_currency IS 'Moneda predeterminada (PYG, USD, etc.)';
```

---

## 📊 TABLA 2: categories

**Propósito**: Categorías del sistema y personalizadas por usuario

### Estructura

```sql
CREATE TYPE category_type AS ENUM ('income', 'expense');

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  type category_type NOT NULL DEFAULT 'expense',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_category UNIQUE(profile_id, name),
  CONSTRAINT system_no_owner CHECK (
    (is_system = TRUE AND profile_id IS NULL) OR 
    (is_system = FALSE AND profile_id IS NOT NULL)
  )
);
```

### Índices

```sql
CREATE INDEX idx_categories_profile ON categories(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_categories_system ON categories(is_system, type) WHERE is_system = TRUE;
```

### Datos Semilla (System Categories)

```sql
-- Categorías de GASTOS
INSERT INTO categories (name, icon, color, type, is_system) VALUES
  ('Comida y Bebidas', '🍔', '#ef4444', 'expense', TRUE),
  ('Transporte', '🚗', '#3b82f6', 'expense', TRUE),
  ('Hogar', '🏠', '#10b981', 'expense', TRUE),
  ('Servicios', '⚡', '#f59e0b', 'expense', TRUE),
  ('Salud', '🏥', '#ec4899', 'expense', TRUE),
  ('Educación', '🎓', '#8b5cf6', 'expense', TRUE),
  ('Ocio y Entretenimiento', '🎮', '#06b6d4', 'expense', TRUE),
  ('Ropa y Accesorios', '👕', '#f43f5e', 'expense', TRUE),
  ('Regalos', '🎁', '#a855f7', 'expense', TRUE),
  ('Otros Gastos', '💳', '#6b7280', 'expense', TRUE);

-- Categorías de INGRESOS
INSERT INTO categories (name, icon, color, type, is_system) VALUES
  ('Salario', '💼', '#22c55e', 'income', TRUE),
  ('Freelance', '💰', '#14b8a6', 'income', TRUE),
  ('Inversiones', '📈', '#eab308', 'income', TRUE),
  ('Bonos', '🎉', '#fb923c', 'income', TRUE),
  ('Otros Ingresos', '💵', '#84cc16', 'income', TRUE);
```

---

## 📊 TABLA 3: accounts

**Propósito**: Cuentas bancarias, billeteras digitales, efectivo

### Estructura

```sql
CREATE TYPE account_type AS ENUM ('bank', 'wallet', 'cash', 'credit_card', 'debit_card');

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  institution TEXT,
  currency TEXT NOT NULL DEFAULT 'PYG',
  initial_balance BIGINT NOT NULL DEFAULT 0,
  current_balance BIGINT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'wallet',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_initial_balance CHECK (initial_balance >= 0)
);
```

### Notas sobre Montos

- Los montos se almacenan en **enteros (BIGINT)** representando la unidad mínima
- Para PYG: `1 Guaraní = 1` (ej: 50000 → ₲50.000)
- Para USD: `1 centavo = 1` (ej: 500 → $5.00)
- **Frontend** debe dividir/multiplicar por 100 para USD, dejar igual para PYG

### Índices

```sql
CREATE INDEX idx_accounts_profile ON accounts(profile_id, is_active);
CREATE INDEX idx_accounts_currency ON accounts(currency, is_active);
```

### Iconos Válidos (Lucide Icons)

- `wallet` - Billetera/Efectivo
- `banknote` - Cuenta bancaria
- `smartphone` - Billetera digital (Tigo Money, etc.)
- `credit-card` - Tarjeta de crédito
- `dollar-sign` - Cuentas en USD

---

## 📊 TABLA 4: transactions

**Propósito**: Todas las transacciones financieras (gastos, ingresos, transferencias)

### Estructura

```sql
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PYG',
  description TEXT NOT NULL,
  merchant TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  status transaction_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  receipt_url TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT transfer_requires_to_account CHECK (
    (type = 'transfer' AND to_account_id IS NOT NULL) OR
    (type IN ('expense', 'income') AND to_account_id IS NULL)
  ),
  CONSTRAINT no_self_transfer CHECK (
    type != 'transfer' OR account_id != to_account_id
  )
);
```

### Índices (Críticos para Performance)

```sql
-- Más usado: listar transacciones de un usuario por fecha
CREATE INDEX idx_transactions_profile_date ON transactions(
  profile_id, 
  transaction_date DESC
);

-- Filtrar por cuenta y estado
CREATE INDEX idx_transactions_account_status ON transactions(
  account_id, 
  status
) WHERE status = 'completed';

-- Agrupar por categoría
CREATE INDEX idx_transactions_category ON transactions(category_id) 
WHERE category_id IS NOT NULL;

-- Buscar transferencias
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id) 
WHERE to_account_id IS NOT NULL;
```

### Lógica de Negocio

**Tipo: expense**
- `amount` positivo (ej: 50000)
- Reduce `current_balance` de `account_id`
- `to_account_id` debe ser NULL

**Tipo: income**
- `amount` positivo (ej: 100000)
- Incrementa `current_balance` de `account_id`
- `to_account_id` debe ser NULL

**Tipo: transfer**
- `amount` positivo (ej: 75000)
- Reduce `current_balance` de `account_id` (origen)
- Incrementa `current_balance` de `to_account_id` (destino)
- Ambas cuentas deben pertenecer al mismo usuario

---

## 📊 TABLA 5: money_tag_groups

**Propósito**: Grupos para compartir gastos (ej: "Asado Sábado", "Viaje Encarnación")

### Estructura

```sql
CREATE TABLE public.money_tag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_groups_owner ON money_tag_groups(owner_profile_id, is_settled);
CREATE INDEX idx_groups_created ON money_tag_groups(created_at DESC);
```

### Lógica

- **owner_profile_id**: El usuario que crea el grupo
- **is_settled**: Indica si las deudas fueron liquidadas
- Un usuario puede ser participante sin ser owner

---

## 📊 TABLA 6: group_participants

**Propósito**: Participantes en grupos (usuarios registrados o invitados externos)

### Estructura

```sql
CREATE TABLE public.group_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES money_tag_groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_profile_per_group UNIQUE(group_id, profile_id) 
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT unique_phone_per_group UNIQUE(group_id, phone) 
    WHERE phone IS NOT NULL
);
```

### Índices

```sql
CREATE INDEX idx_participants_group ON group_participants(group_id);
CREATE INDEX idx_participants_profile ON group_participants(profile_id) 
WHERE profile_id IS NOT NULL;
```

### Lógica

**Usuario registrado:**
- `profile_id` tiene valor
- `name` se sincroniza desde `profiles.full_name`

**Invitado externo:**
- `profile_id` es NULL
- `name` y `phone` se ingresan manualmente

---

## 📊 TABLA 7: group_expenses

**Propósito**: Gastos dentro de un grupo

### Estructura

```sql
CREATE TABLE public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES money_tag_groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PYG',
  paid_by_participant_id UUID NOT NULL REFERENCES group_participants(id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_expense_amount CHECK (amount > 0)
);
```

### Índices

```sql
CREATE INDEX idx_expenses_group ON group_expenses(group_id, expense_date DESC);
CREATE INDEX idx_expenses_paid_by ON group_expenses(paid_by_participant_id);
```

---

## 📊 TABLA 8: expense_splits

**Propósito**: Junction table - quién participa en cada gasto

### Estructura

```sql
CREATE TABLE public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES group_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_participant_per_expense UNIQUE(expense_id, participant_id)
);
```

### Índices

```sql
CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_splits_participant ON expense_splits(participant_id);
```

### Lógica de Split

**Versión 1 (MVP)**: Split igual entre todos los participantes
- Si gasto = 300.000 y 3 participantes → cada uno debe 100.000

**Versión 2 (Futuro)**: 
- Agregar columnas `split_type` ('equal', 'percentage', 'exact')
- Agregar columna `split_amount` para splits personalizados

---

## 🔒 ESTRATEGIA RLS (Row Level Security)

### Principio Fundamental

**Simple y Directo**: Todas las políticas usan `auth.uid()` directamente sin joins complejos.

### Habilitar RLS en Todas las Tablas

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_tag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
```

---

## 🔒 RLS: profiles

```sql
-- SELECT: Solo tu propio perfil
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT 
  USING (id = auth.uid());

-- INSERT: Solo al registrarse (manejado por Supabase Auth)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- UPDATE: Solo tu propio perfil
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: No permitido (se maneja desde Auth)
-- No crear política DELETE
```

---

## 🔒 RLS: categories

```sql
-- SELECT: Categorías del sistema + tus propias categorías
CREATE POLICY categories_select ON categories
  FOR SELECT 
  USING (
    is_system = TRUE 
    OR profile_id = auth.uid()
  );

-- INSERT: Solo puedes crear tus propias categorías (no sistema)
CREATE POLICY categories_insert_own ON categories
  FOR INSERT 
  WITH CHECK (
    profile_id = auth.uid() 
    AND is_system = FALSE
  );

-- UPDATE: Solo tus propias categorías (no sistema)
CREATE POLICY categories_update_own ON categories
  FOR UPDATE 
  USING (
    profile_id = auth.uid() 
    AND is_system = FALSE
  )
  WITH CHECK (
    profile_id = auth.uid() 
    AND is_system = FALSE
  );

-- DELETE: Solo tus propias categorías (no sistema)
CREATE POLICY categories_delete_own ON categories
  FOR DELETE 
  USING (
    profile_id = auth.uid() 
    AND is_system = FALSE
  );
```

---

## 🔒 RLS: accounts

```sql
-- Una política ALL simplificada
CREATE POLICY accounts_all_own ON accounts
  FOR ALL 
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
```

**Explicación**: 
- `FOR ALL` cubre SELECT, INSERT, UPDATE, DELETE
- `USING`: Verifica filas existentes (SELECT, UPDATE, DELETE)
- `WITH CHECK`: Verifica nuevas filas (INSERT, UPDATE)

---

## 🔒 RLS: transactions

```sql
-- Una política ALL simplificada
CREATE POLICY transactions_all_own ON transactions
  FOR ALL 
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
```

**Validación adicional**: El trigger `validate_transaction_accounts` verifica que `account_id` y `to_account_id` pertenezcan al usuario.

---

## 🔒 RLS: money_tag_groups

```sql
-- SELECT: Grupos donde eres owner O participante
CREATE POLICY groups_select ON money_tag_groups
  FOR SELECT 
  USING (
    owner_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 
      FROM group_participants 
      WHERE group_id = money_tag_groups.id 
        AND profile_id = auth.uid()
    )
  );

-- INSERT: Solo puedes crear grupos propios
CREATE POLICY groups_insert_own ON money_tag_groups
  FOR INSERT 
  WITH CHECK (owner_profile_id = auth.uid());

-- UPDATE: Solo el owner puede modificar
CREATE POLICY groups_update_owner ON money_tag_groups
  FOR UPDATE 
  USING (owner_profile_id = auth.uid())
  WITH CHECK (owner_profile_id = auth.uid());

-- DELETE: Solo el owner puede eliminar
CREATE POLICY groups_delete_owner ON money_tag_groups
  FOR DELETE 
  USING (owner_profile_id = auth.uid());
```

---

## 🔒 RLS: group_participants

```sql
-- SELECT: Ver participantes de grupos donde estás (como owner o participante)
CREATE POLICY participants_select ON group_participants
  FOR SELECT 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
    OR group_id IN (
      SELECT group_id 
      FROM group_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- INSERT: Solo el owner del grupo puede agregar participantes
CREATE POLICY participants_insert_owner ON group_participants
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
  );

-- UPDATE: Solo el owner puede modificar participantes
CREATE POLICY participants_update_owner ON group_participants
  FOR UPDATE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
  );

-- DELETE: Solo el owner puede eliminar participantes
CREATE POLICY participants_delete_owner ON group_participants
  FOR DELETE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
  );
```

---

## 🔒 RLS: group_expenses

```sql
-- SELECT: Ver gastos de grupos donde participas
CREATE POLICY expenses_select ON group_expenses
  FOR SELECT 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
    OR group_id IN (
      SELECT group_id 
      FROM group_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- INSERT: Cualquier participante del grupo puede agregar gastos
CREATE POLICY expenses_insert_participant ON group_expenses
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
    OR group_id IN (
      SELECT group_id 
      FROM group_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- UPDATE: Solo owner del grupo o quien pagó
CREATE POLICY expenses_update_owner_or_payer ON group_expenses
  FOR UPDATE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
    OR paid_by_participant_id IN (
      SELECT id 
      FROM group_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- DELETE: Solo owner del grupo
CREATE POLICY expenses_delete_owner ON group_expenses
  FOR DELETE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = auth.uid()
    )
  );
```

---

## 🔒 RLS: expense_splits

```sql
-- SELECT: Ver splits de gastos de tus grupos
CREATE POLICY splits_select ON expense_splits
  FOR SELECT 
  USING (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = auth.uid()
      )
      OR group_id IN (
        SELECT group_id 
        FROM group_participants 
        WHERE profile_id = auth.uid()
      )
    )
  );

-- INSERT: Cualquier participante puede agregar splits al crear gasto
CREATE POLICY splits_insert_participant ON expense_splits
  FOR INSERT 
  WITH CHECK (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = auth.uid()
      )
      OR group_id IN (
        SELECT group_id 
        FROM group_participants 
        WHERE profile_id = auth.uid()
      )
    )
  );

-- UPDATE: Solo owner del grupo
CREATE POLICY splits_update_owner ON expense_splits
  FOR UPDATE 
  USING (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = auth.uid()
      )
    )
  );

-- DELETE: Solo owner del grupo
CREATE POLICY splits_delete_owner ON expense_splits
  FOR DELETE 
  USING (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = auth.uid()
      )
    )
  );
```

---

## ⚙️ TRIGGERS Y FUNCIONES

### 1. Actualizar `updated_at` Automáticamente

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON money_tag_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON group_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Actualizar Balance de Cuentas

```sql
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar transacciones completadas
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    
    -- Caso: EXPENSE (gasto)
    IF NEW.type = 'expense' THEN
      UPDATE accounts 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    
    -- Caso: INCOME (ingreso)
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    
    -- Caso: TRANSFER (transferencia)
    ELSIF NEW.type = 'transfer' THEN
      -- Restar de cuenta origen
      UPDATE accounts 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
      
      -- Sumar a cuenta destino
      UPDATE accounts 
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.to_account_id;
    END IF;
  
  -- Revertir balance al eliminar transacción completada
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    
    IF OLD.type = 'expense' THEN
      UPDATE accounts 
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    
    ELSIF OLD.type = 'transfer' THEN
      UPDATE accounts 
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
      
      UPDATE accounts 
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.to_account_id;
    END IF;
  
  -- Actualizar balance al cambiar status
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    
    -- De no-completado a completado: aplicar
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      IF NEW.type = 'expense' THEN
        UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'income' THEN
        UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    
    -- De completado a no-completado: revertir
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      IF NEW.type = 'expense' THEN
        UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'income' THEN
        UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER transaction_balance_update
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();
```

---

### 3. Validar Transferencias

```sql
CREATE OR REPLACE FUNCTION validate_transaction_accounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que account_id pertenece al usuario
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = NEW.account_id 
    AND profile_id = NEW.profile_id
  ) THEN
    RAISE EXCEPTION 'La cuenta seleccionada no pertenece al usuario';
  END IF;
  
  -- Si es transferencia, validar to_account_id
  IF NEW.type = 'transfer' THEN
    IF NEW.to_account_id IS NULL THEN
      RAISE EXCEPTION 'Las transferencias requieren una cuenta destino';
    END IF;
    
    IF NEW.account_id = NEW.to_account_id THEN
      RAISE EXCEPTION 'No puedes transferir a la misma cuenta';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM accounts 
      WHERE id = NEW.to_account_id 
      AND profile_id = NEW.profile_id
    ) THEN
      RAISE EXCEPTION 'La cuenta destino no pertenece al usuario';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_accounts_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_accounts();
```

---

### 4. Sincronizar Nombre de Participante Registrado

```sql
CREATE OR REPLACE FUNCTION sync_participant_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el participante está vinculado a un perfil, usar su nombre
  IF NEW.profile_id IS NOT NULL THEN
    SELECT full_name INTO NEW.name
    FROM profiles
    WHERE id = NEW.profile_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_participant_name_trigger
  BEFORE INSERT OR UPDATE ON group_participants
  FOR EACH ROW
  WHEN (NEW.profile_id IS NOT NULL)
  EXECUTE FUNCTION sync_participant_name();
```

---

### 5. Función: Calcular Deudas de Grupo

```sql
CREATE OR REPLACE FUNCTION calculate_group_debts(group_uuid UUID)
RETURNS TABLE(
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  amount BIGINT
) AS $$
DECLARE
  participant RECORD;
  balance RECORD;
  balances JSONB := '{}';
  debtor RECORD;
  creditor RECORD;
BEGIN
  -- 1. Calcular balance de cada participante
  FOR participant IN 
    SELECT id, name 
    FROM group_participants 
    WHERE group_id = group_uuid
  LOOP
    -- Cuánto pagó
    DECLARE
      total_paid BIGINT;
      total_owes BIGINT;
      net_balance BIGINT;
    BEGIN
      SELECT COALESCE(SUM(amount), 0) INTO total_paid
      FROM group_expenses
      WHERE group_id = group_uuid 
        AND paid_by_participant_id = participant.id;
      
      -- Cuánto debe (su parte en cada gasto donde participó)
      SELECT COALESCE(SUM(
        ge.amount / (
          SELECT COUNT(*) 
          FROM expense_splits 
          WHERE expense_id = ge.id
        )
      ), 0) INTO total_owes
      FROM group_expenses ge
      JOIN expense_splits es ON es.expense_id = ge.id
      WHERE ge.group_id = group_uuid 
        AND es.participant_id = participant.id;
      
      net_balance := total_paid - total_owes;
      
      balances := jsonb_set(
        balances, 
        ARRAY[participant.id::text], 
        jsonb_build_object(
          'name', participant.name,
          'balance', net_balance
        )
      );
    END;
  END LOOP;
  
  -- 2. Algoritmo greedy para minimizar transacciones
  -- (Simplificado: retornar balances directos)
  FOR balance IN 
    SELECT 
      key::uuid as pid,
      (value->>'name')::text as pname,
      (value->>'balance')::bigint as bal
    FROM jsonb_each(balances)
  LOOP
    IF balance.bal < 0 THEN
      -- Deudor: debe dinero
      FOR creditor IN 
        SELECT 
          key::uuid as cid,
          (value->>'name')::text as cname,
          (value->>'balance')::bigint as cbal
        FROM jsonb_each(balances)
        WHERE (value->>'balance')::bigint > 0
      LOOP
        RETURN QUERY SELECT 
          balance.pid,
          balance.pname,
          creditor.cid,
          creditor.cname,
          ABS(balance.bal);
        EXIT; -- Por ahora, una deuda simple por deudor
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Nota**: Esta es una versión simplificada. Para producción, implementar algoritmo greedy completo.

---

## 📦 ORDEN DE EJECUCIÓN - MIGRACIONES

### Migración 1: `20251027000001_create_base_schema.sql`

**Contenido:**
1. Crear ENUMs (category_type, account_type, transaction_type, transaction_status)
2. Crear tabla `profiles`
3. Crear tabla `categories`
4. Insertar categorías del sistema (seed data)
5. Crear función `update_updated_at_column()`
6. Crear triggers para `updated_at` en profiles y categories
7. Crear índices básicos

**Dependencias:** Ninguna

---

### Migración 2: `20251027000002_create_accounts_transactions.sql`

**Contenido:**
1. Crear tabla `accounts`
2. Crear tabla `transactions`
3. Crear función `validate_transaction_accounts()`
4. Crear función `update_account_balance()`
5. Crear triggers para validación y balance
6. Crear triggers para `updated_at`
7. Crear índices de performance

**Dependencias:** Migración 1

---

### Migración 3: `20251027000003_create_money_tags.sql`

**Contenido:**
1. Crear tabla `money_tag_groups`
2. Crear tabla `group_participants`
3. Crear tabla `group_expenses`
4. Crear tabla `expense_splits`
5. Crear función `sync_participant_name()`
6. Crear función `calculate_group_debts()`
7. Crear triggers para `updated_at`
8. Crear índices

**Dependencias:** Migración 1

---

### Migración 4: `20251027000004_create_rls_policies.sql`

**Contenido:**
1. Habilitar RLS en todas las tablas
2. Crear políticas para `profiles`
3. Crear políticas para `categories`
4. Crear políticas para `accounts`
5. Crear políticas para `transactions`
6. Crear políticas para `money_tag_groups`
7. Crear políticas para `group_participants`
8. Crear políticas para `group_expenses`
9. Crear políticas para `expense_splits`

**Dependencias:** Migraciones 1, 2, 3

---

### Migración 5: `20251027000005_add_comments.sql`

**Contenido:**
1. Agregar comentarios descriptivos a todas las tablas
2. Agregar comentarios a columnas importantes
3. Documentar constraints y lógica de negocio

**Dependencias:** Migraciones 1, 2, 3

---

## 📐 CAMBIOS NECESARIOS EN FRONTEND

### 1. Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Cliente Supabase

**Archivo:** `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### 3. Crear TypeScript Types

**Archivo:** `src/types/database.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          country_code: string
          default_currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          country_code?: string
          default_currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          country_code?: string
          default_currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          icon: string
          color: string
          type: 'income' | 'expense'
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          name: string
          icon: string
          color?: string
          type?: 'income' | 'expense'
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          name?: string
          icon?: string
          color?: string
          type?: 'income' | 'expense'
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          profile_id: string
          name: string
          type: 'bank' | 'wallet' | 'cash' | 'credit_card' | 'debit_card'
          institution: string | null
          currency: string
          initial_balance: number
          current_balance: number
          color: string
          icon: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          type: 'bank' | 'wallet' | 'cash' | 'credit_card' | 'debit_card'
          institution?: string | null
          currency?: string
          initial_balance?: number
          current_balance?: number
          color?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          type?: 'bank' | 'wallet' | 'cash' | 'credit_card' | 'debit_card'
          institution?: string | null
          currency?: string
          initial_balance?: number
          current_balance?: number
          color?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          profile_id: string
          type: 'expense' | 'income' | 'transfer'
          amount: number
          currency: string
          description: string
          merchant: string | null
          category_id: string | null
          account_id: string
          to_account_id: string | null
          status: 'pending' | 'completed' | 'cancelled'
          notes: string | null
          receipt_url: string | null
          transaction_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          type: 'expense' | 'income' | 'transfer'
          amount: number
          currency?: string
          description: string
          merchant?: string | null
          category_id?: string | null
          account_id: string
          to_account_id?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          receipt_url?: string | null
          transaction_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          type?: 'expense' | 'income' | 'transfer'
          amount?: number
          currency?: string
          description?: string
          merchant?: string | null
          category_id?: string | null
          account_id?: string
          to_account_id?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          receipt_url?: string | null
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      money_tag_groups: {
        Row: {
          id: string
          owner_profile_id: string
          name: string
          description: string | null
          is_settled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_profile_id: string
          name: string
          description?: string | null
          is_settled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_profile_id?: string
          name?: string
          description?: string | null
          is_settled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      group_participants: {
        Row: {
          id: string
          group_id: string
          profile_id: string | null
          name: string
          phone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          profile_id?: string | null
          name: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          profile_id?: string | null
          name?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      group_expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          currency: string
          paid_by_participant_id: string
          expense_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          currency?: string
          paid_by_participant_id: string
          expense_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          currency?: string
          paid_by_participant_id?: string
          expense_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          participant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          participant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          participant_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_group_debts: {
        Args: {
          group_uuid: string
        }
        Returns: {
          debtor_id: string
          debtor_name: string
          creditor_id: string
          creditor_name: string
          amount: number
        }[]
      }
    }
    Enums: {
      category_type: 'income' | 'expense'
      account_type: 'bank' | 'wallet' | 'cash' | 'credit_card' | 'debit_card'
      transaction_type: 'expense' | 'income' | 'transfer'
      transaction_status: 'pending' | 'completed' | 'cancelled'
    }
  }
}
```

### 4. Crear Hooks Personalizados

**Archivo:** `src/hooks/useCategories.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Category = Database['public']['Tables']['categories']['Row'];

export function useCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Category[];
    }
  });
}
```

**Archivo:** `src/hooks/useAccounts.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Account[];
    }
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: AccountInsert) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AccountUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
```

**Archivo:** `src/hooks/useTransactions.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export function useTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .order('transaction_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      if (filters?.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}
```

### 5. Actualizar Componentes

**Cambios principales en formularios:**

1. **AccountForm**: Agregar campo `type` (select con opciones: bank, wallet, cash, etc.)
2. **TransactionForm**: 
   - Cambiar categoría de string a select con `useCategories()`
   - Cambiar cuenta de string a select con `useAccounts()`
   - Agregar campo `type` (expense, income, transfer)
   - Si type='transfer', mostrar campo `to_account_id`

---

## ✅ BENEFICIOS DE ESTA ARQUITECTURA

1. **RLS Simplificado**: `auth.uid()` directo, sin joins complejos a tabla intermedia
2. **Performance**: Índices estratégicos en queries más comunes
3. **Integridad**: Triggers mantienen balances actualizados automáticamente
4. **Escalabilidad**: Separación clara de concerns (finanzas personales vs compartidas)
5. **Auditoría**: Timestamps en todas las tablas
6. **Seguridad**: RLS robusto testeado
7. **Flexibilidad**: MoneyTags soporta usuarios registrados y externos
8. **Consistencia**: 100% alineado con frontend actual

---

## 📦 ENTREGABLES

### Archivos SQL

1. `migrations/20251027000001_create_base_schema.sql` (Profiles + Categories)
2. `migrations/20251027000002_create_accounts_transactions.sql` (Accounts + Transactions + Triggers)
3. `migrations/20251027000003_create_money_tags.sql` (MoneyTags completo)
4. `migrations/20251027000004_create_rls_policies.sql` (Todas las políticas RLS)
5. `migrations/20251027000005_add_comments.sql` (Documentación)

### Archivos TypeScript

1. `src/types/database.ts` (Tipos generados)
2. `src/lib/supabase/client.ts` (Cliente configurado)
3. `src/hooks/useCategories.ts`
4. `src/hooks/useAccounts.ts`
5. `src/hooks/useTransactions.ts`
6. `src/hooks/useMoneyTagGroups.ts`

### Documentación

1. Este archivo (plan completo)
2. Guía de testing RLS
3. Guía de integración Frontend

---

## ⏱️ ESTIMACIÓN

- **Escribir 5 migraciones SQL**: 2-3 horas
- **Crear types TypeScript**: 1 hora
- **Crear hooks personalizados**: 2 horas
- **Actualizar componentes**: 3-4 horas
- **Testing RLS + Integration**: 2 horas
- **Total**: **10-12 horas de desarrollo**

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar** este plan
2. **Aplicar migraciones** en orden (1 → 2 → 3 → 4 → 5)
3. **Configurar cliente Supabase** en frontend
4. **Crear hooks** para fetch de datos
5. **Actualizar formularios** con campos faltantes
6. **Testing completo** de RLS
7. **Deploy** a producción

---

**Documento creado por**: Droid (Factory AI)  
**Última actualización**: 27 de Octubre 2025  
**Estado**: ✅ Listo para Implementación
