'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import SignUpForm from './sign-up-form';
import EmailVerificationSuccess from './email-verification-success';
import { useState } from 'react';

export default function SignUpViewPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // Si ya se registró, mostrar pantalla de verificación
  if (registeredEmail) {
    return (
      <div className='relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
        <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
          <div className='absolute inset-0 bg-zinc-900' />
          <div className='relative z-20 flex items-center text-lg font-medium'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='mr-2 h-6 w-6'
            >
              <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
            </svg>
            MONI
          </div>
          <div className='relative z-20 mt-auto'>
            <blockquote className='space-y-2'>
              <p className='text-lg'>
                &ldquo;Verificar tu email es rápido y te protege. ¡Gracias por
                confiar en MONI!&rdquo;
              </p>
            </blockquote>
          </div>
        </div>
        <div className='flex h-full items-center justify-center p-4 lg:p-8'>
          <EmailVerificationSuccess email={registeredEmail} />
        </div>
      </div>
    );
  }

  // Pantalla de registro normal
  return (
    <div className='relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-in'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 md:top-8 md:right-8'
        )}
      >
        Iniciar Sesión
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          MONI
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;MONI me ayuda a mantener el control total de mis finanzas
              personales y gastos compartidos con amigos.&rdquo;
            </p>
            <footer className='text-sm'>Usuario MONI</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Crear Cuenta
            </h1>
            <p className='text-muted-foreground text-sm'>
              Ingresa tus datos para comenzar con MONI
            </p>
          </div>

          <SignUpForm onSuccess={(email) => setRegisteredEmail(email)} />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            Al continuar, aceptas nuestros{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
