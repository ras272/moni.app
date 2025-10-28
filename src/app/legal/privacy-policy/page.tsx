import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad - MONI',
  description: 'Política de privacidad de la aplicación MONI'
};

export default function PrivacyPolicyPage() {
  return (
    <div className='mx-auto min-h-screen max-w-4xl px-4 py-16'>
      <div className='mb-8'>
        <Link
          href='/'
          className='text-primary mb-4 inline-block hover:underline'
        >
          ← Volver al inicio
        </Link>
        <h1 className='mb-4 text-4xl font-bold'>Política de Privacidad</h1>
        <p className='text-muted-foreground'>
          Última actualización: {new Date().toLocaleDateString('es-PY')}
        </p>
      </div>

      <div className='prose prose-neutral dark:prose-invert max-w-none space-y-6'>
        <section>
          <h2 className='mb-3 text-2xl font-semibold'>1. Introducción</h2>
          <p>
            MONI ('nosotros', 'nuestro' o 'la aplicación') se compromete a
            proteger su privacidad. Esta Política de Privacidad explica cómo
            recopilamos, usamos, divulgamos y protegemos su información cuando
            utiliza nuestra aplicación de gestión financiera personal.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            2. Información que Recopilamos
          </h2>
          <h3 className='mb-2 text-xl font-semibold'>
            2.1 Información proporcionada por usted
          </h3>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Nombre completo y dirección de correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
            <li>
              Información financiera que ingrese manualmente (transacciones,
              cuentas, presupuestos)
            </li>
            <li>Datos de grupos y gastos compartidos</li>
          </ul>

          <h3 className='mt-4 mb-2 text-xl font-semibold'>
            2.2 Información recopilada automáticamente
          </h3>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Dirección IP y datos de conexión</li>
            <li>Tipo de dispositivo y navegador</li>
            <li>Registros de uso de la aplicación</li>
            <li>Cookies y tecnologías similares</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            3. Cómo Usamos su Información
          </h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Proporcionar y mantener los servicios de MONI</li>
            <li>Personalizar su experiencia de usuario</li>
            <li>Procesar transacciones y gestionar su cuenta</li>
            <li>Enviar notificaciones importantes sobre su cuenta</li>
            <li>
              Mejorar nuestros servicios y desarrollar nuevas funcionalidades
            </li>
            <li>Detectar y prevenir fraudes y abusos</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            4. Compartir Información
          </h2>
          <p>
            No vendemos ni alquilamos su información personal a terceros.
            Podemos compartir su información únicamente en los siguientes casos:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              Con su consentimiento explícito (por ejemplo, al compartir gastos
              con otros usuarios)
            </li>
            <li>Con proveedores de servicios que nos ayudan a operar MONI</li>
            <li>
              Cuando sea requerido por ley o para proteger nuestros derechos
              legales
            </li>
            <li>
              En caso de fusión, adquisición o venta de activos (con previo
              aviso)
            </li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>5. Seguridad de Datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas
            apropiadas para proteger su información personal, incluyendo:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Cifrado de datos en tránsito y en reposo</li>
            <li>Autenticación segura mediante Supabase Auth</li>
            <li>Control de acceso basado en roles (RLS)</li>
            <li>Monitoreo continuo de seguridad</li>
            <li>Auditorías regulares de seguridad</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>6. Sus Derechos</h2>
          <p>Usted tiene derecho a:</p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Acceder a su información personal</li>
            <li>Corregir información inexacta o incompleta</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Exportar sus datos en formato portátil</li>
            <li>Optar por no recibir comunicaciones de marketing</li>
            <li>Revocar su consentimiento en cualquier momento</li>
          </ul>
          <p className='mt-4'>
            Para ejercer estos derechos, consulte nuestra{' '}
            <Link
              href='/legal/data-deletion'
              className='text-primary hover:underline'
            >
              página de eliminación de datos
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>7. Retención de Datos</h2>
          <p>
            Conservamos su información personal solo durante el tiempo necesario
            para cumplir los propósitos descritos en esta política, a menos que
            la ley requiera o permita un período de retención más largo.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            8. Servicios de Terceros
          </h2>
          <p>MONI utiliza los siguientes servicios de terceros:</p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              <strong>Supabase:</strong> Base de datos y autenticación
            </li>
            <li>
              <strong>Vercel:</strong> Hosting y despliegue
            </li>
            <li>
              <strong>Meta WhatsApp Business API:</strong> Notificaciones (si
              está habilitado)
            </li>
          </ul>
          <p className='mt-2'>
            Cada servicio tiene su propia política de privacidad que rige el uso
            de su información.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            9. Privacidad de Menores
          </h2>
          <p>
            MONI no está dirigido a menores de 18 años. No recopilamos
            intencionalmente información de menores de edad. Si descubrimos que
            hemos recopilado información de un menor, la eliminaremos de
            inmediato.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            10. Cambios a esta Política
          </h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente. Le
            notificaremos sobre cambios significativos publicando la nueva
            política en esta página y actualizando la fecha de 'Última
            actualización'.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>11. Contacto</h2>
          <p>
            Si tiene preguntas sobre esta Política de Privacidad, puede
            contactarnos en:
          </p>
          <ul className='list-none space-y-1 pl-0'>
            <li>
              <strong>Email:</strong> hello@monipy.pro
            </li>
            <li>
              <strong>Sitio web:</strong>{' '}
              <Link href='/' className='text-primary hover:underline'>
                monipy.pro
              </Link>
            </li>
          </ul>
        </section>

        <div className='mt-12 border-t pt-8'>
          <p className='text-muted-foreground text-center text-sm'>
            Esta política es efectiva a partir del{' '}
            {new Date().toLocaleDateString('es-PY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
