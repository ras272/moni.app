'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { TransactionWithRelations } from '@/types/database';
import { TransactionFormValues } from '@/lib/schemas';
import { useState } from 'react';
import { EditTransactionForm } from './edit-transaction-form';

function transactionToFormValues(
  transaction: TransactionWithRelations
): TransactionFormValues {
  return {
    descripcion: transaction.description,
    monto: Math.abs(transaction.amount),
    fecha: new Date(transaction.transaction_date),
    categoria: transaction.category?.name || 'Supermercado',
    cuenta: transaction.account.name,
    tipo: transaction.type === 'expense' ? 'EXPENSE' : 'INGRESS'
  };
}

interface EditTransactionDialogProps {
  transaction: TransactionWithRelations;
  children: React.ReactNode;
}

export function EditTransactionDialog({
  transaction,
  children
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const initialData = transactionToFormValues(transaction);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
          <DialogDescription>
            Modifica los detalles de esta transacción. ID: {transaction.id}
          </DialogDescription>
        </DialogHeader>
        <EditTransactionForm
          transactionId={transaction.id}
          initialData={initialData}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
