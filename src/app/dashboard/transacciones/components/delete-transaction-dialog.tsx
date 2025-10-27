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
import { deleteTransactionAction } from '../../actions';

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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteTransactionAction(transactionId);

      if (result.success) {
        toast.success('Transacción eliminada', {
          description: `"${transactionDescription}" ha sido eliminada correctamente.`
        });
        setOpen(false);
      } else {
        toast.error('Error al eliminar la transacción', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error al eliminar la transacción', {
        description: 'Ocurrió un error inesperado'
      });
    } finally {
      setIsDeleting(false);
    }
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
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
