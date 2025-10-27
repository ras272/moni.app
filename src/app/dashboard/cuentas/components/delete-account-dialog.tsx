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

  const handleDelete = () => {
    console.log('Eliminando cuenta:', accountId);

    toast.success('Cuenta eliminada', {
      description: `"${accountName}" ha sido eliminada correctamente.`
    });

    setOpen(false);
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
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            Eliminar Cuenta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
