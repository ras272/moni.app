/**
 * WhatsApp Bot - Balance Handler
 *
 * Maneja consultas de balance desde WhatsApp
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { HandlerResponse } from '../types';
import { formatCurrency, formatRelativeTime } from '../client';

// =====================================================
// HANDLE GET BALANCE
// =====================================================

export async function handleGetBalance(
  profileId: string
): Promise<HandlerResponse> {
  try {
    // Usar admin client porque el webhook no tiene sesión de usuario
    const supabase = getSupabaseAdmin();

    // 1. Obtener todas las cuentas activas del usuario
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, current_balance, currency, updated_at')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('current_balance', { ascending: false });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return {
        success: false,
        message:
          '❌ Error al consultar el balance.\n\n' +
          'Por favor intenta de nuevo.'
      };
    }

    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        message:
          '📊 *Tu Balance*\n\n' +
          'No tienes cuentas activas.\n\n' +
          '💡 Crea tu primera cuenta en:\n' +
          'https://moni.app/dashboard/cuentas'
      };
    }

    // 2. Agrupar por moneda
    const balancesByCurrency: Record<string, number> = {};
    const accountsList: string[] = [];

    for (const account of accounts as any[]) {
      const currency = account.currency || 'PYG';

      // Sumar balance por moneda
      if (!balancesByCurrency[currency]) {
        balancesByCurrency[currency] = 0;
      }
      balancesByCurrency[currency] += account.current_balance;

      // Agregar a lista de cuentas
      const formattedBalance = formatCurrency(
        account.current_balance,
        currency
      );
      accountsList.push(`• ${account.name}: ${formattedBalance}`);
    }

    // 3. Generar mensaje de respuesta
    let message = '💰 *Tu Balance Actual*\n\n';

    message += '🏦 *Cuentas Activas:*\n';
    message += accountsList.join('\n');
    message += '\n\n';

    message += '📊 *Total por Moneda:*\n';
    for (const [currency, total] of Object.entries(balancesByCurrency)) {
      message += `${currency}: ${formatCurrency(total, currency)}\n`;
    }

    // 4. Agregar timestamp
    const latestUpdate = (accounts as any)[0]?.updated_at;
    if (latestUpdate) {
      message += `\n⏱️ Actualizado: ${formatRelativeTime(latestUpdate)}`;
    }

    return {
      success: true,
      message,
      metadata: {
        total_accounts: accounts.length,
        balances: balancesByCurrency
      }
    };
  } catch (error) {
    console.error('Unexpected error in handleGetBalance:', error);
    return {
      success: false,
      message:
        '❌ Ocurrió un error inesperado al consultar el balance.\n\n' +
        'Por favor intenta de nuevo más tarde.'
    };
  }
}
