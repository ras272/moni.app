import { NextResponse } from 'next/server';
import { forceDeleteBudget } from '@/lib/supabase/budgets';
import type {
  ForceDeleteBudgetRequest,
  ForceDeleteBudgetResponse
} from '@/lib/supabase/budgets';

/**
 * POST /api/budgets/admin/force-delete
 *
 * Administrative endpoint to PERMANENTLY delete a budget
 * This performs a hard delete of the budget and all related data:
 * - Budget record
 * - All budget periods
 * - All budget alerts
 *
 * ⚠️  WARNING: This action cannot be undone!
 *
 * @body {ForceDeleteBudgetRequest} Request with budget ID
 * @returns {ForceDeleteBudgetResponse} Deletion confirmation
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/budgets/admin/force-delete \
 *   -H "Content-Type: application/json" \
 *   -d '{"id":"uuid-here"}'
 * ```
 */
export async function POST(request: Request) {
  try {
    const body: ForceDeleteBudgetRequest = await request.json();

    // Validate request body
    if (!body.id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.id)) {
      return NextResponse.json(
        { error: 'Invalid budget ID format' },
        { status: 400 }
      );
    }

    console.log(`[ForceDelete] Attempting to delete budget: ${body.id}`);

    // Perform deletion
    const result = await forceDeleteBudget(body.id);

    console.log('[ForceDelete] Deletion successful:', result);

    const response: ForceDeleteBudgetResponse = {
      success: true,
      ...result
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[ForceDelete] Error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Presupuesto no encontrado' },
          { status: 404 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'No autorizado para eliminar este presupuesto' },
          { status: 403 }
        );
      }

      if (error.message.includes('not authenticated')) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Error al eliminar presupuesto' },
      { status: 500 }
    );
  }
}
