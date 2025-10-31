'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userId: string;
  userName: string | null;
  onAvatarUpdate: (url: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userId,
  userName,
  onAvatarUpdate
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de archivo no válido. Usa JPG, PNG, WebP o GIF');
        return;
      }

      // Validar tamaño (2MB)
      if (file.size > 2097152) {
        toast.error('El archivo es muy grande. Máximo 2MB');
        return;
      }

      setUploading(true);

      // Crear preview local
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Eliminar avatar anterior si existe
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Subir nuevo archivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);

      // Actualizar profile en la base de datos
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuario no encontrado');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('auth_id', user.id);

      if (updateError) throw updateError;

      // Actualizar user_metadata también para sincronización
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      onAvatarUpdate(publicUrl);
      toast.success('Avatar actualizado correctamente');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Error al subir el avatar');
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='group relative'>
      <Avatar className='h-20 w-20'>
        <AvatarImage src={previewUrl || ''} />
        <AvatarFallback className='bg-primary text-primary-foreground text-2xl'>
          {userName?.slice(0, 2).toUpperCase() || 'US'}
        </AvatarFallback>
      </Avatar>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        onChange={handleFileSelect}
        className='hidden'
        disabled={uploading}
      />
      <Button
        size='sm'
        variant='outline'
        className='absolute -right-2 -bottom-2 h-8 w-8 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100'
        onClick={handleButtonClick}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className='h-3 w-3 animate-spin' />
        ) : (
          <Upload className='h-3 w-3' />
        )}
      </Button>
    </div>
  );
}
