import { NextResponse } from 'next/server';
import { deleteBudget } from '@/lib/supabase/budgets';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { message: 'Budget ID is required' },
        { status: 400 }
      );
    }

    await deleteBudget(body.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Error al eliminar el presupuesto'
      },
      { status: 500 }
    );
  }
}
