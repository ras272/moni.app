'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WhatsAppConnection } from '@/lib/whatsapp/types';
import { CheckCircle2, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WhatsAppConnectionCardProps {
  connection: WhatsAppConnection;
}

export function WhatsAppConnectionCard({
  connection
}: WhatsAppConnectionCardProps) {
  const router = useRouter();
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleUnlink = async () => {
    if (
      !confirm(
        '¿Estás seguro de desvincular tu WhatsApp? Dejarás de poder usar el bot.'
      )
    ) {
      return;
    }

    setIsUnlinking(true);

    try {
      const response = await fetch('/api/whatsapp/unlink', {
        method: 'POST'
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Error al desvincular WhatsApp');
      }
    } catch (error) {
      console.error('Error unlinking:', error);
      alert('Error al desvincular WhatsApp');
    } finally {
      setIsUnlinking(false);
    }
  };

  const formatPhone = (phone: string) => {
    // Formato: +595 991 234567
    if (phone.startsWith('595')) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle2 className='text-green-500 h-5 w-5' />
            WhatsApp Vinculado
          </CardTitle>
          <Badge variant='default' className='bg-green-500'>
            Activo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Número de teléfono */}
        <div className='flex items-center gap-3'>
          <Phone className='text-muted-foreground h-5 w-5' />
          <div>
            <p className='text-sm font-medium'>Número vinculado</p>
            <p className='text-muted-foreground text-sm'>
              {formatPhone(connection.phone_number)}
            </p>
          </div>
        </div>

        {/* Fecha de vinculación */}
        <div className='flex items-center gap-3'>
          <Calendar className='text-muted-foreground h-5 w-5' />
          <div>
            <p className='text-sm font-medium'>Vinculado desde</p>
            <p className='text-muted-foreground text-sm'>
              {formatDate(connection.linked_at)}
            </p>
          </div>
        </div>

        {/* Última actividad */}
        {connection.last_message_at && (
          <div className='flex items-center gap-3'>
            <AlertCircle className='text-muted-foreground h-5 w-5' />
            <div>
              <p className='text-sm font-medium'>Último mensaje</p>
              <p className='text-muted-foreground text-sm'>
                {formatDate(connection.last_message_at)}
              </p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className='border-t pt-4'>
          <Button
            variant='destructive'
            onClick={handleUnlink}
            disabled={isUnlinking}
            className='w-full'
          >
            {isUnlinking ? 'Desvinculando...' : 'Desvincular WhatsApp'}
          </Button>
        </div>

        {/* Instrucciones rápidas */}
        <div className='bg-muted/50 rounded-md p-4'>
          <p className='mb-2 text-sm font-medium'>Comandos rápidos:</p>
          <ul className='text-muted-foreground space-y-1 text-xs'>
            <li>• "Gasté 50.000 en almuerzo"</li>
            <li>• "¿Cuánto tengo?"</li>
            <li>• "Resumen de hoy"</li>
            <li>• "Ayuda"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
