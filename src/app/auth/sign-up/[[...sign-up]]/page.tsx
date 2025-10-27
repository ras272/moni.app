import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'MONI | Crear Cuenta',
  description: 'Crea tu cuenta en MONI para gestionar tus finanzas.'
};

export default function Page() {
  return <SignUpViewPage />;
}
