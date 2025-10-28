# 🤖 WhatsApp Bot MVP - Arquitectura Completa

## 📋 Visión General

Bot de WhatsApp para registrar gastos e ingresos de forma conversacional usando WhatsApp Business API de Meta.

**Feature Killer:** Los usuarios paraguayos pueden gestionar sus finanzas sin abrir la app, directamente desde WhatsApp.

---

## 🎯 Alcance del MVP

### ✅ Funcionalidades Incluidas

1. **Vinculación de Usuario**
   - Link seguro desde dashboard
   - Token de verificación temporal
   - Desvinculación desde settings

2. **Comandos de Registro**
   - ✅ "Gasté X en Y" → Crea gasto
   - ✅ "Cobré X" → Crea ingreso
   - ✅ "¿Cuánto tengo?" → Muestra balance
   - ✅ "Resumen de hoy" → Estadísticas diarias

3. **Detección Inteligente**
   - Parser con regex para español paraguayo
   - Auto-detección de categorías
   - Soporte para múltiples formatos de números

### ❌ Fuera del Alcance (Post-MVP)

- 📸 OCR de tickets
- 🧠 NLP con OpenAI
- 🏷️ MoneyTags desde WhatsApp
- 📊 Reportes avanzados
- 🔔 Notificaciones proactivas

---

## 🗂️ Estructura de Carpetas

```
src/
├── app/
│   ├── api/
│   │   └── whatsapp/
│   │       └── webhook/
│   │           └── route.ts               # Meta webhook (GET verification + POST messages)
│   └── dashboard/
│       └── settings/
│           └── whatsapp/
│               ├── page.tsx               # Página de configuración
│               └── components/
│                   ├── connection-card.tsx
│                   └── link-instructions.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── whatsapp-connections.ts       # CRUD de conexiones WhatsApp
│   │   └── whatsapp-logs.ts              # Logging de mensajes
│   └── whatsapp/
│       ├── types.ts                      # Tipos e interfaces compartidas
│       ├── client.ts                     # Cliente Meta Graph API
│       ├── message-parser.ts             # NLP básico con regex
│       ├── category-detector.ts          # Mapeo keywords → categorías
│       ├── webhook-validator.ts          # Validación de firma Meta
│       ├── auth/
│       │   └── linking.ts                # Vinculación usuario ↔ WhatsApp
│       └── handlers/
│           ├── expense.ts                # Registrar gasto
│           ├── income.ts                 # Registrar ingreso
│           ├── balance.ts                # Consultar balance
│           ├── summary.ts                # Resumen diario/mensual
│           └── help.ts                   # Mensaje de ayuda
│
└── migrations/
    └── 20251028XXXXXX_create_whatsapp_tables.sql
```

---

## 🗄️ Base de Datos

### Nueva Tabla: `whatsapp_connections`

```sql
CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  
  -- Estado de vinculación
  is_active BOOLEAN DEFAULT true,
  
  -- Token temporal para vinculación (expira en 15 min)
  verification_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Auditoría
  linked_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_whatsapp_phone ON whatsapp_connections(phone_number);
CREATE INDEX idx_whatsapp_profile ON whatsapp_connections(profile_id);
CREATE INDEX idx_whatsapp_active ON whatsapp_connections(is_active);

-- RLS Policies
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON whatsapp_connections FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can manage own connections"
  ON whatsapp_connections FOR ALL
  USING (profile_id = auth.uid());
```

**Decisiones de Diseño:**
- ✅ `phone_number UNIQUE` → Un número solo puede estar vinculado a una cuenta
- ✅ `verification_token` → Expira en 15 min para seguridad
- ✅ `last_message_at` → Para detectar usuarios inactivos
- ✅ RLS activado → Solo el usuario ve su propia conexión

---

### Nueva Tabla: `whatsapp_message_logs`

```sql
CREATE TABLE whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  
  -- Dirección del mensaje
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- Contenido
  message_text TEXT NOT NULL,
  
  -- Intención detectada (para inbound)
  intent TEXT,
  
  -- Metadata adicional (JSON flexible)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsquedas por conexión
CREATE INDEX idx_message_logs_connection ON whatsapp_message_logs(connection_id);
CREATE INDEX idx_message_logs_created ON whatsapp_message_logs(created_at DESC);

-- RLS
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message logs"
  ON whatsapp_message_logs FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM whatsapp_connections WHERE profile_id = auth.uid()
    )
  );
```

**Uso:**
- 📊 Auditoría de conversaciones
- 🐛 Debugging de parsers
- 📈 Analytics de uso del bot
- 🔍 Ver historial en dashboard (futuro)

---

## 🔌 Integración con Meta

### Variables de Entorno

```bash
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=123456789012345    # ID del número de teléfono en Meta
WHATSAPP_ACCESS_TOKEN=EAAxx...              # Token permanente de Meta
WHATSAPP_APP_SECRET=abcdef123456            # Secret para validar webhooks
WHATSAPP_VERIFY_TOKEN=moni_webhook_2024     # Token para verificación inicial
WHATSAPP_BOT_NUMBER=595991234567            # Número del bot (para links wa.me)
```

### Setup en Meta Developer

1. **Crear App de Meta**
   - https://developers.facebook.com/apps
   - Tipo: Business
   - Agregar producto: WhatsApp

2. **Configurar Número**
   - Verificar número de teléfono
   - Obtener PHONE_NUMBER_ID
   - Generar ACCESS_TOKEN (permanente)

3. **Configurar Webhook**
   - URL: `https://tu-dominio.com/api/whatsapp/webhook`
   - Verify Token: `moni_webhook_2024`
   - Suscribirse a: `messages`

---

## 💬 Flujo de Mensajes

### 1️⃣ Vinculación de Usuario

```
Usuario en Dashboard
  ↓
Click "Conectar WhatsApp"
  ↓
Backend genera token JWT (expira 15 min)
  ↓
Dashboard muestra: "Envía este mensaje"
  ↓
Usuario click link wa.me/?text=Vincular ABC123XYZ
  ↓
WhatsApp abre con mensaje pre-llenado
  ↓
Usuario envía mensaje
  ↓
Webhook recibe mensaje
  ↓
Backend valida token + vincula phone ↔ profile_id
  ↓
Bot responde: "✅ Cuenta vinculada exitosamente"
```

### 2️⃣ Registrar Gasto

```
Usuario: "Gasté 50.000 en almuerzo"
  ↓
Meta envía webhook a /api/whatsapp/webhook
  ↓
Backend valida firma HMAC-SHA256
  ↓
Busca connection por phone_number
  ↓
Si no está vinculado → "Por favor vincula tu cuenta"
  ↓
Si está vinculado → parseMessage()
  ↓
Intent: add_expense, amount: 50000, description: "almuerzo"
  ↓
detectCategory("almuerzo") → "Comida y Bebidas"
  ↓
Obtener cuenta default del usuario
  ↓
Crear transaction en Supabase
  ↓
Responder: "✅ Gasto registrado\n💸 Gs. 50.000\n📝 almuerzo"
```

---

## 🧠 Message Parser (NLP Básico)

### Patterns Soportados

```typescript
// GASTOS
"Gasté 50.000 en almuerzo"
"Pagué 150k supermercado"
"Compré 25 mil en farmacia"
"50000 taxi"

// INGRESOS
"Cobré 500.000 de sueldo"
"Recibí 100k freelance"
"Ingresó 200k"

// CONSULTAS
"¿Cuánto tengo?"
"Balance"
"Saldo"
"Resumen de hoy"
"¿Cuánto gasté hoy?"

// AYUDA
"Ayuda"
"Comandos"
"Help"
"¿Qué puedes hacer?"
```

### Lógica de Parseo

```typescript
export function parseMessage(text: string): ParsedMessage {
  const lower = text.toLowerCase().trim();
  
  // 1. Detectar intención
  if (/gast[eé]|pagu[eé]|compr[eé]/.test(lower)) {
    return parseExpense(text);
  }
  
  if (/cobr[eé]|recib[íi]|ingres[oó]/.test(lower)) {
    return parseIncome(text);
  }
  
  if (/cu[aá]nto\s+(tengo|tenés)|balance|saldo/.test(lower)) {
    return { intent: 'get_balance' };
  }
  
  if (/resumen|gastos?\s+(de\s+)?hoy/.test(lower)) {
    return { intent: 'get_summary' };
  }
  
  // Default: ayuda
  return { intent: 'help' };
}

function parseAmount(text: string): number {
  // Casos: "50.000", "150k", "25 mil", "300000"
  const match = text.match(/(\d+[\.,]?\d*)\s*(mil|k|gs)?/i);
  if (!match) return 0;
  
  let num = parseFloat(match[1].replace(/[.,]/g, ''));
  
  if (/k$/i.test(match[0])) num *= 1000;
  if (/mil/i.test(match[0])) num *= 1000;
  
  return num;
}
```

---

## 🏷️ Detección Automática de Categorías

```typescript
const CATEGORY_KEYWORDS = {
  'Comida y Bebidas': [
    'almuerzo', 'cena', 'desayuno', 'restaurante', 
    'supermercado', 'super', 'comida', 'bebida'
  ],
  'Transporte': [
    'taxi', 'uber', 'bolt', 'gasolina', 'combustible',
    'estacionamiento', 'peaje', 'bus', 'colectivo'
  ],
  'Salud': [
    'farmacia', 'médico', 'doctor', 'medicina', 
    'consulta', 'hospital', 'clínica'
  ],
  'Compras': [
    'ropa', 'shopping', 'mall', 'zapatillas', 'zapatos'
  ],
  'Servicios': [
    'electricidad', 'agua', 'internet', 'celular', 'cable'
  ]
};

export async function detectCategory(
  description: string,
  profileId: string
): Promise<string | null> {
  const lower = description.toLowerCase();
  
  // Buscar keywords
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      // Buscar categoría en DB del usuario
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('profile_id', profileId)
        .eq('name', categoryName)
        .eq('type', 'expense')
        .single();
      
      if (data) return data.id;
    }
  }
  
  // Fallback: categoría "Otros Gastos"
  const { data: otherCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('profile_id', profileId)
    .eq('name', 'Otros Gastos')
    .single();
  
  return otherCategory?.id || null;
}
```

---

## 🔒 Seguridad

### 1. Validación de Webhooks (HMAC-SHA256)

```typescript
import crypto from 'crypto';

export function validateWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

### 2. Rate Limiting

```typescript
// Máximo 10 mensajes por minuto por usuario
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 minuto

export async function checkRateLimit(
  connectionId: string
): Promise<boolean> {
  const { count } = await supabase
    .from('whatsapp_message_logs')
    .select('*', { count: 'exact', head: true })
    .eq('connection_id', connectionId)
    .eq('direction', 'inbound')
    .gte('created_at', new Date(Date.now() - RATE_WINDOW).toISOString());
  
  return (count || 0) < RATE_LIMIT;
}
```

### 3. Token Expiración

```typescript
// Tokens de vinculación expiran en 15 minutos
export function generateLinkToken(profileId: string): string {
  const payload = {
    profileId,
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 min
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}
```

---

## 📊 Formato de Respuestas

### Gasto Registrado

```
✅ *Gasto registrado*

💸 Monto: Gs. 50.000
📝 Descripción: almuerzo
🏷️ Categoría: Comida y Bebidas
📅 Fecha: 28/10/2025

Tu balance actual: Gs. 1.250.000

¿Deseas agregar otro gasto?
```

### Balance

```
💰 *Tu Balance Actual*

🏦 *Cuentas Activas*
• Billetera Personal: Gs. 850.000
• Tarjeta Itaú: Gs. 400.000

📊 *Total: Gs. 1.250.000*

Última actualización: Hace 2 minutos
```

### Resumen Diario

```
📊 *Resumen de Hoy* (28/10/2025)

💸 Gastos: Gs. 125.000 (3 transacciones)
💰 Ingresos: Gs. 0

🏷️ *Top Gastos:*
1. Comida y Bebidas: Gs. 75.000
2. Transporte: Gs. 30.000
3. Otros: Gs. 20.000

🎯 Promedio diario del mes: Gs. 98.500
```

---

## 🚀 Deployment Checklist

### Pre-producción

- [ ] Crear app en Meta Developer
- [ ] Verificar número de teléfono
- [ ] Configurar variables de entorno
- [ ] Ejecutar migración de WhatsApp tables
- [ ] Testear webhook en ngrok localmente

### Producción

- [ ] Deploy a Vercel/Railway
- [ ] Configurar webhook en Meta → URL producción
- [ ] Testear vinculación con usuario real
- [ ] Testear todos los comandos
- [ ] Monitorear logs de `whatsapp_message_logs`

---

## 💰 Costos Estimados

### WhatsApp Business API

```
Gratis: Primeras 1,000 conversaciones/mes

Después (Paraguay):
- Usuario inicia: ~$0.003 USD por mensaje
- Empresa inicia: ~$0.008 USD por mensaje

Ejemplo con 500 usuarios activos (10 msg/mes cada uno):
500 * 10 = 5,000 mensajes
5,000 * $0.003 = $15 USD/mes
```

### Infraestructura

- Hosting: Gratis (Vercel)
- Supabase: Gratis (plan Free hasta 500MB DB)
- Total: **~$15-30 USD/mes** para 500 usuarios activos

---

## 🧪 Testing Manual

### Caso 1: Vinculación

1. Usuario crea cuenta en MONI
2. Va a Settings → WhatsApp
3. Click "Vincular WhatsApp"
4. Envía mensaje con token
5. Verificar: `whatsapp_connections` tiene registro
6. Bot responde confirmación

### Caso 2: Registrar Gasto

1. Usuario vinculado envía: "Gasté 50.000 en almuerzo"
2. Verificar: `transactions` tiene nueva fila
3. Verificar: `whatsapp_message_logs` registra inbound + outbound
4. Verificar: `accounts.current_balance` se actualizó
5. Bot responde con confirmación formateada

### Caso 3: Consultar Balance

1. Usuario envía: "¿Cuánto tengo?"
2. Bot responde con balance de todas las cuentas
3. Verificar formato correcto (Gs. separador de miles)

---

## 🔮 Roadmap Post-MVP

### Fase 2 (1-2 meses)

- 📸 OCR de tickets con Google Vision
- 🏷️ MoneyTags desde WhatsApp
- 📊 Gráficos inline (Chart images)
- 🔔 Recordatorios diarios de registro

### Fase 3 (3-6 meses)

- 🧠 NLP avanzado con OpenAI
- 🗣️ Notas de voz → Transacciones
- 📍 Detección de ubicación → Merchant
- 💬 Conversaciones contextuales

---

## 📚 Referencias

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Message Templates](https://developers.facebook.com/docs/whatsapp/pricing)
- [Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)

---

**Versión:** 1.0.0  
**Fecha:** 2025-10-28  
**Autor:** MONI Team
