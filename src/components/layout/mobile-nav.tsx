'use client';

import { navItems, navItemsTools } from '@/constants/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../icons';
import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clickedUrl, setClickedUrl] = useState<string | null>(null);

  // Combinar los items principales que queremos mostrar
  const quickNavItems = [...navItems, ...navItemsTools];

  const handleClick = (e: React.MouseEvent, url: string) => {
    if (url === pathname) return; // No hacer nada si ya estamos en esa página

    e.preventDefault();
    setClickedUrl(url);

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur md:hidden'>
      <div className='scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3'>
        {quickNavItems.map((item) => {
          const Icon = item.icon ? Icons[item.icon] : Icons.logo;
          const isActive = pathname === item.url;
          const isLoading = isPending && clickedUrl === item.url;

          return (
            <Link
              key={item.url}
              href={item.url}
              onClick={(e) => handleClick(e, item.url)}
              className={cn(
                'relative flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                isLoading && 'opacity-70'
              )}
            >
              {isLoading ? (
                <Loader2 className='h-5 w-5 animate-spin' />
              ) : (
                <Icon className='h-5 w-5' />
              )}
              <span className='text-xs font-medium whitespace-nowrap'>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
