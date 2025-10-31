import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { TransactionsTable } from './components/transactions-table';
import { columns } from './components/columns';
import { fetchTransactionsServer } from '@/lib/supabase/transactions-server';
import { AddTransactionDialog } from './components/add-transaction-dialog';

export const metadata = {
  title: 'MONI - Transacciones'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function getTransactions() {
  try {
    const transactions = await fetchTransactionsServer();
    return transactions;
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
}

export default async function TransaccionesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const data = await getTransactions();

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 px-4 sm:px-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <Heading
            title='Transacciones'
            description='Revisa y gestiona todos tus gastos e ingresos.'
          />
          <Suspense fallback={null}>
            <AddTransactionDialog />
          </Suspense>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={7} rowCount={10} filterCount={3} />
          }
        >
          <TransactionsTable
            data={data}
            totalItems={data.length}
            columns={columns}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
