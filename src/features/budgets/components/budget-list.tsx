'use client';

import { BudgetCard } from './budget-card';
import { Wallet } from 'lucide-react';
import {
  sortBudgetsByPriority,
  type BudgetStatus
} from '@/lib/supabase/budgets';

interface BudgetListProps {
  budgets: BudgetStatus[];
  onEditBudget?: (budgetId: string) => void;
  onDeleteBudget?: (budgetId: string) => void;
  className?: string;
}

export function BudgetList({
  budgets,
  onEditBudget,
  onDeleteBudget,
  className
}: BudgetListProps) {
  // Sort budgets by priority (over budget first, then by percentage)
  const sortedBudgets = sortBudgetsByPriority(budgets);

  if (budgets.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
        <div className='bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
          <Wallet className='text-muted-foreground h-6 w-6' />
        </div>
        <h3 className='mb-2 text-lg font-semibold'>
          No tienes presupuestos configurados
        </h3>
        <p className='text-muted-foreground max-w-sm text-sm'>
          Los presupuestos te ayudan a controlar tus gastos y alcanzar tus metas
          financieras. Crea tu primer presupuesto usando el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {sortedBudgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={onEditBudget}
            onDelete={onDeleteBudget}
          />
        ))}
      </div>
    </div>
  );
}
