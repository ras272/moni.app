'use client';
import ShimmerButton from '@/components/ui/shimmer-button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Navbar1 } from './navbar1';
import NewItemsLoading from './new-items-loading';
import WordAnimator from './word-animator';

const HeroSection = () => {
  const words = ['Simple', 'Rapida', 'Inteligente'];

  return (
    <section className='relative h-screen overflow-hidden overflow-x-hidden bg-white pb-20'>
      {/* Navbar */}
      <Navbar1 />

      <article className='relative z-[10] grid px-4 py-16 sm:px-0 md:pt-28 md:pb-20 2xl:pt-32 2xl:pb-24'>
        <div className='mb-6 flex justify-center'>
          <NewItemsLoading />
        </div>
        <h1 className='text-center text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl md:text-6xl xl:text-7xl'>
          <div className='flex flex-col gap-2'>
            <span>Gestiona tus Finanzas</span>
            <span className='flex flex-wrap items-center justify-center gap-2'>
              <span>de Forma</span>
              <WordAnimator
                words={words}
                duration={3}
                className='w-fit rounded-lg border-neutral-200 bg-gray-200 px-3 py-1 italic'
              />
            </span>
          </div>
        </h1>
        <p className='mx-auto mt-5 text-center text-sm text-gray-700 sm:w-[80%] sm:text-lg lg:w-[700px]'>
          Registra gastos, divide cuentas con amigos y organiza tus finanzas{' '}
          <strong>sin salir de WhatsApp</strong>. Con{' '}
          <strong>divisiones flexibles</strong> y{' '}
          <strong>@monitags sociales</strong>.
        </p>
        <div className='mt-6 flex items-center justify-center'>
          <Link href='/auth/sign-up'>
            <ShimmerButton
              borderRadius={'100px'}
              className={cn(
                'flex w-fit items-center gap-2 rounded-full border px-4 py-3 text-white sm:px-6'
              )}
              background={'#1F7D67'}
            >
              <span className='text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white lg:text-base'>
                Comenzar Ahora
              </span>
            </ShimmerButton>
          </Link>
        </div>
      </article>
    </section>
  );
};

export default HeroSection;
