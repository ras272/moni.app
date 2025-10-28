'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WhatsAppLinkInstructionsProps {
  profileId: string;
}

export function WhatsAppLinkInstructions({
  profileId
}: WhatsAppLinkInstructionsProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '595991234567';

  const generateToken = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/whatsapp/generate-token', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
      } else {
        alert('Error al generar token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Error al generar token');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToken = () => {
    if (!token) return;

    navigator.clipboard.writeText(`Vincular ${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    if (!token) return;

    const message = `Vincular ${token}`;
    const url = `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5' />
          Vincular WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Paso 1: Generar token */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
              1
            </div>
            <h3 className='font-semibold'>Genera tu código de vinculación</h3>
          </div>

          {!token ? (
            <Button
              onClick={generateToken}
              disabled={isGenerating}
              className='w-full'
            >
              {isGenerating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Generando...
                </>
              ) : (
                'Generar Código'
              )}
            </Button>
          ) : (
            <div className='space-y-2'>
              <Label>Tu código (válido por 15 minutos)</Label>
              <div className='flex gap-2'>
                <Input value={`Vincular ${token}`} readOnly className='font-mono' />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={copyToken}
                  title='Copiar'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              {copied && (
                <p className='text-green-600 text-sm'>✓ Código copiado</p>
              )}
            </div>
          )}
        </div>

        {/* Paso 2: Enviar mensaje */}
        {token && (
          <>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
                  2
                </div>
                <h3 className='font-semibold'>Envía el código al bot</h3>
              </div>

              <Button onClick={openWhatsApp} className='w-full' size='lg'>
                <MessageCircle className='mr-2 h-4 w-4' />
                Abrir WhatsApp
                <ExternalLink className='ml-2 h-4 w-4' />
              </Button>

              <p className='text-muted-foreground text-sm'>
                Se abrirá WhatsApp con el mensaje pre-llenado. Solo envíalo y
                recibirás una confirmación.
              </p>
            </div>

            {/* Paso 3: Confirmación */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
                  3
                </div>
                <h3 className='font-semibold'>¡Listo!</h3>
              </div>

              <p className='text-muted-foreground text-sm'>
                Una vez vinculado, podrás registrar gastos e ingresos
                directamente desde WhatsApp.
              </p>
            </div>
          </>
        )}

        {/* Información de seguridad */}
        <div className='bg-muted/50 rounded-md p-4'>
          <p className='mb-2 text-sm font-medium'>🔒 Seguridad</p>
          <ul className='text-muted-foreground space-y-1 text-xs'>
            <li>• El código expira en 15 minutos</li>
            <li>• Solo puedes vincular un número por cuenta</li>
            <li>• Puedes desvincular en cualquier momento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
