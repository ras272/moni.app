'use client';

import { useCallback, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type {
  ConfiguracionFormValues,
  UserPreferences
} from '@/features/configuracion/utils/configuracion-schema';

export function useConfiguracion() {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const updateUserProfile = useCallback(
    async (data: Partial<ConfiguracionFormValues>) => {
      setUpdating(true);
      try {
        // Actualizar user_metadata en auth
        const { error: authError } = await supabase.auth.updateUser({
          data: data
        });

        if (authError) throw authError;

        // Actualizar tabla profiles si hay campos relevantes
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user) {
          const profileUpdates: any = {};
          if (data.full_name !== undefined)
            profileUpdates.full_name = data.full_name;
          if (data.avatar_url !== undefined)
            profileUpdates.avatar_url = data.avatar_url;

          if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdates)
              .eq('auth_id', user.id);

            if (profileError) throw profileError;
          }
        }

        toast.success('Perfil actualizado correctamente');
        return { success: true };
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Error al actualizar el perfil');
        return { success: false, error };
      } finally {
        setUpdating(false);
      }
    },
    [supabase]
  );

  const updatePreferences = useCallback(
    async (preferences: Partial<UserPreferences>) => {
      setUpdating(true);
      try {
        // Aquí podrías guardar las preferencias en una tabla de user_preferences
        // Por ahora las guardamos en localStorage
        const currentPrefs = JSON.parse(
          localStorage.getItem('user_preferences') || '{}'
        );
        const updatedPrefs = { ...currentPrefs, ...preferences };
        localStorage.setItem('user_preferences', JSON.stringify(updatedPrefs));

        toast.success('Preferencias actualizadas');
        return { success: true };
      } catch (error) {
        console.error('Error updating preferences:', error);
        toast.error('Error al actualizar preferencias');
        return { success: false, error };
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const getPreferences = useCallback((): UserPreferences | null => {
    try {
      const saved = localStorage.getItem('user_preferences');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard/overview`
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Limpiar preferencias locales al cerrar sesión
      localStorage.removeItem('user_preferences');

      toast.success('Sesión cerrada');
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    loading,
    updating,
    updateUserProfile,
    updatePreferences,
    getPreferences,
    signIn,
    signOut
  };
}
