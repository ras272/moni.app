/**
 * WhatsApp Bot - Webhook API Route
 *
 * Endpoint principal que recibe todos los mensajes de WhatsApp
 * GET: Verificación inicial de Meta
 * POST: Recepción de mensajes
 */

import { NextRequest, NextResponse } from 'next/server';
import type { WhatsAppWebhook } from '@/lib/whatsapp/types';
import {
  validateWebhookSignature,
  validateVerifyToken
} from '@/lib/whatsapp/webhook-validator';
import { parseMessage } from '@/lib/whatsapp/message-parser';
import {
  getConnectionByPhone,
  updateLastMessage
} from '@/lib/whatsapp/auth/linking';
import { linkPhoneToProfile } from '@/lib/whatsapp/auth/linking';
import { sendWhatsAppMessage, cleanPhoneNumber } from '@/lib/whatsapp/client';
import {
  logInboundMessage,
  logOutboundMessage,
  checkRateLimit
} from '@/lib/whatsapp/message-logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Handlers
import { handleExpense } from '@/lib/whatsapp/handlers/expense';
import { handleIncome } from '@/lib/whatsapp/handlers/income';
import { handleGetBalance } from '@/lib/whatsapp/handlers/balance';
import { handleGetSummary } from '@/lib/whatsapp/handlers/summary';
import { handleHelp } from '@/lib/whatsapp/handlers/help';

// =====================================================
// GET - VERIFICACIÓN DE WEBHOOK
// =====================================================

/**
 * Meta llama este endpoint para verificar que el webhook es legítimo
 * Debe retornar el challenge enviado si el verify_token es correcto
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 Webhook verification request:', {
      mode,
      token: token ? `${token.substring(0, 10)}...` : 'missing',
      challenge: challenge ? `${challenge.substring(0, 10)}...` : 'missing',
      fullURL: request.url
    });

    // Validar que sea un request de suscripción con el token correcto
    if (mode === 'subscribe' && validateVerifyToken(token)) {
      console.log('✅ Webhook verified successfully, returning challenge');
      return new NextResponse(challenge, { status: 200 });
    }

    console.error('❌ Webhook verification failed:', {
      modeOK: mode === 'subscribe',
      tokenOK: validateVerifyToken(token)
    });
    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// =====================================================
// POST - RECEPCIÓN DE MENSAJES
// =====================================================

/**
 * Recibe todos los mensajes y eventos de WhatsApp
 */
export async function POST(request: NextRequest) {
  console.log('📥 POST webhook called at:', new Date().toISOString());

  try {
    // 1. Leer el body como texto para validar firma
    const bodyText = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    console.log('🔐 Validating signature:', {
      hasSignature: !!signature,
      bodyLength: bodyText.length
    });

    // 2. Validar firma HMAC-SHA256
    if (!validateWebhookSignature(bodyText, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 3. Parsear body
    const body: WhatsAppWebhook = JSON.parse(bodyText);

    // 4. Extraer mensaje
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    // Si no hay mensaje, retornar 200 OK (puede ser un status update)
    if (!message) {
      return NextResponse.json({ success: true });
    }

    const from = cleanPhoneNumber(message.from);
    const messageText = message.text?.body;
    const messageId = message.id;

    if (!messageText) {
      return NextResponse.json({ success: true });
    }

    console.log(`📨 Message received from ${from}: ${messageText}`);

    // 5. Buscar conexión del usuario
    console.log('🔍 Looking up connection for phone:', from);
    let connection = await getConnectionByPhone(from);
    console.log('🔍 Connection found:', !!connection);

    // 6. Obtener cuentas del usuario para parsing inteligente (si está conectado)
    let userAccounts: any[] = [];
    if (connection) {
      const supabase = getSupabaseAdmin();
      // @ts-ignore
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name, currency')
        .eq('profile_id', connection.profile_id)
        .eq('is_active', true);

      if (accounts) {
        userAccounts = accounts;
      }
    }

    // 7. Parsear mensaje con contexto de cuentas
    const parsed = parseMessage(messageText, userAccounts);

    // 8. CASO ESPECIAL: Vinculación de cuenta
    if (parsed.intent === 'link_account') {
      console.log('🔗 Link account intent detected:', {
        from,
        token: parsed.linkToken,
        rawText: parsed.rawText
      });

      if (!parsed.linkToken) {
        await sendWhatsAppMessage(
          from,
          '❌ Token de vinculación inválido.\n\n' +
            'Genera un nuevo código desde:\n' +
            'https://moni.app/dashboard/settings/whatsapp'
        );
        return NextResponse.json({ success: true });
      }

      const linkResult = await linkPhoneToProfile(from, parsed.linkToken);
      console.log('🔗 Link result:', linkResult);

      if (linkResult.success) {
        await sendWhatsAppMessage(
          from,
          '✅ *¡Cuenta vinculada exitosamente!*\n\n' +
            '🎉 Ya puedes registrar gastos e ingresos desde WhatsApp.\n\n' +
            'Prueba enviando:\n' +
            '• "Gasté 50.000 en almuerzo"\n' +
            '• "¿Cuánto tengo?"\n' +
            '• "Resumen de hoy"\n\n' +
            'Escribe "ayuda" para ver todos los comandos.'
        );
      } else {
        await sendWhatsAppMessage(from, `❌ ${linkResult.error}`);
      }

      return NextResponse.json({ success: true });
    }

    // 9. Si no está vinculado, pedir que vincule
    if (!connection) {
      await sendWhatsAppMessage(
        from,
        '👋 *¡Hola! Bienvenido a MONI*\n\n' +
          'Para usar el bot de WhatsApp, primero vincula tu cuenta:\n\n' +
          '1️⃣ Ingresa a: https://moni.app/dashboard/settings/whatsapp\n' +
          '2️⃣ Genera un código de vinculación\n' +
          '3️⃣ Envíame el código aquí\n\n' +
          '¡Es rápido y seguro! 🔐'
      );
      return NextResponse.json({ success: true });
    }

    // 9. Verificar rate limit
    const rateLimitOk = await checkRateLimit(connection.id);
    if (!rateLimitOk) {
      await sendWhatsAppMessage(
        from,
        '⏸️ Has enviado muchos mensajes.\n\n' +
          'Por favor espera un minuto antes de continuar.'
      );
      return NextResponse.json({ success: true });
    }

    // 10. Actualizar última actividad
    await updateLastMessage(connection.id);

    // 11. Log mensaje entrante
    await logInboundMessage(connection.id, messageText, parsed.intent, {
      parsed_amount: parsed.amount,
      parsed_description: parsed.description,
      parsed_currency: parsed.currency
    });

    // 12. Ejecutar handler correspondiente
    let response;

    switch (parsed.intent) {
      case 'add_expense':
        if (!parsed.amount || !parsed.description) {
          response = {
            success: false,
            message:
              '❌ No pude entender el monto o descripción.\n\n' +
              'Intenta: "Gasté 50.000 en almuerzo"'
          };
        } else {
          response = await handleExpense(
            connection.profile_id,
            parsed.amount,
            parsed.description,
            parsed.currency,
            parsed.accountName
          );
        }
        break;

      case 'add_income':
        if (!parsed.amount || !parsed.description) {
          response = {
            success: false,
            message:
              '❌ No pude entender el monto o descripción.\n\n' +
              'Intenta: "Cobré 500.000 de sueldo"'
          };
        } else {
          response = await handleIncome(
            connection.profile_id,
            parsed.amount,
            parsed.description,
            parsed.currency,
            parsed.accountName
          );
        }
        break;

      case 'get_balance':
        response = await handleGetBalance(connection.profile_id);
        break;

      case 'get_summary':
        response = await handleGetSummary(connection.profile_id);
        break;

      case 'help':
        response = await handleHelp();
        break;

      case 'unknown':
      default:
        response = {
          success: false,
          message:
            '🤔 No entendí tu mensaje.\n\n' +
            'Escribe "ayuda" para ver los comandos disponibles.'
        };
    }

    // 13. Enviar respuesta al usuario
    await sendWhatsAppMessage(from, response.message);

    // 14. Log mensaje saliente
    await logOutboundMessage(
      connection.id,
      response.message,
      response.metadata
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Critical error processing webhook:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
