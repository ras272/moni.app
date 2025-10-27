'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { settleDebtAction } from '../actions/settle-debt';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrencyPY } from '@/lib/utils';

interface SettleDebtDialogProps {
  groupId: string;
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  debtAmount: number;
  currentUserId?: string;
}

export function SettleDebtDialog({
  groupId,
  debtorId,
  debtorName,
  creditorId,
  creditorName,
  debtAmount,
  currentUserId
}: SettleDebtDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(debtAmount.toString());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if current user is involved in this debt
  const isDebtor = currentUserId === debtorId;
  const isCreditor = currentUserId === creditorId;
  const canSettle = isDebtor || isCreditor;

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseInt(amount, 10);

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Monto inválido', {
        description: 'Ingresa un monto válido mayor a 0'
      });
      return;
    }

    if (parsedAmount > debtAmount) {
      toast.error('Monto excedido', {
        description: `El monto no puede ser mayor a la deuda (${formatCurrencyPY(debtAmount)})`
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await settleDebtAction({
        groupId,
        debtorParticipantId: debtorId,
        creditorParticipantId: creditorId,
        amount: parsedAmount,
        notes: notes.trim() || undefined
      });

      if (result.success) {
        toast.success('¡Pago registrado!', {
          description: `${formatCurrencyPY(parsedAmount)} liquidado correctamente`
        });
        setIsOpen(false);
        setAmount(debtAmount.toString());
        setNotes('');
        router.refresh();
      } else {
        toast.error('Error al registrar pago', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      toast.error('Error al registrar pago', {
        description: 'Ocurrió un error inesperado'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSettle) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <CheckCircle2 className='mr-2 h-4 w-4' />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Liquidar Deuda</DialogTitle>
          <DialogDescription>
            Registra el pago de{' '}
            <span className='font-semibold'>{debtorName}</span> a{' '}
            <span className='font-semibold'>{creditorName}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSettle}>
          <div className='grid gap-4 py-4'>
            {/* Amount */}
            <div className='grid gap-2'>
              <Label htmlFor='amount'>Monto a Pagar</Label>
              <Input
                id='amount'
                type='number'
                placeholder='50000'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                min={1}
                max={debtAmount}
                step={1}
              />
              <p className='text-muted-foreground text-xs'>
                Deuda total: {formatCurrencyPY(debtAmount)}
              </p>
            </div>

            {/* Notes */}
            <div className='grid gap-2'>
              <Label htmlFor='notes'>Notas (opcional)</Label>
              <Textarea
                id='notes'
                placeholder='Ej: Transferencia Bancolombia, Efectivo, etc.'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Info box */}
            <div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20'>
              <p className='text-sm text-blue-900 dark:text-blue-100'>
                💡 <span className='font-medium'>Tip:</span> Puedes registrar
                pagos parciales. La deuda restante seguirá mostrándose.
              </p>
            </div>
          </div>

          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setIsOpen(false);
                setAmount(debtAmount.toString());
                setNotes('');
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Registrar Pago
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
