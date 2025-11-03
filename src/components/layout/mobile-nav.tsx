'use client';

import { navItems, navItemsTools } from '@/constants/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';

export function MobileNav() {
  const pathname = usePathname();

  // Combinar los items principales que queremos mostrar
  const quickNavItems = [...navItems, ...navItemsTools];

  return (
    <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur md:hidden'>
      <div className='scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3'>
        {quickNavItems.map((item) => {
          const Icon = item.icon ? Icons[item.icon] : Icons.logo;
          const isActive = pathname === item.url;

          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                'flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className='h-5 w-5' />
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
