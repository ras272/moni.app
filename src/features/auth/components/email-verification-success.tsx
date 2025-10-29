'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EmailVerificationSuccessProps {
  email: string;
}

export default function EmailVerificationSuccess({
  email
}: EmailVerificationSuccessProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className='w-full max-w-md space-y-8'>
      {/* Animación de check */}
      <div className='flex justify-center'>
        <div
          className={`relative transition-all duration-700 ${
            mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        >
          <div className='bg-primary/10 relative rounded-full p-6'>
            <div className='bg-primary absolute inset-0 animate-ping rounded-full opacity-20' />
            <Mail className='text-primary relative h-16 w-16' />
          </div>
        </div>
      </div>

      {/* Título y descripción */}
      <div
        className={`space-y-3 text-center transition-all delay-300 duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className='flex items-center justify-center gap-2'>
          <CheckCircle2 className='h-6 w-6 text-green-500' />
          <h1 className='text-2xl font-bold tracking-tight'>
            ¡Revisa tu correo!
          </h1>
        </div>
        <p className='text-muted-foreground text-sm'>
          Te hemos enviado un enlace de verificación a:
        </p>
        <p className='font-semibold'>{email}</p>
      </div>

      {/* Instrucciones */}
      <div
        className={`bg-muted space-y-4 rounded-lg border p-6 transition-all delay-500 duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className='space-y-3'>
          <div className='flex gap-3'>
            <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
              1
            </div>
            <div>
              <p className='text-sm font-medium'>Abre tu bandeja de entrada</p>
              <p className='text-muted-foreground text-xs'>
                Revisa la carpeta de spam si no lo ves
              </p>
            </div>
          </div>

          <div className='flex gap-3'>
            <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
              2
            </div>
            <div>
              <p className='text-sm font-medium'>
                Haz clic en el enlace de verificación
              </p>
              <p className='text-muted-foreground text-xs'>
                Te redirigirá automáticamente a MONI
              </p>
            </div>
          </div>

          <div className='flex gap-3'>
            <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
              3
            </div>
            <div>
              <p className='text-sm font-medium'>
                ¡Listo! Comienza a usar MONI
              </p>
              <p className='text-muted-foreground text-xs'>
                Gestiona tus finanzas de forma inteligente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de ir al login */}
      <div
        className={`space-y-3 transition-all delay-700 duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <Button asChild className='w-full'>
          <Link href='/auth/sign-in'>
            Ir al inicio de sesión
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>

        <p className='text-muted-foreground text-center text-xs'>
          ¿No recibiste el correo?{' '}
          <button
            onClick={() => window.location.reload()}
            className='text-primary font-medium hover:underline'
          >
            Reenviar
          </button>
        </p>
      </div>
    </div>
  );
}
