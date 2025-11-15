'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import type { RecurringTransactionWithRelations } from '@/lib/supabase/recurring-transactions';
import {
  updateRecurringTransactionSchema,
  type UpdateRecurringTransactionFormValues
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/categories/use-categories';
import { useAccounts } from '@/hooks/accounts/use-accounts';
import { useUpdateRecurring } from '@/hooks/recurring-transactions';

interface EditRecurringDialogProps {
  recurring: RecurringTransactionWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRecurringDialog({
  recurring,
  open,
  onOpenChange
}: EditRecurringDialogProps) {
  const updateMutation = useUpdateRecurring();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const form = useForm<UpdateRecurringTransactionFormValues>({
    resolver: zodResolver(updateRecurringTransactionSchema),
    defaultValues: {
      descripcion: recurring.description,
      monto: recurring.amount,
      categoria: recurring.category?.name || undefined,
      cuenta: recurring.account?.name || undefined,
      comercio: recurring.merchant || undefined,
      notas: recurring.notes || undefined,
      fechaFin: recurring.end_date ? new Date(recurring.end_date) : undefined
    }
  });

  const filteredCategories = categories.filter(
    (cat) => cat.type === recurring.type
  );

  async function onSubmit(values: UpdateRecurringTransactionFormValues) {
    try {
      const account = accounts.find((acc) => acc.name === values.cuenta);
      const category = filteredCategories.find(
        (cat) => cat.name === values.categoria
      );

      const updates: any = {};
      if (values.descripcion) updates.description = values.descripcion;
      if (values.monto) updates.amount = values.monto;
      if (category) updates.category_id = category.id;
      if (account) updates.account_id = account.id;
      if (values.comercio !== undefined)
        updates.merchant = values.comercio || undefined;
      if (values.notas !== undefined) updates.notes = values.notas || undefined;
      if (values.fechaFin !== undefined) {
        updates.end_date = values.fechaFin
          ? values.fechaFin.toISOString().split('T')[0]
          : undefined;
      }

      await updateMutation.mutateAsync({
        id: recurring.id,
        updates
      });

      toast.success('Recurrencia actualizada', {
        description: 'Los cambios se han guardado correctamente'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating recurring:', error);
      toast.error('Error al actualizar', {
        description: 'Ocurrió un error inesperado'
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-[95vw] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Editar Recurrencia</DialogTitle>
          <DialogDescription>
            Modifica los detalles de esta transacción recurrente. La frecuencia
            y fechas de inicio no se pueden cambiar.
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          {/* Descripción */}
          <FormInput
            control={form.control}
            name='descripcion'
            label='Descripción'
            placeholder='Descripción de la recurrencia'
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Monto */}
            <FormInput
              control={form.control}
              name='monto'
              label='Monto'
              type='number'
              min={1}
              placeholder='150000'
            />

            {/* Categoría */}
            <FormSelect
              control={form.control}
              name='categoria'
              label='Categoría'
              placeholder='Seleccionar categoría'
              options={filteredCategories.map((cat) => ({
                label: `${cat.icon} ${cat.name}`,
                value: cat.name
              }))}
            />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Cuenta */}
            <FormSelect
              control={form.control}
              name='cuenta'
              label='Cuenta'
              placeholder='Seleccionar cuenta'
              options={accounts.map((acc) => ({
                label: `${acc.icon} ${acc.name}`,
                value: acc.name
              }))}
            />

            {/* Comercio */}
            <FormInput
              control={form.control}
              name='comercio'
              label='Comercio'
              placeholder='Nombre del comercio'
            />
          </div>

          {/* Notas */}
          <FormTextarea
            control={form.control}
            name='notas'
            label='Notas'
            placeholder='Notas adicionales...'
            config={{ rows: 3 }}
          />

          {/* Fecha de fin */}
          <FormDatePicker
            control={form.control}
            name='fechaFin'
            label='Fecha de fin (opcional)'
            config={{
              placeholder: 'Sin fecha de fin'
            }}
          />

          {/* Botones */}
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
