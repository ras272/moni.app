# 🤖 WhatsApp Bot - Guía de Configuración

## 📋 Requisitos Previos

- Cuenta de Meta Developer (Facebook)
- Número de teléfono verificado (puede ser de prueba inicialmente)
- App desplegada con URL pública (Vercel, Railway, etc.)
- Certificado SSL válido (HTTPS requerido)

---

## 🚀 Paso 1: Crear App de Meta

### 1.1 Acceder a Meta Developer

1. Ve a: https://developers.facebook.com/apps
2. Click en **"Crear app"**
3. Selecciona tipo: **"Empresa"**
4. Completa:
   - **Nombre de la app:** MONI Bot (o tu nombre)
   - **Email de contacto:** tu@email.com
   - **Cuenta de empresa:** Selecciona o crea una

### 1.2 Agregar WhatsApp Product

1. En el panel de la app, busca **"WhatsApp"**
2. Click en **"Configurar"**
3. Meta creará automáticamente:
   - Un número de teléfono de prueba
   - Access tokens temporales
   - Configuración inicial

---

## 🔌 Paso 2: Configurar Webhook

### 2.1 Desplegar tu App

Primero debes tener tu app corriendo en producción:

```bash
# Ejemplo con Vercel
vercel --prod

# URL resultado: https://moni.app (o tu dominio)
```

### 2.2 Configurar Webhook en Meta

1. En Meta Developer → WhatsApp → **Configuración**
2. Sección **"Configuración de webhook"**
3. Click en **"Editar"**
4. Completa:
   - **URL de callback:** `https://tu-dominio.com/api/whatsapp/webhook`
   - **Token de verificación:** `moni_webhook_2024` (debe coincidir con tu .env)
5. Click en **"Verificar y guardar"**

Meta enviará un request GET para verificar:
```
GET https://tu-dominio.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=moni_webhook_2024&hub.challenge=123456
```

Tu endpoint debe retornar el `hub.challenge` recibido.

### 2.3 Suscribirse a Mensajes

1. En la misma sección, busca **"Campos del webhook"**
2. Activa la suscripción a: **`messages`**
3. Guarda cambios

---

## 🔑 Paso 3: Obtener Credenciales

### 3.1 Phone Number ID

1. WhatsApp → **"Configuración de API"**
2. Copia el **"ID del número de teléfono"**
3. Ejemplo: `123456789012345`

```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

### 3.2 Access Token (Temporal)

Meta proporciona un token temporal (24 horas):

1. WhatsApp → **"Configuración de API"**
2. Copia el **"Token de acceso temporal"**
3. ⚠️ Este token expira en 24 horas

### 3.3 Access Token (Permanente)

Para producción, necesitas un token permanente:

1. Ve a **"Herramientas del sistema"** → **"Tokens de acceso"**
2. Click en **"Generar nuevo token"**
3. Selecciona:
   - **App:** Tu app de MONI
   - **Permisos:** `whatsapp_business_messaging`
   - **Vencimiento:** Nunca
4. Copia y guarda el token de forma segura

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxx
```

### 3.4 App Secret

1. **Configuración básica** de la app
2. Copia el **"Clave secreta de la app"**
3. Click en **"Mostrar"** para ver el valor completo

```env
WHATSAPP_APP_SECRET=abc123def456...
```

---

## ⚙️ Paso 4: Variables de Entorno

Crea/actualiza tu archivo `.env.local`:

```env
# WhatsApp Bot Configuration
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxx
WHATSAPP_APP_SECRET=abc123def456...
WHATSAPP_VERIFY_TOKEN=moni_webhook_2024
NEXT_PUBLIC_WHATSAPP_BOT_NUMBER=595991234567
```

**Explicación:**
- `WHATSAPP_PHONE_NUMBER_ID`: ID del número en Meta
- `WHATSAPP_ACCESS_TOKEN`: Token permanente para enviar mensajes
- `WHATSAPP_APP_SECRET`: Para validar firmas HMAC de webhooks
- `WHATSAPP_VERIFY_TOKEN`: Token personalizado para verificación inicial
- `NEXT_PUBLIC_WHATSAPP_BOT_NUMBER`: Tu número de bot (formato internacional sin +)

---

## 🗄️ Paso 5: Ejecutar Migración

Aplica la migración de base de datos:

```bash
# Si usas Supabase CLI
supabase db push

# O ejecuta directamente el SQL en Supabase Dashboard
# migrations/20251028200000_create_whatsapp_tables.sql
```

Verifica que las tablas existan:
```sql
SELECT * FROM whatsapp_connections LIMIT 1;
SELECT * FROM whatsapp_message_logs LIMIT 1;
```

---

## 🧪 Paso 6: Probar el Bot

### 6.1 Vincular tu Cuenta

1. Accede a: https://moni.app/dashboard/settings/whatsapp
2. Click en **"Generar Código"**
3. Copia el código (ej: `ABC123XY`)
4. Abre WhatsApp y envía al número del bot:
   ```
   Vincular ABC123XY
   ```
5. Deberías recibir: ✅ *¡Cuenta vinculada exitosamente!*

### 6.2 Probar Comandos

Envía estos mensajes al bot:

```
Gasté 50.000 en almuerzo
```
Debería registrar el gasto y responder con confirmación.

```
¿Cuánto tengo?
```
Debería mostrar tu balance actual.

```
Resumen de hoy
```
Debería mostrar estadísticas del día.

---

## 🔍 Paso 7: Debugging

### Ver logs del webhook

```bash
# Logs de Vercel
vercel logs

# O en tu plataforma de hosting
```

### Verificar webhooks en Meta

1. WhatsApp → **"Configuración de webhook"**
2. Click en **"Probar"**
3. Envía un mensaje de prueba
4. Deberías ver status: `200 OK`

### Logs de mensajes

Verifica la tabla `whatsapp_message_logs`:

```sql
SELECT 
  direction,
  message_text,
  intent,
  created_at
FROM whatsapp_message_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Seguridad

### ✅ Checklist de Seguridad

- [ ] Access tokens nunca en código fuente
- [ ] Validación HMAC-SHA256 activa
- [ ] RLS policies aplicadas en tablas
- [ ] Rate limiting funcionando (10 msg/min)
- [ ] Tokens de vinculación expiran en 15 min
- [ ] HTTPS obligatorio en webhook

### Rotar Access Token

Si tu token se compromete:

1. Meta Developer → **"Herramientas del sistema"** → **"Tokens de acceso"**
2. Revoca el token comprometido
3. Genera uno nuevo
4. Actualiza `.env.local`
5. Redeploy app

---

## 💰 Costos

### Pricing de WhatsApp Business API

**Gratuito:**
- Primeras 1,000 conversaciones/mes

**Después (Paraguay):**
- Conversación iniciada por usuario: ~$0.003 USD
- Conversación iniciada por negocio: ~$0.008 USD

**Ejemplo:**
- 500 usuarios × 10 mensajes/mes = 5,000 mensajes
- Costo: 5,000 × $0.003 = **$15 USD/mes**

---

## 📊 Monitoreo

### Métricas Importantes

1. **Mensajes procesados:** `whatsapp_message_logs` count
2. **Rate limit hits:** Verificar logs de rate limit
3. **Errores:** Filtrar por logs con error
4. **Usuarios activos:** Count distinct `connection_id`

### Query de Analytics

```sql
-- Mensajes por día (últimos 7 días)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages,
  COUNT(DISTINCT connection_id) as unique_users
FROM whatsapp_message_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Intenciones más usadas
SELECT 
  intent,
  COUNT(*) as count
FROM whatsapp_message_logs
WHERE intent IS NOT NULL
GROUP BY intent
ORDER BY count DESC;
```

---

## 🆘 Troubleshooting

### Error: "Invalid signature"

**Causa:** HMAC validation falla

**Solución:**
1. Verifica que `WHATSAPP_APP_SECRET` sea correcto
2. Confirma que el body del request no esté modificado

### Error: "Phone number not found"

**Causa:** Número de teléfono no tiene `WHATSAPP_PHONE_NUMBER_ID` correcto

**Solución:**
1. Verifica el Phone Number ID en Meta Developer
2. Asegúrate que esté en `.env.local`

### Webhook no recibe mensajes

**Causa:** Suscripción no activa

**Solución:**
1. Meta Developer → WhatsApp → **"Configuración de webhook"**
2. Verifica que `messages` esté suscrito
3. Prueba enviando un mensaje de prueba

### "Token expired"

**Causa:** Access token temporal expiró

**Solución:**
1. Genera un token permanente (ver Paso 3.3)
2. Actualiza `.env.local`

---

## 📚 Recursos Adicionales

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Meta Developer Console](https://developers.facebook.com/apps)

---

**¿Problemas?** Abre un issue en GitHub o contacta soporte.

**Versión:** 1.0.0  
**Última actualización:** 2025-10-28
