'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: '¿Qué es Moni?',
    answer:
      'Moni es tu asistente financiero que te ayuda a controlar gastos e ingresos. Registra desde WhatsApp, crea grupos compartidos y obtén reportes automáticos. Todo simple, sin complicaciones.'
  },
  {
    question: '¿Es gratis?',
    answer:
      'Sí, el plan Básico es gratis para siempre. Incluye transacciones ilimitadas, 10 WhatsApp/mes y 1 cuenta. Para funciones avanzadas, tenemos Personal ($4.99) y Familiar ($8.99) con 30 días gratis.'
  },
  {
    question: '¿Necesito conectar mi banco?',
    answer:
      'No. Moni NO se conecta a tu banco, es más seguro así. Registras tus gastos manualmente y Moni organiza todo. Control total sin exponer credenciales bancarias.'
  },
  {
    question: '¿Qué son los grupos compartidos?',
    answer:
      'Son grupos donde divides gastos con amigos o familia. Ideal para viajes o renta compartida. Moni calcula automáticamente quién debe a quién. ¡Olvídate de las hojas de Excel!'
  },
  {
    question: '¿Mis datos están seguros?',
    answer:
      'Sí. Usamos encriptación bancaria, servidores certificados y NUNCA pedimos acceso a tu banco. Tus datos son privados y jamás los compartimos.'
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer:
      'Sí, sin preguntas. Cancelas cuando quieras y vuelves al plan gratuito conservando todos tus datos históricos.'
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className='bg-white py-16 md:py-24'>
      <div className='mx-auto max-w-4xl px-6'>
        {/* Header */}
        <div className='mb-12 text-center md:mb-16'>
          <p className='text-sm font-medium tracking-wider text-zinc-600 uppercase'>
            Preguntas Frecuentes
          </p>
          <h2 className='mt-2 text-3xl font-bold text-zinc-950 md:text-4xl'>
            ¿Tienes dudas? Te ayudamos
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-base text-zinc-600 md:text-lg'>
            Todo lo que necesitas saber sobre Moni
          </p>
        </div>

        {/* FAQ Items */}
        <div className='space-y-4'>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className='overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-[#1F7D67]/30'
            >
              <button
                onClick={() => toggleQuestion(index)}
                className='flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-zinc-50'
              >
                <span className='text-base font-semibold text-zinc-950 md:text-lg'>
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 flex-shrink-0 text-[#1F7D67] transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>

              <div
                className={cn(
                  'grid transition-all duration-200 ease-in-out',
                  openIndex === index
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className='overflow-hidden'>
                  <div className='border-t border-zinc-100 px-6 pt-4 pb-6'>
                    <p className='text-sm leading-relaxed text-zinc-600 md:text-base'>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className='mt-12 rounded-2xl border border-[#1F7D67]/20 bg-gradient-to-br from-[#1F7D67]/5 to-[#1F7D67]/10 p-8 text-center'>
          <h3 className='text-xl font-bold text-zinc-950'>
            ¿No encontraste tu respuesta?
          </h3>
          <p className='mt-2 text-zinc-600'>
            Estamos aquí para ayudarte. Escríbenos y te responderemos pronto.
          </p>
          <a
            href='mailto:hola@moni.app'
            className='mt-4 inline-flex items-center justify-center rounded-lg bg-[#1F7D67] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1F7D67]/90 hover:shadow-lg'
          >
            Contactar Soporte
          </a>
        </div>
      </div>
    </section>
  );
}
