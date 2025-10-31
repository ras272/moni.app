import { Toaster } from '@/components/ui/sonner';
import { ActiveThemeProvider } from '@/components/active-theme';
import { cookies } from 'next/headers';

/**
 * Auth Layout - Mínimo y rápido
 * Solo carga lo esencial para páginas de autenticación
 */
export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value || '';

  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <Toaster />
      {children}
    </ActiveThemeProvider>
  );
}
