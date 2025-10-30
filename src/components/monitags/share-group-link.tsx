'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Link2, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareGroupLinkProps {
  ownerMonitag: string;
  groupSlug: string;
  groupName: string;
}

/**
 * Card para compartir link del grupo con QR code
 *
 * Características:
 * - Copy to clipboard
 * - QR code generation
 * - Share API (mobile)
 * - URL preview
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

  // QR Code URL (usando API pública)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(groupUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(groupUrl);
      setCopied(true);
      toast.success('Link copiado al portapapeles');

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar link');
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
        text: `Únete al grupo "${groupName}" en Moni`,
        url: groupUrl
      });
    } catch (error) {
      // Usuario canceló el share
      if ((error as Error).name !== 'AbortError') {
        toast.error('Error al compartir');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Share2 className='text-primary h-5 w-5' />
          Compartir Grupo
        </CardTitle>
        <CardDescription>
          Comparte este link para que otros vean el grupo
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='link' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='link' className='gap-2'>
              <Link2 className='h-4 w-4' />
              Link
            </TabsTrigger>
            <TabsTrigger value='qr' className='gap-2'>
              <QrCode className='h-4 w-4' />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value='link' className='space-y-4'>
            {/* URL Input */}
            <div className='space-y-2'>
              <Label htmlFor='group-url'>Link del grupo</Label>
              <div className='flex gap-2'>
                <Input
                  id='group-url'
                  value={groupUrl}
                  readOnly
                  className='font-mono text-sm'
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleCopy}
                  className='shrink-0'
                >
                  {copied ? (
                    <Check className='text-success h-4 w-4' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <Button onClick={handleCopy} className='flex-1 gap-2'>
                <Copy className='h-4 w-4' />
                Copiar Link
              </Button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  onClick={handleShare}
                  variant='outline'
                  className='flex-1 gap-2'
                >
                  <Share2 className='h-4 w-4' />
                  Compartir
                </Button>
              )}
            </div>

            {/* URL Preview */}
            <div className='bg-muted/50 rounded-lg border p-3'>
              <p className='text-muted-foreground mb-1 text-xs'>
                Vista previa:
              </p>
              <p className='font-mono text-sm break-all'>
                moni.app/g/@{ownerMonitag}/{groupSlug}
              </p>
            </div>
          </TabsContent>

          <TabsContent value='qr' className='space-y-4'>
            {/* QR Code */}
            <div className='flex flex-col items-center space-y-4'>
              <div className='rounded-lg border-2 border-dashed p-4'>
                <img
                  src={qrCodeUrl}
                  alt='QR Code del grupo'
                  className='h-48 w-48'
                  loading='lazy'
                />
              </div>

              <p className='text-muted-foreground text-center text-sm'>
                Escanea este código para abrir el grupo
              </p>

              <Button
                variant='outline'
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCodeUrl;
                  link.download = `${groupSlug}-qr.png`;
                  link.click();
                }}
                className='gap-2'
              >
                <QrCode className='h-4 w-4' />
                Descargar QR
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
