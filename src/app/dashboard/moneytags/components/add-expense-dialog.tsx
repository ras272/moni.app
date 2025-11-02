/**
 * =====================================================
 * COMPONENT: AddExpenseDialog (v2.0 - Flexible Splits)
 * =====================================================
 *
 * Dialog para agregar gastos con divisiones flexibles.
 * Soporta: equitativa, porcentajes, montos exactos.
 *
 * @module moneytags/components
 * @author Sistema
 * @version 2.0.0
 */

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
import { FormSelect } from '@/components/forms/form-select';
import { zodResolver } from '@hookform/resolvers/zod';
import { Add01Icon } from 'hugeicons-react';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createGroupExpenseAction } from '@/app/dashboard/moneytags/actions/create-expense';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { calculateSplitAmounts } from '@/lib/split-calculator';
import type { SplitType, SplitInput } from '@/types/expense-splits';
import {
  ParticipantSelector,
  SplitTypeSelector,
  SplitAmountInput,
  SplitPreview
} from './split-ui';
import { Separator } from '@/components/ui/separator';

const expenseSchema = z.object({
  description: z
    .string()
    .min(3, 'La descripción debe tener al menos 3 caracteres'),
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  paid_by_participant_id: z.string().min(1, 'Debes seleccionar quién pagó')
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface Participant {
  id: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
}

interface AddExpenseDialogProps {
  groupId: string;
  participants: Participant[];
}

export function AddExpenseDialog({
  groupId,
  participants
}: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // State para splits flexibles
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >(participants.map((p) => p.id)); // Todos seleccionados por defecto
  const [splitInputs, setSplitInputs] = useState<SplitInput[]>(
    participants.map((p) => ({ participant_id: p.id }))
  );

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      paid_by_participant_id: ''
    }
  });

  const totalAmount = form.watch('amount');

  // Actualizar splitInputs cuando cambien los participantes seleccionados
  useEffect(() => {
    setSplitInputs(
      selectedParticipantIds.map((id) => {
        const existing = splitInputs.find((s) => s.participant_id === id);
        return existing || { participant_id: id };
      })
    );
  }, [selectedParticipantIds]);

  // Calcular splits en tiempo real
  const calculationResult = useMemo(() => {
    if (!totalAmount || totalAmount <= 0 || splitInputs.length === 0) {
      return { splits: [], total: 0, valid: false };
    }

    return calculateSplitAmounts(totalAmount, splitType, splitInputs);
  }, [totalAmount, splitType, splitInputs]);

  // Participantes seleccionados con datos completos
  const selectedParticipants = useMemo(() => {
    return participants.filter((p) => selectedParticipantIds.includes(p.id));
  }, [participants, selectedParticipantIds]);

  async function onSubmit(values: ExpenseFormValues) {
    try {
      // Validación: debe haber participantes seleccionados
      if (selectedParticipantIds.length === 0) {
        toast.error('Error', {
          description: 'Debes seleccionar al menos un participante'
        });
        return;
      }

      // Validación: splits deben ser válidos
      if (!calculationResult.valid) {
        toast.error('Error en la división', {
          description:
            calculationResult.errors?.[0] ||
            'La división de gastos no es válida'
        });
        return;
      }

      const formData = new FormData();
      formData.append('group_id', groupId);
      formData.append('description', values.description);
      formData.append('amount', values.amount.toString());
      formData.append('currency', 'PYG');
      formData.append('paid_by_participant_id', values.paid_by_participant_id);
      formData.append('split_type', splitType);

      // Para tipos diferentes a 'equal', enviar splits calculados
      if (
        splitType !== 'equal' ||
        selectedParticipantIds.length !== participants.length
      ) {
        formData.append('splits', JSON.stringify(splitInputs));
      }

      const result = await createGroupExpenseAction(formData);

      if (result.success) {
        const payer = participants.find(
          (p) => p.id === values.paid_by_participant_id
        );

        toast.success('¡Gasto agregado al grupo!', {
          description: `${values.description} - ${values.amount.toLocaleString('es-PY')} Gs pagado por ${payer?.name || 'Participante'}`
        });

        // Reset form and state
        form.reset();
        setSplitType('equal');
        setSelectedParticipantIds(participants.map((p) => p.id));
        setSplitInputs(participants.map((p) => ({ participant_id: p.id })));
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Error al agregar gasto', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Error al agregar gasto', {
        description: 'Ocurrió un error inesperado'
      });
    }
  }

  const handleReset = () => {
    form.reset();
    setSplitType('equal');
    setSelectedParticipantIds(participants.map((p) => p.id));
    setSplitInputs(participants.map((p) => ({ participant_id: p.id })));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Add01Icon className='mr-2 h-4 w-4' />
          Agregar Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Agregar Gasto al Grupo</DialogTitle>
          <DialogDescription>
            Registra un nuevo gasto compartido con división flexible entre
            participantes.
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Información básica del gasto */}
          <div className='space-y-4'>
            <FormInput
              control={form.control}
              name='description'
              label='Descripción del Gasto'
              placeholder='Ej: Carne para el asado, Hotel...'
              required
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='amount'
                label='Monto Total'
                type='number'
                placeholder='150000'
                min={1}
                step={1}
                required
                description='Monto en Guaraníes'
              />

              <FormSelect
                control={form.control}
                name='paid_by_participant_id'
                label='¿Quién pagó?'
                placeholder='Seleccionar'
                required
                options={participants.map((p) => ({
                  label: p.name,
                  value: p.id
                }))}
              />
            </div>
          </div>

          <Separator />

          {/* Selector de tipo de división */}
          <SplitTypeSelector
            value={splitType}
            onChange={setSplitType}
            disabled={form.formState.isSubmitting}
          />

          <Separator />

          {/* Selector de participantes */}
          <ParticipantSelector
            participants={participants}
            selectedIds={selectedParticipantIds}
            onChange={setSelectedParticipantIds}
            disabled={form.formState.isSubmitting}
          />

          {/* Inputs de montos/porcentajes (si no es 'equal') */}
          {splitType !== 'equal' && selectedParticipants.length > 0 && (
            <>
              <Separator />
              <SplitAmountInput
                splitType={splitType}
                participants={selectedParticipants}
                splits={splitInputs}
                onChange={setSplitInputs}
                totalAmount={totalAmount}
              />
            </>
          )}

          {/* Vista previa de cálculos */}
          {totalAmount > 0 &&
            selectedParticipants.length > 0 &&
            calculationResult.splits.length > 0 && (
              <>
                <Separator />
                <SplitPreview
                  participants={selectedParticipants}
                  calculatedSplits={calculationResult.splits}
                  totalAmount={totalAmount}
                  isValid={calculationResult.valid}
                />
              </>
            )}

          {/* Botones */}
          <div className='flex justify-end gap-4'>
            <Button type='button' variant='outline' onClick={handleReset}>
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={
                form.formState.isSubmitting ||
                !calculationResult.valid ||
                selectedParticipantIds.length === 0
              }
            >
              {form.formState.isSubmitting ? 'Guardando...' : 'Agregar Gasto'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
