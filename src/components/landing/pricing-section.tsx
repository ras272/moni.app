'use client';

import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Básico',
    price: 'Gratis',
    period: 'para siempre',
    description: 'Perfecto para empezar a organizar tus finanzas',
    ctaText: 'Comenzar Gratis',
    features: [
      'Transacciones ilimitadas',
      '10 mensajes WhatsApp/mes',
      'Dashboard interactivo en tiempo real',
      'Sin grupos compartidos',
      '1 cuenta bancaria',
      '5 presupuestos',
      'Recordatorios automáticos',
      'Soporte email 24h'
    ]
  },
  {
    name: 'Personal',
    price: '$4.99',
    period: '/mes',
    description: 'Para quienes quieren aprovechar todo el poder de Moni',
    ctaText: 'Comenzar Gratis 30 Días',
    badge: 'Más Popular',
    highlighted: true,
    features: [
      'Todo en Básico, más:',
      'WhatsApp Bot ILIMITADO',
      'Reconocimiento de voz + imágenes + PDF',
      'Grupos compartidos ilimitados',
      'Cuentas ilimitadas',
      'Presupuestos ilimitados',
      'Transacciones recurrentes ilimitadas',
      'Reglas de automatización (10)',
      'Reportes avanzados con IA',
      'Gráficos personalizables',
      'Exportar Excel/PDF avanzado',
      'Previsiones financieras con IA',
      'Soporte prioritario < 2h'
    ]
  },
  {
    name: 'Familiar',
    price: '$8.99',
    period: '/mes',
    description: 'Ideal para familias y parejas que administran juntos',
    ctaText: 'Comenzar Gratis 30 Días',
    features: [
      'Todo en Personal, más:',
      'Hasta 6 usuarios incluidos',
      'Dashboard familiar consolidado',
      'Presupuestos familiares compartidos',
      'Control parental de gastos',
      'Metas financieras familiares',
      'Notificaciones de gastos importantes',
      'Reportes por miembro familiar',
      'Análisis financiero familiar con IA',
      'Gestor de deudas entre miembros',
      'Calendario de pagos compartido',
      'Prioridad absoluta en soporte'
    ]
  }
];

export function PricingSection() {
  return (
    <section className='relative bg-gradient-to-b from-white to-zinc-50 py-16 md:py-24'>
      <div className='mx-auto max-w-7xl px-6'>
        {/* Header */}
        <div className='mb-12 text-center md:mb-16'>
          <p className='text-sm font-medium tracking-wider text-zinc-600 uppercase'>
            Precios simples y transparentes
          </p>
          <h2 className='mt-2 text-3xl font-bold text-zinc-950 md:text-4xl'>
            Elige el plan perfecto para ti
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-base text-zinc-600 md:text-lg'>
            Sin sorpresas, sin letra chica. Prueba gratis 30 días, cancela
            cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className='grid gap-8 md:grid-cols-3 md:gap-6'>
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-xl',
                plan.highlighted
                  ? 'border-[#1F7D67] ring-2 ring-[#1F7D67] ring-offset-2 md:scale-105'
                  : 'border-zinc-200'
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className='absolute -top-4 left-1/2 -translate-x-1/2'>
                  <span className='flex items-center gap-1 rounded-full bg-[#1F7D67] px-3 py-1 text-xs font-semibold text-white shadow-lg'>
                    <Sparkles className='h-3 w-3' />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <div className='mb-4'>
                <h3 className='text-xl font-bold text-zinc-950'>{plan.name}</h3>
                <p className='mt-2 text-sm text-zinc-600'>{plan.description}</p>
              </div>

              {/* Price */}
              <div className='mb-6'>
                <div className='flex items-baseline gap-1'>
                  <span
                    className={cn(
                      'text-4xl font-bold',
                      plan.highlighted ? 'text-[#1F7D67]' : 'text-zinc-950'
                    )}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className='text-sm text-zinc-600'>{plan.period}</span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className={cn(
                  'mb-6 w-full',
                  plan.highlighted
                    ? 'bg-[#1F7D67] hover:bg-[#1F7D67]/90'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                )}
                size='lg'
              >
                {plan.ctaText}
              </Button>

              {/* Features */}
              <div className='flex-1'>
                <ul className='space-y-3'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start gap-3'>
                      <Check
                        className={cn(
                          'mt-0.5 h-5 w-5 flex-shrink-0',
                          plan.highlighted ? 'text-[#1F7D67]' : 'text-zinc-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm',
                          feature.startsWith('Todo en')
                            ? 'font-semibold text-zinc-700'
                            : 'text-zinc-600'
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
