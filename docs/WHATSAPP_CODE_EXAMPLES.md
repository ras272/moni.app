# 🧑‍💻 WhatsApp Bot - Ejemplos de Código Completos

## 📋 Índice

1. [Tipos Base (types.ts)](#tipos-base)
2. [Cliente WhatsApp (client.ts)](#cliente-whatsapp)
3. [Parser de Mensajes (message-parser.ts)](#parser-de-mensajes)
4. [Detector de Categorías (category-detector.ts)](#detector-de-categorías)
5. [Sistema de Vinculación (auth/linking.ts)](#sistema-de-vinculación)
6. [Handler: Expense (handlers/expense.ts)](#handler-expense)
7. [Handler: Balance (handlers/balance.ts)](#handler-balance)
8. [Webhook API Route (api/whatsapp/webhook/route.ts)](#webhook-api-route)
9. [Validador de Webhooks (webhook-validator.ts)](#validador-de-webhooks)
10. [Página de Settings (dashboard/settings/whatsapp/page.tsx)](#página-de-settings)

---

## Tipos Base

**Archivo:** `src/lib/whatsapp/types.ts`

```typescript
// =====================================================
// INTENCIONES SOPORTADAS
// =====================================================

export type Intent =
  | 'add_expense'
  | 'add_income'
  | 'get_balance'
  | 'get_summary'
  | 'link_account'
  | 'help'
  | 'unknown';

// =====================================================
// MENSAJE PARSEADO
// =====================================================

export interface ParsedMessage {
  intent: Intent;
  amount?: number;
  currency?: 'PYG' | 'USD';
  description?: string;
  category?: string;
  linkToken?: string;
  rawText: string;
}

// =====================================================
// CONTEXTO DEL MENSAJE
// =====================================================

export interface MessageContext {
  from: string; // Número de WhatsApp
  messageId: string; // ID del mensaje de WhatsApp
  timestamp: number;
  profileId?: string; // UUID del usuario vinculado (si existe)
}

// =====================================================
// RESPUESTA DE HANDLERS
// =====================================================

export interface HandlerResponse {
  success: boolean;
  message: string; // Texto a enviar al usuario
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  metadata?: Record<string, any>;
}

// =====================================================
// WEBHOOK DE META
// =====================================================

export interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// =====================================================
// CONEXIÓN WHATSAPP (DB)
// =====================================================

export interface WhatsAppConnection {
  id: string;
  profile_id: string;
  phone_number: string;
  is_active: boolean;
  verification_token: string | null;
  token_expires_at: string | null;
  linked_at: string;
  last_message_at: string | null;
}

// =====================================================
// LOG DE MENSAJES (DB)
// =====================================================

export interface WhatsAppMessageLog {
  id: string;
  connection_id: string;
  direction: 'inbound' | 'outbound';
  message_text: string;
  intent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}
```

---

## Cliente WhatsApp

**Archivo:** `src/lib/whatsapp/client.ts`

```typescript
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

// =====================================================
// ENVIAR MENSAJE SIMPLE
// =====================================================

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      return {
        success: false,
        error: error.error?.message || 'Unknown error'
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id
    };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// ENVIAR MENSAJE CON BOTONES INTERACTIVOS
// =====================================================

export async function sendWhatsAppButtons(
  to: string,
  text: string,
  buttons: Array<{ id: string; title: string }>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text },
          action: {
            buttons: buttons.slice(0, 3).map((btn) => ({
              // WhatsApp permite máximo 3 botones
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title.slice(0, 20) // Max 20 caracteres
              }
            }))
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || 'Unknown error'
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// UTILIDADES DE FORMATO
// =====================================================

export function formatCurrency(amount: number, currency: string = 'PYG'): string {
  if (currency === 'PYG') {
    return `Gs. ${amount.toLocaleString('es-PY')}`;
  }
  return `$${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}
```

---

## Parser de Mensajes

**Archivo:** `src/lib/whatsapp/message-parser.ts`

```typescript
import type { ParsedMessage } from './types';

// =====================================================
// PARSER PRINCIPAL
// =====================================================

export function parseMessage(text: string): ParsedMessage {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Vinculación de cuenta
  if (/^vincular\s+/i.test(trimmed)) {
    const token = trimmed.split(/\s+/)[1];
    return {
      intent: 'link_account',
      linkToken: token,
      rawText: trimmed
    };
  }

  // 2. Gastos
  if (/gast[eé]|pagu[eé]|compr[eé]/.test(lower)) {
    return parseExpense(trimmed);
  }

  // 3. Ingresos
  if (/cobr[eé]|recib[íi]|ingres[oó]/.test(lower)) {
    return parseIncome(trimmed);
  }

  // 4. Balance
  if (/cu[aá]nto\s+(tengo|tenés)|balance|saldo/.test(lower)) {
    return {
      intent: 'get_balance',
      rawText: trimmed
    };
  }

  // 5. Resumen
  if (/resumen|gastos?\s+(de\s+)?hoy|cu[aá]nto\s+gast[eé]/.test(lower)) {
    return {
      intent: 'get_summary',
      rawText: trimmed
    };
  }

  // 6. Ayuda
  if (/ayuda|help|comandos|qu[eé]\s+puedes/.test(lower)) {
    return {
      intent: 'help',
      rawText: trimmed
    };
  }

  // Default: unknown
  return {
    intent: 'unknown',
    rawText: trimmed
  };
}

// =====================================================
// PARSER DE GASTOS
// =====================================================

function parseExpense(text: string): ParsedMessage {
  const amount = parseAmount(text);
  const currency = detectCurrency(text);
  const description = extractDescription(text);

  return {
    intent: 'add_expense',
    amount,
    currency,
    description,
    rawText: text
  };
}

// =====================================================
// PARSER DE INGRESOS
// =====================================================

function parseIncome(text: string): ParsedMessage {
  const amount = parseAmount(text);
  const currency = detectCurrency(text);
  const description = extractDescription(text);

  return {
    intent: 'add_income',
    amount,
    currency,
    description: description || 'Ingreso desde WhatsApp',
    rawText: text
  };
}

// =====================================================
// EXTRAER MONTO
// =====================================================

export function parseAmount(text: string): number {
  // Patrones soportados:
  // - "50.000" → 50000
  // - "150k" → 150000
  // - "25 mil" → 25000
  // - "300000" → 300000
  // - "1.5m" → 1500000

  const patterns = [
    /(\d+[\.,]?\d*)\s*m(?:illones?)?/i, // 1.5m, 2 millones
    /(\d+[\.,]?\d*)\s*k/i, // 150k
    /(\d+[\.,]?\d*)\s+mil/i, // 25 mil
    /(\d+[\.,]\d+)/, // 50.000
    /(\d+)/ // 300000
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let num = parseFloat(match[1].replace(/[.,]/g, ''));

      // Aplicar multiplicadores
      if (/m(?:illones?)?/i.test(match[0])) num *= 1_000_000;
      else if (/k/i.test(match[0])) num *= 1000;
      else if (/mil/i.test(match[0])) num *= 1000;

      return Math.round(num);
    }
  }

  return 0;
}

// =====================================================
// DETECTAR MONEDA
// =====================================================

function detectCurrency(text: string): 'PYG' | 'USD' {
  const lower = text.toLowerCase();

  if (/\$|usd|d[oó]lares?|dolar/.test(lower)) {
    return 'USD';
  }

  // Default: Guaraníes
  return 'PYG';
}

// =====================================================
// EXTRAER DESCRIPCIÓN
// =====================================================

function extractDescription(text: string): string {
  // Buscar después de "en", "para", "de"
  const patterns = [
    /\b(?:en|para|de)\s+(.+)$/i,
    /\d+[kmil]*\s+(.+)$/i // Después del número
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Si no encuentra, usar todo el texto sin el monto
  return text.replace(/\d+[\.,]?\d*\s*[kmil]*/gi, '').trim() || 'Sin descripción';
}
```

---

## Detector de Categorías

**Archivo:** `src/lib/whatsapp/category-detector.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

// =====================================================
// MAPEO DE KEYWORDS → CATEGORÍAS
// =====================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Comida y Bebidas': [
    'almuerzo',
    'cena',
    'desayuno',
    'restaurante',
    'supermercado',
    'super',
    'comida',
    'bebida',
    'café',
    'bar',
    'parrilla',
    'asado'
  ],
  'Transporte': [
    'taxi',
    'uber',
    'bolt',
    'gasolina',
    'combustible',
    'nafta',
    'estacionamiento',
    'peaje',
    'bus',
    'colectivo',
    'pasaje'
  ],
  'Salud': [
    'farmacia',
    'médico',
    'doctor',
    'medicina',
    'medicamento',
    'consulta',
    'hospital',
    'clínica',
    'laboratorio'
  ],
  'Compras': [
    'ropa',
    'shopping',
    'mall',
    'zapatillas',
    'zapatos',
    'tienda',
    'boutique'
  ],
  'Servicios': [
    'electricidad',
    'ande',
    'agua',
    'essap',
    'internet',
    'celular',
    'cable',
    'netflix',
    'spotify'
  ],
  'Entretenimiento': [
    'cine',
    'película',
    'teatro',
    'concierto',
    'fiesta',
    'bar',
    'boliche'
  ],
  'Educación': [
    'colegio',
    'universidad',
    'curso',
    'libro',
    'material',
    'matrícula'
  ]
};

// =====================================================
// DETECTAR CATEGORÍA
// =====================================================

export async function detectCategory(
  description: string,
  profileId: string
): Promise<string | null> {
  const supabase = await createClient();
  const lower = description.toLowerCase();

  // 1. Buscar por keywords
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hasKeyword = keywords.some((keyword) => lower.includes(keyword));

    if (hasKeyword) {
      // Buscar categoría del usuario con ese nombre
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('type', 'expense')
        .or(`profile_id.eq.${profileId},is_system.eq.true`)
        .limit(1)
        .single();

      if (data) return data.id;
    }
  }

  // 2. Fallback: Categoría "Otros Gastos"
  const { data: otherCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Otros Gastos')
    .eq('type', 'expense')
    .or(`profile_id.eq.${profileId},is_system.eq.true`)
    .limit(1)
    .single();

  return otherCategory?.id || null;
}

// =====================================================
// OBTENER NOMBRE DE CATEGORÍA (para respuestas)
// =====================================================

export async function getCategoryName(categoryId: string): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();

  return data?.name || 'Sin categoría';
}
```

---

## Sistema de Vinculación

**Archivo:** `src/lib/whatsapp/auth/linking.ts`

```typescript
import jwt from 'jsonwebtoken';
import { createClient } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const TOKEN_EXPIRY = 15 * 60; // 15 minutos

// =====================================================
// GENERAR TOKEN DE VINCULACIÓN
// =====================================================

export function generateLinkToken(profileId: string): string {
  const payload = {
    profileId,
    purpose: 'whatsapp_link',
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY
  };

  return jwt.sign(payload, JWT_SECRET);
}

// =====================================================
// VERIFICAR TOKEN
// =====================================================

export function verifyLinkToken(token: string): {
  valid: boolean;
  profileId?: string;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      profileId: string;
      purpose: string;
    };

    if (decoded.purpose !== 'whatsapp_link') {
      return { valid: false, error: 'Invalid token purpose' };
    }

    return { valid: true, profileId: decoded.profileId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: false, error: 'Invalid token' };
  }
}

// =====================================================
// VINCULAR TELÉFONO A PERFIL
// =====================================================

export async function linkPhoneToProfile(
  phoneNumber: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Verificar si el teléfono ya está vinculado
  const { data: existing } = await supabase
    .from('whatsapp_connections')
    .select('id, profile_id')
    .eq('phone_number', phoneNumber)
    .eq('is_active', true)
    .single();

  if (existing) {
    if (existing.profile_id === profileId) {
      return { success: true }; // Ya estaba vinculado al mismo usuario
    }
    return {
      success: false,
      error: 'Este número ya está vinculado a otra cuenta'
    };
  }

  // 2. Crear conexión
  const { error } = await supabase.from('whatsapp_connections').insert({
    profile_id: profileId,
    phone_number: phoneNumber,
    is_active: true,
    linked_at: new Date().toISOString()
  });

  if (error) {
    console.error('Error linking phone:', error);
    return {
      success: false,
      error: 'Error al vincular número. Intenta de nuevo.'
    };
  }

  return { success: true };
}

// =====================================================
// DESVINCULAR TELÉFONO
// =====================================================

export async function unlinkPhone(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('whatsapp_connections')
    .update({ is_active: false })
    .eq('profile_id', profileId);

  if (error) {
    return { success: false, error: 'Error al desvincular' };
  }

  return { success: true };
}

// =====================================================
// OBTENER CONEXIÓN POR TELÉFONO
// =====================================================

export async function getConnectionByPhone(phoneNumber: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('is_active', true)
    .single();

  return data;
}

// =====================================================
// ACTUALIZAR ÚLTIMA ACTIVIDAD
// =====================================================

export async function updateLastMessage(connectionId: string) {
  const supabase = await createClient();

  await supabase
    .from('whatsapp_connections')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', connectionId);
}
```

---

**(Continúa en siguiente mensaje debido al límite de caracteres)**
