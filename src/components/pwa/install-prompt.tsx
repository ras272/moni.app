'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Download, Share, X, Smartphone, Monitor } from 'lucide-react';

interface InstallPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallPrompt({ open, onOpenChange }: InstallPromptProps) {
  const { deviceType, canAutoPrompt, promptInstall, isInstalled } =
    usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canAutoPrompt) {
      setIsInstalling(true);
      const accepted = await promptInstall();
      setIsInstalling(false);

      if (accepted) {
        onOpenChange(false);
      }
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'ios':
      case 'android':
        return <Smartphone className='text-primary h-16 w-16' />;
      case 'desktop':
        return <Monitor className='text-primary h-16 w-16' />;
      default:
        return <Download className='text-primary h-16 w-16' />;
    }
  };

  const getInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return (
          <div className='space-y-4'>
            <div className='bg-muted/50 space-y-3 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 mt-1 rounded-full p-2'>
                  <Share className='text-primary h-5 w-5' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-semibold'>Paso 1</p>
                  <p className='text-muted-foreground text-sm'>
                    Toca el botón <strong>Compartir</strong> (
                    <Share className='inline h-4 w-4' />) en la barra inferior
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 mt-1 rounded-full p-2'>
                  <Download className='text-primary h-5 w-5' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-semibold'>Paso 2</p>
                  <p className='text-muted-foreground text-sm'>
                    Desplázate y selecciona{' '}
                    <strong>"Agregar a pantalla de inicio"</strong>
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 mt-1 rounded-full p-2'>
                  <span className='text-primary flex h-5 w-5 items-center justify-center font-bold'>
                    ✓
                  </span>
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-semibold'>Paso 3</p>
                  <p className='text-muted-foreground text-sm'>
                    Confirma tocando <strong>"Agregar"</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'android':
        return (
          <div className='space-y-4'>
            {canAutoPrompt ? (
              <p className='text-muted-foreground text-center text-sm'>
                Toca el botón de abajo para instalar Moni en tu dispositivo
              </p>
            ) : (
              <div className='bg-muted/50 space-y-3 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <div className='bg-primary/10 mt-1 rounded-full p-2'>
                    <span className='text-primary h-5 w-5 font-bold'>⋮</span>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-semibold'>Paso 1</p>
                    <p className='text-muted-foreground text-sm'>
                      Toca el menú (⋮) en la esquina superior derecha
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='bg-primary/10 mt-1 rounded-full p-2'>
                    <Download className='text-primary h-5 w-5' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-semibold'>Paso 2</p>
                    <p className='text-muted-foreground text-sm'>
                      Selecciona <strong>"Instalar aplicación"</strong> o{' '}
                      <strong>"Agregar a pantalla de inicio"</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'desktop':
        return (
          <div className='space-y-4'>
            {canAutoPrompt ? (
              <p className='text-muted-foreground text-center text-sm'>
                Haz clic en el botón de abajo para instalar Moni
              </p>
            ) : (
              <div className='bg-muted/50 space-y-3 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <div className='bg-primary/10 mt-1 rounded-full p-2'>
                    <Download className='text-primary h-5 w-5' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-semibold'>Opción 1</p>
                    <p className='text-muted-foreground text-sm'>
                      Busca el icono de instalación (+) en la barra de
                      direcciones
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='bg-primary/10 mt-1 rounded-full p-2'>
                    <span className='text-primary h-5 w-5 font-bold'>⋮</span>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-semibold'>Opción 2</p>
                    <p className='text-muted-foreground text-sm'>
                      Ve a Menú (⋮) → <strong>"Instalar Moni..."</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <p className='text-muted-foreground text-center text-sm'>
            Accede a Moni directamente desde tu pantalla de inicio
          </p>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <button
          onClick={() => onOpenChange(false)}
          className='ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Cerrar</span>
        </button>

        <DialogHeader className='space-y-4 pb-4'>
          <div className='flex justify-center'>{getDeviceIcon()}</div>
          <DialogTitle className='text-center text-2xl'>
            ¡Instala Moni en tu {deviceType === 'desktop' ? 'PC' : 'teléfono'}!
          </DialogTitle>
          <DialogDescription className='text-center'>
            Accede más rápido y disfruta de una experiencia completa
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {getInstructions()}

          <div className='flex flex-col gap-2'>
            {canAutoPrompt ? (
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size='lg'
                className='w-full'
              >
                <Download className='mr-2 h-5 w-5' />
                {isInstalling ? 'Instalando...' : 'Instalar Moni'}
              </Button>
            ) : null}

            <Button
              onClick={() => onOpenChange(false)}
              variant='ghost'
              size='lg'
              className='w-full'
            >
              Tal vez después
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
