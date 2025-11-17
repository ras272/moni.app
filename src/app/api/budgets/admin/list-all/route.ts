import { NextResponse } from 'next/server';
import {
  getAllBudgetsWithDetails,
  getBudgetsHealth
} from '@/lib/supabase/budgets';

/**
 * GET /api/budgets/admin/list-all
 *
 * Administrative endpoint to list ALL budgets including orphaned ones
 * Returns detailed information about each budget including period counts
 *
 * Query Parameters:
 * - health=true: Returns health analysis instead of basic list
 *
 * @returns {ListAllBudgetsResponse} List of budgets with details
 *
 * @example
 * ```bash
 * # Basic list
 * curl http://localhost:3000/api/budgets/admin/list-all
 *
 * # With health analysis
 * curl http://localhost:3000/api/budgets/admin/list-all?health=true
 * ```
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHealth = searchParams.get('health') === 'true';

    if (includeHealth) {
      const budgetsHealth = await getBudgetsHealth();
      return NextResponse.json({ budgets: budgetsHealth }, { status: 200 });
    }

    const result = await getAllBudgetsWithDetails();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error listing budgets:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al listar presupuestos'
      },
      { status: 500 }
    );
  }
}
