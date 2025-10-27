'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

import { getCategoryVariant } from '@/data/mock-transactions';
import { TransactionWithRelations } from '@/types/database';
import { formatCurrencyPY } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

export const columns: ColumnDef<TransactionWithRelations>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'transaction_date',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Fecha
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('transaction_date'));
      const formatted = fecha.toLocaleDateString('es-PY');
      return <div className='font-medium'>{formatted}</div>;
    }
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => {
      return <div className='max-w-[300px]'>{row.getValue('description')}</div>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Descripción',
      variant: 'text',
      placeholder: 'Buscar por descripción...'
    }
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <div className='text-right'>
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Monto
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const monto = parseFloat(row.getValue('amount'));
      const tipo = row.original.type;
      const montoConSigno =
        tipo === 'expense' ? -Math.abs(monto) : Math.abs(monto);
      const formatted = formatCurrencyPY(montoConSigno);
      const textColor =
        tipo === 'expense' ? 'text-destructive' : 'text-green-600';

      return (
        <div className={`text-right font-medium ${textColor}`}>{formatted}</div>
      );
    }
  },
  {
    id: 'category',
    header: 'Categoría',
    cell: ({ row }) => {
      const categoria = row.original.category?.name || 'Sin categoría';
      return (
        <Badge variant={getCategoryVariant(categoria as any)}>
          {categoria}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.category?.name || '');
    },
    enableColumnFilter: true,
    meta: {
      label: 'Categoría',
      variant: 'multiSelect',
      options: [
        { label: 'Supermercado', value: 'Supermercado' },
        { label: 'Transporte', value: 'Transporte' },
        { label: 'Restaurante', value: 'Restaurante' },
        { label: 'Servicios', value: 'Servicios' },
        { label: 'Ocio', value: 'Ocio' },
        { label: 'Salud', value: 'Salud' }
      ]
    }
  },
  {
    id: 'account',
    header: 'Cuenta',
    cell: ({ row }) => {
      return <div className='font-medium'>{row.original.account.name}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.account.name);
    },
    enableColumnFilter: true,
    meta: {
      label: 'Cuenta',
      variant: 'multiSelect',
      options: [
        { label: 'Billetera', value: 'Billetera' },
        { label: 'Visión Banco', value: 'Visión Banco' },
        { label: 'Tigo Money', value: 'Tigo Money' }
      ]
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Abrir menú</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <EditTransactionDialog transaction={transaction}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
      );
    },
    enableSorting: false,
    enableHiding: false
  }
];
