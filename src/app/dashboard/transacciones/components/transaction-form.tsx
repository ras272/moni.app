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

interface TransactionFormProps {
  initialData?: TransactionFormValues;
  onSuccess?: () => void;
}

export function TransactionForm({
  initialData,
  onSuccess
}: TransactionFormProps) {
  const isEditing = !!initialData;

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

  function onSubmit(values: TransactionFormValues) {
    if (isEditing) {
      console.log('Transacción actualizada:', values);
      toast.success('¡Transacción actualizada con éxito!', {
        description: `${values.descripcion} - ${values.monto.toLocaleString('es-PY')} Gs.`
      });
    } else {
      console.log('Transacción creada:', values);
      toast.success('¡Transacción registrada con éxito!', {
        description: `${values.descripcion} - ${values.monto.toLocaleString('es-PY')} Gs.`
      });
    }

    if (!isEditing) {
      form.reset();
    }

    if (onSuccess) {
      onSuccess();
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
          placeholder='Seleccionar categoría'
          required
          options={[
            { label: '🛒 Supermercado', value: 'Supermercado' },
            { label: '🚗 Transporte', value: 'Transporte' },
            { label: '🍽️ Restaurante', value: 'Restaurante' },
            { label: '💡 Servicios', value: 'Servicios' },
            { label: '🎮 Ocio', value: 'Ocio' },
            { label: '💊 Salud', value: 'Salud' }
          ]}
        />

        {/* Cuenta */}
        <FormSelect
          control={form.control}
          name='cuenta'
          label='Cuenta'
          placeholder='Seleccionar cuenta'
          required
          options={[
            { label: '👛 Billetera', value: 'Billetera' },
            { label: '🏦 Visión Banco', value: 'Visión Banco' },
            { label: '📱 Tigo Money', value: 'Tigo Money' }
          ]}
        />
      </div>

      {/* Botón de Submit */}
      <div className='flex justify-end gap-4'>
        {!isEditing && (
          <Button type='button' variant='outline' onClick={() => form.reset()}>
            Limpiar
          </Button>
        )}
        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? 'Guardando...'
            : isEditing
              ? 'Guardar Cambios'
              : 'Guardar Transacción'}
        </Button>
      </div>
    </Form>
  );
}
