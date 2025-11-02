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
import { CreateGroupDialog } from './components/create-group-dialog';
import { formatCurrencyPY } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetchMoneyTagGroupsServer } from '@/lib/supabase/moneytags-server';

export const metadata = {
  title: 'MONI - MoniTags'
};

export default async function MoneyTagsPage() {
  const groups = await fetchMoneyTagGroupsServer(false);

  return (
    <PageContainer scrollable>
      <div className='mx-auto w-full max-w-6xl space-y-4 px-4 sm:px-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <Heading
            title='MoniTags'
            description='Organiza gastos con amigos, familia o compañeros de trabajo.'
          />
          <CreateGroupDialog />
        </div>
        <Separator />

        {/* Lista de Grupos */}
        {groups.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-6 sm:min-h-[400px]'>
            <div className='text-center'>
              <h3 className='text-base font-semibold sm:text-lg'>
                No tienes grupos creados
              </h3>
              <p className='text-muted-foreground mt-2 mb-4 text-xs sm:text-sm'>
                Crea tu primer grupo para compartir gastos con otras personas.
              </p>
              <CreateGroupDialog />
            </div>
          </div>
        ) : (
          <>
            {/* Vista de Cards para Móvil */}
            <div className='space-y-3 md:hidden'>
              {groups.map((group) => (
                <div key={group.id} className='bg-card rounded-lg border p-4'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='flex-1'>
                      <h3 className='font-semibold'>{group.name}</h3>
                      {group.is_settled && (
                        <Badge variant='secondary' className='mt-1 text-xs'>
                          Liquidado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Participantes:
                      </span>
                      <div className='flex items-center gap-1.5'>
                        <Users className='text-muted-foreground h-3.5 w-3.5' />
                        <span className='font-medium'>
                          {group.participant_count || 0}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Total Gastado:
                      </span>
                      <span className='font-medium'>{formatCurrencyPY(0)}</span>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Creado:
                      </span>
                      <span className='text-xs'>
                        {new Date(group.created_at).toLocaleDateString('es-PY')}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/moneytags/${group.id}`}
                    className='mt-3 block'
                  >
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full text-xs'
                    >
                      <Eye className='mr-1.5 h-3.5 w-3.5' />
                      Ver Detalle
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {/* Vista de Tabla para Desktop */}
            <div className='hidden rounded-lg border md:block'>
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
                            {group.participant_count || 0}
                          </span>
                          <span className='text-muted-foreground text-sm'>
                            personas
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {formatCurrencyPY(0)}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(group.created_at).toLocaleDateString('es-PY')}
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
          </>
        )}

        {/* Estadísticas */}
        {groups.length > 0 && (
          <div className='mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4'>
            <div className='bg-card rounded-lg border p-4 sm:p-6'>
              <p className='text-muted-foreground text-xs sm:text-sm'>
                Total de Grupos
              </p>
              <p className='mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl'>
                {groups.length}
              </p>
            </div>
            <div className='bg-card rounded-lg border p-4 sm:p-6'>
              <p className='text-muted-foreground text-xs sm:text-sm'>
                Grupos Activos
              </p>
              <p className='mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl'>
                {groups.filter((g) => !g.is_settled).length}
              </p>
            </div>
            <div className='bg-card rounded-lg border p-4 sm:p-6'>
              <p className='text-muted-foreground text-xs sm:text-sm'>
                Total Compartido
              </p>
              <p className='mt-1 text-xl font-bold sm:mt-2 sm:text-2xl'>
                {formatCurrencyPY(0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
