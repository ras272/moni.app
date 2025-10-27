'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Transaction } from '@/data/mock-transactions';
import { TransactionFormValues } from '@/lib/schemas';
import { useState } from 'react';
import { TransactionForm } from './transaction-form';

function transactionToFormValues(
  transaction: Transaction
): TransactionFormValues {
  return {
    descripcion: transaction.descripcion,
    monto: Math.abs(transaction.monto),
    fecha: new Date(transaction.fecha),
    categoria: transaction.categoria,
    cuenta: transaction.cuenta,
    tipo: transaction.monto < 0 ? 'EXPENSE' : 'INGRESS'
  };
}

interface EditTransactionDialogProps {
  transaction: Transaction;
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
        <TransactionForm initialData={initialData} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
