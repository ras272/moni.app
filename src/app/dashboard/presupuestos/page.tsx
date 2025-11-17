import { Suspense } from 'react';
import { getBudgetStatus } from '@/lib/supabase/budgets';
import { BudgetsPageClient } from './budgets-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Presupuestos | Moni',
  description: 'Gestiona tus presupuestos y controla tus gastos'
};

async function BudgetsContent() {
  const budgets = await getBudgetStatus();

  return <BudgetsPageClient budgets={budgets} />;
}

function BudgetsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Skeleton className='mb-2 h-8 w-48' />
          <Skeleton className='h-4 w-32' />
        </div>
        <Skeleton className='h-10 w-40' />
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-64' />
        ))}
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <div className='container mx-auto space-y-6 p-6'>
      <Suspense fallback={<BudgetsSkeleton />}>
        <BudgetsContent />
      </Suspense>
    </div>
  );
}
