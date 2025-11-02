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
import { zodResolver } from '@hookform/resolvers/zod';
import { Add01Icon } from 'hugeicons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createMoneyTagGroupAction } from '@/app/dashboard/moneytags/actions/create-group';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional()
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  async function onSubmit(values: CreateGroupFormValues) {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.description) {
        formData.append('description', values.description);
      }

      const result = await createMoneyTagGroupAction(formData);

      if (result.success) {
        toast.success('¡Grupo creado con éxito!', {
          description: `${values.name} creado. Ahora puedes agregar participantes.`
        });

        form.reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Error al crear el grupo', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      toast.error('Error al crear el grupo', {
        description: 'Ocurrió un error inesperado'
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full text-xs sm:w-auto sm:text-sm'>
          <Add01Icon className='mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4' />
          <span className='sm:inline'>Crear Grupo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-base sm:text-lg'>
            Crear Grupo de Gastos Compartidos
          </DialogTitle>
          <DialogDescription className='text-xs sm:text-sm'>
            Crea un nuevo grupo. Luego podrás agregar participantes desde la
            página de detalle del grupo.
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 sm:space-y-6'
        >
          {/* Nombre del Grupo */}
          <FormInput
            control={form.control}
            name='name'
            label='Nombre del Grupo'
            placeholder='Ej: Asado Sábado 🍖, Viaje Encarnación...'
            required
          />

          {/* Descripción (opcional) */}
          <FormInput
            control={form.control}
            name='description'
            label='Descripción (opcional)'
            placeholder='Ej: Gastos del asado del 15 de noviembre'
          />

          {/* Botones */}
          <div className='flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
              className='w-full text-xs sm:w-auto sm:text-sm'
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={form.formState.isSubmitting}
              className='w-full text-xs sm:w-auto sm:text-sm'
            >
              {form.formState.isSubmitting ? 'Creando...' : 'Crear Grupo'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
