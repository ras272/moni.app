'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Grid3x3, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PerfilCard } from './perfil-card';
import { PreferenciasCard } from './preferencias-card';
import { AccionesCard } from './acciones-card';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function ConfiguracionView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        // Obtener datos del perfil desde la tabla profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, created_at')
          .eq('auth_id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className='flex w-full flex-col items-center justify-center p-8'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
        <p className='text-muted-foreground mt-4'>Cargando configuración...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='flex w-full flex-col items-center justify-center p-8'>
        <Badge variant='destructive' className='mb-4'>
          <Info className='mr-1 h-3 w-3' />
          Error
        </Badge>
        <p className='text-muted-foreground text-center'>
          No se pudo cargar el perfil. Por favor, recarga la página.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Grid3x3 className='h-6 w-6' />
            <h1 className='text-2xl font-bold tracking-tight'>Configuración</h1>
          </div>
          <p className='text-muted-foreground'>
            Gestiona tu perfil, preferencias y seguridad de cuenta
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>
            <Shield className='mr-1 h-3 w-3' />
            Cuenta Segura
          </Badge>
        </div>
      </div>

      {/* Grid Layout */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Primera Fila: Perfil y Preferencias */}
        <div className='space-y-6 lg:col-span-2'>
          <PerfilCard profile={profile} onProfileUpdate={fetchProfile} />
          <PreferenciasCard />
        </div>

        {/* Segunda Fila: Acciones Rápidas */}
        <div className='lg:col-span-1'>
          <AccionesCard />
        </div>
      </div>
    </div>
  );
}
