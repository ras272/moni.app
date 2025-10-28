/**
 * WhatsApp Bot - Summary Handler
 * 
 * Maneja consultas de resumen diario/mensual desde WhatsApp
 */

import { createClient } from '@/lib/supabase/server';
import type { HandlerResponse } from '../types';
import { formatCurrency, formatDate } from '../client';

// =====================================================
// HANDLE GET SUMMARY
// =====================================================

export async function handleGetSummary(
  profileId: string
): Promise<HandlerResponse> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Obtener gastos de hoy
    const { data: todayExpenses, error: todayError } = await supabase
      .from('transactions')
      .select('amount, currency')
      .eq('profile_id', profileId)
      .eq('type', 'expense')
      .eq('status', 'completed')
      .eq('transaction_date', today);

    if (todayError) {
      console.error('Error fetching today expenses:', todayError);
      return {
        success: false,
        message:
          '❌ Error al consultar el resumen.\n\n' + 'Por favor intenta de nuevo.'
      };
    }

    // 2. Obtener ingresos de hoy
    const { data: todayIncome } = await supabase
      .from('transactions')
      .select('amount, currency')
      .eq('profile_id', profileId)
      .eq('type', 'income')
      .eq('status', 'completed')
      .eq('transaction_date', today);

    // 3. Calcular totales de hoy
    const todayExpenseTotal = calculateTotal(todayExpenses || [], 'PYG');
    const todayIncomeTotal = calculateTotal(todayIncome || [], 'PYG');
    const todayExpenseCount = todayExpenses?.length || 0;

    // 4. Obtener gastos del mes actual
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const firstDay = firstDayOfMonth.toISOString().split('T')[0];

    const { data: monthExpenses } = await supabase
      .from('transactions')
      .select('amount, currency')
      .eq('profile_id', profileId)
      .eq('type', 'expense')
      .eq('status', 'completed')
      .gte('transaction_date', firstDay)
      .lte('transaction_date', today);

    const monthExpenseTotal = calculateTotal(monthExpenses || [], 'PYG');

    // 5. Obtener top 3 categorías del mes
    const { data: topCategories } = await supabase
      .from('transactions')
      .select('category_id, categories(name), amount')
      .eq('profile_id', profileId)
      .eq('type', 'expense')
      .eq('status', 'completed')
      .gte('transaction_date', firstDay)
      .lte('transaction_date', today)
      .order('amount', { ascending: false })
      .limit(10); // Obtener más para agrupar

    // Agrupar por categoría
    const categoryTotals: Record<string, number> = {};
    if (topCategories) {
      for (const tx of topCategories) {
        const categoryName =
          (tx.categories as any)?.name || 'Sin categoría';
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += tx.amount;
      }
    }

    // Ordenar y obtener top 3
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // 6. Generar mensaje de respuesta
    let message = `📊 *Resumen de Hoy* (${formatDate(new Date())})\n\n`;

    message += '💸 *Gastos del Día:*\n';
    if (todayExpenseCount > 0) {
      message += `${formatCurrency(todayExpenseTotal, 'PYG')} (${todayExpenseCount} transacción${todayExpenseCount > 1 ? 'es' : ''})\n`;
    } else {
      message += 'Sin gastos registrados hoy\n';
    }

    message += '\n💰 *Ingresos del Día:*\n';
    message += `${formatCurrency(todayIncomeTotal, 'PYG')}\n`;

    message += '\n📈 *Resumen del Mes:*\n';
    message += `Total gastado: ${formatCurrency(monthExpenseTotal, 'PYG')}\n`;

    // Calcular promedio diario
    const daysElapsed = new Date().getDate();
    const dailyAverage = Math.round(monthExpenseTotal / daysElapsed);
    message += `Promedio diario: ${formatCurrency(dailyAverage, 'PYG')}\n`;

    // Top categorías
    if (sortedCategories.length > 0) {
      message += '\n🏷️ *Top Categorías del Mes:*\n';
      sortedCategories.forEach(([category, total], index) => {
        message += `${index + 1}. ${category}: ${formatCurrency(total, 'PYG')}\n`;
      });
    }

    return {
      success: true,
      message,
      metadata: {
        today_expenses: todayExpenseTotal,
        today_income: todayIncomeTotal,
        month_expenses: monthExpenseTotal,
        top_categories: sortedCategories
      }
    };
  } catch (error) {
    console.error('Unexpected error in handleGetSummary:', error);
    return {
      success: false,
      message:
        '❌ Ocurrió un error inesperado al consultar el resumen.\n\n' +
        'Por favor intenta de nuevo más tarde.'
    };
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Calcula el total de un array de transacciones
 * Solo suma transacciones de la moneda especificada
 */
function calculateTotal(
  transactions: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): number {
  return transactions
    .filter((tx) => tx.currency === targetCurrency)
    .reduce((sum, tx) => sum + tx.amount, 0);
}
