# Corrección Crítica de RLS - MONI

**Fecha**: 27 de Octubre 2025  
**Criticidad**: 🔴 ALTA - Falla de seguridad corregida

---

## 🚨 Problema Identificado

### Falla de Seguridad Original

El diseño inicial tenía un **error crítico de arquitectura**:

```sql
-- ❌ INCORRECTO (diseño original)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);

-- Política RLS insegura
CREATE POLICY accounts_all_own ON accounts
  FOR ALL 
  USING (profile_id = auth.uid())  -- ❌ PELIGROSO
  WITH CHECK (profile_id = auth.uid());
```

**Por qué era peligroso:**
- `profile_id` referencia `profiles.id` (PK interna de la app)
- `auth.uid()` retorna `auth.users.id` (PK de autenticación)
- En el diseño original, ambos eran el mismo UUID, lo cual crea confusión
- Si en el futuro se desvincula `profiles.id` de `auth.users.id`, RLS falla completamente

---

## ✅ Solución Implementada

### Nuevo Diseño Seguro

```sql
-- ✅ CORRECTO (diseño nuevo)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- PK interna independiente
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- FK a auth
  ...
);

-- Políticas RLS seguras
-- Para tabla profiles:
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT 
  USING (auth_id = auth.uid());  -- ✅ Compara auth_id con auth.uid()

-- Para todas las demás tablas:
CREATE POLICY accounts_all_own ON accounts
  FOR ALL 
  USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))  -- ✅ SEGURO
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));
```

---

## 📝 Archivos Modificados

### 1. **Migración 1**: `20251027000001_create_base_schema.sql`

**Cambios:**
- Tabla `profiles` ahora tiene `auth_id` como FK a `auth.users.id`
- `profiles.id` es un UUID independiente generado automáticamente
- Agregado índice `idx_profiles_auth_id` para optimizar joins

**Impacto**: 
- ✅ Separación clara entre ID interno de la app y ID de autenticación
- ✅ Permite futuras migraciones sin romper relaciones

---

### 2. **Migración 4**: `20251027000004_create_rls_policies.sql`

**Cambios:**

#### Tabla `profiles` (usa `auth_id` directamente):
```sql
-- Antes: id = auth.uid()
-- Ahora:  auth_id = auth.uid()

USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid())
```

#### Todas las demás tablas (usan subconsulta):
```sql
-- Antes: profile_id = auth.uid() ó owner_profile_id = auth.uid()
-- Ahora:  profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())

-- Ejemplo para categories:
USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))

-- Ejemplo para money_tag_groups:
USING (owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
WITH CHECK (owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
```

**Tablas corregidas:**
- ✅ `profiles` (3 políticas)
- ✅ `categories` (4 políticas)
- ✅ `accounts` (1 política)
- ✅ `transactions` (1 política)
- ✅ `money_tag_groups` (4 políticas)
- ✅ `group_participants` (4 políticas)
- ✅ `group_expenses` (4 políticas)
- ✅ `expense_splits` (4 políticas)

**Total**: 25 políticas RLS corregidas

---

### 3. **Migración 5**: `20251027000005_add_comments.sql`

**Cambios:**
```sql
-- Antes:
COMMENT ON TABLE profiles IS 
'Perfiles de usuario vinculados directamente a Supabase Auth. El id es auth.users.id';

COMMENT ON COLUMN profiles.id IS 
'UUID del usuario en auth.users - Referencia directa para simplificar RLS';

-- Ahora:
COMMENT ON TABLE profiles IS 
'Perfiles de usuario vinculados a Supabase Auth mediante auth_id';

COMMENT ON COLUMN profiles.id IS 
'UUID único del perfil - PK interna de la aplicación';

COMMENT ON COLUMN profiles.auth_id IS 
'UUID que vincula a auth.users.id - Usado para autenticación y RLS';
```

---

### 4. **Cliente Supabase**: `src/lib/supabase/client.ts`

**Cambios:**

1. **Helper actualizado**: `getCurrentProfile()`
```typescript
// Antes:
.eq('id', user.id)

// Ahora:
.eq('auth_id', user.id)
```

2. **Nueva helper function** (CRÍTICA):
```typescript
export async function getCurrentProfileId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (error) {
    console.error('Error getting current profile id:', error);
    return null;
  }

  return data?.id || null;
}
```

**Uso**: Esta función convierte `auth.users.id` → `profiles.id` para usar en inserts

---

### 5. **Funciones de BD**: `src/lib/supabase/*.ts`

**Cambios en todos los archivos** (`categories.ts`, `accounts.ts`, `transactions.ts`, `money-tags.ts`):

```typescript
// ❌ Antes (INSEGURO):
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Usuario no autenticado');

const { data, error } = await supabase
  .from('accounts')
  .insert({
    profile_id: user.id,  // ❌ Usa auth.users.id directamente
    ...
  });

// ✅ Ahora (SEGURO):
const profileId = await getCurrentProfileId();
if (!profileId) throw new Error('Usuario no autenticado');

const { data, error } = await supabase
  .from('accounts')
  .insert({
    profile_id: profileId,  // ✅ Usa profiles.id
    ...
  });
```

**Archivos actualizados:**
- ✅ `src/lib/supabase/categories.ts`
- ✅ `src/lib/supabase/accounts.ts`
- ✅ `src/lib/supabase/transactions.ts`
- ✅ `src/lib/supabase/money-tags.ts`

---

## 🎯 Ventajas del Nuevo Diseño

### 1. **Seguridad Mejorada**
- RLS ahora es explícito: `auth_id` vs `id` nunca se confunden
- La subconsulta garantiza la vinculación correcta en todas las tablas

### 2. **Flexibilidad Futura**
- Si necesitas cambiar cómo se vinculan perfiles a auth, solo modificas `profiles`
- No necesitas tocar todas las demás tablas

### 3. **Claridad Conceptual**
- `auth_id`: vínculo a Supabase Auth (inmutable)
- `profiles.id`: identidad interna de la app (puede cambiar)

### 4. **Compatibilidad con OAuth**
- Si un usuario cambia de proveedor de auth (Google → Email), `profiles.id` permanece
- Solo `auth_id` se actualiza

---

## 🧪 Testing de RLS

### Cómo Verificar que Funciona

```sql
-- 1. Crear perfil de prueba
INSERT INTO auth.users (id, email) VALUES 
  ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com');

INSERT INTO profiles (auth_id, email, full_name) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', 'Usuario Test');

-- 2. Verificar que RLS permite solo al usuario ver su perfil
SET SESSION VARIABLE jwt.claims.sub = '123e4567-e89b-12d3-a456-426614174000';

SELECT * FROM profiles;  -- Debería ver solo su perfil

-- 3. Verificar que puede crear categorías
INSERT INTO categories (name, icon, type) VALUES
  ('Test Category', '🧪', 'expense');

-- 4. Verificar que NO puede ver categorías de otros usuarios
SET SESSION VARIABLE jwt.claims.sub = 'otro-usuario-id';

SELECT * FROM categories WHERE profile_id IS NOT NULL;  -- No debería ver nada
```

---

## ⚠️ Migración desde BD Antigua

Si ya tienes datos en la BD con el diseño antiguo:

```sql
-- Paso 1: Agregar columna auth_id
ALTER TABLE profiles ADD COLUMN auth_id UUID;

-- Paso 2: Copiar id → auth_id
UPDATE profiles SET auth_id = id;

-- Paso 3: Hacer auth_id NOT NULL y UNIQUE
ALTER TABLE profiles 
  ALTER COLUMN auth_id SET NOT NULL,
  ADD CONSTRAINT profiles_auth_id_key UNIQUE (auth_id),
  ADD CONSTRAINT profiles_auth_id_fkey FOREIGN KEY (auth_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE;

-- Paso 4: Generar nuevos IDs para profiles.id
UPDATE profiles SET id = gen_random_uuid();

-- Paso 5: Aplicar nuevas políticas RLS (DROP old, CREATE new)
```

**⚠️ ADVERTENCIA**: Esto romperá FKs existentes. Solo para desarrollo, NO producción.

---

## 📋 Checklist de Aplicación

- [x] Migración 1: Estructura de `profiles` corregida
- [x] Migración 4: Todas las políticas RLS actualizadas (25 políticas)
- [x] Migración 5: Comentarios actualizados
- [x] Cliente Supabase: `getCurrentProfileId()` agregado
- [x] Lib Supabase: Todas las funciones usan `getCurrentProfileId()`
- [ ] **Aplicar migraciones en Supabase** (orden 1 → 2 → 3 → 4 → 5)
- [ ] **Testing de RLS** con usuarios de prueba
- [ ] **Verificar inserts** desde frontend

---

## 🚀 Próximos Pasos

1. **Aplicar las migraciones corregidas** en orden:
   ```bash
   # Usando MCP de Supabase
   supabase___apply_migration(name: "create_base_schema", query: "...")
   supabase___apply_migration(name: "create_accounts_transactions", query: "...")
   supabase___apply_migration(name: "create_money_tags", query: "...")
   supabase___apply_migration(name: "create_rls_policies", query: "...")
   supabase___apply_migration(name: "add_comments", query: "...")
   ```

2. **Testing de seguridad**:
   - Crear 2 usuarios de prueba
   - Verificar que Usuario A no puede ver datos de Usuario B
   - Verificar que inserts funcionan correctamente

3. **Integrar con Frontend**:
   - Los hooks ya están listos
   - Solo falta configurar `.env.local` y aplicar migraciones

---

**Corrección aplicada por**: Droid (Factory AI)  
**Fecha**: 27 de Octubre 2025  
**Estado**: ✅ Código corregido, listo para aplicar migraciones
