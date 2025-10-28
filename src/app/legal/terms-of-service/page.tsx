import Link from 'next/link';

export const metadata = {
  title: 'Términos de Servicio - MONI',
  description: 'Términos y condiciones de uso de la aplicación MONI'
};

export default function TermsOfServicePage() {
  return (
    <div className='mx-auto min-h-screen max-w-4xl px-4 py-16'>
      <div className='mb-8'>
        <Link
          href='/'
          className='text-primary mb-4 inline-block hover:underline'
        >
          ← Volver al inicio
        </Link>
        <h1 className='mb-4 text-4xl font-bold'>Términos de Servicio</h1>
        <p className='text-muted-foreground'>
          Última actualización: {new Date().toLocaleDateString('es-PY')}
        </p>
      </div>

      <div className='prose prose-neutral dark:prose-invert max-w-none space-y-6'>
        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            1. Aceptación de los Términos
          </h2>
          <p>
            Al acceder y utilizar MONI ('la aplicación', 'el servicio'), usted
            acepta estar sujeto a estos Términos de Servicio y a todas las leyes
            y regulaciones aplicables. Si no está de acuerdo con alguno de estos
            términos, no debe utilizar este servicio.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            2. Descripción del Servicio
          </h2>
          <p>
            MONI es una aplicación de gestión financiera personal que permite a
            los usuarios:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Registrar y categorizar transacciones financieras</li>
            <li>Gestionar múltiples cuentas bancarias y carteras</li>
            <li>Crear y monitorear presupuestos</li>
            <li>Dividir gastos con otros usuarios (MoneyTags)</li>
            <li>Visualizar estadísticas y reportes financieros</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>3. Registro de Cuenta</h2>
          <h3 className='mb-2 text-xl font-semibold'>3.1 Requisitos</h3>
          <p>Para utilizar MONI, debe:</p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Ser mayor de 18 años</li>
            <li>Proporcionar información precisa y completa</li>
            <li>Mantener la seguridad de su contraseña</li>
            <li>Notificar inmediatamente cualquier uso no autorizado</li>
          </ul>

          <h3 className='mt-4 mb-2 text-xl font-semibold'>
            3.2 Responsabilidad
          </h3>
          <p>
            Usted es responsable de todas las actividades que ocurran bajo su
            cuenta. No debe compartir sus credenciales con terceros.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>4. Uso Aceptable</h2>
          <h3 className='mb-2 text-xl font-semibold'>4.1 Está permitido</h3>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Usar MONI para gestionar sus finanzas personales</li>
            <li>Compartir gastos con otros usuarios de manera legítima</li>
            <li>Exportar sus propios datos</li>
          </ul>

          <h3 className='mt-4 mb-2 text-xl font-semibold'>
            4.2 Está prohibido
          </h3>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Usar el servicio para actividades ilegales o fraudulentas</li>
            <li>Intentar acceder a cuentas de otros usuarios</li>
            <li>Realizar ingeniería inversa o copiar el código</li>
            <li>Sobrecargar o interrumpir el funcionamiento del servicio</li>
            <li>Distribuir virus, malware o código malicioso</li>
            <li>Recopilar datos de otros usuarios sin consentimiento</li>
            <li>Usar bots o scripts automatizados sin autorización</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            5. Contenido del Usuario
          </h2>
          <h3 className='mb-2 text-xl font-semibold'>5.1 Propiedad</h3>
          <p>
            Usted conserva todos los derechos sobre los datos financieros que
            ingresa en MONI. Al usar el servicio, nos otorga una licencia para
            almacenar, procesar y mostrar su contenido únicamente con el
            propósito de proporcionar el servicio.
          </p>

          <h3 className='mt-4 mb-2 text-xl font-semibold'>
            5.2 Responsabilidad
          </h3>
          <p>
            Usted es responsable de la exactitud de los datos que ingresa. MONI
            no verifica la precisión de la información financiera proporcionada
            por los usuarios.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            6. Privacidad y Seguridad
          </h2>
          <p>
            El uso de MONI también está regido por nuestra{' '}
            <Link
              href='/legal/privacy-policy'
              className='text-primary hover:underline'
            >
              Política de Privacidad
            </Link>
            . Implementamos medidas de seguridad razonables, pero no podemos
            garantizar una seguridad absoluta.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            7. Limitación de Responsabilidad
          </h2>
          <h3 className='mb-2 text-xl font-semibold'>
            7.1 Servicio 'TAL CUAL'
          </h3>
          <p>
            MONI se proporciona 'tal cual' y 'según disponibilidad', sin
            garantías de ningún tipo, expresas o implícitas. No garantizamos que
            el servicio será ininterrumpido, seguro o libre de errores.
          </p>

          <h3 className='mt-4 mb-2 text-xl font-semibold'>
            7.2 Limitación de Daños
          </h3>
          <p>
            En ningún caso MONI, sus directores, empleados o agentes serán
            responsables por daños indirectos, incidentales, especiales,
            consecuentes o punitivos, incluyendo pérdida de beneficios, datos o
            uso, resultantes de:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Su uso o incapacidad de usar el servicio</li>
            <li>Acceso no autorizado a sus datos</li>
            <li>Errores en los cálculos o reportes</li>
            <li>
              Decisiones financieras basadas en la información del servicio
            </li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>8. Tarifas y Pagos</h2>
          <p>
            MONI actualmente ofrece su servicio de forma gratuita. Nos
            reservamos el derecho de introducir tarifas en el futuro, con previo
            aviso de 30 días.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            9. Cancelación y Terminación
          </h2>
          <h3 className='mb-2 text-xl font-semibold'>
            9.1 Por parte del usuario
          </h3>
          <p>
            Puede cancelar su cuenta en cualquier momento desde la configuración
            de su perfil o solicitando la{' '}
            <Link
              href='/legal/data-deletion'
              className='text-primary hover:underline'
            >
              eliminación de sus datos
            </Link>
            .
          </p>

          <h3 className='mt-4 mb-2 text-xl font-semibold'>
            9.2 Por parte de MONI
          </h3>
          <p>
            Nos reservamos el derecho de suspender o terminar su acceso al
            servicio si:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Viola estos Términos de Servicio</li>
            <li>Su cuenta permanece inactiva por más de 2 años</li>
            <li>Es necesario por razones legales o de seguridad</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            10. Modificaciones del Servicio
          </h2>
          <p>
            Nos reservamos el derecho de modificar, suspender o discontinuar
            cualquier aspecto de MONI en cualquier momento, con o sin previo
            aviso. No seremos responsables ante usted o terceros por cualquier
            modificación, suspensión o discontinuación del servicio.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            11. Propiedad Intelectual
          </h2>
          <p>
            Todo el contenido, características y funcionalidad de MONI
            (incluyendo diseño, texto, gráficos, logos) son propiedad de MONI y
            están protegidos por leyes de derechos de autor, marcas registradas
            y otras leyes de propiedad intelectual.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>12. Ley Aplicable</h2>
          <p>
            Estos términos se regirán e interpretarán de acuerdo con las leyes
            de Paraguay, sin tener en cuenta sus disposiciones sobre conflictos
            de leyes.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            13. Resolución de Disputas
          </h2>
          <p>
            Cualquier disputa relacionada con estos términos se resolverá
            primero mediante negociación de buena fe. Si no se alcanza una
            resolución, las partes acuerdan someter la disputa a mediación antes
            de iniciar acciones legales.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>14. Divisibilidad</h2>
          <p>
            Si alguna disposición de estos términos se considera inválida o
            inaplicable, las disposiciones restantes permanecerán en pleno vigor
            y efecto.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>15. Contacto</h2>
          <p>
            Para preguntas sobre estos Términos de Servicio, puede contactarnos
            en:
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
            Al utilizar MONI, usted reconoce que ha leído, entendido y aceptado
            estos Términos de Servicio.
          </p>
          <p className='text-muted-foreground mt-4 text-center text-sm'>
            Efectivo desde el{' '}
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
