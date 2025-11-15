'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Pause,
  Play,
  Clock,
  Calendar,
  Wallet,
  Tag
} from 'lucide-react';
import type { RecurringTransactionWithRelations } from '@/lib/supabase/recurring-transactions';
import {
  formatFrequency,
  formatNextOccurrence
} from '@/lib/supabase/recurring-transactions';
import { useToggleRecurring } from '@/hooks/recurring-transactions';
import { toast } from 'sonner';

interface RecurringTransactionCardProps {
  recurring: RecurringTransactionWithRelations;
  onEdit: (recurring: RecurringTransactionWithRelations) => void;
  onDelete: (recurring: RecurringTransactionWithRelations) => void;
}

export function RecurringTransactionCard({
  recurring,
  onEdit,
  onDelete
}: RecurringTransactionCardProps) {
  const toggleMutation = useToggleRecurring();

  const handleToggle = async () => {
    try {
      await toggleMutation.mutateAsync({
        id: recurring.id,
        pause: recurring.is_active
      });

      toast.success(
        recurring.is_active ? 'Recurrencia pausada' : 'Recurrencia reanudada',
        {
          description: recurring.is_active
            ? 'No se generarán más transacciones automáticamente'
            : 'Se volverán a generar transacciones automáticamente'
        }
      );
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudo cambiar el estado de la recurrencia'
      });
    }
  };

  const isExpense = recurring.type === 'expense';
  const statusColor = recurring.is_active
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-md'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          {/* Contenido principal */}
          <div className='flex-1 space-y-2'>
            {/* Header: Descripción y monto */}
            <div className='flex items-start justify-between'>
              <div>
                <h3 className='font-semibold text-gray-900 dark:text-gray-100'>
                  {recurring.description}
                </h3>
                {recurring.merchant && (
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {recurring.merchant}
                  </p>
                )}
              </div>
              <div className='text-right'>
                <p
                  className={`text-lg font-bold ${
                    isExpense
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {isExpense ? '-' : '+'}
                  {recurring.amount.toLocaleString('es-PY')} Gs.
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className='flex flex-wrap gap-2 text-xs'>
              {/* Frecuencia */}
              <div className='flex items-center gap-1 text-gray-600 dark:text-gray-300'>
                <Clock className='h-3 w-3' />
                <span>
                  {formatFrequency(
                    recurring.frequency,
                    recurring.interval_count
                  )}
                </span>
              </div>

              {/* Próxima ocurrencia */}
              <div className='flex items-center gap-1 text-gray-600 dark:text-gray-300'>
                <Calendar className='h-3 w-3' />
                <span>
                  {formatNextOccurrence(recurring.next_occurrence_date)}
                </span>
              </div>

              {/* Cuenta */}
              {recurring.account && (
                <div className='flex items-center gap-1 text-gray-600 dark:text-gray-300'>
                  <Wallet className='h-3 w-3' />
                  <span>{recurring.account.name}</span>
                </div>
              )}

              {/* Categoría */}
              {recurring.category && (
                <div className='flex items-center gap-1 text-gray-600 dark:text-gray-300'>
                  <Tag className='h-3 w-3' />
                  <span>
                    {recurring.category.icon} {recurring.category.name}
                  </span>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div className='flex items-center gap-2'>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
              >
                {recurring.is_active ? 'Activa' : 'Pausada'}
              </span>
              {recurring.end_date && (
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  Finaliza:{' '}
                  {new Date(recurring.end_date).toLocaleDateString('es-PY')}
                </span>
              )}
            </div>
          </div>

          {/* Menú de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='ml-2 h-8 w-8 p-0'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEdit(recurring)}>
                <Pencil className='mr-2 h-4 w-4' />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggle}
                disabled={toggleMutation.isPending}
              >
                {recurring.is_active ? (
                  <>
                    <Pause className='mr-2 h-4 w-4' />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className='mr-2 h-4 w-4' />
                    Reanudar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(recurring)}
                className='text-red-600 dark:text-red-400'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
