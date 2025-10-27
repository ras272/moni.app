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
import { FormCheckboxGroup } from '@/components/forms/form-checkbox-group';
import {
  groupSchema,
  GroupFormValues,
  mockParticipants
} from '@/data/mock-moneytags';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      participant_ids: []
    }
  });

  function onSubmit(values: GroupFormValues) {
    console.log('Grupo creado:', values);

    const selectedNames = mockParticipants
      .filter((p) => values.participant_ids.includes(p.id))
      .map((p) => p.name)
      .join(', ');

    toast.success('¡Grupo creado con éxito!', {
      description: `${values.name} con ${values.participant_ids.length} participantes`
    });

    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className='mr-2 h-4 w-4' />
          Crear Nuevo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Crear Grupo de Gastos Compartidos</DialogTitle>
          <DialogDescription>
            Agrega un nombre al grupo y selecciona los participantes que
            compartirán gastos.
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Nombre del Grupo */}
          <FormInput
            control={form.control}
            name='name'
            label='Nombre del Grupo'
            placeholder='Ej: Asado Sábado 🍖, Viaje Encarnación...'
            required
          />

          {/* Selección de Participantes */}
          <FormCheckboxGroup
            control={form.control}
            name='participant_ids'
            label='Seleccionar Participantes'
            description='Selecciona al menos 2 personas para compartir gastos'
            required
            options={mockParticipants.map((p) => ({
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
              {form.formState.isSubmitting ? 'Creando...' : 'Crear Grupo'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
