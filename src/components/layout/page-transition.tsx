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

    // 🚀 PERFORMANCE FIX: Reducir delay de 50ms a 10ms
    // Esto hace la navegación más instantánea
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isTransitioning
          ? 'scale-[0.99] opacity-0 blur-sm'
          : 'blur-0 scale-100 opacity-100'
      } `}
    >
      {children}
    </div>
  );
}
