'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Hook para detectar cuando Next.js está navegando
 * Útil para mostrar loading states instantáneos
 */
export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Cuando cambia el pathname/searchParams, la navegación terminó
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const startNavigating = () => {
    setIsNavigating(true);
  };

  return { isNavigating, startNavigating };
}
