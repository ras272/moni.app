'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Page Transition mejorada con Efecto de Deslizamiento Suave
 * Transición elegante y fluida entre páginas
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [transitionState, setTransitionState] = useState<'idle' | 'out' | 'in'>(
    'idle'
  );

  useEffect(() => {
    // Evitar transición inicial
    if (transitionState === 'idle') {
      setTransitionState('in');
      return;
    }

    // Secuencia de transición suave
    setTransitionState('out');

    const outTimer = setTimeout(() => {
      setTransitionState('in');
    }, 150);

    return () => clearTimeout(outTimer);
  }, [pathname]);

  const getTransitionClasses = () => {
    switch (transitionState) {
      case 'out':
        return 'opacity-0 scale-[0.98] translate-y-2 blur-md';
      case 'in':
        return 'opacity-100 scale-100 translate-y-0 blur-0';
      default:
        return 'opacity-100 scale-100 translate-y-0 blur-0';
    }
  };

  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${getTransitionClasses()}`}
    >
      {children}
    </div>
  );
}
