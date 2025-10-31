import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSidebarStats } from '@/lib/supabase/sidebar-stats';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
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

  // Obtener estadísticas del sidebar
  const stats = await getSidebarStats();

  return (
    <>
      <NextTopLoader color='var(--primary)' showSpinner={false} />
      <NuqsAdapter>
        <Providers activeThemeValue={activeThemeValue as string}>
          <Toaster />
          <KBar>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar stats={stats} />
              <SidebarInset>
                <Header />
                {/* page main content */}
                {children}
                {/* page main content ends */}
              </SidebarInset>
            </SidebarProvider>
          </KBar>
        </Providers>
      </NuqsAdapter>
    </>
  );
}
