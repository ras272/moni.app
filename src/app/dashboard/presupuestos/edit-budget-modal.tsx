'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { BudgetForm } from '@/features/budgets/components/budget-form';
import type { BudgetStatus } from '@/lib/supabase/budgets';

interface EditBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  budget: BudgetStatus | null;
}

export function EditBudgetModal({
  open,
  onOpenChange,
  onSuccess,
  budget
}: EditBudgetModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  if (!mounted || !open || !budget) return null;

  return createPortal(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Editar Presupuesto</DialogTitle>
          <DialogDescription>
            Modifica los límites y configuración de tu presupuesto para{' '}
            {budget.category_name || 'General'}
          </DialogDescription>
        </DialogHeader>
        <BudgetForm
          onSuccess={handleSuccess}
          budgetId={budget.id}
          defaultValues={{
            category_id: budget.category_id,
            period_type: budget.period_type,
            amount: budget.amount,
            rollover_unused: budget.rollover_unused,
            alert_at_80: budget.alert_at_80,
            alert_at_90: budget.alert_at_90,
            alert_at_100: budget.alert_at_100
          }}
        />
      </DialogContent>
    </Dialog>,
    document.body
  );
}
