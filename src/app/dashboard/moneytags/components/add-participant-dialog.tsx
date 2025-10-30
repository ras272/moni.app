'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { addParticipantAction } from '@/app/dashboard/actions';
import { useRouter } from 'next/navigation';
import { UserPlus, Search, UserCircle } from 'lucide-react';
import { MonitagSearchCombobox } from '@/components/monitags';
import type { MonittagSearchResult } from '@/types/monitags';
import { useGroupParticipantManagement } from '@/hooks/monitags';

interface AddParticipantDialogProps {
  groupId: string;
  groupName: string;
}

export function AddParticipantDialog({
  groupId,
  groupName
}: AddParticipantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [selectedMonitag, setSelectedMonitag] = useState<
    MonittagSearchResult | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addByMonitag, isAddingByMonitag } = useGroupParticipantManagement();

  const handleAddByMonitag = async () => {
    if (!selectedMonitag) {
      toast.error('Selecciona un usuario', {
        description: 'Por favor, busca y selecciona un @monitag'
      });
      return;
    }

    try {
      await addByMonitag({
        groupId,
        monitag: selectedMonitag.monitag
      });

      toast.success('¡Participante agregado!', {
        description: `@${selectedMonitag.monitag} se unió al grupo "${groupName}".`
      });
      setIsOpen(false);
      setSelectedMonitag(undefined);
      router.refresh();
    } catch (error: any) {
      toast.error('Error al agregar participante', {
        description: error.message || 'Ocurrió un error inesperado'
      });
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Error de entrada', {
        description:
          'Por favor, introduce el email, teléfono o nombre del usuario.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', identifier.trim());

      if (identifier.includes('@')) {
        formData.append('email', identifier.trim());
      } else if (
        identifier.startsWith('+') ||
        /^\d+$/.test(identifier.trim())
      ) {
        formData.append('phone', identifier.trim());
      }

      const result = await addParticipantAction(groupId, formData);

      if (result.success) {
        toast.success('¡Participante agregado!', {
          description: `Se añadió a ${identifier} al grupo "${groupName}".`
        });
        setIsOpen(false);
        setIdentifier('');
        router.refresh();
      } else {
        toast.error('Error al agregar participante', {
          description: result.error || 'Ocurrió un error inesperado'
        });
      }
    } catch (error) {
      toast.error('Error al agregar participante', {
        description: 'Ocurrió un error inesperado'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <UserPlus className='mr-2 h-4 w-4' />
          Agregar Participante
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Añadir a &quot;{groupName}&quot;</DialogTitle>
          <DialogDescription>
            Busca por @monitag o agrega manualmente por email/teléfono
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='monitag' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='monitag' className='gap-2'>
              <Search className='h-4 w-4' />
              Por @monitag
            </TabsTrigger>
            <TabsTrigger value='manual' className='gap-2'>
              <UserCircle className='h-4 w-4' />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value='monitag' className='space-y-4'>
            <div className='space-y-3 py-4'>
              <Label>Buscar usuario</Label>
              <MonitagSearchCombobox
                value={selectedMonitag?.monitag}
                onSelect={setSelectedMonitag}
                placeholder='Buscar por @monitag...'
              />
              {selectedMonitag && (
                <div className='bg-muted flex items-center gap-3 rounded-lg p-3'>
                  <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                    <span className='text-primary text-sm font-semibold'>
                      {selectedMonitag.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className='flex-1'>
                    <p className='font-medium'>{selectedMonitag.full_name}</p>
                    <p className='text-muted-foreground text-sm'>
                      @{selectedMonitag.monitag}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsOpen(false);
                  setSelectedMonitag(undefined);
                }}
                disabled={isAddingByMonitag}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddByMonitag}
                disabled={!selectedMonitag || isAddingByMonitag}
              >
                {isAddingByMonitag ? 'Agregando...' : 'Agregar al Grupo'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='manual'>
            <form onSubmit={handleAddManual}>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='identifier'>Email, Teléfono o Nombre</Label>
                  <Input
                    id='identifier'
                    placeholder='email@ejemplo.com, +595981123456 o Juan Pérez'
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    autoComplete='off'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Si es email o teléfono registrado, se vinculará
                    automáticamente
                  </p>
                </div>
              </div>
              <div className='flex justify-end gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsOpen(false);
                    setIdentifier('');
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? 'Agregando...' : 'Añadir Usuario'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
