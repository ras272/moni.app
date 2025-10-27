'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { accountSchema, AccountFormValues } from '@/data/mock-accounts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createAccountAction, updateAccountAction } from '../../actions';
import { useState } from 'react';

interface AccountFormProps {
  initialData?: AccountFormValues;
  onSuccess?: () => void;
}

export function AccountForm({ initialData, onSuccess }: AccountFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: initialData || {
      name: '',
      initial_balance: 0,
      currency: 'PYG',
      is_active: true
    }
  });

  async function onSubmit(values: AccountFormValues) {
    setIsSubmitting(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('initial_balance', values.initial_balance.toString());
      formData.append('currency', values.currency);
      formData.append('type', 'wallet'); // Default type
      formData.append('icon', 'wallet'); // Default icon
      formData.append('color', '#3B82F6'); // Default color

      let result;

      if (isEditing && initialData?.id) {
        // Update existing account
        formData.append('is_active', values.is_active.toString());
        result = await updateAccountAction(initialData.id, formData);
      } else {
        // Create new account
        result = await createAccountAction(formData);
      }

      if (result.success) {
        toast.success(
          isEditing
            ? '¡Cuenta actualizada con éxito!'
            : '¡Cuenta creada con éxito!',
          {
            description: isEditing
              ? `${values.name} ha sido actualizada.`
              : `${values.name} - Saldo inicial: ${values.initial_balance.toLocaleString('es-PY')} ${values.currency}`
          }
        );

        if (!isEditing) {
          form.reset();
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Error al guardar la cuenta', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar la cuenta', {
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
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Guardando...'
            : isEditing
              ? 'Guardar Cambios'
              : 'Guardar Cuenta'}
        </Button>
      </div>
    </Form>
  );
}
