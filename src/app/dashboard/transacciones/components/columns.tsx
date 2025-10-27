'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

import { Transaction, getCategoryVariant } from '@/data/mock-transactions';
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

export const columns: ColumnDef<Transaction>[] = [
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
    accessorKey: 'fecha',
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
      const fecha = new Date(row.getValue('fecha'));
      const formatted = fecha.toLocaleDateString('es-PY');
      return <div className='font-medium'>{formatted}</div>;
    }
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => {
      return <div className='max-w-[300px]'>{row.getValue('descripcion')}</div>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Descripción',
      variant: 'text',
      placeholder: 'Buscar por descripción...'
    }
  },
  {
    accessorKey: 'monto',
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
      const monto = parseFloat(row.getValue('monto'));
      const formatted = formatCurrencyPY(monto);
      const textColor = monto < 0 ? 'text-destructive' : 'text-green-600';

      return (
        <div className={`text-right font-medium ${textColor}`}>{formatted}</div>
      );
    }
  },
  {
    accessorKey: 'categoria',
    header: 'Categoría',
    cell: ({ row }) => {
      const categoria = row.getValue('categoria') as Transaction['categoria'];
      return <Badge variant={getCategoryVariant(categoria)}>{categoria}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
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
    accessorKey: 'cuenta',
    header: 'Cuenta',
    cell: ({ row }) => {
      return <div className='font-medium'>{row.getValue('cuenta')}</div>;
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
              transactionDescription={transaction.descripcion}
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
