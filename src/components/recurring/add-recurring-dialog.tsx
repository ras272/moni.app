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
import { Add01Icon } from 'hugeicons-react';
import { useState } from 'react';
import { RecurringTransactionForm } from './recurring-transaction-form';

export function AddRecurringDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full text-xs sm:w-auto sm:text-sm'>
          <Add01Icon className='mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4' />
          <span className='sm:inline'>Nueva Recurrencia</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] max-w-[95vw] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='text-base sm:text-lg'>
            Crear Transacción Recurrente
          </DialogTitle>
          <DialogDescription className='text-xs sm:text-sm'>
            Configura un gasto o ingreso que se repita automáticamente.
          </DialogDescription>
        </DialogHeader>
        <RecurringTransactionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
