import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { getConnectionByProfileId } from '@/lib/whatsapp/auth/linking';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppConnectionCard } from './components/connection-card';
import { WhatsAppLinkInstructions } from './components/link-instructions';

export const metadata = {
  title: 'MONI - WhatsApp Bot'
};

async function getProfileId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  return profile?.id || null;
}

export default async function WhatsAppSettingsPage() {
  const profileId = await getProfileId();

  if (!profileId) {
    return (
      <PageContainer scrollable>
        <div className='space-y-4'>
          <Heading
            title='WhatsApp Bot'
            description='Gestiona tus finanzas desde WhatsApp'
          />
          <Separator />
          <div className='text-muted-foreground'>
            Error al cargar tu perfil. Por favor recarga la página.
          </div>
        </div>
      </PageContainer>
    );
  }

  // Obtener conexión actual
  const connection = await getConnectionByProfileId(profileId);

  return (
    <PageContainer scrollable>
      <div className='space-y-6'>
        <div>
          <Heading
            title='WhatsApp Bot'
            description='Registra gastos e ingresos directamente desde WhatsApp'
          />
        </div>

        <Separator />

        {/* Estado de conexión */}
        {connection ? (
          <WhatsAppConnectionCard connection={connection} />
        ) : (
          <WhatsAppLinkInstructions profileId={profileId} />
        )}

        {/* Información adicional */}
        <div className='bg-muted/30 rounded-lg border p-6'>
          <h3 className='mb-3 text-lg font-semibold'>
            ¿Cómo funciona el bot?
          </h3>
          <div className='text-muted-foreground space-y-2 text-sm'>
            <p>
              Una vez vinculado, podrás enviar mensajes al bot de MONI para:
            </p>
            <ul className='ml-6 list-disc space-y-1'>
              <li>
                <strong>Registrar gastos:</strong> "Gasté 50.000 en almuerzo"
              </li>
              <li>
                <strong>Registrar ingresos:</strong> "Cobré 500k de sueldo"
              </li>
              <li>
                <strong>Consultar balance:</strong> "¿Cuánto tengo?"
              </li>
              <li>
                <strong>Ver resumen:</strong> "Resumen de hoy"
              </li>
            </ul>
            <p className='mt-4'>
              El bot detecta automáticamente las categorías y actualiza tu
              dashboard en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
