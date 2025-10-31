'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareGroupLinkProps {
  ownerMonitag: string;
  groupSlug: string;
  groupName: string;
}

/**
 * Componente compacto para compartir link del grupo
 */
export function ShareGroupLink({
  ownerMonitag,
  groupSlug,
  groupName
}: ShareGroupLinkProps) {
  const [copied, setCopied] = useState(false);

  // Construir URL completa
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const groupUrl = `${baseUrl}/g/@${ownerMonitag}/${groupSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(groupUrl);
      setCopied(true);
      toast.success('Link copiado');

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: groupName,
        text: `Únete al grupo "${groupName}"`,
        url: groupUrl
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Error al compartir');
      }
    }
  };

  return (
    <Alert className='p-3 sm:p-4'>
      <AlertDescription className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2'>
        <div className='flex items-center gap-2'>
          <Share2 className='h-4 w-4 shrink-0' />
          <span className='text-xs font-medium sm:text-sm'>
            Link del grupo:
          </span>
        </div>
        <div className='flex flex-1 flex-col gap-2 sm:flex-row'>
          <Input
            value={groupUrl}
            readOnly
            className='h-8 w-full font-mono text-[10px] sm:text-xs'
          />
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCopy}
              className='flex-1 gap-1.5 text-xs sm:flex-none sm:text-sm'
            >
              {copied ? (
                <>
                  <Check className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                  <span className='sm:inline'>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                  <span className='sm:inline'>Copiar</span>
                </>
              )}
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleShare}
                className='flex-1 gap-1.5 text-xs sm:flex-none sm:text-sm'
              >
                <Share2 className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                <span className='sm:inline'>Compartir</span>
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
