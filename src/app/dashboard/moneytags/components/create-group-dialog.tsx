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
import { createMoneyTagGroupAction } from '@/app/dashboard/actions';
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
        <Button>
          <Add01Icon className='mr-2 h-4 w-4' />
          Crear Nuevo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Crear Grupo de Gastos Compartidos</DialogTitle>
          <DialogDescription>
            Crea un nuevo grupo. Luego podrás agregar participantes desde la
            página de detalle del grupo.
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

          {/* Descripción (opcional) */}
          <FormInput
            control={form.control}
            name='description'
            label='Descripción (opcional)'
            placeholder='Ej: Gastos del asado del 15 de noviembre'
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
