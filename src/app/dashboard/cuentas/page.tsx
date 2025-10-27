import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { mockAccounts } from '@/data/mock-accounts';
import { AddAccountDialog } from './components/add-account-dialog';
import { AccountCard } from './components/account-card';

export const metadata = {
  title: 'MONI - Cuentas'
};

async function getAccounts() {
  return Promise.resolve(mockAccounts);
}

export default async function CuentasPage() {
  const accounts = await getAccounts();

  return (
    <PageContainer scrollable>
      <div className='mx-auto w-full max-w-6xl space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Gestión de Cuentas'
            description='Administra tus fuentes de dinero y visualiza tus saldos.'
          />
          <AddAccountDialog />
        </div>
        <Separator />

        {/* Grid de Cuentas */}
        {accounts.length === 0 ? (
          <div className='flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>
                No tienes cuentas registradas
              </h3>
              <p className='text-muted-foreground mt-2 mb-4 text-sm'>
                Comienza agregando tu primera cuenta para gestionar tus
                finanzas.
              </p>
              <AddAccountDialog />
            </div>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}

        {/* Resumen Total */}
        {accounts.length > 0 && (
          <div className='bg-muted/50 mt-8 rounded-lg border p-6'>
            <h3 className='mb-4 text-lg font-semibold'>Resumen Total</h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-sm'>
                  Total en Guaraníes
                </p>
                <p className='text-2xl font-bold'>
                  ₲{' '}
                  {accounts
                    .filter((acc) => acc.currency === 'PYG')
                    .reduce((sum, acc) => sum + acc.current_balance, 0)
                    .toLocaleString('es-PY')}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm'>
                  Total en Dólares (equiv.)
                </p>
                <p className='text-2xl font-bold'>
                  ${' '}
                  {accounts
                    .filter((acc) => acc.currency === 'USD')
                    .reduce((sum, acc) => sum + acc.current_balance / 7500, 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
