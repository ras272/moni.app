'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Profile = {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProfile = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (error) throw error;

        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Escuchar cambios en auth
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { profile, loading, refetch: fetchProfile };
}
