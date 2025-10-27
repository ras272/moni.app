'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useState } from 'react';

interface DeleteTransactionDialogProps {
  transactionId: string;
  transactionDescription: string;
  children: React.ReactNode;
}

export function DeleteTransactionDialog({
  transactionId,
  transactionDescription,
  children
}: DeleteTransactionDialogProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    console.log('Eliminando transacción:', transactionId);

    toast.success('Transacción eliminada', {
      description: `"${transactionDescription}" ha sido eliminada correctamente.`
    });

    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de que quieres eliminar este registro?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará la transacción{' '}
            <strong>&quot;{transactionDescription}&quot;</strong>. No podrás
            deshacerla. Esta transacción es parte de tus gastos en MONI.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
