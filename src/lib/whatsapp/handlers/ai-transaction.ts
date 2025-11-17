/**
 * WhatsApp Bot - AI Transaction Handler
 *
 * Maneja el registro de transacciones usando IA para extracción inteligente
 * de información desde lenguaje natural.
 *
 * Ejemplos de mensajes que puede procesar:
 * - "gasté 50 mil en biggie"
 * - "pagué 120 de nafta en copetrol"
 * - "compré en el super 75k"
 * - "cobré mi sueldo"
 *
 * NOTA: Este handler es opcional y se puede activar/desactivar con AI_CONFIG.ENABLED
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { HandlerResponse } from '../types';
import { formatCurrency } from '../client';
import { fuzzyMatchAccount } from '../utils/account-matcher';
import {
  extractTransaction,
  formatExtractedTransaction,
  generateConfirmationMessage,
  AI_CONFIG,
  type ExtractedTransaction
} from '@/lib/ai';

/**
 * Map de categorías del sistema de IA a IDs de categorías de Supabase
 */
async function getCategoryIdByName(
  categoryName: string,
  profileId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('profile_id', profileId)
    .ilike('name', `%${categoryName}%`)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as { id: string }).id;
}

/**
 * Maneja el registro de una transacción usando IA para extracción
 *
 * @param profileId ID del perfil del usuario
 * @param message Mensaje natural del usuario
 * @returns HandlerResponse con el resultado
 */
export async function handleAITransaction(
  profileId: string,
  message: string
): Promise<HandlerResponse> {
  try {
    // 1. Verificar que la IA esté habilitada
    if (!AI_CONFIG.ENABLED) {
      return {
        success: false,
        message:
          '❌ La extracción inteligente con IA no está habilitada.\n\n' +
          'Usa los comandos tradicionales:\n' +
          '• `/gasto [monto] [descripción]`\n' +
          '• `/ingreso [monto] [descripción]`'
      };
    }

    // 2. Extraer transacción con IA/reglas
    const extraction = await extractTransaction(message);

    if (!extraction.success || !extraction.data) {
      return {
        success: false,
        message:
          '❌ No pude entender la transacción.\n\n' +
          'Intenta con formato más claro:\n' +
          '• "gasté [monto] en [lugar]"\n' +
          '• "pagué [monto] de [concepto]"\n\n' +
          'Ejemplo: "gasté 50 mil en biggie"'
      };
    }

    const tx = extraction.data;

    // 3. Validar que tenga al menos un monto
    if (!tx.amount || tx.amount <= 0) {
      return {
        success: false,
        message:
          '⚠️ No detecté un monto válido.\n\n' +
          formatExtractedTransaction(tx) +
          '\n\n❓ ¿Cuál es el monto? Responde solo con el número.'
      };
    }

    // 4. Si la confianza es baja, pedir confirmación
    if (tx.confidence < 0.7) {
      // Guardar en estado temporal para confirmar después
      // (esto requeriría implementar un sistema de estados por usuario)
      return {
        success: false,
        message: generateConfirmationMessage(tx)
      };
    }

    // 5. Buscar cuentas del usuario
    const supabase = getSupabaseAdmin();

    const { data: allAccounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('profile_id', profileId)
      .eq('is_active', true);

    if (accountsError || !allAccounts || allAccounts.length === 0) {
      return {
        success: false,
        message:
          '❌ No tienes cuentas activas.\n\n' +
          '📱 Crea tu primera cuenta en:\n' +
          'https://moni.app/dashboard/cuentas'
      };
    }

    // 6. Seleccionar cuenta (usar fuzzy matching si se detectó merchant)
    let accountToUse: any = null;

    if (tx.merchant) {
      accountToUse = fuzzyMatchAccount(tx.merchant, allAccounts as any);
    }

    if (!accountToUse) {
      // Usar primera cuenta con moneda PYG
      accountToUse =
        (allAccounts as any).find((acc: any) => acc.currency === 'PYG') ||
        allAccounts[0];
    }

    // 7. Obtener category_id si se detectó categoría
    let categoryId: string | null = null;
    if (tx.category) {
      categoryId = await getCategoryIdByName(tx.category, profileId);
    }

    // 8. Crear la transacción
    const transactionType =
      tx.type === 'income'
        ? 'income'
        : tx.type === 'transfer'
          ? 'transfer'
          : 'expense';

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        profile_id: profileId,
        account_id: accountToUse.id,
        type: transactionType,
        amount: tx.amount,
        description: tx.merchant || tx.notes || 'Transacción desde WhatsApp',
        category_id: categoryId,
        merchant: tx.merchant,
        notes: tx.notes,
        currency: 'PYG',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return {
        success: false,
        message:
          '❌ Error al guardar la transacción.\n\n' +
          'Por favor intenta de nuevo más tarde.'
      };
    }

    // 9. Respuesta de éxito
    const typeEmoji = tx.type === 'expense' ? '💸' : '💰';
    const typeLabel = tx.type === 'expense' ? 'Gasto' : 'Ingreso';
    const methodEmoji = tx.method === 'rules' ? '⚡' : '🤖';
    const methodLabel = tx.method === 'rules' ? 'Reglas' : 'IA';

    let successMessage = `✅ ${typeEmoji} ${typeLabel} registrado\n\n`;
    successMessage += `💵 Monto: ${formatCurrency(tx.amount, 'PYG')}\n`;

    if (tx.merchant) {
      successMessage += `🏪 Comercio: ${tx.merchant}\n`;
    }

    if (tx.category) {
      successMessage += `📁 Categoría: ${tx.category}\n`;
    }

    successMessage += `💳 Cuenta: ${accountToUse.name}\n`;
    successMessage += `\n${methodEmoji} Detectado con: ${methodLabel}`;

    if (tx.confidence < 0.9) {
      successMessage += `\n\n💡 Si algo no es correcto, podés editarlo en el dashboard`;
    }

    return {
      success: true,
      message: successMessage
    };
  } catch (error: any) {
    console.error('Error in handleAITransaction:', error);

    return {
      success: false,
      message:
        '❌ Ocurrió un error al procesar tu mensaje.\n\n' +
        'Intenta con el formato tradicional:\n' +
        '`/gasto [monto] [descripción]`'
    };
  }
}

/**
 * Detecta si un mensaje parece ser una transacción en lenguaje natural
 * (sin comando explícito)
 */
export function looksLikeTransaction(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Keywords que sugieren una transacción
  const transactionKeywords = [
    'gast',
    'pagu',
    'compr',
    'cobr',
    'recib',
    'deposit',
    'transfer',
    'envi',
    'mand',
    'sal',
    'carg' // "cargué nafta"
  ];

  // Detectar si contiene keywords de transacción
  const hasKeyword = transactionKeywords.some((keyword) =>
    lowerMessage.includes(keyword)
  );

  // Detectar si menciona montos ("50 mil", "120 lucas", "75k", etc)
  const hasMoney =
    /\d+\s*(mil|lucas|k|miles)/i.test(message) || /\d{4,}/.test(message);

  return hasKeyword && hasMoney;
}
