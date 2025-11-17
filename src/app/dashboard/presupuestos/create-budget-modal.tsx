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

interface CreateBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBudgetModal({
  open,
  onOpenChange,
  onSuccess
}: CreateBudgetModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  if (!mounted || !open) return null;

  return createPortal(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
          <DialogDescription>
            Establece límites de gasto para controlar tus finanzas y alcanzar
            tus metas.
          </DialogDescription>
        </DialogHeader>
        <BudgetForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>,
    document.body
  );
}
