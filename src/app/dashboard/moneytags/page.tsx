import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { mockMoneyTagGroups } from '@/data/mock-moneytags';
import { CreateGroupDialog } from './components/create-group-dialog';
import { columns } from './components/columns';
import { formatCurrencyPY } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'MONI - MoneyTags'
};

async function getGroups() {
  return Promise.resolve(mockMoneyTagGroups);
}

export default async function MoneyTagsPage() {
  const groups = await getGroups();

  return (
    <PageContainer scrollable>
      <div className='mx-auto w-full max-w-6xl space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='MoneyTags (Gastos Compartidos)'
            description='Organiza gastos con amigos, familia o compañeros de trabajo.'
          />
          <CreateGroupDialog />
        </div>
        <Separator />

        {/* Lista de Grupos */}
        {groups.length === 0 ? (
          <div className='flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>
                No tienes grupos creados
              </h3>
              <p className='text-muted-foreground mt-2 mb-4 text-sm'>
                Crea tu primer grupo para compartir gastos con otras personas.
              </p>
              <CreateGroupDialog />
            </div>
          </div>
        ) : (
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Grupo</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Total Gastado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className='font-medium'>
                        {group.name}
                        {group.is_settled && (
                          <Badge variant='secondary' className='ml-2'>
                            Liquidado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Users className='text-muted-foreground h-4 w-4' />
                        <span className='font-medium'>
                          {group.participants.length}
                        </span>
                        <span className='text-muted-foreground text-sm'>
                          personas
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {formatCurrencyPY(group.total_spent)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(group.date_created).toLocaleDateString('es-PY')}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/moneytags/${group.id}`}>
                        <Button variant='ghost' size='sm'>
                          <Eye className='mr-2 h-4 w-4' />
                          Ver Detalle
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Estadísticas */}
        {groups.length > 0 && (
          <div className='mt-8 grid gap-4 sm:grid-cols-3'>
            <div className='bg-card rounded-lg border p-6'>
              <p className='text-muted-foreground text-sm'>Total de Grupos</p>
              <p className='mt-2 text-3xl font-bold'>{groups.length}</p>
            </div>
            <div className='bg-card rounded-lg border p-6'>
              <p className='text-muted-foreground text-sm'>Grupos Activos</p>
              <p className='mt-2 text-3xl font-bold'>
                {groups.filter((g) => !g.is_settled).length}
              </p>
            </div>
            <div className='bg-card rounded-lg border p-6'>
              <p className='text-muted-foreground text-sm'>Total Compartido</p>
              <p className='mt-2 text-2xl font-bold'>
                {formatCurrencyPY(
                  groups.reduce((sum, g) => sum + g.total_spent, 0)
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
