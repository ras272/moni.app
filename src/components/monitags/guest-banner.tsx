'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import Link from 'next/link';

interface GuestBannerProps {
  /** Nombre del invitado */
  guestName: string;
  /** Si se puede cerrar el banner */
  dismissible?: boolean;
}

/**
 * Banner flotante para usuarios invitados (sin cuenta)
 *
 * Muestra un mensaje personalizado incentivando al usuario a registrarse
 * para obtener funcionalidades adicionales como notificaciones y crear grupos.
 *
 * @example
 * ```tsx
 * <GuestBanner guestName="Pedro" dismissible />
 * ```
 */
export function GuestBanner({
  guestName,
  dismissible = true
}: GuestBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // No mostrar si fue cerrado
  if (isDismissed) return null;

  return (
    <Card className='border-primary/20 from-primary/5 dark:from-primary/10 relative bg-gradient-to-r to-green-50 dark:to-green-950/20'>
      <div className='flex items-start gap-4 p-4'>
        {/* Icono */}
        <div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
          <Sparkles className='text-primary h-5 w-5' />
        </div>

        {/* Contenido */}
        <div className='flex-1 space-y-2'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='font-semibold'>👋 Hola {guestName}!</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Estás viendo este grupo como invitado.
              </p>
            </div>

            {/* Botón cerrar */}
            {dismissible && (
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 shrink-0'
                onClick={() => setIsDismissed(true)}
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Cerrar</span>
              </Button>
            )}
          </div>

          {/* Beneficios */}
          <div className='text-muted-foreground space-y-1 text-xs'>
            <p className='text-foreground font-medium'>
              Registrate para obtener:
            </p>
            <ul className='ml-4 space-y-0.5'>
              <li>• Notificaciones cuando se agreguen gastos</li>
              <li>• Crear tus propios grupos compartidos</li>
              <li>• Sincronizar entre dispositivos</li>
              <li>• Tu propio @monitag personalizado</li>
            </ul>
          </div>

          {/* CTA */}
          <div className='flex flex-wrap gap-2 pt-2'>
            <Link href='/auth/sign-up'>
              <Button size='sm' className='gap-2'>
                <Sparkles className='h-4 w-4' />
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href='/auth/sign-in'>
              <Button size='sm' variant='outline'>
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
