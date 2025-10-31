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
    <Alert>
      <AlertDescription className='flex items-center gap-2'>
        <Share2 className='h-4 w-4 shrink-0' />
        <span className='text-sm font-medium'>Link del grupo:</span>
        <div className='flex flex-1 gap-2'>
          <Input value={groupUrl} readOnly className='h-8 font-mono text-xs' />
          <Button
            variant='outline'
            size='sm'
            onClick={handleCopy}
            className='gap-1.5'
          >
            {copied ? (
              <>
                <Check className='h-3.5 w-3.5' />
                Copiado
              </>
            ) : (
              <>
                <Copy className='h-3.5 w-3.5' />
                Copiar
              </>
            )}
          </Button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleShare}
              className='gap-1.5'
            >
              <Share2 className='h-3.5 w-3.5' />
              Compartir
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
