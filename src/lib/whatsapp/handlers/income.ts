/**
 * WhatsApp Bot - Income Handler
 *
 * Maneja el registro de ingresos desde WhatsApp
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { HandlerResponse } from '../types';
import { detectIncomeCategory, getCategoryName } from '../category-detector';
import { formatCurrency, formatDate } from '../client';
import { isValidAmount, isValidDescription } from '../message-parser';

// =====================================================
// HANDLE INCOME
// =====================================================

export async function handleIncome(
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
          'Ejemplo: "Cobré 500.000 de sueldo"'
      };
    }

    // 2. Validar descripción
    if (!isValidDescription(description)) {
      return {
        success: false,
        message:
          '❌ Descripción inválida. Debe tener entre 1 y 200 caracteres.\n\n' +
          'Ejemplo: "Cobré 500.000 de sueldo"'
      };
    }

    // 3. Usar admin client porque el webhook no tiene sesión de usuario
    const supabase = getSupabaseAdmin();

    // 4. Buscar cuenta específica si se mencionó, sino usar default
    let accountQuery = supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('profile_id', profileId)
      .eq('is_active', true);

    // Si especificó nombre de cuenta, buscar por nombre (case insensitive)
    if (accountName) {
      accountQuery = accountQuery.ilike('name', `%${accountName}%`);
    } else {
      // Sino, buscar cuenta con la moneda correcta
      accountQuery = accountQuery.eq('currency', currency);
    }

    // @ts-ignore - TypeScript issue with Supabase admin client typing
    const { data: defaultAccount, error: accountError } = await accountQuery
      .limit(1)
      .single();

    let accountToUse = defaultAccount as any;

    if (accountError || !defaultAccount) {
      // Si no hay cuenta de esa moneda, buscar cualquier cuenta activa
      const { data: anyAccount } = await supabase
        .from('accounts')
        .select('id, name, currency')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!anyAccount) {
        return {
          success: false,
          message:
            '❌ No tienes cuentas activas.\n\n' +
            '📱 Crea tu primera cuenta en:\n' +
            'https://moni.app/dashboard/cuentas\n\n' +
            'Después podrás registrar ingresos desde WhatsApp.'
        };
      }

      accountToUse = anyAccount;
    }

    // Verificación final de seguridad
    if (!accountToUse) {
      return {
        success: false,
        message:
          '❌ No se pudo obtener una cuenta válida.\n\n' +
          'Por favor intenta de nuevo.'
      };
    }

    // 4. Detectar categoría automáticamente
    const categoryId = await detectIncomeCategory(description, profileId);
    const categoryName = categoryId
      ? await getCategoryName(categoryId)
      : 'Sin categoría';

    // 5. Crear transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      // @ts-ignore - TypeScript issue with Supabase admin client typing
      .insert({
        profile_id: profileId,
        type: 'income',
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
      console.error('Error creating income transaction:', transactionError);
      return {
        success: false,
        message:
          '❌ Error al registrar el ingreso. Por favor intenta de nuevo.\n\n' +
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
        '✅ *Ingreso registrado exitosamente*\n\n' +
        `💰 Monto: ${formatCurrency(amount, currency)}\n` +
        `📝 Descripción: ${description}\n` +
        `🏷️ Categoría: ${categoryName}\n` +
        `💳 Cuenta: ${accountToUse.name}\n` +
        `📅 Fecha: ${formatDate(new Date())}\n\n` +
        `📊 Balance actual: ${formatCurrency(updatedBalance, accountToUse.currency)}\n\n` +
        '¡Excelente! 🎉',
      metadata: {
        transaction_id: (transaction as any)?.id,
        amount,
        category: categoryName,
        new_balance: updatedBalance
      }
    };
  } catch (error) {
    console.error('Unexpected error in handleIncome:', error);
    return {
      success: false,
      message:
        '❌ Ocurrió un error inesperado al registrar el ingreso.\n\n' +
        'Por favor intenta de nuevo más tarde.'
    };
  }
}
