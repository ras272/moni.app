'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { BudgetPeriodType } from '@/lib/supabase/budgets';
import { useCategories } from '@/hooks/categories/use-categories';

const budgetFormSchema = z.object({
  category_id: z.string().nullable(),
  period_type: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  rollover_unused: z.boolean(),
  alert_at_80: z.boolean(),
  alert_at_90: z.boolean(),
  alert_at_100: z.boolean()
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<BudgetFormValues>;
  budgetId?: string;
}

export function BudgetForm({
  onSuccess,
  defaultValues,
  budgetId
}: BudgetFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load expense categories client-side
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories('expense');

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category_id: defaultValues?.category_id ?? null,
      period_type: defaultValues?.period_type ?? 'monthly',
      amount: defaultValues?.amount ?? undefined,
      rollover_unused: defaultValues?.rollover_unused ?? false,
      alert_at_80: defaultValues?.alert_at_80 ?? true,
      alert_at_90: defaultValues?.alert_at_90 ?? true,
      alert_at_100: defaultValues?.alert_at_100 ?? true
    }
  });

  async function onSubmit(data: BudgetFormValues) {
    setIsSubmitting(true);

    try {
      const endpoint = budgetId ? '/api/budgets/update' : '/api/budgets/create';

      console.log('Sending budget data:', data);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetId ? { ...data, id: budgetId } : data)
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar presupuesto');
      }

      toast.success(
        budgetId ? 'Presupuesto actualizado' : 'Presupuesto creado',
        {
          description: budgetId
            ? 'El presupuesto se actualizó correctamente'
            : 'El presupuesto se creó correctamente'
        }
      );

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Error al crear el presupuesto', {
        description:
          error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isPending || isSubmitting || categoriesLoading;

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-6'
    >
      {/* Category Selection */}
      <FormField
        control={form.control}
        name='category_id'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === 'general' ? null : value)
              }
              value={field.value ?? 'general'}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? 'Cargando categorías...'
                        : 'Selecciona una categoría'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='general'>
                  <div className='flex items-center gap-2'>
                    <span>💰</span>
                    <span>General (Todos los gastos)</span>
                  </div>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className='flex items-center gap-2'>
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Presupuesto general o específico para una categoría
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Period Type */}
      <FormField
        control={form.control}
        name='period_type'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Período</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='weekly'>Semanal</SelectItem>
                <SelectItem value='biweekly'>Quincenal</SelectItem>
                <SelectItem value='monthly'>Mensual</SelectItem>
                <SelectItem value='yearly'>Anual</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Con qué frecuencia se renueva el presupuesto
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Amount */}
      <FormField
        control={form.control}
        name='amount'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monto (PYG)</FormLabel>
            <FormControl>
              <Input
                type='number'
                placeholder='500000'
                value={field.value}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                disabled={isLoading}
              />
            </FormControl>
            <FormDescription>
              Monto máximo a gastar en este período
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Rollover */}
      <FormField
        control={form.control}
        name='rollover_unused'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <FormLabel className='text-base'>
                Transferir saldo no usado
              </FormLabel>
              <FormDescription>
                Si no gastas todo, el saldo pasa al próximo período
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Alerts */}
      <div className='space-y-4 rounded-lg border p-4'>
        <div>
          <h4 className='text-sm font-medium'>Alertas</h4>
          <p className='text-muted-foreground text-sm'>
            Recibe notificaciones cuando alcances estos umbrales
          </p>
        </div>

        <FormField
          control={form.control}
          name='alert_at_80'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between'>
              <FormLabel className='font-normal'>Alerta al 80%</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='alert_at_90'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between'>
              <FormLabel className='font-normal'>Alerta al 90%</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='alert_at_100'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between'>
              <FormLabel className='font-normal'>
                Alerta al 100% (límite alcanzado)
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {budgetId ? 'Actualizar presupuesto' : 'Crear presupuesto'}
      </Button>
    </Form>
  );
}
