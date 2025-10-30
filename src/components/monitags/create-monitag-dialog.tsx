'use client';

import { useState, useEffect } from 'react';
import { useMonitagWithValidation } from '@/hooks/monitags';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Loader2, AlertCircle, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cleanMonitag, formatMonitag } from '@/lib/validations/monitag';

interface CreateMonitagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (monitag: string) => void;
}

/**
 * Dialog para crear @monitag con validación en tiempo real
 *
 * Características:
 * - Validación de disponibilidad en tiempo real
 * - Sugerencias si no está disponible
 * - Indicadores visuales de estado
 * - Formato automático (limpia @ y lowercase)
 */
export function CreateMonitagDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateMonitagDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const monitag = cleanMonitag(inputValue);

  const {
    isChecking,
    isAvailable,
    isReserved,
    suggestions,
    availabilityError,
    create,
    isCreating,
    createError
  } = useMonitagWithValidation(monitag);

  // Resetear al cerrar
  useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

  // Cerrar y notificar éxito
  const handleSuccess = (createdMonitag: string) => {
    onOpenChange(false);
    onSuccess?.(createdMonitag);
  };

  const handleCreate = () => {
    if (!isAvailable || isCreating) return;

    create(
      { monitag },
      {
        onSuccess: () => handleSuccess(monitag)
      }
    );
  };

  // Estados de validación
  const showValidation = monitag.length >= 3;
  const showError =
    showValidation && !isChecking && (!isAvailable || isReserved);
  const showSuccess = showValidation && !isChecking && isAvailable;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='text-primary h-5 w-5' />
            Crea tu @monitag
          </DialogTitle>
          <DialogDescription>
            Tu @monitag es único y permanente. Elige con cuidado, no podrás
            cambiarlo después.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Input del @monitag */}
          <div className='space-y-2'>
            <Label htmlFor='monitag'>@monitag</Label>
            <div className='relative'>
              <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'>
                @
              </span>
              <Input
                id='monitag'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder='juanpy'
                className={cn(
                  'pl-7',
                  showError &&
                    'border-destructive focus-visible:ring-destructive',
                  showSuccess && 'border-success focus-visible:ring-success'
                )}
                maxLength={20}
                autoComplete='off'
                disabled={isCreating}
              />

              {/* Indicador de estado */}
              {showValidation && (
                <div className='absolute top-1/2 right-3 -translate-y-1/2'>
                  {isChecking && (
                    <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                  )}
                  {showSuccess && <Check className='text-success h-4 w-4' />}
                  {showError && <X className='text-destructive h-4 w-4' />}
                </div>
              )}
            </div>

            {/* Mensaje de estado */}
            {showValidation && (
              <p
                className={cn(
                  'text-sm',
                  showSuccess && 'text-success',
                  showError && 'text-destructive',
                  isChecking && 'text-muted-foreground'
                )}
              >
                {isChecking && 'Verificando disponibilidad...'}
                {showSuccess && `¡${formatMonitag(monitag)} está disponible!`}
                {showError &&
                  isReserved &&
                  'Este @monitag está reservado por el sistema'}
                {showError &&
                  !isReserved &&
                  `${formatMonitag(monitag)} no está disponible`}
                {availabilityError && availabilityError}
              </p>
            )}
          </div>

          {/* Sugerencias */}
          {showError && suggestions.length > 0 && (
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                <p className='mb-2 font-medium'>
                  Prueba con estas alternativas:
                </p>
                <div className='flex flex-wrap gap-2'>
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant='outline'
                      size='sm'
                      onClick={() => setInputValue(suggestion)}
                      disabled={isCreating}
                    >
                      @{suggestion}
                    </Button>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error de creación */}
          {createError && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          {/* Reglas */}
          <div className='bg-muted rounded-lg p-4 text-sm'>
            <p className='mb-2 font-medium'>Reglas del @monitag:</p>
            <ul className='text-muted-foreground space-y-1'>
              <li>• 3-20 caracteres</li>
              <li>• Solo minúsculas, números y guiones bajos (_)</li>
              <li>• No puede empezar ni terminar con guión bajo</li>
              <li>• Una vez creado, no se puede cambiar</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!showSuccess || isCreating}>
            {isCreating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isCreating ? 'Creando...' : 'Crear @monitag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
