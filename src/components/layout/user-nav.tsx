'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { signOut } from '@/app/auth/actions';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

export function UserNav() {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
      toast.success('Sesión cerrada exitosamente');
    });
  };

  if (user) {
    const userForAvatar = {
      imageUrl: user.user_metadata?.avatar_url,
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
      emailAddresses: [{ emailAddress: user.email || '' }]
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <UserAvatarProfile user={userForAvatar} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56'
          align='end'
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
              <p className='text-muted-foreground text-xs leading-none'>
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
            >
              Configuración
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
            {loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
