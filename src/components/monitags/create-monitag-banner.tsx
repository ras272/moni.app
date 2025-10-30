'use client';

import { useState } from 'react';
import { useCurrentMonitag } from '@/hooks/monitags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { CreateMonitagDialog } from './create-monitag-dialog';

/**
 * Banner para promover la creación de @monitag
 * Aparece en el dashboard si el usuario no tiene @monitag
 *
 * Se puede cerrar y guarda la preferencia en localStorage
 */
export function CreateMonitagBanner() {
  const { data: monitag, isLoading } = useCurrentMonitag();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('monitag-banner-dismissed') === 'true';
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // No mostrar si está cargando
  if (isLoading) {
    return null;
  }

  // No mostrar si ya tiene @monitag
  if (monitag) {
    return null;
  }

  // No mostrar si fue cerrado
  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('monitag-banner-dismissed', 'true');
  };

  return (
    <>
      <Alert className='border-primary/50 from-primary/10 relative bg-gradient-to-r to-transparent'>
        <Sparkles className='text-primary h-4 w-4' />

        <Button
          variant='ghost'
          size='icon'
          className='absolute top-2 right-2 h-6 w-6'
          onClick={handleDismiss}
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Cerrar</span>
        </Button>

        <AlertTitle className='mb-2 text-base font-semibold'>
          Crea tu @monitag para usar MoniTags
        </AlertTitle>

        <AlertDescription className='space-y-3'>
          <p className='text-muted-foreground text-sm'>
            Los @monitags te permiten compartir gastos con amigos y familia de
            forma fácil. Es como tu usuario único en Instagram, pero para gastos
            compartidos.
          </p>

          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={() => setIsDialogOpen(true)}
              className='gap-2'
            >
              <Sparkles className='h-4 w-4' />
              Crear mi @monitag
            </Button>

            <Button variant='ghost' size='sm' onClick={handleDismiss}>
              Quizás después
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <CreateMonitagDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
