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
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { AccountForm } from './account-form';

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className='mr-2 h-4 w-4' />
          Agregar Cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Crear Nueva Cuenta</DialogTitle>
          <DialogDescription>
            Agrega una nueva cuenta para organizar tus finanzas. Puede ser
            efectivo, banco o billetera digital.
          </DialogDescription>
        </DialogHeader>
        <AccountForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
