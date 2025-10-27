'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Account, AccountFormValues } from '@/data/mock-accounts';
import { useState } from 'react';
import { AccountForm } from './account-form';

function accountToFormValues(account: Account): AccountFormValues {
  return {
    id: account.id,
    name: account.name,
    initial_balance: account.current_balance,
    currency: account.currency,
    is_active: account.is_active
  };
}

interface EditAccountDialogProps {
  account: Account;
  children: React.ReactNode;
}

export function EditAccountDialog({
  account,
  children
}: EditAccountDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const initialData = accountToFormValues(account);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Editar Cuenta</DialogTitle>
          <DialogDescription>
            Modifica los detalles de esta cuenta. ID: {account.id}
          </DialogDescription>
        </DialogHeader>
        <AccountForm initialData={initialData} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
