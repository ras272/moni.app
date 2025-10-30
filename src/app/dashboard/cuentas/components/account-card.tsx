'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Account } from '@/types/database';
import { formatCurrencyPY } from '@/lib/utils';
import {
  MoreVertical,
  Wallet,
  Banknote,
  Smartphone,
  DollarSign,
  LucideIcon
} from 'lucide-react';
import { EditAccountDialog } from './edit-account-dialog';
import { DeleteAccountDialog } from './delete-account-dialog';

const iconMap: Record<string, LucideIcon> = {
  Wallet,
  Banknote,
  Smartphone,
  DollarSign
};

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const Icon = iconMap[account.icon] || Wallet;

  const formattedBalance =
    account.currency === 'USD'
      ? `$${(account.current_balance / 7500).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : formatCurrencyPY(account.current_balance);

  return (
    <Card className='group relative overflow-hidden'>
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg transition-colors'>
            <Icon className='text-primary h-5 w-5' />
          </div>
          <div>
            <CardTitle className='text-base font-semibold'>
              {account.name}
            </CardTitle>
            <CardDescription className='text-xs'>
              {account.currency === 'USD' ? 'Dólares' : 'Guaraníes'}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Abrir menú</span>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <EditAccountDialog account={account}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Editar Cuenta
              </DropdownMenuItem>
            </EditAccountDialog>
            <DeleteAccountDialog
              accountId={account.id}
              accountName={account.name}
            >
              <DropdownMenuItem
                className='text-destructive'
                onSelect={(e) => e.preventDefault()}
              >
                Eliminar Cuenta
              </DropdownMenuItem>
            </DeleteAccountDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{formattedBalance}</div>
        <p className='text-muted-foreground mt-1 text-xs'>Saldo actual</p>
      </CardContent>
    </Card>
  );
}
