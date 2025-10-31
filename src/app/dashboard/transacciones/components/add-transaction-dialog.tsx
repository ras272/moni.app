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
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TransactionForm } from './transaction-form';

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detectar query param ?new=true y abrir modal
  useEffect(() => {
    const shouldOpen = searchParams.get('new') === 'true';
    if (shouldOpen) {
      setOpen(true);
      // Limpiar el query param de la URL
      router.replace('/dashboard/transacciones', { scroll: false });
    }
  }, [searchParams, router]);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full text-xs sm:w-auto sm:text-sm'>
          <Add01Icon className='mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4' />
          <span className='sm:inline'>Agregar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-base sm:text-lg'>
            Registrar Nueva Transacción
          </DialogTitle>
          <DialogDescription className='text-xs sm:text-sm'>
            Registra un nuevo gasto o ingreso. Todos los campos son
            obligatorios.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
