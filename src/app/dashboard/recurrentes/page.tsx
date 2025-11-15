import { Metadata } from 'next';
import { AddRecurringDialog } from '@/components/recurring';
import { RecurringTransactionsList } from './components/recurring-transactions-list';

export const metadata: Metadata = {
  title: 'Transacciones Recurrentes | Moni',
  description:
    'Gestiona tus gastos e ingresos recurrentes. Automatiza tus transacciones mensuales.'
};

export default function RecurrentesPage() {
  return (
    <div className='flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100'>
            Transacciones Recurrentes
          </h1>
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
            Automatiza tus gastos e ingresos que se repiten periódicamente
          </p>
        </div>
        <AddRecurringDialog />
      </div>

      {/* Info Card */}
      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30'>
        <h3 className='mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100'>
          💡 ¿Cómo funcionan las recurrencias?
        </h3>
        <ul className='space-y-1 text-xs text-blue-800 dark:text-blue-200'>
          <li>
            • Las transacciones se generan automáticamente en las fechas
            configuradas
          </li>
          <li>
            • Puedes pausar una recurrencia sin eliminarla para reactivarla
            después
          </li>
          <li>
            • Las transacciones ya creadas no se eliminan al borrar la
            recurrencia
          </li>
          <li>
            • Configura una fecha de fin opcional para que se detenga
            automáticamente
          </li>
        </ul>
      </div>

      {/* Lista de recurrencias */}
      <RecurringTransactionsList />
    </div>
  );
}
