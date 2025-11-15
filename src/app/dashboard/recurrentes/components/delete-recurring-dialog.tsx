'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import type { RecurringTransactionWithRelations } from '@/lib/supabase/recurring-transactions';
import { useDeleteRecurring } from '@/hooks/recurring-transactions';
import { toast } from 'sonner';

interface DeleteRecurringDialogProps {
  recurring: RecurringTransactionWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRecurringDialog({
  recurring,
  open,
  onOpenChange
}: DeleteRecurringDialogProps) {
  const deleteMutation = useDeleteRecurring();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(recurring.id);

      toast.success('Recurrencia eliminada', {
        description: 'La transacción recurrente ha sido eliminada'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting recurring:', error);
      toast.error('Error al eliminar', {
        description: 'Ocurrió un error inesperado'
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar recurrencia?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar la recurrencia "{recurring.description}".
            <br />
            <br />
            <strong>Importante:</strong> Las transacciones ya creadas NO se
            eliminarán, solo se detendrá la generación automática de nuevas
            transacciones.
            <br />
            <br />
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
