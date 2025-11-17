import { NextResponse } from 'next/server';
import { createBudget, type CreateBudgetInput } from '@/lib/supabase/budgets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received budget data:', body);

    const budgetData: CreateBudgetInput = {
      category_id: body.category_id,
      period_type: body.period_type,
      amount: body.amount,
      currency: body.currency,
      rollover_unused: body.rollover_unused,
      alert_at_80: body.alert_at_80,
      alert_at_90: body.alert_at_90,
      alert_at_100: body.alert_at_100,
      start_date: body.start_date,
      end_date: body.end_date
    };

    console.log('Creating budget with data:', budgetData);
    const budget = await createBudget(budgetData);
    console.log('Budget created successfully:', budget);

    return NextResponse.json(budget, { status: 201 });
  } catch (error: any) {
    console.error('Error creating budget - Full error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );

    // Handle specific constraint violations
    let message = 'Error al crear el presupuesto';

    if (error?.code === '23505') {
      if (error.message?.includes('idx_budgets_unique_active_general')) {
        message =
          'Ya tenés un presupuesto general activo. Podés crear presupuestos para categorías específicas o eliminar el presupuesto general existente.';
      } else if (
        error.message?.includes('idx_budgets_unique_active_category')
      ) {
        message =
          'Ya existe un presupuesto activo para esta categoría. Solo podés tener un presupuesto por categoría.';
      } else {
        message = 'Ya existe un presupuesto similar activo.';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      { message },
      { status: error?.code === '23505' ? 409 : 500 }
    );
  }
}
