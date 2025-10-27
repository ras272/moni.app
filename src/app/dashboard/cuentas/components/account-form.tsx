'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { accountSchema, AccountFormValues } from '@/data/mock-accounts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface AccountFormProps {
  initialData?: AccountFormValues;
  onSuccess?: () => void;
}

export function AccountForm({ initialData, onSuccess }: AccountFormProps) {
  const isEditing = !!initialData;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: initialData || {
      name: '',
      initial_balance: 0,
      currency: 'PYG',
      is_active: true
    }
  });

  function onSubmit(values: AccountFormValues) {
    if (isEditing) {
      console.log('Cuenta actualizada:', values);
      toast.success('¡Cuenta actualizada con éxito!', {
        description: `${values.name} ha sido actualizada.`
      });
    } else {
      console.log('Cuenta creada:', values);
      toast.success('¡Cuenta creada con éxito!', {
        description: `${values.name} - Saldo inicial: ${values.initial_balance.toLocaleString('es-PY')} ${values.currency}`
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
      {/* Nombre de la Cuenta */}
      <FormInput
        control={form.control}
        name='name'
        label='Nombre de la Cuenta'
        placeholder='Ej: Billetera, Visión Banco, Tigo Money...'
        required
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Saldo Inicial */}
        <FormInput
          control={form.control}
          name='initial_balance'
          label='Saldo Inicial'
          type='number'
          placeholder='0'
          min={0}
          step={1}
          required
          description={`Monto inicial en ${form.watch('currency')}`}
        />

        {/* Moneda */}
        <FormSelect
          control={form.control}
          name='currency'
          label='Moneda'
          placeholder='Seleccionar moneda'
          required
          options={[
            { label: '₲ Guaraníes (PYG)', value: 'PYG' },
            { label: '$ Dólares (USD)', value: 'USD' }
          ]}
        />
      </div>

      {/* Botones de Submit */}
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
              : 'Guardar Cuenta'}
        </Button>
      </div>
    </Form>
  );
}
