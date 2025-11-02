/**
 * =====================================================
 * COMPONENT: SplitAmountInput
 * =====================================================
 *
 * Inputs dinámicos para montos o porcentajes según tipo de split.
 * Muestra validación en tiempo real.
 *
 * @module moneytags/components/split-ui
 * @author Sistema
 * @version 1.0.0
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SplitType, SplitInput } from '@/types/expense-splits';
import { AlertCircle } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface SplitAmountInputProps {
  /** Tipo de split (determina el input) */
  splitType: SplitType;

  /** Participantes seleccionados */
  participants: Participant[];

  /** Splits actuales con valores */
  splits: SplitInput[];

  /** Callback cuando cambia un valor */
  onChange: (splits: SplitInput[]) => void;

  /** Monto total del gasto (para validación) */
  totalAmount: number;

  /** Errores de validación */
  errors?: Record<string, string>;
}

export function SplitAmountInput({
  splitType,
  participants,
  splits,
  onChange,
  totalAmount,
  errors = {}
}: SplitAmountInputProps) {
  const handleAmountChange = (participantId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedSplits = splits.map((split) =>
      split.participant_id === participantId
        ? { ...split, amount: numValue }
        : split
    );
    onChange(updatedSplits);
  };

  const handlePercentageChange = (participantId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedSplits = splits.map((split) =>
      split.participant_id === participantId
        ? { ...split, percentage: numValue }
        : split
    );
    onChange(updatedSplits);
  };

  // Si es división equitativa, no necesita inputs
  if (splitType === 'equal') {
    return null;
  }

  // Calcular suma total para mostrar progreso
  const totalPercentage = splits.reduce(
    (sum, split) => sum + (split.percentage || 0),
    0
  );
  const totalExact = splits.reduce(
    (sum, split) => sum + (split.amount || 0),
    0
  );

  const isPercentageValid =
    splitType === 'percentage' && Math.abs(totalPercentage - 100) < 0.01;
  const isExactValid = splitType === 'exact' && totalExact === totalAmount;

  return (
    <div className='space-y-4'>
      {/* Header con progreso */}
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>
          {splitType === 'percentage'
            ? 'Porcentaje por persona'
            : 'Monto por persona'}
        </Label>

        {splitType === 'percentage' && (
          <span
            className={`text-xs font-semibold ${
              isPercentageValid ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {totalPercentage.toFixed(1)}% / 100%
          </span>
        )}

        {splitType === 'exact' && (
          <span
            className={`text-xs font-semibold ${
              isExactValid ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {totalExact.toLocaleString('es-PY')} /{' '}
            {totalAmount.toLocaleString('es-PY')} Gs
          </span>
        )}
      </div>

      {/* Lista de inputs */}
      <div className='space-y-3'>
        {participants.map((participant) => {
          const split = splits.find((s) => s.participant_id === participant.id);
          const error = errors[participant.id];

          return (
            <div
              key={participant.id}
              className='flex items-center gap-3 rounded-lg border p-3'
            >
              {/* Avatar */}
              <Avatar className='h-8 w-8 shrink-0'>
                <AvatarImage
                  src={participant.avatar_url || ''}
                  alt={participant.name}
                />
                <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                  {participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>

              {/* Nombre */}
              <span className='flex-1 text-sm font-medium'>
                {participant.name}
              </span>

              {/* Input según tipo */}
              {splitType === 'percentage' && (
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    placeholder='30'
                    value={split?.percentage || ''}
                    onChange={(e) =>
                      handlePercentageChange(participant.id, e.target.value)
                    }
                    min={0}
                    max={100}
                    step={0.1}
                    className={`w-20 text-right ${error ? 'border-destructive' : ''}`}
                  />
                  <span className='text-muted-foreground text-sm'>%</span>
                </div>
              )}

              {splitType === 'exact' && (
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    placeholder='50000'
                    value={split?.amount || ''}
                    onChange={(e) =>
                      handleAmountChange(participant.id, e.target.value)
                    }
                    min={0}
                    step={1000}
                    className={`w-32 text-right ${error ? 'border-destructive' : ''}`}
                  />
                  <span className='text-muted-foreground text-xs'>Gs</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Validación general */}
      {splitType === 'percentage' &&
        !isPercentageValid &&
        totalPercentage > 0 && (
          <div className='flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/20'>
            <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400' />
            <p className='text-xs text-yellow-900 dark:text-yellow-100'>
              Los porcentajes deben sumar exactamente 100%.{' '}
              {totalPercentage > 100
                ? `Sobran ${(totalPercentage - 100).toFixed(1)}%`
                : `Faltan ${(100 - totalPercentage).toFixed(1)}%`}
            </p>
          </div>
        )}

      {splitType === 'exact' && !isExactValid && totalExact > 0 && (
        <div className='flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/20'>
          <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400' />
          <p className='text-xs text-yellow-900 dark:text-yellow-100'>
            Los montos deben sumar exactamente{' '}
            {totalAmount.toLocaleString('es-PY')} Gs.{' '}
            {totalExact > totalAmount
              ? `Sobran ${(totalExact - totalAmount).toLocaleString('es-PY')} Gs`
              : `Faltan ${(totalAmount - totalExact).toLocaleString('es-PY')} Gs`}
          </p>
        </div>
      )}
    </div>
  );
}
