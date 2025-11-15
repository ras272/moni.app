'use client';

import { useRecurringTransactions } from '@/hooks/recurring-transactions';
import { RecurringTransactionCard } from './recurring-transaction-card';
import type { RecurringTransactionWithRelations } from '@/lib/supabase/recurring-transactions';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { EditRecurringDialog } from './edit-recurring-dialog';
import { DeleteRecurringDialog } from './delete-recurring-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function RecurringTransactionsList() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>(
    'all'
  );
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringTransactionWithRelations | null>(null);
  const [deletingRecurring, setDeletingRecurring] =
    useState<RecurringTransactionWithRelations | null>(null);

  // Fetch recurring transactions with filters
  const filters =
    statusFilter === 'all'
      ? undefined
      : { is_active: statusFilter === 'active' };

  const {
    data: recurrings,
    isLoading,
    error
  } = useRecurringTransactions(filters);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>
        <p className='font-semibold'>Error al cargar recurrencias</p>
        <p className='text-sm'>{(error as Error).message}</p>
      </div>
    );
  }

  if (!recurrings || recurrings.length === 0) {
    return (
      <div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900'>
        <p className='text-gray-600 dark:text-gray-400'>
          {statusFilter === 'active' && 'No hay recurrencias activas'}
          {statusFilter === 'paused' && 'No hay recurrencias pausadas'}
          {statusFilter === 'all' &&
            'No hay transacciones recurrentes configuradas'}
        </p>
        <p className='mt-2 text-sm text-gray-500 dark:text-gray-500'>
          Crea una nueva recurrencia para automatizar tus gastos e ingresos.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filtro de estado */}
      <div className='mb-4 flex items-center justify-between'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {recurrings.length} recurrencia{recurrings.length !== 1 ? 's' : ''}
        </p>
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | 'active' | 'paused') =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filtrar por estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todas</SelectItem>
            <SelectItem value='active'>Activas</SelectItem>
            <SelectItem value='paused'>Pausadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de cards */}
      <div className='grid gap-4 sm:grid-cols-1 lg:grid-cols-2'>
        {recurrings.map((recurring) => (
          <RecurringTransactionCard
            key={recurring.id}
            recurring={recurring}
            onEdit={setEditingRecurring}
            onDelete={setDeletingRecurring}
          />
        ))}
      </div>

      {/* Dialogs */}
      {editingRecurring && (
        <EditRecurringDialog
          recurring={editingRecurring}
          open={!!editingRecurring}
          onOpenChange={(open) => !open && setEditingRecurring(null)}
        />
      )}

      {deletingRecurring && (
        <DeleteRecurringDialog
          recurring={deletingRecurring}
          open={!!deletingRecurring}
          onOpenChange={(open) => !open && setDeletingRecurring(null)}
        />
      )}
    </>
  );
}
