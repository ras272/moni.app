/**
 * Daily Statistics Module
 *
 * Obtiene datos diarios de transacciones para gráficos detallados
 */

import { cache } from 'react';
import { createClient } from './server';

export type DailyData = {
  date: string;
  income: number;
  expenses: number;
  balance: number;
};

/**
 * Obtiene datos diarios del mes actual
 * Agrupa transacciones por día para generar sparklines con datos reales
 */
export const getDailyStats = cache(async (): Promise<DailyData[]> => {
  try {
    const supabase = await createClient();

    // Obtener fechas del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = lastDayOfMonth.toISOString().split('T')[0];

    // Obtener transacciones del mes actual
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('transaction_date, amount, type')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true });

    if (error) {
      console.error('Error fetching daily stats:', error);
      return [];
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Agrupar por día
    const dailyMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach((tx) => {
      const date = tx.transaction_date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { income: 0, expenses: 0 });
      }

      const dayData = dailyMap.get(date)!;
      if (tx.type === 'income') {
        dayData.income += tx.amount;
      } else {
        dayData.expenses += tx.amount;
      }
    });

    // Convertir a array y calcular balance acumulado
    const dailyData: DailyData[] = [];
    let cumulativeBalance = 0;

    // Ordenar por fecha
    const sortedDates = Array.from(dailyMap.keys()).sort();

    sortedDates.forEach((date) => {
      const dayData = dailyMap.get(date)!;
      cumulativeBalance += dayData.income - dayData.expenses;

      dailyData.push({
        date,
        income: dayData.income,
        expenses: dayData.expenses,
        balance: cumulativeBalance
      });
    });

    return dailyData;
  } catch (error) {
    console.error('Error in getDailyStats:', error);
    return [];
  }
});

/**
 * Obtiene datos diarios con acumulación
 * Útil para mostrar tendencias acumuladas en el mes
 */
export const getDailyCumulativeStats = cache(async (): Promise<DailyData[]> => {
  try {
    const dailyData = await getDailyStats();

    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;

    return dailyData.map((day) => {
      cumulativeIncome += day.income;
      cumulativeExpenses += day.expenses;

      return {
        date: day.date,
        income: cumulativeIncome,
        expenses: cumulativeExpenses,
        balance: cumulativeIncome - cumulativeExpenses
      };
    });
  } catch (error) {
    console.error('Error in getDailyCumulativeStats:', error);
    return [];
  }
});
