'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormRadioGroup } from '@/components/forms/form-radio-group';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  recurringTransactionSchema,
  type RecurringTransactionFormValues
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/accounts/use-accounts';
import { useCategories } from '@/hooks/categories/use-categories';
import { RecurringConfig } from './recurring-config';
import { useCreateRecurring } from '@/hooks/recurring-transactions';

interface RecurringTransactionFormProps {
  onSuccess?: () => void;
}

export function RecurringTransactionForm({
  onSuccess
}: RecurringTransactionFormProps) {
  // Load accounts and categories
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  // Mutation hook para crear recurrencia
  const createMutation = useCreateRecurring();

  const form = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      tipo: 'EXPENSE',
      descripcion: '',
      monto: 0,
      categoria: '',
      cuenta: '',
      comercio: '',
      notas: '',
      frecuencia: 'monthly',
      intervalo: 1,
      diaPeriodo: undefined,
      fechaInicio: new Date(),
      fechaFin: undefined,
      tieneFechaFin: false
    }
  });

  const transactionType = form.watch('tipo');

  // Filter categories by type
  const filteredCategories = categories.filter((cat) => {
    if (transactionType === 'EXPENSE') {
      return cat.type === 'expense';
    } else {
      return cat.type === 'income';
    }
  });

  async function onSubmit(values: RecurringTransactionFormValues) {
    try {
      // Find the account_id and category_id from the names
      const account = accounts.find((acc) => acc.name === values.cuenta);
      const category = filteredCategories.find(
        (cat) => cat.name === values.categoria
      );

      if (!account) {
        toast.error('Error', {
          description: 'La cuenta seleccionada no existe'
        });
        return;
      }

      // Create input for mutation
      const input = {
        type:
          values.tipo === 'EXPENSE'
            ? ('expense' as const)
            : ('income' as const),
        amount: values.monto,
        description: values.descripcion,
        account_id: account.id,
        category_id: category?.id,
        merchant: values.comercio || undefined,
        notes: values.notas || undefined,
        currency: 'PYG' as const,
        frequency: values.frecuencia,
        interval_count: values.intervalo,
        day_of_period: values.diaPeriodo,
        start_date: values.fechaInicio.toISOString().split('T')[0],
        end_date:
          values.tieneFechaFin && values.fechaFin
            ? values.fechaFin.toISOString().split('T')[0]
            : undefined
      };

      await createMutation.mutateAsync(input);

      toast.success('¡Recurrencia creada con éxito!', {
        description: `${values.descripcion} se repetirá automáticamente`
      });

      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al crear la recurrencia', {
        description: 'Ocurrió un error inesperado'
      });
    }
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-4 sm:space-y-6'
    >
      {/* Tipo: Ingreso o Egreso */}
      <FormRadioGroup
        control={form.control}
        name='tipo'
        label='Tipo de Transacción'
        required
        orientation='horizontal'
        options={[
          { label: '💸 Egreso (Gasto)', value: 'EXPENSE' },
          { label: '💰 Ingreso', value: 'INCOME' }
        ]}
      />

      {/* Descripción */}
      <FormInput
        control={form.control}
        name='descripcion'
        label='Descripción'
        placeholder='Ej: Suscripción Netflix, Pago de alquiler...'
        required
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Monto */}
        <FormInput
          control={form.control}
          name='monto'
          label='Monto'
          type='number'
          placeholder='150000'
          min={1}
          step={1}
          required
          description='Monto en Guaraníes'
        />

        {/* Categoría */}
        <FormSelect
          control={form.control}
          name='categoria'
          label='Categoría'
          placeholder={
            categoriesLoading
              ? 'Cargando categorías...'
              : 'Seleccionar categoría'
          }
          disabled={categoriesLoading}
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
          placeholder={
            accountsLoading ? 'Cargando cuentas...' : 'Seleccionar cuenta'
          }
          required
          disabled={accountsLoading}
          options={accounts.map((acc) => ({
            label: `${acc.icon} ${acc.name}`,
            value: acc.name
          }))}
        />

        {/* Comercio (opcional) */}
        <FormInput
          control={form.control}
          name='comercio'
          label='Comercio'
          placeholder='Ej: Netflix, Biggie...'
        />
      </div>

      {/* Notas (opcional) */}
      <FormTextarea
        control={form.control}
        name='notas'
        label='Notas adicionales'
        placeholder='Información adicional sobre esta recurrencia...'
        config={{ rows: 3 }}
      />

      {/* Configuración de Recurrencia */}
      <RecurringConfig control={form.control} />

      {/* Botón de Submit */}
      <div className='flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-4'>
        <Button
          type='button'
          variant='outline'
          onClick={() => form.reset()}
          className='w-full text-xs sm:w-auto sm:text-sm'
        >
          Limpiar
        </Button>
        <Button
          type='submit'
          disabled={
            createMutation.isPending || accountsLoading || categoriesLoading
          }
          className='w-full text-xs sm:w-auto sm:text-sm'
        >
          {createMutation.isPending ? 'Guardando...' : 'Crear Recurrencia'}
        </Button>
      </div>
    </Form>
  );
}
