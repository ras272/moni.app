'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';

interface GuestNameModalProps {
  /** Si el modal está abierto */
  open: boolean;
  /** Callback cuando cambia el estado de apertura */
  onOpenChange: (open: boolean) => void;
  /** Nombre del grupo */
  groupName: string;
  /** Callback cuando el usuario guarda su nombre */
  onSave: (name: string) => void;
  /** Si está procesando el guardado */
  isLoading?: boolean;
}

/**
 * Modal para capturar el nombre de un visitante sin cuenta
 *
 * Se muestra la primera vez que un usuario sin cuenta entra a un grupo público.
 * Guarda el nombre en localStorage para futuras visitas.
 *
 * @example
 * ```tsx
 * <GuestNameModal
 *   open={!hasSession}
 *   onOpenChange={setOpen}
 *   groupName="Asado el Sábado"
 *   onSave={handleSaveName}
 * />
 * ```
 */
export function GuestNameModal({
  open,
  onOpenChange,
  groupName,
  onSave,
  isLoading = false
}: GuestNameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  /**
   * Valida y guarda el nombre del invitado
   */
  const handleSave = () => {
    // Validación
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (trimmedName.length > 50) {
      setError('El nombre es demasiado largo');
      return;
    }

    // Limpiar error y ejecutar callback
    setError('');
    onSave(trimmedName);
  };

  /**
   * Maneja el Enter en el input
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <UserCircle className='text-primary h-6 w-6' />
          </div>
          <DialogTitle className='text-center'>
            Bienvenido a {groupName}
          </DialogTitle>
          <DialogDescription className='text-center'>
            Para ver y participar en este grupo, necesitamos saber tu nombre
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='guest-name'>¿Cómo te llamas?</Label>
            <Input
              id='guest-name'
              placeholder='Tu nombre'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(''); // Limpiar error al escribir
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
              autoComplete='off'
            />
            {error && <p className='text-destructive text-sm'>{error}</p>}
          </div>

          <div className='bg-muted rounded-lg p-3'>
            <p className='text-muted-foreground text-xs'>
              💡 <strong>Sin cuenta, puedes:</strong>
            </p>
            <ul className='text-muted-foreground mt-2 space-y-1 text-xs'>
              <li>• Ver todos los gastos del grupo</li>
              <li>• Ver cuánto debes</li>
              <li>• Agregar tus propios gastos</li>
            </ul>
          </div>

          <div className='border-primary/20 bg-primary/5 rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>
              <strong className='text-primary'>¿Querés más?</strong> Creá una
              cuenta para recibir notificaciones y crear tus propios grupos.
            </p>
          </div>
        </div>

        <div className='flex justify-end gap-3'>
          <Button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className='w-full'
          >
            {isLoading ? 'Guardando...' : 'Entrar al grupo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
