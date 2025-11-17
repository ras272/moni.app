# 🤖 Sistema de IA para Extracción de Transacciones

Sistema híbrido inteligente que combina **reglas** (gratis, rápido) con **IA de Groq** (gratis pero con rate limits) para extraer información de transacciones desde lenguaje natural.

## 🎯 ¿Qué hace?

Permite a los usuarios registrar transacciones escribiendo naturalmente, sin comandos rígidos:

```
❌ Antes: /gasto 50000 en supermercado biggie categoria compras
✅ Ahora: gasté 50 mil en biggie
```

El sistema detecta automáticamente:
- 💰 Monto (soporta "mil", "lucas", "k")
- 📁 Categoría (Comida, Transporte, Compras, etc.)
- 🏪 Comercio/Merchant
- 📝 Tipo (gasto, ingreso, transferencia)

## 🚀 Quick Start

### 1. Obtener API Key de Groq (GRATIS)

1. Ve a https://console.groq.com/keys
2. Crea una cuenta (gratis)
3. Genera un API key
4. Agrega a tu `.env.local`:

```bash
GROQ_API_KEY=gsk_your_key_here
```

**Límites gratuitos:**
- 14,400 requests/día
- ~20 requests/minuto
- Más que suficiente para uso personal o pequeña escala

### 2. Activar el Sistema

Edita `src/lib/ai/config.ts`:

```typescript
export const AI_CONFIG = {
  ENABLED: true, // ⬅️ Cambiar a true
  // ... resto de la config
};
```

### 3. ¡Listo! Ya funciona

El sistema está integrado y listo para usar.

## 📊 Estrategia Híbrida

```
Usuario envía: "gasté 50 mil en biggie"
         ↓
    [Reglas] ⚡ Intentan extraer (gratis, <1ms)
         ↓
    ¿Confianza >= 70%?
    ├─ SÍ → ✅ Usar resultado de reglas
    └─ NO → Usar IA (Groq) 🤖
              ↓
         ¿IA funcionó?
         ├─ SÍ → ✅ Usar resultado de IA
         └─ NO → Usar mejor intento de reglas
```

**Resultado:** ~80% de mensajes se resuelven con reglas (gratis), solo 20% usa IA.

## 🔧 Configuración

Ver `src/lib/ai/config.ts` para opciones avanzadas:

```typescript
export const AI_CONFIG = {
  // Master switch
  ENABLED: false, // true para activar

  // Estrategia
  USE_RULES_FIRST: true, // Siempre intentar reglas primero
  USE_AI_FALLBACK: true, // Usar IA si reglas fallan

  // Límites auto-impuestos (por seguridad)
  MAX_DAILY_AI_REQUESTS: 1000,
  MAX_AI_REQUESTS_PER_MINUTE: 20,

  // Confianza mínima para reglas
  MIN_CONFIDENCE_RULES: 0.7, // 70%

  // Logging (para debugging)
  LOG_EXTRACTIONS: true,
  LOG_AI_USAGE: true,
};
```

## 📝 Uso desde Código

### Extracción básica

```typescript
import { extractTransaction } from '@/lib/ai';

const result = await extractTransaction("gasté 50 mil en biggie");

if (result.success && result.data) {
  const tx = result.data;
  console.log({
    amount: tx.amount,        // 50000
    type: tx.type,            // 'expense'
    category: tx.category,    // 'Compras'
    merchant: tx.merchant,    // 'biggie'
    confidence: tx.confidence,// 0.9
    method: tx.method         // 'rules' o 'ai'
  });
}
```

### Integración con WhatsApp

```typescript
import { handleAITransaction, looksLikeTransaction } from '@/lib/whatsapp/handlers/ai-transaction';

// Detectar si es una transacción natural
if (looksLikeTransaction(userMessage)) {
  const response = await handleAITransaction(profileId, userMessage);
  // Responder al usuario
}
```

### Formatear para mostrar

```typescript
import { formatExtractedTransaction, generateConfirmationMessage } from '@/lib/ai';

const tx = result.data;

// Formato simple
console.log(formatExtractedTransaction(tx));
// 💸 Egreso: ₲50.000
// 🏪 Comercio: biggie
// 📁 Categoría: Compras
// ⚡ Detectado con: Reglas
// ✅ Confianza: 90%

// Con confirmación
console.log(generateConfirmationMessage(tx));
// ✨ Detecté una transacción:
// ...
// ¿Es correcto?
// ✅ Responde "confirmar" para registrar
```

## 🧪 Testing

### Casos de prueba

```typescript
// Test 1: Monto con "mil"
await extractTransaction("gasté 50 mil en biggie");
// ✅ amount: 50000, merchant: "biggie"

// Test 2: Monto con "lucas"
await extractTransaction("pagué 120 lucas de nafta");
// ✅ amount: 120000, category: "Transporte"

// Test 3: Monto raw
await extractTransaction("compré en el super 75000");
// ✅ amount: 75000, category: "Compras"

// Test 4: Sin monto
await extractTransaction("gasté en biggie");
// ❌ amount: null, confidence: 0.4

// Test 5: Ingreso
await extractTransaction("cobré mi sueldo");
// ✅ type: "income"
```

### Script de prueba

Crea `test-ai.ts`:

```typescript
import { extractTransaction, getAIStats } from '@/lib/ai';

async function test() {
  const messages = [
    "gasté 50 mil en biggie",
    "pagué 120 de nafta",
    "compré en el super 75k",
    "cobré mi sueldo",
  ];

  for (const msg of messages) {
    const result = await extractTransaction(msg);
    console.log(`\nMensaje: "${msg}"`);
    console.log('Resultado:', result.data);
  }

  console.log('\nEstadísticas:', getAIStats());
}

test();
```

## 📈 Monitoreo

Obtener estadísticas de uso:

```typescript
import { getAIStats } from '@/lib/ai';

const stats = getAIStats();
console.log({
  dailyRequests: stats.dailyRequests,        // Requests hechos hoy
  dailyLimit: stats.dailyLimit,              // Límite diario
  percentageUsed: stats.percentageUsed,      // % usado
  canMakeRequest: stats.canMakeRequest       // ¿Puede hacer más?
});
```

## 🐛 Debugging

### Ver logs detallados

```typescript
// En config.ts
export const AI_CONFIG = {
  LOG_EXTRACTIONS: true,  // Ver cada extracción
  LOG_AI_USAGE: true,     // Ver cuándo se usa IA vs reglas
};
```

Verás logs como:
```
🔍 [Rules] Extracting from: gasté 50 mil en biggie
✅ [Rules] Extracted: { amount: 50000, confidence: 0.9 }
✅ [Hybrid] Using rules result (high confidence): 0.9
```

O si usa IA:
```
🔍 [Rules] Extracting from: mensaje complejo...
🔄 [Hybrid] Rules confidence low (0.5), trying AI...
🤖 [Groq] Extracting from: mensaje complejo...
✅ [Groq] Extracted: { amount: ..., confidence: 0.85 }
📊 AI requests today: 15/1000
```

## 🔒 Seguridad

- ✅ Rate limiting automático
- ✅ Validación de respuestas de IA
- ✅ Fallback a reglas si IA falla
- ✅ Sin API key = funciona solo con reglas
- ✅ Puede desactivarse completamente

## 🎨 Personalización

### Agregar comercios conocidos

Edita `src/lib/ai/rules-extractor.ts`:

```typescript
const MERCHANT_TO_CATEGORY: Record<string, TransactionCategory> = {
  // Agrega tu comercio local favorito
  'paseo la galeria': 'Entretenimiento',
  'multiplaza': 'Compras',
  // ...
};
```

### Agregar keywords

```typescript
const CATEGORY_KEYWORDS: Record<string, TransactionCategory> = {
  'terere|tereré|mate': 'Comida',
  // ...
};
```

## ❓ FAQ

**Q: ¿Funciona sin Groq API key?**
A: Sí, usa solo reglas (80% efectivo para casos comunes).

**Q: ¿Cuánto cuesta?**
A: $0. Groq es gratis (14,400 req/día).

**Q: ¿Qué pasa si se acaban los requests?**
A: Automáticamente usa solo reglas ese día.

**Q: ¿Puedo forzar uso de IA?**
A: Sí:
```typescript
await extractTransaction(message, { forceAI: true });
```

**Q: ¿Cómo desactivar completamente?**
A: `AI_CONFIG.ENABLED = false` en config.ts

## 📚 Arquitectura

```
src/lib/ai/
├── config.ts                    # Configuración y feature flags
├── types.ts                     # Tipos TypeScript
├── rules-extractor.ts           # Sistema de reglas (sin IA)
├── groq-client.ts               # Cliente de Groq
├── transaction-extractor.ts     # Extractor híbrido (punto de entrada)
├── index.ts                     # Exports principales
└── README.md                    # Esta documentación

src/lib/whatsapp/handlers/
└── ai-transaction.ts            # Handler de WhatsApp con IA
```

## 🚀 Roadmap

- [ ] Sistema de estados para confirmaciones
- [ ] Cache de resultados frecuentes
- [ ] Aprendizaje de patrones del usuario
- [ ] OCR para tickets (Llama 4 Vision)
- [ ] Comandos de voz (speech-to-text)
- [ ] Análisis predictivo
- [ ] Alertas proactivas

## 📞 Soporte

Issues o preguntas? Crea un issue en GitHub.

## 📄 Licencia

Mismo que el proyecto principal.
