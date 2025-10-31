import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ConfiguracionView } from '@/features/configuracion/components/configuracion-view';

export const metadata = {
  title: 'MONI - Configuración'
};

export default function ConfiguracionPage() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 px-4 sm:px-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <Heading
            title='Configuración'
            description='Gestiona tu perfil y preferencias'
          />
        </div>
        <Separator />
        <ConfiguracionView />
      </div>
    </PageContainer>
  );
}
