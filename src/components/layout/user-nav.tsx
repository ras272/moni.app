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
import { useProfile } from '@/hooks/use-profile';

export function UserNav() {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const { profile } = useProfile();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
      toast.success('Sesión cerrada exitosamente');
    });
  };

  if (profile) {
    const userForAvatar = {
      imageUrl: profile.avatar_url || undefined,
      fullName: profile.full_name,
      emailAddresses: [{ emailAddress: profile.email }]
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
                {profile.full_name}
              </p>
              <p className='text-muted-foreground text-xs leading-none'>
                {profile.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/configuracion')}
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
