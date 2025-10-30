# 🔐 Auditoría de Seguridad - Vista Pública MoniTags

**Fecha:** 2025-10-30
**Alcance:** Vista pública `/g/@[monitag]/[slug]` y funcionalidad de invitados

---

## ✅ Puntos Fuertes

### 1. **RLS Policies Implementadas**
- ✅ RLS habilitado en todas las tablas críticas
- ✅ Políticas específicas para acceso anónimo
- ✅ Restricción: guests solo pueden insertar con `profile_id = NULL`

### 2. **Validación de Inputs con Zod**
- ✅ Todos los server actions validan con schemas Zod
- ✅ Sanitización automática (trim, lowercase)
- ✅ Validación de UUIDs, longitud de strings, formato

### 3. **Sin SQL Injection**
- ✅ Uso de Supabase client (parametrized queries)
- ✅ Funciones SQL usan parámetros, no concatenación
- ✅ No hay SQL raw strings concatenados

### 4. **Protección CSRF**
- ✅ Server Actions de Next.js tienen CSRF protection built-in
- ✅ Tokens automáticos en cada request

---

## ⚠️ Vulnerabilidades Encontradas

### 🔴 CRÍTICO 1: Falta Rate Limiting

**Problema:**
```typescript
// addGuestParticipant() puede ser llamado infinitas veces
// Un atacante podría spam crear participantes
```

**Impacto:**
- DoS: Llenar BD con miles de participantes falsos
- Costos de BD aumentan

**Solución:**
```typescript
// Opción A: Rate limit por IP
import { Ratelimit } from "@upstash/ratelimit";

// Opción B: Rate limit en RLS con timestamp
CREATE POLICY "Limit guest creation frequency"
ON group_participants FOR INSERT
WITH CHECK (
  profile_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM group_participants
    WHERE group_id = NEW.group_id
      AND phone LIKE 'guest:%'
      AND created_at > NOW() - INTERVAL '1 minute'
  )
);
```

---

### 🟡 MEDIO 1: Exposición de IDs de Grupo en URL
✅ARREGLADO AHORA
**Problema:**
```
URL actual: /g/@greenajack/dee6f866-b675-4659-865e-998c0ae88c4f
                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                 UUID expuesto
```

**Impacto:**
- Enumeración: Un atacante puede iterar UUIDs y encontrar grupos
- UUIDs son difíciles pero no imposibles de enumerar

**Estado:** ✅ **MITIGADO**
- Los UUIDs v4 tienen ~5.3x10^36 posibilidades (prácticamente imposible de enumerar)
- Solo grupos con `is_public = true` son accesibles
- RLS protege datos privados

**Recomendación:** ACEPTAR (bajo riesgo)

---

### 🟡 MEDIO 2: Sin límite en longitud de nombres guest

**Problema:**
```typescript
// Validación actual: 2-50 caracteres
// Pero no hay límite en cantidad de participantes guest
```

**Impacto:**
- Un grupo público podría tener 1000 guests
- Performance degradada al cargar participantes

**Solución:**
```sql
-- Agregar constraint de máximo guests por grupo
ALTER TABLE money_tag_groups
ADD COLUMN max_guests INTEGER DEFAULT 50;

-- Policy que respete el límite
CREATE OR REPLACE POLICY "Limit guests per group"
ON group_participants FOR INSERT
WITH CHECK (
  profile_id IS NULL
  AND (
    SELECT COUNT(*)
    FROM group_participants
    WHERE group_id = NEW.group_id
      AND profile_id IS NULL
  ) < (
    SELECT COALESCE(max_guests, 50)
    FROM money_tag_groups
    WHERE id = NEW.group_id
  )
);
```

---

### 🟢 BAJO 1: Nombres de guests no son únicos

**Problema:**
```typescript
// Si hay 2 "Pedro" en el grupo, ambos ven la misma deuda
const visitorDebts = debts.filter(
  (debt) => debt.debtor_name.toLowerCase() === visitorName.toLowerCase()
);
```

**Impacto:**
- Confusión si hay nombres duplicados
- No es un problema de seguridad, pero mala UX

**Solución:**
```typescript
// Sugerir nombre único si ya existe
if (existingGuest) {
  suggestName = `${name} (${guestCount + 1})`;
}
```

---

### 🟢 BAJO 2: localStorage puede ser limpiado

**Problema:**
- Si el usuario limpia localStorage, pierde su identidad de guest
- Podría crear múltiples participantes con nombres diferentes

**Impacto:** Bajo (solo afecta UX del usuario)

**Solución:** Agregar cookie como backup
```typescript
// Guardar también en cookie
document.cookie = `guest_${groupId}=${guestId}; max-age=2592000`; // 30 días
```

---

## 🔒 Recomendaciones de Seguridad

### Prioridad ALTA

1. **Implementar Rate Limiting**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

   ```typescript
   // middleware.ts
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, "1 m"),
   });
   ```

2. **Límite de guests por grupo**
   - Agregar column `max_guests` (default: 50)
   - Policy que lo respete

3. **Captcha para guests** (opcional)
   - hCaptcha o Turnstile para prevenir bots
   - Solo en el modal de nombre

### Prioridad MEDIA

4. **Logging de acciones de guests**
   ```sql
   CREATE TABLE guest_activity_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     group_id UUID REFERENCES money_tag_groups(id),
     guest_id TEXT,
     action TEXT, -- 'join', 'view'
     ip_address INET,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Validación de nombres ofensivos**
   ```typescript
   const bannedWords = ['admin', 'moderator', ...];
   if (bannedWords.some(word => name.toLowerCase().includes(word))) {
     throw new Error('Nombre no permitido');
   }
   ```

### Prioridad BAJA

6. **Nombres únicos sugeridos**
7. **Cookie backup para guestId**
8. **Analytics de uso público**

---

## 📊 Checklist de Seguridad

### Autenticación & Autorización
- [x] RLS habilitado en todas las tablas
- [x] Políticas públicas solo para lectura
- [x] Guests solo pueden insertar con `profile_id = NULL`
- [x] Server Actions verifican `is_public = true`
- [ ] **Rate limiting implementado** ⚠️

### Validación de Datos
- [x] Zod schemas en todos los inputs
- [x] Validación de UUIDs
- [x] Sanitización de strings (trim, lowercase)
- [x] Límite de longitud en nombres (2-50 chars)
- [ ] **Límite de guests por grupo** ⚠️

### Inyección & XSS
- [x] Sin SQL injection (parametrized queries)
- [x] React escapa HTML automáticamente
- [x] No uso de `dangerouslySetInnerHTML`
- [x] CSP headers (Next.js default)

### Exposición de Datos
- [x] Solo datos públicos expuestos
- [x] Emails/teléfonos NO expuestos (excepto phone de guests que es un ID)
- [x] Profile IDs NO expuestos innecesariamente
- [x] Errores NO muestran stack traces

### Rate Limiting & DoS
- [ ] **Rate limiting en server actions** ⚠️
- [ ] **Límite de guests por grupo** ⚠️
- [x] Queries optimizadas (índices)
- [x] Paginación (no aplica, grupos pequeños)

---

## 🎯 Resumen Ejecutivo

### Seguridad General: **7/10** ⚠️

**Muy Bien:**
- RLS policies correctas
- Validación de inputs robusta
- Sin vulnerabilidades de inyección
- CSRF protection

**Mejorar:**
- ⚠️ Falta rate limiting (CRÍTICO)
- ⚠️ Límite de guests por grupo (MEDIO)
- Captcha para prevenir bots (OPCIONAL)

### Acción Requerida

**Para producción, DEBE implementarse:**
1. Rate limiting en `addGuestParticipant`
2. Límite de 50 guests por grupo

**Opcional pero recomendado:**
3. Logging de actividad
4. Captcha en modal de nombre

---

## 📝 Código de Ejemplo - Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const guestRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 requests per 10 min
  analytics: true,
});

// lib/actions/guest-participants.ts
export async function addGuestParticipant(...) {
  // Rate limit por IP
  const identifier = headers().get("x-forwarded-for") ?? "unknown";
  const { success } = await guestRateLimit.limit(identifier);

  if (!success) {
    return {
      success: false,
      error: "Demasiados intentos. Espera unos minutos."
    };
  }

  // ... resto del código
}
```

---

## ✅ Conclusión

La vista pública es **funcionalmente segura** pero **requiere rate limiting** antes de producción.

Las RLS policies están bien implementadas y no hay vulnerabilidades críticas de inyección o XSS.

**Estado:** ✅ Seguro para desarrollo/testing
**Estado:** ⚠️ Requiere hardening para producción
