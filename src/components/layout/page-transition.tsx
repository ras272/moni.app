'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Page Transition con Blur Fade Effect
 * Efecto suave de desenfoque que se aclara cuando cambia la página
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Iniciar transición
    setIsTransitioning(true);

    // Terminar transición después de un momento
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isTransitioning
          ? 'scale-[0.98] opacity-0 blur-sm'
          : 'blur-0 scale-100 opacity-100'
      } `}
    >
      {children}
    </div>
  );
}
