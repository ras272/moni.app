import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HeroSection from '@/components/landing/hero-section';
import { ThreeStepProcess } from '@/components/landing/three-step-process';
import { Features } from '@/components/landing/features';
import { ScreenshotsSection } from '@/components/landing/screenshots-section';

/**
 * Landing page
 * Muestra landing para usuarios no autenticados
 * Redirige a dashboard si está autenticado
 */
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Si el usuario está autenticado, redirigir al dashboard
  if (user) {
    redirect('/dashboard/overview');
  }

  // Mostrar landing para usuarios no autenticados
  return (
    <main className='min-h-screen overflow-x-hidden bg-white'>
      <HeroSection />
      <ThreeStepProcess />
      <Features />
      <ScreenshotsSection />
    </main>
  );
}
