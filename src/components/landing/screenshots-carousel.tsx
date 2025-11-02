'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { wrap } from 'popmotion';
import { Smartphone, BarChart3, Users, Wallet } from 'lucide-react';

export interface Screenshot {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  badge: string;
  icon: React.ReactNode;
  backgroundClassName?: string;
}

const screenshots: Screenshot[] = [
  {
    id: 1,
    title: 'Dashboard',
    subtitle: 'Vista completa de tus finanzas',
    description: 'Controla tus gastos e ingresos en tiempo real',
    badge: 'Dashboard',
    icon: <BarChart3 size={14} />,
    backgroundClassName: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 2,
    title: 'WhatsApp',
    subtitle: 'Registra desde tu chat',
    description: 'Agrega gastos sin abrir la app',
    badge: 'WhatsApp',
    icon: <Smartphone size={14} />,
    image: '/whatsapp.png'
  },
  {
    id: 3,
    title: 'Grupos',
    subtitle: 'Gastos compartidos',
    description: 'Divide gastos con amigos fácilmente',
    badge: 'MoniTags',
    icon: <Users size={14} />,
    backgroundClassName: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },
  {
    id: 4,
    title: 'Reportes',
    subtitle: 'Analiza tus finanzas',
    description: 'Gráficos y estadísticas detalladas',
    badge: 'Reportes',
    icon: <Wallet size={14} />,
    backgroundClassName: 'bg-gradient-to-br from-orange-500 to-orange-700'
  }
];

const variants = {
  center: {
    x: '-50%',
    rotate: 0,
    scale: 1,
    opacity: 1,
    zIndex: 3,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.5
    }
  },
  left: {
    x: '-130%',
    rotate: -12,
    scale: 0.85,
    opacity: 0.6,
    zIndex: 2,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.5
    }
  },
  right: {
    x: '30%',
    rotate: 12,
    scale: 0.85,
    opacity: 0.6,
    zIndex: 2,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.5
    }
  },
  hidden: {
    opacity: 0,
    scale: 0.8,
    zIndex: 1,
    transition: { duration: 0.2 }
  }
};

export default function ScreenshotsCarousel() {
  const [internalPage, setInternalPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const interval = 4000; // ms - intervalo más largo para mejor performance

  const setPage = (val: number, dir: number) => {
    setInternalPage(val);
    setDirection(dir);
  };

  const activeIndex = wrap(0, screenshots.length, internalPage);
  const setPageRef = useRef(setPage);

  useEffect(() => {
    setPageRef.current = setPage;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setPageRef.current(internalPage + 1, 1);
    }, interval);
    return () => clearInterval(timer);
  }, [internalPage, interval]);

  const visibleScreenshots = [-1, 0, 1].map(
    (offset) => screenshots[wrap(0, screenshots.length, activeIndex + offset)]
  );

  return (
    <div className='relative flex h-[600px] w-full items-center justify-center md:h-[650px]'>
      <AnimatePresence initial={false} custom={direction}>
        {visibleScreenshots.map((screenshot, index) => (
          <motion.div
            key={screenshot.id}
            custom={direction}
            variants={variants}
            initial='hidden'
            animate={index === 1 ? 'center' : index === 0 ? 'left' : 'right'}
            exit='hidden'
            style={{
              width: '280px',
              height: '500px'
            }}
            className='absolute top-1/2 left-1/2 origin-center -translate-y-1/2 will-change-transform md:h-[580px] md:w-[320px]'
          >
            <div className='relative h-full w-full transform-gpu overflow-hidden rounded-3xl shadow-2xl'>
              {screenshot.backgroundClassName ? (
                <div
                  className={`flex h-full w-full items-center justify-center ${screenshot.backgroundClassName}`}
                >
                  {/* Placeholder para screenshot real */}
                  <div className='text-center text-white'>
                    <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                      {screenshot.icon}
                    </div>
                    <p className='text-lg font-semibold'>
                      Screenshot próximamente
                    </p>
                  </div>
                </div>
              ) : screenshot.image ? (
                <Image
                  src={screenshot.image}
                  alt={screenshot.title}
                  width={400}
                  height={600}
                  className='h-full w-full object-cover'
                />
              ) : null}

              {/* Badge */}
              <div className='absolute top-4 left-4 z-[3]'>
                <span className='flex flex-row items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl'>
                  {screenshot.icon}
                  {screenshot.badge}
                </span>
              </div>

              {/* Content */}
              <div className='absolute bottom-0 z-[3] w-full overflow-hidden rounded-b-3xl p-6 text-white'>
                <p className='mb-1 text-center text-xl font-bold md:text-2xl'>
                  {screenshot.title}
                </p>
                <p className='text-center text-sm opacity-90'>
                  {screenshot.subtitle}
                </p>
                <p className='mt-2 text-center text-xs opacity-75'>
                  {screenshot.description}
                </p>
              </div>

              {/* Simplified blur gradient - mejor performance */}
              <div className='pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-1/2 rounded-b-3xl bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm'></div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
