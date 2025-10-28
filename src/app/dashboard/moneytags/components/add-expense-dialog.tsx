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
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createGroupExpenseAction } from '@/app/dashboard/actions';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const expenseSchema = z.object({
  description: z
    .string()
    .min(3, 'La descripción debe tener al menos 3 caracteres'),
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  paid_by_participant_id: z.string().min(1, 'Debes seleccionar quién pagó')
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface Participant {
  id: string;
  name: string;
  phone?: string | null;
}

interface AddExpenseDialogProps {
  groupId: string;
  participants: Participant[];
}

export function AddExpenseDialog({
  groupId,
  participants
}: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      paid_by_participant_id: ''
    }
  });

  async function onSubmit(values: ExpenseFormValues) {
    try {
      const formData = new FormData();
      formData.append('group_id', groupId);
      formData.append('description', values.description);
      formData.append('amount', values.amount.toString());
      formData.append('currency', 'PYG');
      formData.append('paid_by_participant_id', values.paid_by_participant_id);

      const result = await createGroupExpenseAction(formData);

      if (result.success) {
        const payer = participants.find(
          (p) => p.id === values.paid_by_participant_id
        );

        toast.success('¡Gasto agregado al grupo!', {
          description: `${values.description} - ${values.amount.toLocaleString('es-PY')} Gs pagado por ${payer?.name || 'Participante'}`
        });

        form.reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Error al agregar gasto', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      toast.error('Error al agregar gasto', {
        description: 'Ocurrió un error inesperado'
      });
    }
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
              name='paid_by_participant_id'
              label='¿Quién pagó?'
              placeholder='Seleccionar'
              required
              options={participants.map((p) => ({
                label: p.name,
                value: p.id
              }))}
            />
          </div>

          {/* Nota sobre división */}
          <div className='bg-muted/50 rounded-lg border p-4'>
            <p className='text-sm font-medium'>División Automática</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              El gasto se dividirá automáticamente en partes iguales entre todos
              los participantes del grupo.
            </p>
          </div>

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
