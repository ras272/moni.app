import ScreenshotsCarousel from './screenshots-carousel';

export function ScreenshotsSection() {
  return (
    <section className='relative bg-white pt-16 pb-20 md:pt-24 md:pb-32'>
      <div className='mx-auto max-w-6xl px-6'>
        {/* Header */}
        <div className='mb-12 text-center md:mb-16'>
          <p className='text-sm font-medium tracking-wider text-zinc-600 uppercase'>
            Ve Moni en acción
          </p>
          <h2 className='mt-2 text-3xl font-bold text-zinc-950 md:text-4xl'>
            Diseñado para simplicidad
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-base text-zinc-600 md:text-lg'>
            Interfaz intuitiva y elegante para que gestionar tus finanzas sea
            tan fácil como enviar un mensaje.
          </p>
        </div>

        {/* Carousel */}
        <ScreenshotsCarousel />

        {/* Bottom CTA */}
        <div className='mt-12 text-center md:mt-16'>
          <p className='text-sm text-zinc-600'>
            Disponible en <strong>web</strong> y próximamente en{' '}
            <strong>móvil</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
