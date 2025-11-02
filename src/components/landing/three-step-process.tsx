'use client';

import { Users, Plus, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ThreeStepProcess() {
  const steps = [
    {
      number: '1',
      icon: Users,
      title: 'Crea un grupo',
      description: 'Invita amigos o compañeros'
    },
    {
      number: '2',
      icon: Plus,
      title: 'Agrega gastos',
      description: 'Registra quien pagó qué'
    },
    {
      number: '3',
      icon: Calculator,
      title: 'Divide automáticamente',
      description: 'Moni calcula quién debe a quién'
    }
  ];

  return (
    <section className='relative z-10 -mt-[320px] bg-white pt-8 pb-20 md:-mt-[420px] md:pt-12 md:pb-24'>
      <div className='relative mx-auto max-w-5xl px-6'>
        <div className='mb-8 text-center'>
          <p className='text-sm font-medium tracking-wider text-zinc-600 uppercase'>
            Así de simple
          </p>
          <h2 className='mt-2 text-2xl font-bold text-zinc-950 md:text-3xl'>
            Comienza en 3 pasos
          </h2>
        </div>

        <div className='grid gap-4 md:grid-cols-3 md:gap-6'>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className='relative overflow-hidden border bg-white'
              >
                <CardContent className='flex flex-col items-center p-6 text-center'>
                  {/* Step number badge - minimalista */}
                  <div className='relative mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-200 bg-white'>
                    <Icon className='h-7 w-7 text-zinc-700' strokeWidth={1.5} />
                    <span className='absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700'>
                      {step.number}
                    </span>
                  </div>

                  {/* Step content */}
                  <h3 className='mb-2 text-base font-semibold text-zinc-950'>
                    {step.title}
                  </h3>
                  <p className='text-sm text-zinc-600'>{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
