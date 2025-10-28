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
        <Button>
          <Add01Icon className='mr-2 h-4 w-4' />
          Agregar Transacción
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Registrar Nueva Transacción</DialogTitle>
          <DialogDescription>
            Registra un nuevo gasto o ingreso. Todos los campos son
            obligatorios.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
