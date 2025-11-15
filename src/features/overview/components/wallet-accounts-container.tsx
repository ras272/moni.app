'use client';

import { Button } from '@/components/ui/button';
import { WalletAccountEnhanced } from './wallet-account-enhanced';

interface WalletAccount {
  id: string;
  name: string;
  currentBalance: number;
  transactions: number;
  updatedAt: string;
  color: 'primary' | 'info' | 'success' | 'warning';
}

interface WalletAccountsContainerProps {
  walletAccounts: WalletAccount[];
}

export function WalletAccountsContainer({
  walletAccounts
}: WalletAccountsContainerProps) {
  return (
    <div>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>Tus cuentas</h3>
      </div>
      <div className='space-y-4'>
        {walletAccounts.map((wallet, index) => (
          <div
            key={wallet.id}
            className='animate-in fade-in slide-in-from-left-4'
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            <WalletAccountEnhanced {...wallet} />
          </div>
        ))}
        {walletAccounts.length === 0 && (
          <div className='flex min-h-[200px] items-center justify-center rounded-lg border border-dashed'>
            <div className='text-center'>
              <p className='text-muted-foreground text-sm'>
                No hay cuentas disponibles
              </p>
              <Button variant='link' className='mt-2'>
                Crear primera cuenta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
