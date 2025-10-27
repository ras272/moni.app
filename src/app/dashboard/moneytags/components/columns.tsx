'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoneyTagGroup } from '@/data/mock-moneytags';
import { formatCurrencyPY } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users } from 'lucide-react';
import Link from 'next/link';

export const columns: ColumnDef<MoneyTagGroup>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre del Grupo',
    cell: ({ row }) => {
      return (
        <div className='font-medium'>
          {row.getValue('name')}
          {row.original.is_settled && (
            <Badge variant='secondary' className='ml-2'>
              Liquidado
            </Badge>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'participants',
    header: 'Participantes',
    cell: ({ row }) => {
      const participants = row.original.participants;
      return (
        <div className='flex items-center gap-2'>
          <Users className='text-muted-foreground h-4 w-4' />
          <span className='font-medium'>{participants.length}</span>
          <span className='text-muted-foreground text-sm'>personas</span>
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'total_spent',
    header: 'Total Gastado',
    cell: ({ row }) => {
      const amount = row.getValue('total_spent') as number;
      return <div className='font-medium'>{formatCurrencyPY(amount)}</div>;
    }
  },
  {
    accessorKey: 'date_created',
    header: 'Fecha de Creación',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date_created'));
      return (
        <div className='text-muted-foreground'>
          {date.toLocaleDateString('es-PY')}
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const group = row.original;
      return (
        <Link href={`/dashboard/moneytags/${group.id}`}>
          <Button variant='ghost' size='sm'>
            <Eye className='mr-2 h-4 w-4' />
            Ver Detalle
          </Button>
        </Link>
      );
    },
    enableSorting: false,
    enableHiding: false
  }
];
