'use client';

import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/forms/form-input';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { signIn } from '@/app/auth/actions';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Ingresa un email válido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
});

type SignInFormValue = z.infer<typeof formSchema>;

export default function SignInForm() {
  const [loading, startTransition] = useTransition();

  const form = useForm<SignInFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: SignInFormValue) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result = await signIn(formData);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className='w-full space-y-4'>
      <Form
        form={form}
        onSubmit={form.handleSubmit(onSubmit)}
        className='w-full space-y-4'
      >
        <FormInput
          control={form.control}
          name='email'
          label='Email'
          type='email'
          placeholder='tu@email.com'
          disabled={loading}
        />

        <FormInput
          control={form.control}
          name='password'
          label='Contraseña'
          type='password'
          placeholder='••••••••'
          disabled={loading}
        />

        <div className='flex items-center justify-end'>
          <Link
            href='/auth/reset-password'
            className='text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline'
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button disabled={loading} className='w-full' type='submit'>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </Form>

      <div className='text-muted-foreground text-center text-sm'>
        ¿No tienes cuenta?{' '}
        <Link
          href='/auth/sign-up'
          className='text-primary font-medium underline-offset-4 hover:underline'
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}
