'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BudgetForm } from './budget-form';

export function CreateBudgetDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh(); // Reload server data to show new budget
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Nuevo Presupuesto
        </Button>
      </DialogTrigger>
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
    </Dialog>
  );
}
