'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export default function ProfileViewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className='flex w-full flex-col items-center justify-center p-8'>
        <p className='text-muted-foreground'>Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='flex w-full flex-col items-center justify-center p-8'>
        <p className='text-muted-foreground'>No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col gap-6 p-4 md:p-6'>
      <div>
        <h1 className='text-3xl font-bold'>Perfil</h1>
        <p className='text-muted-foreground'>
          Gestiona tu información personal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Tu información de cuenta y preferencias
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className='text-2xl'>
                {profile.full_name?.slice(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className='text-lg font-semibold'>
                {profile.full_name || 'Usuario'}
              </h3>
              <p className='text-muted-foreground text-sm'>{profile.email}</p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={profile.email}
                disabled
                className='bg-muted'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='name'>Nombre Completo</Label>
              <Input
                id='name'
                type='text'
                value={profile.full_name || ''}
                disabled
                className='bg-muted'
              />
            </div>
          </div>

          <div className='pt-4'>
            <Button
              variant='outline'
              onClick={() => toast.info('Próximamente: Editar perfil')}
            >
              Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Gestiona tu contraseña y seguridad de cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='outline'
            onClick={() => toast.info('Próximamente: Cambiar contraseña')}
          >
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
