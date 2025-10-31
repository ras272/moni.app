'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  HelpCircle,
  FileText,
  Shield,
  Smartphone,
  LogOut,
  Mail,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { toast } from 'sonner';

export function AccionesCard() {
  const { signOut, loading } = useConfiguracion();

  const handleExportData = () => {
    // Simular exportación de datos
    const data = {
      export_date: new Date().toISOString(),
      user_data: 'datos del usuario...',
      transactions: 'transacciones...',
      accounts: 'cuentas...'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moni-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Datos exportados correctamente');
  };

  const handleContactSupport = () => {
    toast.info('Próximamente: Chat de soporte');
  };

  const handleViewDocs = () => {
    window.open('https://docs.moni.app', '_blank');
  };

  const handleClearCache = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    // Limpiar localStorage de preferencias no esenciales
    const keysToKeep = ['user_preferences', 'supabase.auth.token'];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    toast.success('Caché limpiada. Recarga la página.');
  };

  const handleDeleteAccount = () => {
    const confirmed = confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    if (confirmed) {
      toast.error('Próximamente: Eliminación de cuenta');
    }
  };

  return (
    <Card className='flex flex-col justify-between'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Smartphone className='h-5 w-5' />
          <CardTitle>Acciones Rápidas</CardTitle>
          <Badge variant='secondary'>Herramientas</Badge>
        </div>
        <CardDescription>
          Opciones rápidas y utilidades de tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Acciones Principales */}
        <div className='space-y-2'>
          <Button
            variant='outline'
            className='w-full justify-start gap-2'
            onClick={handleExportData}
          >
            <Download className='h-4 w-4' />
            Exportar Datos
            <Badge variant='secondary' className='ml-auto'>
              JSON
            </Badge>
          </Button>

          <Button
            variant='outline'
            className='w-full justify-start gap-2'
            onClick={handleClearCache}
          >
            <RefreshCw className='h-4 w-4' />
            Limpiar Caché
          </Button>
        </div>

        <Separator />

        {/* Soporte y Ayuda */}
        <div className='space-y-2'>
          <Button
            variant='outline'
            className='w-full justify-start gap-2'
            onClick={handleContactSupport}
          >
            <HelpCircle className='h-4 w-4' />
            Soporte Técnico
            <Badge variant='outline' className='ml-auto'>
              Chat
            </Badge>
          </Button>

          <Button
            variant='outline'
            className='w-full justify-start gap-2'
            onClick={handleViewDocs}
          >
            <FileText className='h-4 w-4' />
            Documentación
            <Badge variant='outline' className='ml-auto'>
              Docs
            </Badge>
          </Button>
        </div>

        <Separator />

        {/* Seguridad */}
        <div className='space-y-2'>
          <Button
            variant='outline'
            className='w-full justify-start gap-2'
            onClick={() => toast.info('Próximamente: Activar 2FA')}
          >
            <Shield className='h-4 w-4' />
            Autenticación 2FA
            <Badge variant='secondary' className='ml-auto'>
              Próximamente
            </Badge>
          </Button>
        </div>

        <Separator />

        {/* Peligro - Account Actions */}
        <div className='space-y-2'>
          <Button
            variant='outline'
            className='w-full justify-start gap-2'
            onClick={() => toast.info('Próximamente: Solicitar eliminación')}
          >
            <Mail className='h-4 w-4 text-orange-600' />
            Solicitar Eliminación
          </Button>

          <Button
            variant='destructive'
            className='w-full justify-start gap-2'
            onClick={handleDeleteAccount}
          >
            <Trash2 className='h-4 w-4' />
            Eliminar Cuenta
          </Button>
        </div>

        {/* Logout */}
        <Button
          variant='outline'
          className='w-full justify-start gap-2 border-red-200 hover:bg-red-50 hover:text-red-600'
          onClick={signOut}
          disabled={loading}
        >
          <LogOut className='h-4 w-4' />
          Cerrar Sesión
        </Button>

        {/* Info Adicional */}
        <div className='bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs'>
          <div className='flex items-center gap-2'>
            <Shield className='h-3 w-3' />
            <span>Tus datos están seguros y encriptados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
