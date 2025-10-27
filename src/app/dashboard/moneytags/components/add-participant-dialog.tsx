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
import { toast } from 'sonner';
import { addParticipantAction } from '@/app/dashboard/actions';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddParticipant = async (e: React.FormEvent) => {
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
      // Crear FormData para la Server Action
      const formData = new FormData();
      formData.append('name', identifier.trim());

      // Detectar si es email o teléfono
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
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Añadir a &quot;{groupName}&quot;</DialogTitle>
          <DialogDescription>
            Busca y añade un usuario MONI por su email, teléfono o nombre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddParticipant}>
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
                Si es email o teléfono registrado, se vinculará automáticamente
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
      </DialogContent>
    </Dialog>
  );
}
