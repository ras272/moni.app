import { Metadata } from 'next';
import VerifiedView from '@/features/auth/components/verified-view';

export const metadata: Metadata = {
  title: 'MONI | Cuenta Verificada',
  description: 'Tu cuenta ha sido verificada exitosamente.'
};

export default function Page() {
  return <VerifiedView />;
}
