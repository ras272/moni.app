# 🏷️ MoniTags - Arquitectura Social para Gastos Compartidos

## Visión General

Transformar MoneyTags en un sistema social moderno donde los usuarios tienen `@monitags` únicos y pueden compartir grupos de gasto de forma pública con usuarios registrados y no registrados.

---

## 🎯 Objetivos Principales

1. **Sistema de @monitag único** por usuario (opcional, necesario solo para usar MoniTags)
2. **URLs amigables** con formato: `moni.app/g/@juanpy/asado-amigos`
3. **Experiencias diferenciadas**: Usuarios registrados vs no registrados
4. **Invitaciones públicas** mediante link compartible
5. **Notificaciones solo para usuarios registrados**

---

## 📊 Arquitectura de Base de Datos

### Cambios Necesarios

#### 1. Tabla `profiles` (Agregar @monitag)

```sql
-- Agregar campo monitag a profiles
ALTER TABLE profiles 
ADD COLUMN monitag TEXT UNIQUE;

-- Índice para búsquedas rápidas
CREATE INDEX idx_profiles_monitag ON profiles(monitag) 
WHERE monitag IS NOT NULL;

-- Constraint: monitag debe ser lowercase y alfanumérico
ALTER TABLE profiles 
ADD CONSTRAINT monitag_format 
CHECK (monitag ~ '^[a-z0-9_]{3,20}$');
```

**Reglas del @monitag:**
- 3-20 caracteres
- Solo lowercase, números y guiones bajos
- Único en toda la plataforma
- Opcional hasta que el usuario quiera usar MoniTags

#### 2. Tabla `money_tag_groups` (Agregar slug y público)

```sql
-- Agregar slug para URLs amigables
ALTER TABLE money_tag_groups 
ADD COLUMN slug TEXT NOT NULL DEFAULT gen_random_uuid()::text;

-- Agregar campo is_public para links compartibles
ALTER TABLE money_tag_groups 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;

-- Índice único combinado: owner_monitag + slug
CREATE UNIQUE INDEX idx_groups_owner_slug 
ON money_tag_groups(owner_profile_id, slug);

-- Índice para búsqueda pública
CREATE INDEX idx_groups_public 
ON money_tag_groups(is_public) 
WHERE is_public = true;
```

**Formato del slug:**
- Generado automáticamente al crear el grupo
- Basado en el nombre del grupo (slugified)
- Ejemplo: "Asado con Amigos" → "asado-con-amigos"
- Si existe, agrega sufijo numérico: "asado-con-amigos-2"

#### 3. Tabla `group_participants` (Mejorar estructura)

```sql
-- Agregar estado de invitación
ALTER TABLE group_participants 
ADD COLUMN invitation_status TEXT NOT NULL DEFAULT 'accepted'
CHECK (invitation_status IN ('pending', 'accepted', 'rejected'));

-- Agregar token de invitación para usuarios no registrados
ALTER TABLE group_participants 
ADD COLUMN invitation_token TEXT UNIQUE;

-- Índice para búsqueda por token
CREATE INDEX idx_participants_token 
ON group_participants(invitation_token) 
WHERE invitation_token IS NOT NULL;
```

**Estados de participantes:**
- `accepted`: Usuario registrado, ya en el grupo
- `pending`: Usuario invitado pero no ha aceptado
- `rejected`: Usuario rechazó la invitación

---

## 🔄 Flujos de Usuario

### Flujo 1: Creación de @monitag

```
Usuario registrado sin @monitag
  ↓
Dashboard muestra banner: "Crea tu @monitag para usar MoniTags"
  ↓
Usuario hace clic → Modal de creación
  ↓
Ingresa @monitag deseado
  ↓
Sistema valida:
  - Formato correcto (3-20 chars, lowercase, alfanumérico)
  - Disponibilidad (no existe)
  - Si no disponible, sugiere alternativas:
    @juanpy → @juan_py, @juanpy23, @juanpy_
  ↓
@monitag creado exitosamente
  ↓
Usuario puede crear grupos MoniTags
```

### Flujo 2: Creación de Grupo

```
Usuario con @monitag hace clic en "Crear Grupo"
  ↓
Modal: Ingresa nombre del grupo
  ↓
Sistema genera slug automático:
  "Asado con Amigos" → "asado-con-amigos"
  ↓
Grupo creado con URL:
  moni.app/g/@juanpy/asado-con-amigos
  ↓
Usuario puede compartir link público
```

### Flujo 3: Agregar Participantes (3 formas)

#### Opción A: Por @monitag (Usuarios registrados)

```
En vista de grupo → "Agregar Participante"
  ↓
Input de búsqueda: "@..."
  ↓
Sistema busca monitags que coincidan en tiempo real
  ↓
Usuario selecciona @amigo de la lista
  ↓
Participante agregado inmediatamente (estado: accepted)
  ↓
@amigo ve el grupo en su dashboard automáticamente
```

#### Opción B: Por Link Compartible

```
Usuario copia link del grupo:
  moni.app/g/@juanpy/asado-con-amigos
  ↓
Comparte por WhatsApp/Telegram/etc
  ↓
Receptor hace clic en el link
  ↓
  ┌─────────────────┐
  │ ¿Está logueado? │
  └────┬────────┬───┘
       │        │
    SI │        │ NO
       ↓        ↓
  Dashboard  Vista Pública
  + grupo    (solo lectura)
```

#### Opción C: Manual (Nombre + Teléfono)

```
En vista de grupo → "Agregar Manualmente"
  ↓
Ingresa: Nombre + Teléfono (opcional)
  ↓
Sistema crea participante sin profile_id
  ↓
Participante aparece en lista pero:
  - No recibe notificaciones
  - No puede interactuar
  - Solo visible en el grupo
```

### Flujo 4: Usuario No Registrado (Vista Pública)

```
Usuario sin cuenta hace clic en:
  moni.app/g/@juanpy/asado-con-amigos
  ↓
Ve página pública del grupo:
  ┌──────────────────────────────┐
  │ Grupo: Asado con Amigos      │
  │ Creado por: @juanpy          │
  │                              │
  │ Participantes (5):           │
  │ - Juan Pablo                 │
  │ - María                      │
  │ - Carlos                     │
  │ - Ana                        │
  │ - TÚ (Pedro)                 │
  │                              │
  │ Gastos (3):                  │
  │ ✓ Carne - 150.000 Gs         │
  │ ✓ Bebidas - 80.000 Gs        │
  │ ✓ Carbón - 20.000 Gs         │
  │                              │
  │ TU DEUDA: 83.333 Gs          │
  │ Debes a @juanpy              │
  │                              │
  │ ⚠️ Registrate para:          │
  │ • Recibir notificaciones     │
  │ • Agregar gastos             │
  │ • Marcar deudas como pagas   │
  │                              │
  │ [Registrarme en Moni]        │
  └──────────────────────────────┘
```

**Características de la vista pública:**
- ✅ Ver todos los gastos del grupo
- ✅ Ver participantes
- ✅ Ver cuánto debe
- ✅ Ver a quién le debe
- ❌ NO puede agregar gastos
- ❌ NO puede marcar deudas como pagas
- ❌ NO recibe notificaciones
- ✅ CTA prominente para registrarse

---

## 🔔 Sistema de Notificaciones

**Solo para usuarios registrados con @monitag:**

### Eventos que generan notificaciones:

1. **Agregado a un grupo**
   - "@juanpy te agregó al grupo 'Asado con Amigos'"

2. **Nuevo gasto en grupo**
   - "Nuevo gasto en 'Asado con Amigos': 150.000 Gs"
   - "Debes 50.000 Gs"

3. **Deuda liquidada**
   - "@mariapaz marcó como paga tu deuda de 50.000 Gs"

4. **Grupo liquidado**
   - "El grupo 'Asado con Amigos' fue liquidado"

**Canales de notificación:**
- In-app (dashboard)
- Email (opcional)
- WhatsApp Bot (futuro, opcional)

---

## 🎨 Componentes UI Necesarios

### 1. Banner de Creación de @monitag
```tsx
// Aparece en dashboard si user.monitag === null
<Banner>
  Crea tu @monitag para usar MoniTags
  [Crear Ahora]
</Banner>
```

### 2. Modal de Creación de @monitag
```tsx
<Dialog>
  <Input 
    prefix="@" 
    placeholder="juanpy"
    validation={validateMonitag}
  />
  {suggestions && (
    <div>
      Sugerencias: @juan_py, @juanpy23
    </div>
  )}
  [Crear @monitag]
</Dialog>
```

### 3. Búsqueda de @monitag
```tsx
<Combobox 
  placeholder="Buscar @monitag..."
  onSearch={searchMonitags}
  results={monitags}
/>
```

### 4. Link Compartible del Grupo
```tsx
<Card>
  <CopyButton text="moni.app/g/@juanpy/asado-amigos" />
  <QRCode value="moni.app/g/@juanpy/asado-amigos" />
</Card>
```

### 5. Vista Pública del Grupo
```tsx
<PublicGroupView>
  <GroupHeader>
    <Avatar />
    <Title>{groupName}</Title>
    <Subtitle>Creado por @{ownerMonitag}</Subtitle>
  </GroupHeader>
  
  <ParticipantsList />
  <ExpensesList />
  
  <DebtSummary>
    TU DEUDA: {amount}
    Debes a @{creditor}
  </DebtSummary>
  
  <CTABanner>
    Registrate para interactuar
    [Crear cuenta]
  </CTABanner>
</PublicGroupView>
```

---

## 🚀 Plan de Migración (5 Fases)

### Fase 1: Base de Datos (1-2 días)
- ✅ Migración SQL para agregar `monitag` a `profiles`
- ✅ Migración SQL para agregar `slug` e `is_public` a `money_tag_groups`
- ✅ Migración SQL para agregar estados a `group_participants`
- ✅ Función SQL para generar slugs únicos
- ✅ Función SQL para buscar monitags

### Fase 2: Backend & Hooks (2-3 días)
- ✅ Hook `useCreateMonitag` - Crear @monitag
- ✅ Hook `useSearchMonitags` - Buscar usuarios por @monitag
- ✅ Hook `useAddParticipantByMonitag` - Agregar por @monitag
- ✅ Server Action `generateGroupSlug` - Generar slug único
- ✅ Server Action `getPublicGroup` - Obtener grupo público
- ✅ RLS policies para vistas públicas

### Fase 3: UI Components (3-4 días)
- ✅ Banner de creación de @monitag
- ✅ Modal de creación de @monitag
- ✅ Búsqueda de @monitag (Combobox)
- ✅ Link compartible con QR
- ✅ Vista pública del grupo `/g/[monitag]/[slug]`
- ✅ Mejorar "Agregar Participante" con 3 opciones

### Fase 4: Notificaciones (2-3 días)
- ✅ Sistema de notificaciones in-app
- ✅ Template de emails para eventos
- ✅ Hook `useNotifications`
- ✅ Badge de notificaciones en sidebar

### Fase 5: Testing & Pulido (2-3 días)
- ✅ Testing de flujos completos
- ✅ Validaciones de edge cases
- ✅ UI/UX polish
- ✅ Documentación para usuarios
- ✅ Migración de grupos existentes

**TOTAL: 10-15 días de desarrollo**

---

## 🔐 Consideraciones de Seguridad

### RLS Policies

#### Vista Pública de Grupos
```sql
-- Cualquiera puede ver grupos públicos
CREATE POLICY "Public groups are viewable by anyone"
ON money_tag_groups FOR SELECT
USING (is_public = true);

-- Solo participantes pueden ver gastos
CREATE POLICY "Group expenses viewable by participants or public"
ON group_expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE id = group_id AND is_public = true
  )
  OR
  EXISTS (
    SELECT 1 FROM group_participants 
    WHERE group_id = group_expenses.group_id 
    AND profile_id = auth.uid()
  )
);
```

#### Protección de @monitag
```sql
-- Solo el usuario puede cambiar su propio @monitag
CREATE POLICY "Users can update own monitag"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

---

## 📱 URLs & Routing

### Nuevas Rutas

```
/dashboard/moneytags
  → Lista de grupos del usuario

/dashboard/moneytags/[groupId]
  → Vista privada del grupo (para miembros)

/g/@[monitag]/[slug]
  → Vista pública del grupo (para todos)

/dashboard/settings/monitag
  → Configuración de @monitag
```

### Redirecciones

```
/g/@juanpy/asado-amigos
  ↓
Usuario logueado → /dashboard/moneytags/[groupId]
Usuario no logueado → Permanece en vista pública
```

---

## 🎯 Decisiones Pendientes

### 1. Usuarios No Registrados - Interacción Limitada

**Pregunta:** ¿Pueden marcar deudas como pagas desde la vista pública?

**Opción A: Solo Lectura (Recomendado)**
- ✅ Más simple de implementar
- ✅ Incentiva el registro
- ❌ Menos flexible

**Opción B: Validación por WhatsApp**
- Usuario no registrado puede "Marcar como pago"
- Sistema envía código de verificación por WhatsApp
- Valida código y registra el pago
- ✅ Más flexible
- ❌ Más complejo (requiere WhatsApp Bot)

**MI RECOMENDACIÓN: Opción A** 
- Más simple y fuerza el registro
- Si el usuario quiere interactuar, debe registrarse (es justo)

### 2. @monitag Inmutable o Editable

**Pregunta:** ¿Se puede cambiar el @monitag después de crearlo?

**Opción A: Inmutable (Recomendado)**
- Una vez creado, no se puede cambiar
- Evita confusión y broken links
- Como Twitter/Instagram

**Opción B: Editable 1 vez**
- Permite 1 cambio después de creación
- Por si el usuario se arrepiente
- Requiere migración de URLs

**MI RECOMENDACIÓN: Opción A**
- Más simple y consistente
- Validación inicial debe ser fuerte

---

## 🎨 Mockups de UI

### Vista Pública del Grupo
```
┌────────────────────────────────────────┐
│  [LOGO MONI]               [Registrarse]│
├────────────────────────────────────────┤
│                                        │
│  🏷️ Asado con Amigos                   │
│  Creado por @juanpy                    │
│  5 participantes · 3 gastos            │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 👥 PARTICIPANTES                 │ │
│  │                                  │ │
│  │ • @juanpy (creador)              │ │
│  │ • @mariapaz                      │ │
│  │ • Carlos Gómez                   │ │
│  │ • Ana López                      │ │
│  │ • Pedro Ramírez (TÚ)             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💰 GASTOS                        │ │
│  │                                  │ │
│  │ ✓ Carne asada                    │ │
│  │   150.000 Gs · Pagó @juanpy      │ │
│  │                                  │ │
│  │ ✓ Bebidas y hielo                │ │
│  │   80.000 Gs · Pagó @mariapaz     │ │
│  │                                  │ │
│  │ ✓ Carbón                         │ │
│  │   20.000 Gs · Pagó @juanpy       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📊 TU RESUMEN                    │ │
│  │                                  │ │
│  │ Debes:                           │ │
│  │ • 50.000 Gs a @juanpy            │ │
│  │ • 16.000 Gs a @mariapaz          │ │
│  │                                  │ │
│  │ TOTAL A PAGAR: 66.000 Gs         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ⚠️ REGISTRATE PARA:              │ │
│  │                                  │ │
│  │ ✓ Recibir notificaciones         │ │
│  │ ✓ Agregar gastos                 │ │
│  │ ✓ Marcar deudas como pagas       │ │
│  │ ✓ Crear tus propios grupos       │ │
│  │                                  │ │
│  │    [Crear cuenta en Moni]        │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Migración: Agregar `monitag` a `profiles`
- [ ] Migración: Agregar `slug` a `money_tag_groups`
- [ ] Migración: Agregar `is_public` a `money_tag_groups`
- [ ] Migración: Agregar estados a `group_participants`
- [ ] Función: `generate_group_slug(name TEXT, owner_id UUID)`
- [ ] Función: `search_monitags(query TEXT)`
- [ ] RLS: Policies para vistas públicas

### Backend
- [ ] Hook: `useCreateMonitag`
- [ ] Hook: `useSearchMonitags`
- [ ] Hook: `useAddParticipantByMonitag`
- [ ] Server Action: `generateGroupSlug`
- [ ] Server Action: `getPublicGroup`
- [ ] Server Action: `getPublicGroupExpenses`
- [ ] Server Action: `getPublicGroupDebts`

### Frontend - Dashboard
- [ ] Banner: Crear @monitag
- [ ] Modal: Crear @monitag con validación
- [ ] Mejorar: Crear Grupo (genera slug automático)
- [ ] Mejorar: Agregar Participante (3 opciones)
- [ ] Componente: Link compartible con QR
- [ ] Componente: Badge de @monitag en sidebar

### Frontend - Público
- [ ] Ruta: `/g/@[monitag]/[slug]`
- [ ] Página: Vista pública del grupo
- [ ] Componente: Header del grupo público
- [ ] Componente: Lista de participantes
- [ ] Componente: Lista de gastos
- [ ] Componente: Resumen de deuda del visitante
- [ ] CTA: Banner de registro

### Notificaciones
- [ ] Sistema: Crear tabla `notifications`
- [ ] Hook: `useNotifications`
- [ ] Componente: Badge de notificaciones
- [ ] Componente: Dropdown de notificaciones
- [ ] Templates: Emails para eventos

### Testing
- [ ] Test: Crear @monitag
- [ ] Test: Búsqueda de @monitag
- [ ] Test: Crear grupo con slug
- [ ] Test: Agregar participante por @monitag
- [ ] Test: Vista pública del grupo
- [ ] Test: Redirecciones según estado de login

---

## 🎉 Resultado Final

Un sistema moderno de gastos compartidos donde:
1. ✅ Usuarios tienen identidad social con @monitag
2. ✅ URLs amigables y compartibles
3. ✅ Experiencia diferenciada para registrados y no registrados
4. ✅ Incentivo claro para registrarse
5. ✅ Sistema escalable y mantenible

¿Empezamos por la Fase 1?
