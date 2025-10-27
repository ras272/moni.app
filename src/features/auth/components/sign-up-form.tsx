'use client';

import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/forms/form-input';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { signUp } from '@/app/auth/actions';
import Link from 'next/link';

const formSchema = z
  .object({
    full_name: z
      .string()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Ingresa un email válido' }),
    password: z
      .string()
      .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    confirm_password: z.string()
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password']
  });

type SignUpFormValue = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [loading, startTransition] = useTransition();

  const form = useForm<SignUpFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: ''
    }
  });

  const onSubmit = async (data: SignUpFormValue) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result = await signUp(formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('¡Cuenta creada exitosamente!');
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
          name='full_name'
          label='Nombre Completo'
          placeholder='Juan Pérez'
          disabled={loading}
        />

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

        <FormInput
          control={form.control}
          name='confirm_password'
          label='Confirmar Contraseña'
          type='password'
          placeholder='••••••••'
          disabled={loading}
        />

        <Button disabled={loading} className='w-full' type='submit'>
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </Button>
      </Form>

      <div className='text-muted-foreground text-center text-sm'>
        ¿Ya tienes cuenta?{' '}
        <Link
          href='/auth/sign-in'
          className='text-primary font-medium underline-offset-4 hover:underline'
        >
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
