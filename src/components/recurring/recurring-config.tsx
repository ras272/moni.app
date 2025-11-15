'use client';

import { Control, useWatch } from 'react-hook-form';
import { FormSelect } from '@/components/forms/form-select';
import { FormInput } from '@/components/forms/form-input';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { FormSwitch } from '@/components/forms/form-switch';
import { getFrequencyOptions } from '@/lib/supabase/recurring-transactions';
import type { RecurringTransactionFormValues } from '@/lib/schemas';

interface RecurringConfigProps {
  control: Control<RecurringTransactionFormValues>;
}

export function RecurringConfig({ control }: RecurringConfigProps) {
  // Watch valores del form para mostrar/ocultar campos
  const frequency = useWatch({ control, name: 'frecuencia' });
  const tieneFechaFin = useWatch({ control, name: 'tieneFechaFin' });

  // Determinar si se necesita día del período
  const needsDayOfPeriod = frequency === 'monthly' || frequency === 'weekly';

  // Label dinámico para día del período
  const getDayLabel = () => {
    if (frequency === 'monthly') return 'Día del mes';
    if (frequency === 'weekly') return 'Día de la semana';
    return 'Día';
  };

  const getDayPlaceholder = () => {
    if (frequency === 'monthly') return 'Ej: 5 (día 5 del mes)';
    if (frequency === 'weekly') return '1=Lunes, 7=Domingo';
    return '';
  };

  const getDayDescription = () => {
    if (frequency === 'monthly') return 'Día del mes (1-31)';
    if (frequency === 'weekly') return '1=Lunes, 2=Martes ... 7=Domingo';
    return '';
  };

  const getDayMax = () => {
    if (frequency === 'monthly') return 31;
    if (frequency === 'weekly') return 7;
    return 31;
  };

  return (
    <div className='space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20'>
      <div className='mb-2'>
        <h3 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
          ⏰ Configuración de Recurrencia
        </h3>
        <p className='text-xs text-blue-700 dark:text-blue-300'>
          Configura cómo se repetirá esta transacción automáticamente
        </p>
      </div>

      {/* Frecuencia */}
      <FormSelect
        control={control}
        name='frecuencia'
        label='Frecuencia'
        placeholder='Selecciona la frecuencia'
        required
        options={getFrequencyOptions().map((opt) => ({
          label: opt.label,
          value: opt.value
        }))}
        description='¿Cada cuánto se repetirá?'
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Intervalo (solo si no es biweekly) */}
        {frequency && frequency !== 'biweekly' && (
          <FormInput
            control={control}
            name='intervalo'
            label='Intervalo'
            type='number'
            min={1}
            max={12}
            placeholder='1'
            description={`Cada cuántos ${frequency === 'monthly' ? 'meses' : frequency === 'yearly' ? 'años' : frequency === 'weekly' ? 'semanas' : 'días'}`}
          />
        )}

        {/* Día del período (solo para monthly y weekly) */}
        {needsDayOfPeriod && (
          <FormInput
            control={control}
            name='diaPeriodo'
            label={getDayLabel()}
            type='number'
            min={1}
            max={getDayMax()}
            placeholder={getDayPlaceholder()}
            required
            description={getDayDescription()}
          />
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Fecha de inicio */}
        <FormDatePicker
          control={control}
          name='fechaInicio'
          label='Fecha de inicio'
          required
          config={{
            placeholder: 'Seleccionar fecha',
            minDate: new Date() // No permitir fechas pasadas
          }}
        />

        {/* Switch: ¿Tiene fecha de fin? */}
        <FormSwitch
          control={control}
          name='tieneFechaFin'
          label='¿Tiene fecha de fin?'
          description='Dejar desactivado para que se repita indefinidamente'
          showDescription={true}
          className='md:col-span-1'
        />
      </div>

      {/* Fecha de fin (condicional) */}
      {tieneFechaFin && (
        <FormDatePicker
          control={control}
          name='fechaFin'
          label='Fecha de fin'
          required={tieneFechaFin}
          config={{
            placeholder: 'Seleccionar fecha de fin'
          }}
        />
      )}

      {/* Preview de la recurrencia */}
      {frequency && (
        <div className='rounded-md bg-blue-100 p-3 text-xs text-blue-900 dark:bg-blue-900/30 dark:text-blue-200'>
          <p className='font-medium'>Vista previa:</p>
          <p className='mt-1'>
            Esta transacción se creará automáticamente{' '}
            <span className='font-semibold'>
              {frequency === 'daily' && 'todos los días'}
              {frequency === 'weekly' && 'todas las semanas'}
              {frequency === 'biweekly' && 'cada 2 semanas'}
              {frequency === 'monthly' && 'todos los meses'}
              {frequency === 'yearly' && 'todos los años'}
            </span>
            {tieneFechaFin
              ? ' hasta la fecha especificada'
              : ' indefinidamente'}
            .
          </p>
        </div>
      )}
    </div>
  );
}
