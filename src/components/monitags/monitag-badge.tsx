'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMonitag } from '@/lib/validations/monitag';
import { cn } from '@/lib/utils';
import { AtSign } from 'lucide-react';

interface MonitagBadgeProps {
  monitag: string;
  fullName?: string;
  avatarUrl?: string | null;
  variant?: 'default' | 'secondary' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  showAvatar?: boolean;
  className?: string;
}

/**
 * Badge para mostrar un @monitag con opciones de personalización
 *
 * Variantes:
 * - default: Primary color
 * - secondary: Muted background
 * - outline: Border only
 * - success: Green (para confirmaciones)
 *
 * Tamaños:
 * - sm: Compacto
 * - md: Normal
 * - lg: Grande con más info
 */
export function MonitagBadge({
  monitag,
  fullName,
  avatarUrl,
  variant = 'default',
  size = 'md',
  showAvatar = false,
  className
}: MonitagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const variantClasses = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border-primary text-primary',
    success: 'bg-success/10 text-success border-success/20'
  };

  if (size === 'lg' && (showAvatar || fullName)) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
          variantClasses[variant],
          className
        )}
      >
        {showAvatar && (
          <Avatar className='h-5 w-5'>
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className='text-[10px]'>
              {monitag[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className='flex flex-col'>
          <span className='text-sm leading-none font-medium'>
            {formatMonitag(monitag)}
          </span>
          {fullName && (
            <span className='text-muted-foreground mt-0.5 text-xs leading-none'>
              {fullName}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Badge
      variant='outline'
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {showAvatar ? (
        <Avatar className='h-4 w-4'>
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className='text-[8px]'>
            {monitag[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <AtSign className='h-3 w-3' />
      )}
      <span>{monitag}</span>
    </Badge>
  );
}
