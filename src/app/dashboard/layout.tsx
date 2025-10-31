import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import Providers from '@/components/layout/providers';
import { PageTransition } from '@/components/layout/page-transition';
import { Toaster } from '@/components/ui/sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSidebarStatsUnified } from '@/lib/supabase/dashboard-unified';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../theme.css';

export const metadata: Metadata = {
  title: 'MONI - Dashboard',
  description: 'App de finanzas personales para Paraguay'
};

/**
 * Dashboard Layout con providers optimizados
 * NextTopLoader, NuqsAdapter, React Query y Toaster solo se cargan en el dashboard
 */
export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const activeThemeValue = cookieStore.get('active_theme')?.value;

  // 🚀 PERFORMANCE FIX: Eliminar stats del sidebar completamente
  // Esto elimina el bloqueo de navegación (~1s de delay)
  // El sidebar ahora solo muestra navegación básica

  return (
    <NuqsAdapter>
      <Providers activeThemeValue={activeThemeValue as string}>
        <Toaster />
        <KBar>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <Header />
              {/* page main content with blur fade transition */}
              <PageTransition>{children}</PageTransition>
              {/* page main content ends */}
            </SidebarInset>
          </SidebarProvider>
        </KBar>
      </Providers>
    </NuqsAdapter>
  );
}
