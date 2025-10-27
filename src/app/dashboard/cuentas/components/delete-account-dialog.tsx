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
import { deleteAccountAction } from '../../actions';

interface DeleteAccountDialogProps {
  accountId: string;
  accountName: string;
  children: React.ReactNode;
}

export function DeleteAccountDialog({
  accountId,
  accountName,
  children
}: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteAccountAction(accountId);

      if (result.success) {
        toast.success('Cuenta eliminada', {
          description: `"${accountName}" ha sido eliminada correctamente.`
        });
        setOpen(false);
      } else {
        toast.error('Error al eliminar la cuenta', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error al eliminar la cuenta', {
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
            ¿Estás seguro de que quieres eliminar esta cuenta?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará la cuenta{' '}
            <strong>&quot;{accountName}&quot;</strong>. Todas las transacciones
            asociadas a esta cuenta quedarán sin asignar. Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Cuenta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
