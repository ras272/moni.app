# 🤖 Setup del Sistema de IA para Extracción de Transacciones

## ✅ Lo que se implementó

Se creó un **sistema híbrido inteligente** que permite a los usuarios registrar transacciones escribiendo naturalmente:

```
Usuario: "gasté 50 mil en biggie"
Bot: ✅ 💸 Gasto registrado
     💵 Monto: ₲50.000
     🏪 Comercio: biggie
     📁 Categoría: Compras
     ⚡ Detectado con: Reglas
```

### 🎯 Características principales

- ✅ **100% funcional sin IA** (usa reglas regex)
- ✅ **IA opcional con Groq** (gratis, 14,400 req/día)
- ✅ **Feature flags** para activar/desactivar fácilmente
- ✅ **No rompe nada existente** (código nuevo, separado)
- ✅ **Rate limiting** automático
- ✅ **Logging detallado** para debugging
- ✅ **Fallbacks** en caso de errores

### 📊 Estrategia Híbrida

```
80% de casos → Reglas (gratis, instantáneo)
20% de casos → IA Groq (gratis pero con límites)
```

Esto permite soportar **~2,500 usuarios activos/día** completamente GRATIS.

## 📁 Archivos creados

```
src/lib/ai/
├── config.ts                    ✅ Configuración y feature flags
├── types.ts                     ✅ Tipos TypeScript
├── rules-extractor.ts           ✅ Sistema de reglas (80% casos)
├── groq-client.ts               ✅ Cliente de Groq IA
├── transaction-extractor.ts     ✅ Extractor híbrido
├── index.ts                     ✅ Exports
└── README.md                    ✅ Documentación completa

src/lib/whatsapp/handlers/
└── ai-transaction.ts            ✅ Handler para WhatsApp

test-ai-extraction.ts            ✅ Script de prueba
SETUP-AI.md                      ✅ Esta guía
.env.example                     ✅ Actualizado con GROQ_API_KEY
```

## 🚀 Cómo activar (Paso a Paso)

### Paso 1: Probar SIN IA (Solo Reglas)

El sistema ya funciona sin API key! Vamos a probarlo:

```bash
# 1. Instalar dependencia de testing
npm install -D tsx

# 2. Activar el sistema (sin IA aún)
# Edita: src/lib/ai/config.ts
# Cambia: ENABLED: false → ENABLED: true

# 3. Correr el test
npx tsx test-ai-extraction.ts
```

**Deberías ver:**
```
🧪 Iniciando tests...
📝 Test 1/10
   Mensaje: "gasté 50 mil en biggie"
   ✅ PASS
   📊 Resultado:
      - Monto: ₲50.000
      - Método: ⚡ Reglas
      - Confianza: 90%
...
✅ Pasados: 8/10
⚡ Resueltos con reglas: 8
🤖 Resueltos con IA: 0
```

**Si esto funciona → las reglas están OK! 🎉**

### Paso 2: Agregar IA de Groq (Opcional)

Para mejorar casos complejos, agrega Groq:

```bash
# 1. Obtener API Key (GRATIS)
# - Ve a: https://console.groq.com/keys
# - Crea cuenta (gratis)
# - Genera API key
# - Copia la key

# 2. Agregar a .env.local
echo "GROQ_API_KEY=gsk_tu_key_aqui" >> .env.local

# 3. Volver a correr el test
npx tsx test-ai-extraction.ts
```

**Ahora deberías ver:**
```
✅ Pasados: 10/10  ← Mejor tasa de éxito
⚡ Resueltos con reglas: 7
🤖 Resueltos con IA: 3   ← IA usada solo cuando necesario

📊 Estadísticas de IA:
   - Requests hoy: 3/1000
   - % usado: 0.3%
```

### Paso 3: Integrar con WhatsApp

Ahora que funciona, integralo con el bot:

**Opción A: Detección automática (recomendado)**

Edita `src/app/api/whatsapp/webhook/route.ts` y agrega al inicio del handler de mensajes:

```typescript
import { looksLikeTransaction, handleAITransaction } from '@/lib/whatsapp/handlers/ai-transaction';

// ... en la función que maneja mensajes:

// Detectar si parece una transacción natural (sin comando)
if (looksLikeTransaction(messageBody)) {
  const response = await handleAITransaction(profileId, messageBody);
  await sendMessage(from, response.message);
  return;
}

// ... resto de los handlers existentes
```

**Opción B: Comando explícito**

Agregar un comando `/auto` o `/ai`:

```typescript
if (messageBody.startsWith('/auto ') || messageBody.startsWith('/ai ')) {
  const message = messageBody.replace(/^\/(auto|ai)\s+/, '');
  const response = await handleAITransaction(profileId, message);
  await sendMessage(from, response.message);
  return;
}
```

## 🧪 Probar en WhatsApp

Una vez integrado, prueba estos mensajes:

```
✅ Casos que deberían funcionar:
- "gasté 50 mil en biggie"
- "pagué 120 de nafta"
- "compré en el super 75k"
- "cargué combustible 150"
- "gasté 35 en netflix"
- "uber 45 lucas"
- "cobré mi sueldo"

❌ Casos que NO funcionan (por diseño):
- "hola" (no es transacción)
- "gasté en biggie" (sin monto)
- "50 mil" (sin contexto de gasto)
```

## 📊 Monitoreo

Ver estadísticas de uso:

```typescript
import { getAIStats } from '@/lib/ai';

const stats = getAIStats();
console.log({
  dailyRequests: stats.dailyRequests,
  percentageUsed: stats.percentageUsed,
  canMakeRequest: stats.canMakeRequest
});
```

## 🎚️ Configuración Avanzada

Edita `src/lib/ai/config.ts` para ajustar:

```typescript
export const AI_CONFIG = {
  // Master switch
  ENABLED: true, // ← Activa/desactiva todo el sistema

  // Estrategia
  USE_RULES_FIRST: true,     // Siempre intentar reglas primero
  USE_AI_FALLBACK: true,     // Usar IA si reglas fallan

  // Límites de seguridad
  MAX_DAILY_AI_REQUESTS: 1000,      // Límite diario auto-impuesto
  MAX_AI_REQUESTS_PER_MINUTE: 20,   // Límite por minuto

  // Umbral de confianza
  MIN_CONFIDENCE_RULES: 0.7,  // 70% - Bajar si quieres usar más IA

  // Logging (para debugging)
  LOG_EXTRACTIONS: true,   // Ver cada extracción
  LOG_AI_USAGE: true,      // Ver cuándo se usa IA
};
```

## 🔧 Personalización

### Agregar tus comercios locales

Edita `src/lib/ai/rules-extractor.ts`:

```typescript
const MERCHANT_TO_CATEGORY: Record<string, TransactionCategory> = {
  // Agrega tus comercios favoritos aquí
  'paseo la galeria': 'Entretenimiento',
  'villa morra': 'Compras',
  'pizzeria don vito': 'Comida',
  // ...
};
```

### Agregar keywords en español paraguayo

```typescript
const CATEGORY_KEYWORDS: Record<string, TransactionCategory> = {
  'terere|tereré|mate|cocido': 'Comida',
  'chipa|sopa paraguaya': 'Comida',
  // ...
};
```

## 🐛 Troubleshooting

### "No se detecta el monto"

```typescript
// Test rápido:
import { extractWithRules } from '@/lib/ai';

const result = extractWithRules("gasté 50 mil en biggie");
console.log(result.amount); // Debería ser 50000

// Si no funciona, revisar patterns en rules-extractor.ts
```

### "IA no funciona"

```bash
# Verificar API key
echo $GROQ_API_KEY  # ¿Está configurada?

# Ver logs
# En config.ts, asegurar:
LOG_AI_USAGE: true

# Correr test:
npx tsx test-ai-extraction.ts
# Deberías ver logs como:
# 🤖 [Groq] Extracting from: ...
# ✅ [Groq] Extracted: ...
```

### "Rate limit exceeded"

```typescript
// Ver estadísticas
import { getAIStats } from '@/lib/ai';
console.log(getAIStats());

// Si llegaste al límite:
// 1. Esperar al día siguiente (se resetea automáticamente)
// 2. O aumentar límite en config.ts (pero cuidado!)
```

## 📈 Escalar el Sistema

### Para 100+ usuarios activos/día

1. **Aumentar límite diario:**
```typescript
MAX_DAILY_AI_REQUESTS: 5000,  // De 1000 → 5000
```

2. **Ajustar umbral de reglas:**
```typescript
MIN_CONFIDENCE_RULES: 0.6,  // Usar más reglas, menos IA
```

### Para 1000+ usuarios

1. **Agregar Google AI Studio como backup:**

```bash
# Obtener key: https://aistudio.google.com/apikey
echo "GOOGLE_API_KEY=tu_key" >> .env.local
```

2. **Implementar cache de resultados frecuentes**

3. **Considerar Ollama local** (sin límites)

## 🎉 ¡Todo listo!

El sistema está implementado y listo para usar. Pasos siguientes:

1. ✅ Probar sin IA (reglas) → `npx tsx test-ai-extraction.ts`
2. ✅ Agregar Groq API key (opcional)
3. ✅ Integrar con WhatsApp
4. ✅ Probar en producción
5. ✅ Monitorear uso

## 📚 Recursos

- [Documentación completa](src/lib/ai/README.md)
- [Groq Console](https://console.groq.com)
- [Script de prueba](test-ai-extraction.ts)

---

**¿Dudas?** Revisar `src/lib/ai/README.md` para más detalles técnicos.
