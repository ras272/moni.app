/**
 * WhatsApp Bot - Expense Handler
 *
 * Maneja el registro de gastos desde WhatsApp
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { HandlerResponse } from '../types';
import { detectCategory, getCategoryName } from '../category-detector';
import { formatCurrency, formatDate } from '../client';
import { isValidAmount, isValidDescription } from '../message-parser';
import { fuzzyMatchAccount } from '../utils/account-matcher';
import type { AccountInfo } from '../utils/account-matcher';

// =====================================================
// HANDLE EXPENSE
// =====================================================

export async function handleExpense(
  profileId: string,
  amount: number,
  description: string,
  currency: 'PYG' | 'USD' = 'PYG',
  accountName?: string
): Promise<HandlerResponse> {
  try {
    // 1. Validar monto
    if (!isValidAmount(amount)) {
      return {
        success: false,
        message:
          '❌ Monto inválido. Por favor verifica el valor e intenta de nuevo.\n\n' +
          'Ejemplo: "Gasté 50.000 en almuerzo"'
      };
    }

    // 2. Validar descripción
    if (!isValidDescription(description)) {
      return {
        success: false,
        message:
          '❌ Descripción inválida. Debe tener entre 1 y 200 caracteres.\n\n' +
          'Ejemplo: "Gasté 50.000 en almuerzo"'
      };
    }

    // 3. Usar admin client porque el webhook no tiene sesión de usuario
    const supabase = getSupabaseAdmin();

    // 4. Obtener todas las cuentas activas del usuario
    // @ts-ignore - TypeScript issue with Supabase admin client typing
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
          'https://moni.app/dashboard/cuentas\n\n' +
          'Después podrás registrar gastos desde WhatsApp.'
      };
    }

    // 5. Seleccionar cuenta usando fuzzy matching inteligente
    let accountToUse: any = null;

    if (accountName) {
      // Si especificó nombre de cuenta, buscar con fuzzy matching
      accountToUse = fuzzyMatchAccount(accountName, allAccounts as any);
    }

    if (!accountToUse) {
      // Si no especificó o no encontró match, buscar cuenta con moneda correcta
      accountToUse = (allAccounts as any).find(
        (acc: any) => acc.currency === currency
      );
    }

    if (!accountToUse) {
      // Si no hay cuenta de esa moneda, usar la primera disponible
      accountToUse = allAccounts[0];
    }

    // 4. Detectar categoría automáticamente
    const categoryId = await detectCategory(description, profileId);
    const categoryName = categoryId
      ? await getCategoryName(categoryId)
      : 'Sin categoría';

    // 5. Crear transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      // @ts-ignore - TypeScript issue with Supabase admin client typing
      .insert({
        profile_id: profileId,
        type: 'expense',
        amount,
        currency,
        description,
        category_id: categoryId,
        account_id: accountToUse.id,
        status: 'completed',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: 'Creado desde WhatsApp Bot'
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error('Error creating transaction:', transactionError);
      return {
        success: false,
        message:
          '❌ Error al registrar el gasto. Por favor intenta de nuevo.\n\n' +
          'Si el problema persiste, contacta soporte.'
      };
    }

    // 6. Obtener balance actualizado
    // @ts-ignore - TypeScript issue with Supabase admin client typing
    const { data: accountData } = await supabase
      .from('accounts')
      .select('current_balance')
      .eq('id', accountToUse.id)
      .single();

    const updatedBalance = (accountData as any)?.current_balance || 0;

    // 7. Generar respuesta de éxito
    return {
      success: true,
      message:
        '✅ *Gasto registrado exitosamente*\n\n' +
        `💸 Monto: ${formatCurrency(amount, currency)}\n` +
        `📝 Descripción: ${description}\n` +
        `🏷️ Categoría: ${categoryName}\n` +
        `💳 Cuenta: ${accountToUse.name}\n` +
        `📅 Fecha: ${formatDate(new Date())}\n\n` +
        `📊 Balance actual: ${formatCurrency(updatedBalance, accountToUse.currency)}\n\n` +
        '¿Deseas agregar otro gasto?',
      metadata: {
        transaction_id: (transaction as any)?.id,
        amount,
        category: categoryName,
        new_balance: updatedBalance
      }
    };
  } catch (error) {
    console.error('Unexpected error in handleExpense:', error);
    return {
      success: false,
      message:
        '❌ Ocurrió un error inesperado al registrar el gasto.\n\n' +
        'Por favor intenta de nuevo más tarde.'
    };
  }
}
