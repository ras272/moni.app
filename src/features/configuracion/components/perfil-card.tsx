'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Edit, Upload, Shield } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useConfiguracion } from '@/hooks/use-configuracion';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

interface PerfilCardProps {
  profile: Profile;
}

export function PerfilCard({ profile }: PerfilCardProps) {
  const { updateUserProfile, updating } = useConfiguracion();
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.full_name || '');

  useEffect(() => {
    setEditedName(profile.full_name || '');
  }, [profile.full_name]);

  const handleSaveName = async () => {
    const result = await updateUserProfile({ full_name: editedName });
    if (result.success) {
      setEditing(false);
    }
  };

  const handleUploadAvatar = () => {
    toast.info('Próximamente: Subir avatar desde archivo');
  };

  const handleChangePassword = () => {
    toast.info('Próximamente: Cambiar contraseña');
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          <CardTitle>Información Personal</CardTitle>
          <Shield className='h-4 w-4 text-green-600' />
        </div>
        <CardDescription>
          Tu información de cuenta y preferencias
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Avatar y Nombre */}
        <div className='flex items-center gap-4'>
          <div className='group relative'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className='bg-primary text-primary-foreground text-2xl'>
                {profile.full_name?.slice(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <Button
              size='sm'
              variant='outline'
              className='absolute -right-2 -bottom-2 h-8 w-8 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100'
              onClick={handleUploadAvatar}
            >
              <Upload className='h-3 w-3' />
            </Button>
          </div>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold'>
              {profile.full_name || 'Usuario'}
            </h3>
            <p className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Mail className='h-3 w-3' />
              {profile.email}
            </p>
            <div className='mt-2 flex items-center gap-2'>
              <Badge variant='secondary'>Usuario</Badge>
              <Badge variant='outline' className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                {new Date(profile.created_at).getFullYear()}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Campos Editables */}
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='name'>Nombre Completo</Label>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setEditing(!editing)}
                className='h-8 px-2'
              >
                <Edit className='h-3 w-3' />
              </Button>
            </div>
            {editing ? (
              <div className='flex gap-2'>
                <Input
                  id='name'
                  type='text'
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={updating}
                  placeholder='Tu nombre'
                  className='flex-1'
                />
                <Button size='sm' onClick={handleSaveName} disabled={updating}>
                  Guardar
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setEditing(false);
                    setEditedName(profile.full_name || '');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Input
                id='name'
                type='text'
                value={profile.full_name || ''}
                disabled
                className='bg-muted'
              />
            )}
          </div>

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
        </div>

        <Separator />

        {/* Acciones */}
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={handleUploadAvatar}
            className='flex items-center gap-2'
          >
            <Upload className='h-4 w-4' />
            Cambiar Avatar
          </Button>
          <Button
            variant='outline'
            onClick={handleChangePassword}
            className='flex items-center gap-2'
          >
            <Shield className='h-4 w-4' />
            Cambiar Contraseña
          </Button>
        </div>

        {/* Información de Miembro */}
        <div className='bg-muted/50 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Miembro desde</span>
            <span className='text-sm font-medium'>
              {new Date(profile.created_at).toLocaleDateString('es-PY', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
