/**
 * =====================================================
 * COMPONENT: SplitPreview
 * =====================================================
 *
 * Vista previa de cálculos de splits en tiempo real.
 * Muestra cuánto pagará cada participante.
 *
 * @module moneytags/components/split-ui
 * @author Sistema
 * @version 1.0.0
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrencyPY } from '@/lib/utils';
import type { CalculatedSplit } from '@/types/expense-splits';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface SplitPreviewProps {
  /** Participantes del grupo */
  participants: Participant[];

  /** Splits calculados */
  calculatedSplits: CalculatedSplit[];

  /** Monto total del gasto */
  totalAmount: number;

  /** Si la validación es exitosa */
  isValid: boolean;
}

export function SplitPreview({
  participants,
  calculatedSplits,
  totalAmount,
  isValid
}: SplitPreviewProps) {
  // Si no hay splits calculados, no mostrar
  if (calculatedSplits.length === 0) {
    return null;
  }

  // Calcular suma total de splits
  const totalSplits = calculatedSplits.reduce(
    (sum, split) => sum + split.amount,
    0
  );

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium'>Vista Previa</h3>
        {isValid ? (
          <div className='flex items-center gap-1.5 text-green-600'>
            <CheckCircle2 className='h-4 w-4' />
            <span className='text-xs font-medium'>Válido</span>
          </div>
        ) : (
          <div className='text-destructive flex items-center gap-1.5'>
            <AlertCircle className='h-4 w-4' />
            <span className='text-xs font-medium'>Revisar</span>
          </div>
        )}
      </div>

      {/* Resumen total */}
      <div
        className={`rounded-lg border p-4 ${
          isValid
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
        }`}
      >
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Total del gasto</span>
          <span className='text-lg font-bold'>
            {formatCurrencyPY(totalAmount)}
          </span>
        </div>
        {!isValid && totalSplits !== totalAmount && (
          <p className='text-muted-foreground mt-2 text-xs'>
            Suma de divisiones: {formatCurrencyPY(totalSplits)}
          </p>
        )}
      </div>

      {/* Lista de splits */}
      <div className='space-y-2'>
        <p className='text-muted-foreground text-xs font-medium'>
          División por participante:
        </p>

        {calculatedSplits.map((split) => {
          const participant = participants.find(
            (p) => p.id === split.participant_id
          );

          if (!participant) return null;

          // Calcular porcentaje del total
          const percentage = ((split.amount / totalAmount) * 100).toFixed(1);

          return (
            <div
              key={split.participant_id}
              className='bg-card flex items-center justify-between rounded-lg border p-3'
            >
              <div className='flex items-center gap-3'>
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
                <div>
                  <p className='text-sm font-medium'>{participant.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {percentage}% del total
                  </p>
                </div>
              </div>

              {/* Monto */}
              <div className='text-right'>
                <p className='text-base font-bold'>
                  {formatCurrencyPY(split.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info adicional */}
      <div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20'>
        <p className='text-xs text-blue-900 dark:text-blue-100'>
          💡 <strong>Tip:</strong> Esta es una vista previa de cómo se dividirá
          el gasto. Verifica que los montos sean correctos antes de guardar.
        </p>
      </div>
    </div>
  );
}
