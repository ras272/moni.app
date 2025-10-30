'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrencyPY } from '@/lib/utils';
import type { GroupDebt } from '@/types/database';

interface PublicDebtSummaryProps {
  /** Nombre del visitante actual */
  visitorName: string;
  /** Lista de todas las deudas del grupo */
  debts: GroupDebt[];
}

/**
 * Componente para mostrar el resumen de deuda de un visitante específico
 *
 * Muestra:
 * - Total que debe el visitante
 * - Desglose de a quién le debe y cuánto
 * - Estado: si está al día o tiene deudas pendientes
 *
 * @example
 * ```tsx
 * <PublicDebtSummary
 *   visitorName="Pedro"
 *   debts={allGroupDebts}
 * />
 * ```
 */
export function PublicDebtSummary({
  visitorName,
  debts
}: PublicDebtSummaryProps) {
  /**
   * Filtra las deudas donde el visitante es el deudor
   */
  const visitorDebts = debts.filter(
    (debt) =>
      debt.debtor_name.toLowerCase().trim() === visitorName.toLowerCase().trim()
  );

  console.log('[DEBUG DebtSummary] visitorName:', visitorName);
  console.log('[DEBUG DebtSummary] all debts:', debts);
  console.log('[DEBUG DebtSummary] visitorDebts:', visitorDebts);

  /**
   * Calcula el total adeudado por el visitante
   */
  const totalOwed = visitorDebts.reduce((sum, debt) => {
    console.log(
      '[DEBUG DebtSummary] debt.debt_amount:',
      debt.debt_amount,
      'type:',
      typeof debt.debt_amount
    );
    return sum + Number(debt.debt_amount || 0);
  }, 0);

  /**
   * Verifica si el visitante está al día (no debe nada)
   */
  const isEvenSteven = totalOwed === 0;

  return (
    <Card className='border-primary/20 from-primary/5 to-primary/10 bg-gradient-to-br'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          {isEvenSteven ? (
            <CheckCircle2 className='h-5 w-5 text-green-600' />
          ) : (
            <TrendingUp className='text-primary h-5 w-5' />
          )}
          <div className='flex-1'>
            <CardTitle>Tu Resumen</CardTitle>
            <CardDescription>
              {isEvenSteven ? '¡Estás al día!' : 'Deudas pendientes'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Total adeudado */}
        <div className='bg-background/60 rounded-lg p-4'>
          <p className='text-muted-foreground text-sm font-medium'>
            {isEvenSteven ? 'No debés nada' : 'Total a pagar'}
          </p>
          <p className='text-primary mt-1 text-3xl font-bold'>
            {formatCurrencyPY(totalOwed)}
          </p>
        </div>

        {/* Desglose de deudas */}
        {!isEvenSteven && (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Debés a:</p>
            <div className='space-y-2'>
              {visitorDebts.map((debt, index) => (
                <div
                  key={index}
                  className='bg-background/60 flex items-center justify-between rounded-lg p-3'
                >
                  <div className='flex items-center gap-2'>
                    <div className='bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full'>
                      <span className='text-primary text-xs font-semibold'>
                        {debt.creditor_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <p className='font-medium'>{debt.creditor_name}</p>
                  </div>
                  <p className='text-lg font-bold'>
                    {formatCurrencyPY(Number(debt.debt_amount || 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado */}
        {isEvenSteven ? (
          <Alert className='border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'>
            <CheckCircle2 className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-sm text-green-900 dark:text-green-100'>
              ¡Excelente! No tenés deudas pendientes en este grupo.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className='border-primary/20 bg-primary/5'>
            <AlertCircle className='text-primary h-4 w-4' />
            <AlertDescription className='text-sm'>
              <strong>Recordá:</strong> Coordiná con los miembros del grupo para
              saldar estas deudas.
            </AlertDescription>
          </Alert>
        )}

        {/* Info adicional */}
        <div className='text-muted-foreground rounded-lg border border-dashed p-3 text-xs'>
          💡 <strong>Tip:</strong> Registrate para recibir notificaciones cuando
          se agreguen nuevos gastos o cuando alguien marque una deuda como paga.
        </div>
      </CardContent>
    </Card>
  );
}
