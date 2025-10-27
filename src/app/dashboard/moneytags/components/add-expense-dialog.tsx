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
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormCheckboxGroup } from '@/components/forms/form-checkbox-group';
import {
  expenseSchema,
  ExpenseFormValues,
  Participant
} from '@/data/mock-moneytags';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface AddExpenseDialogProps {
  groupId: string;
  participants: Participant[];
}

export function AddExpenseDialog({
  groupId,
  participants
}: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      paid_by_id: '',
      split_among_ids: []
    }
  });

  function onSubmit(values: ExpenseFormValues) {
    console.log('Gasto agregado al grupo:', groupId, values);

    const payer = participants.find((p) => p.id === values.paid_by_id);
    const splitCount = values.split_among_ids.length;

    toast.success('¡Gasto agregado al grupo!', {
      description: `${values.description} - ${values.amount.toLocaleString('es-PY')} Gs pagado por ${payer?.name}`
    });

    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className='mr-2 h-4 w-4' />
          Agregar Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Agregar Gasto al Grupo</DialogTitle>
          <DialogDescription>
            Registra un nuevo gasto compartido entre los participantes del
            grupo.
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Descripción del Gasto */}
          <FormInput
            control={form.control}
            name='description'
            label='Descripción del Gasto'
            placeholder='Ej: Carne para el asado, Hotel...'
            required
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Monto */}
            <FormInput
              control={form.control}
              name='amount'
              label='Monto'
              type='number'
              placeholder='150000'
              min={1}
              step={1}
              required
              description='Monto en Guaraníes'
            />

            {/* Quién Pagó */}
            <FormSelect
              control={form.control}
              name='paid_by_id'
              label='¿Quién pagó?'
              placeholder='Seleccionar'
              required
              options={participants.map((p) => ({
                label: p.name,
                value: p.id
              }))}
            />
          </div>

          {/* Dividir Entre */}
          <FormCheckboxGroup
            control={form.control}
            name='split_among_ids'
            label='Dividir entre'
            description='Selecciona quiénes participan de este gasto'
            required
            options={participants.map((p) => ({
              label: p.name,
              value: p.id
            }))}
            columns={2}
            showBadges={true}
          />

          {/* Botones */}
          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Guardando...' : 'Agregar Gasto'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
