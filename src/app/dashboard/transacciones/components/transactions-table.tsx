'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrencyPY } from '@/lib/utils';
import { TransactionWithRelations } from '@/types/database';
import { getCategoryVariant } from '@/data/mock-transactions';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EditTransactionDialog } from './edit-transaction-dialog';
import { DeleteTransactionDialog } from './delete-transaction-dialog';

interface TransactionsTableProps<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function TransactionsTable<TData, TValue>({
  data,
  totalItems,
  columns
}: TransactionsTableProps<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  const transactions = data as TransactionWithRelations[];

  return (
    <>
      {/* Vista de Cards para Móvil */}
      <div className='flex flex-col space-y-4 md:hidden'>
        {/* Debug: Log mobile rendering */}
        {console.log(
          'Mobile cards rendering, data length:',
          transactions.length
        )}
        <DataTableToolbar table={table} />

        {transactions.length === 0 ? (
          <div className='flex min-h-[300px] items-center justify-center rounded-lg border border-dashed'>
            <div className='text-center'>
              <p className='text-muted-foreground text-sm'>
                No hay transacciones
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            {transactions.map((transaction) => {
              const monto = parseFloat(transaction.amount.toString());
              const tipo = transaction.type;
              const montoConSigno =
                tipo === 'expense' ? -Math.abs(monto) : Math.abs(monto);
              const formatted = formatCurrencyPY(montoConSigno);
              const textColor =
                tipo === 'expense' ? 'text-destructive' : 'text-green-600';

              return (
                <div
                  key={transaction.id}
                  className='bg-card rounded-lg border p-4'
                >
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='min-w-0 flex-1'>
                      <h3 className='truncate text-sm font-semibold'>
                        {transaction.description}
                      </h3>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {new Date(
                          transaction.transaction_date
                        ).toLocaleDateString('es-PY')}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(transaction.id)
                          }
                        >
                          Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditTransactionDialog transaction={transaction}>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            Editar Transacción
                          </DropdownMenuItem>
                        </EditTransactionDialog>
                        <DeleteTransactionDialog
                          transactionId={transaction.id}
                          transactionDescription={transaction.description}
                        >
                          <DropdownMenuItem
                            className='text-destructive'
                            onSelect={(e) => e.preventDefault()}
                          >
                            Eliminar Transacción
                          </DropdownMenuItem>
                        </DeleteTransactionDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Monto:
                      </span>
                      <span className={`text-lg font-bold ${textColor}`}>
                        {formatted}
                      </span>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Categoría:
                      </span>
                      <Badge
                        variant={getCategoryVariant(
                          (transaction.category?.name || 'Sin categoría') as any
                        )}
                        className='text-xs'
                      >
                        {transaction.category?.name || 'Sin categoría'}
                      </Badge>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Cuenta:
                      </span>
                      <span className='text-sm font-medium'>
                        {transaction.account.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vista de Tabla para Desktop */}
      <div className='hidden md:flex md:flex-1 md:flex-col'>
        {/* Debug: Log desktop rendering */}
        {console.log(
          'Desktop table rendering, data length:',
          transactions.length
        )}
        <DataTableToolbar table={table} />
        <DataTable table={table} />
      </div>
    </>
  );
}
