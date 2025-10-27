'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormRadioGroup } from '@/components/forms/form-radio-group';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { transactionSchema, TransactionFormValues } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createTransactionAction } from '../../actions';
import { useState } from 'react';
import { useAccounts } from '@/hooks/accounts/use-accounts';
import { useCategories } from '@/hooks/categories/use-categories';

interface TransactionFormProps {
  initialData?: TransactionFormValues;
  onSuccess?: () => void;
}

export function TransactionForm({
  initialData,
  onSuccess
}: TransactionFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load accounts and categories
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData || {
      tipo: 'EXPENSE',
      descripcion: '',
      monto: undefined,
      fecha: new Date(),
      categoria: '',
      cuenta: ''
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

  async function onSubmit(values: TransactionFormValues) {
    setIsSubmitting(true);

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
        setIsSubmitting(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('type', values.tipo === 'EXPENSE' ? 'expense' : 'income');
      formData.append('amount', values.monto.toString());
      formData.append('description', values.descripcion);
      formData.append('account_id', account.id);
      if (category) {
        formData.append('category_id', category.id);
      }
      formData.append(
        'transaction_date',
        values.fecha.toISOString().split('T')[0]
      );
      formData.append('currency', 'PYG');
      formData.append('status', 'completed');

      const result = await createTransactionAction(formData);

      if (result.success) {
        toast.success('¡Transacción registrada con éxito!', {
          description: `${values.descripcion} - ${values.monto.toLocaleString('es-PY')} Gs.`
        });

        if (!isEditing) {
          form.reset();
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Error al registrar la transacción', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al registrar la transacción', {
        description: 'Ocurrió un error inesperado'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-6'
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
          { label: '💰 Ingreso', value: 'INGRESS' }
        ]}
      />

      {/* Descripción */}
      <FormInput
        control={form.control}
        name='descripcion'
        label='Descripción'
        placeholder='Ej: Compras en Biggie, Pago de ANDE...'
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

        {/* Fecha */}
        <FormDatePicker
          control={form.control}
          name='fecha'
          label='Fecha'
          required
          config={{
            placeholder: 'Seleccionar fecha',
            maxDate: new Date()
          }}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
          required
          disabled={categoriesLoading}
          options={filteredCategories.map((cat) => ({
            label: `${cat.icon} ${cat.name}`,
            value: cat.name
          }))}
        />

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
      </div>

      {/* Botón de Submit */}
      <div className='flex justify-end gap-4'>
        {!isEditing && (
          <Button type='button' variant='outline' onClick={() => form.reset()}>
            Limpiar
          </Button>
        )}
        <Button
          type='submit'
          disabled={isSubmitting || accountsLoading || categoriesLoading}
        >
          {isSubmitting
            ? 'Guardando...'
            : isEditing
              ? 'Guardar Cambios'
              : 'Guardar Transacción'}
        </Button>
      </div>
    </Form>
  );
}
