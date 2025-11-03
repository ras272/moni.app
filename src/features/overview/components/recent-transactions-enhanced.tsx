'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Plane,
  GraduationCap,
  Smartphone,
  Package,
  UtensilsCrossed,
  Car,
  Home,
  ShoppingCart,
  Briefcase,
  Wallet,
  Gamepad2,
  Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyPY } from '@/lib/utils';

interface Transaction {
  id: string;
  account: string;
  type: 'expense' | 'income';
  category: string;
  categoryColor: string;
  amount: number;
  date: string;
  relativeTime: string;
}

interface RecentTransactionsEnhancedProps {
  transactions: Transaction[];
}

const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();

  // Comida y Bebidas
  if (
    categoryLower.includes('comida') ||
    categoryLower.includes('bebida') ||
    categoryLower.includes('supermercado') ||
    categoryLower.includes('alimentación') ||
    categoryLower.includes('restaurante')
  ) {
    return <UtensilsCrossed size={18} />;
  }

  // Transporte
  if (
    categoryLower.includes('transporte') ||
    categoryLower.includes('gasolina') ||
    categoryLower.includes('combustible') ||
    categoryLower.includes('uber') ||
    categoryLower.includes('taxi')
  ) {
    return <Car size={18} />;
  }

  // Vivienda/Servicios
  if (
    categoryLower.includes('vivienda') ||
    categoryLower.includes('alquiler') ||
    categoryLower.includes('servicio') ||
    categoryLower.includes('luz') ||
    categoryLower.includes('agua') ||
    categoryLower.includes('internet')
  ) {
    return <Home size={18} />;
  }

  // Salud
  if (
    categoryLower.includes('salud') ||
    categoryLower.includes('médico') ||
    categoryLower.includes('medicina') ||
    categoryLower.includes('farmacia')
  ) {
    return <Pill size={18} />;
  }

  // Entretenimiento
  if (
    categoryLower.includes('entretenimiento') ||
    categoryLower.includes('ocio') ||
    categoryLower.includes('cine') ||
    categoryLower.includes('juego')
  ) {
    return <Gamepad2 size={18} />;
  }

  // Educación
  if (
    categoryLower.includes('educación') ||
    categoryLower.includes('curso') ||
    categoryLower.includes('libro')
  ) {
    return <GraduationCap size={18} />;
  }

  // Viajes
  if (
    categoryLower.includes('viaje') ||
    categoryLower.includes('hotel') ||
    categoryLower.includes('vuelo')
  ) {
    return <Plane size={18} />;
  }

  // Tecnología
  if (
    categoryLower.includes('tecnología') ||
    categoryLower.includes('electrónica') ||
    categoryLower.includes('software')
  ) {
    return <Smartphone size={18} />;
  }

  // Ingresos (Salario, Freelance, etc)
  if (
    categoryLower.includes('sueldo') ||
    categoryLower.includes('salario') ||
    categoryLower.includes('ingreso') ||
    categoryLower.includes('pago')
  ) {
    return <Briefcase size={18} />;
  }

  if (
    categoryLower.includes('freelance') ||
    categoryLower.includes('extra') ||
    categoryLower.includes('bono')
  ) {
    return <Wallet size={18} />;
  }

  // Compras/Shopping
  if (
    categoryLower.includes('compra') ||
    categoryLower.includes('shopping') ||
    categoryLower.includes('ropa')
  ) {
    return <ShoppingCart size={18} />;
  }

  // Default: Otros Gastos
  return <Package size={18} />;
};

export function RecentTransactionsEnhanced({
  transactions
}: RecentTransactionsEnhancedProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <Card className='w-full transition-shadow duration-300 hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>
            Transacciones Recientes
          </CardTitle>
          <Badge variant='secondary' className='font-normal'>
            Últimos 7 días
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='pb-2'>
        <ScrollArea className='h-[420px] pr-4'>
          <div className='space-y-3'>
            {transactions.length === 0 ? (
              <div className='flex min-h-[200px] items-center justify-center'>
                <p className='text-muted-foreground text-sm'>
                  No hay transacciones recientes
                </p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-all duration-200',
                    hoveredId === transaction.id && '-translate-y-0.5 shadow-md'
                  )}
                  onMouseEnter={() => setHoveredId(transaction.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Avatar
                    className='h-10 w-10'
                    style={{
                      backgroundColor: `${transaction.categoryColor}15`
                    }}
                  >
                    <AvatarFallback
                      className='border-none'
                      style={{
                        backgroundColor: `${transaction.categoryColor}15`,
                        color: transaction.categoryColor
                      }}
                    >
                      {getCategoryIcon(transaction.category)}
                    </AvatarFallback>
                  </Avatar>

                  <div className='min-w-0 flex-1'>
                    <div className='mb-1 flex items-center gap-2'>
                      <p className='truncate text-sm font-medium'>
                        {transaction.account}
                      </p>
                      <Badge
                        variant='secondary'
                        className={cn(
                          'px-2 py-0 text-xs',
                          transaction.type === 'income'
                            ? 'border border-[var(--card-income-border)] bg-[var(--card-income-bg)] text-[var(--success)] hover:bg-[var(--card-income-bg)]'
                            : 'border border-[var(--card-expense-border)] bg-[var(--card-expense-bg)] text-[var(--error)] hover:bg-[var(--card-expense-bg)]'
                        )}
                      >
                        {transaction.category}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      {transaction.relativeTime}
                    </p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <p
                        className={cn(
                          'flex items-center gap-1 text-sm font-semibold',
                          transaction.type === 'income'
                            ? 'text-[var(--success)]'
                            : 'text-[var(--error)]'
                        )}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className='h-3 w-3' />
                        ) : (
                          <ArrowDownRight className='h-3 w-3' />
                        )}
                        {formatCurrencyPY(transaction.amount)}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'flex items-center gap-1 transition-opacity duration-200',
                        hoveredId === transaction.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    >
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-foreground h-8 w-8'
                        onClick={() => console.log('Edit', transaction.id)}
                      >
                        <Edit2 className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-destructive h-8 w-8'
                        onClick={() => console.log('Delete', transaction.id)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className='border-t pt-3'>
        <Button
          variant='ghost'
          className='text-primary hover:bg-primary/10 hover:text-primary w-full'
          onClick={() => (window.location.href = '/dashboard/transacciones')}
        >
          Ver todas las transacciones
          <ArrowUpRight className='ml-2 h-4 w-4' />
        </Button>
      </CardFooter>
    </Card>
  );
}
