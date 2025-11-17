import { NextResponse } from 'next/server';
import { updateBudget, type UpdateBudgetInput } from '@/lib/supabase/budgets';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { message: 'Budget ID is required' },
        { status: 400 }
      );
    }

    const budgetData: UpdateBudgetInput = {
      id: body.id,
      amount: body.amount,
      period_type: body.period_type,
      rollover_unused: body.rollover_unused,
      alert_at_80: body.alert_at_80,
      alert_at_90: body.alert_at_90,
      alert_at_100: body.alert_at_100,
      end_date: body.end_date,
      is_active: body.is_active
    };

    const budget = await updateBudget(budgetData);

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el presupuesto'
      },
      { status: 500 }
    );
  }
}
