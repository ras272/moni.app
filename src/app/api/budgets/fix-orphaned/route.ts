import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Fix budgets without current periods by creating periods for them
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Get all active budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('id')
      .eq('is_active', true);

    if (budgetsError) throw budgetsError;
    if (!budgets || budgets.length === 0) {
      return NextResponse.json({
        message: 'No active budgets found',
        fixed: 0
      });
    }

    let fixed = 0;

    // For each budget, try to create/get current period
    for (const budget of budgets) {
      const { error: periodError } = await supabase.rpc(
        'get_or_create_current_budget_period',
        { p_budget_id: budget.id }
      );

      if (!periodError) {
        fixed++;
      } else {
        console.error(`Error fixing budget ${budget.id}:`, periodError);
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} of ${budgets.length} budgets`,
      fixed,
      total: budgets.length
    });
  } catch (error) {
    console.error('Error fixing orphaned budgets:', error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Error al reparar presupuestos'
      },
      { status: 500 }
    );
  }
}
