import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'MONI | Iniciar Sesión',
  description: 'Inicia sesión en MONI para gestionar tus finanzas.'
};

export default function Page() {
  return <SignInViewPage />;
}
