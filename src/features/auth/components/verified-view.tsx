'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function VerifiedView() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className='from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <div className='w-full max-w-md space-y-8'>
        {/* Animación de éxito */}
        <div className='flex justify-center'>
          <div
            className={`relative transition-all duration-1000 ${
              mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <div className='relative rounded-full bg-green-500/10 p-8'>
              <div className='absolute inset-0 animate-ping rounded-full bg-green-500 opacity-20' />
              <CheckCircle2 className='relative h-24 w-24 text-green-500' />
            </div>
          </div>
        </div>

        {/* Título y mensaje */}
        <div
          className={`space-y-4 text-center transition-all delay-300 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className='space-y-2'>
            <div className='flex items-center justify-center gap-2'>
              <Sparkles className='h-5 w-5 text-yellow-500' />
              <h1 className='text-3xl font-bold tracking-tight'>
                ¡Cuenta verificada!
              </h1>
              <Sparkles className='h-5 w-5 text-yellow-500' />
            </div>
            <p className='text-muted-foreground text-lg'>
              Tu email ha sido confirmado exitosamente
            </p>
          </div>

          <div className='bg-muted rounded-lg border p-6'>
            <p className='text-sm'>
              ¡Bienvenido a MONI! 🎉
              <br />
              Ya puedes comenzar a gestionar tus finanzas de forma inteligente.
            </p>
          </div>
        </div>

        {/* Beneficios */}
        <div
          className={`space-y-3 transition-all delay-500 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className='bg-card space-y-3 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs'>
                ✓
              </div>
              <div>
                <p className='text-sm font-medium'>
                  Registra gastos e ingresos
                </p>
                <p className='text-muted-foreground text-xs'>
                  Desde la web o por WhatsApp
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs'>
                ✓
              </div>
              <div>
                <p className='text-sm font-medium'>
                  Control total de tus finanzas
                </p>
                <p className='text-muted-foreground text-xs'>
                  Dashboard con métricas en tiempo real
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs'>
                ✓
              </div>
              <div>
                <p className='text-sm font-medium'>
                  Comparte gastos fácilmente
                </p>
                <p className='text-muted-foreground text-xs'>
                  MoniTags para gastos en grupo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div
          className={`space-y-3 transition-all delay-700 duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <Button asChild className='w-full' size='lg'>
            <Link href='/dashboard'>
              Ir al Dashboard
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>

          <p className='text-muted-foreground text-center text-xs'>
            ¿Necesitas ayuda?{' '}
            <Link
              href='/dashboard/settings'
              className='text-primary font-medium hover:underline'
            >
              Visita la configuración
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
