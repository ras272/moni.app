import Link from 'next/link';

export const metadata = {
  title: 'Eliminación de Datos - MONI',
  description:
    'Instrucciones para solicitar la eliminación de sus datos personales de MONI'
};

export default function DataDeletionPage() {
  return (
    <div className='mx-auto min-h-screen max-w-4xl px-4 py-16'>
      <div className='mb-8'>
        <Link
          href='/'
          className='text-primary mb-4 inline-block hover:underline'
        >
          ← Volver al inicio
        </Link>
        <h1 className='mb-4 text-4xl font-bold'>
          Instrucciones para Eliminación de Datos
        </h1>
        <p className='text-muted-foreground'>
          Última actualización: {new Date().toLocaleDateString('es-PY')}
        </p>
      </div>

      <div className='prose prose-neutral dark:prose-invert max-w-none space-y-6'>
        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            1. Su Derecho a la Eliminación de Datos
          </h2>
          <p>
            En MONI respetamos su derecho a la privacidad y el control sobre sus
            datos personales. Usted tiene derecho a solicitar la eliminación
            permanente de toda su información personal y datos financieros de
            nuestros sistemas en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            2. ¿Qué Datos se Eliminarán?
          </h2>
          <p>
            Al solicitar la eliminación de datos, se eliminarán permanentemente:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Su cuenta de usuario y credenciales de acceso</li>
            <li>Información personal (nombre, email, teléfono)</li>
            <li>
              Todas las transacciones financieras registradas en su cuenta
            </li>
            <li>Cuentas bancarias y carteras configuradas</li>
            <li>Presupuestos y categorías personalizadas</li>
            <li>
              Grupos de gastos compartidos (MoneyTags) donde es el creador
            </li>
            <li>
              Su participación en grupos de gastos compartidos creados por otros
            </li>
            <li>Historial de actividad y preferencias</li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            3. Consideraciones Importantes
          </h2>
          <div className='bg-muted rounded-lg border p-6'>
            <h3 className='mb-3 text-lg font-semibold'>
              ⚠️ Esta acción es IRREVERSIBLE
            </h3>
            <ul className='list-disc space-y-2 pl-6'>
              <li>
                Una vez eliminados, sus datos no podrán ser recuperados bajo
                ninguna circunstancia
              </li>
              <li>Perderá acceso a todo su historial financiero y reportes</li>
              <li>
                Los grupos de gastos compartidos que haya creado serán
                eliminados
              </li>
              <li>
                Su participación en grupos de otros usuarios será removida
              </li>
              <li>
                No podrá usar la misma dirección de email para crear una nueva
                cuenta durante 30 días
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            4. Métodos de Eliminación de Datos
          </h2>

          <div className='space-y-6'>
            <div className='rounded-lg border p-6'>
              <h3 className='mb-3 text-xl font-semibold'>
                Método 1: Desde la Aplicación (Recomendado)
              </h3>
              <ol className='list-decimal space-y-3 pl-6'>
                <li>
                  Inicie sesión en su cuenta de MONI en{' '}
                  <Link
                    href='/auth/sign-in'
                    className='text-primary hover:underline'
                  >
                    monipy.pro
                  </Link>
                </li>
                <li>
                  Navegue a <strong>Perfil → Configuración de Cuenta</strong>
                </li>
                <li>
                  Desplácese hasta la sección <strong>'Zona de Peligro'</strong>
                </li>
                <li>
                  Haga clic en <strong>'Eliminar mi cuenta y datos'</strong>
                </li>
                <li>Lea atentamente las advertencias</li>
                <li>
                  Escriba <strong>'ELIMINAR'</strong> para confirmar
                </li>
                <li>Ingrese su contraseña para verificación de seguridad</li>
                <li>Haga clic en el botón de confirmación final</li>
              </ol>
              <p className='text-muted-foreground mt-4 text-sm'>
                ⏱️ Tiempo de procesamiento: Inmediato
              </p>
            </div>

            <div className='rounded-lg border p-6'>
              <h3 className='mb-3 text-xl font-semibold'>
                Método 2: Por Correo Electrónico
              </h3>
              <p className='mb-4'>
                Si no puede acceder a su cuenta, puede solicitar la eliminación
                por email:
              </p>
              <ol className='list-decimal space-y-3 pl-6'>
                <li>
                  Envíe un correo a{' '}
                  <a
                    href='mailto:hello@monipy.pro'
                    className='text-primary hover:underline'
                  >
                    hello@monipy.pro
                  </a>
                </li>
                <li>
                  Asunto: <strong>'Solicitud de Eliminación de Datos'</strong>
                </li>
                <li>
                  Incluya en el cuerpo del mensaje:
                  <ul className='mt-2 list-disc space-y-1 pl-6'>
                    <li>Su nombre completo registrado en MONI</li>
                    <li>La dirección de email asociada a su cuenta</li>
                    <li>
                      Una declaración confirmando que solicita la eliminación
                      permanente de todos sus datos
                    </li>
                    <li>
                      (Opcional) Motivo de la solicitud para mejorar nuestro
                      servicio
                    </li>
                  </ul>
                </li>
                <li>
                  Le responderemos dentro de <strong>48 horas</strong> para
                  verificar su identidad
                </li>
                <li>
                  Una vez verificado, procesaremos la eliminación en{' '}
                  <strong>72 horas</strong>
                </li>
                <li>
                  Recibirá un email de confirmación cuando el proceso esté
                  completo
                </li>
              </ol>
              <p className='text-muted-foreground mt-4 text-sm'>
                ⏱️ Tiempo de procesamiento: 3-5 días hábiles
              </p>
            </div>

            <div className='rounded-lg border p-6'>
              <h3 className='mb-3 text-xl font-semibold'>
                Método 3: Vía WhatsApp (Solo para usuarios con WhatsApp
                vinculado)
              </h3>
              <p className='mb-4'>
                Si usó WhatsApp para autenticarse o recibir notificaciones:
              </p>
              <ol className='list-decimal space-y-3 pl-6'>
                <li>
                  Envíe un mensaje al número oficial de MONI WhatsApp Business
                </li>
                <li>
                  Escriba: <strong>'ELIMINAR MIS DATOS'</strong>
                </li>
                <li>
                  Confirme su identidad respondiendo las preguntas de seguridad
                </li>
                <li>
                  Recibirá un link de confirmación que debe abrir en el
                  navegador
                </li>
                <li>Complete el proceso de verificación</li>
                <li>
                  Recibirá una confirmación por WhatsApp cuando se complete
                </li>
              </ol>
              <p className='text-muted-foreground mt-4 text-sm'>
                ⏱️ Tiempo de procesamiento: 24-48 horas
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            5. Proceso de Verificación
          </h2>
          <p>
            Para proteger su privacidad y prevenir eliminaciones no autorizadas,
            verificaremos su identidad antes de procesar cualquier solicitud de
            eliminación mediante:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>Verificación de contraseña (método desde la app)</li>
            <li>
              Verificación de email (recibirá un link de confirmación único)
            </li>
            <li>
              Preguntas de seguridad sobre su cuenta (método por email o
              WhatsApp)
            </li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            6. Excepciones de Retención de Datos
          </h2>
          <p>
            Aunque eliminamos todos sus datos personales, podemos retener cierta
            información cuando sea requerido por ley o por razones legítimas:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              <strong>Registros de auditoría:</strong> Logs técnicos
              anonimizados para seguridad y detección de fraudes (90 días)
            </li>
            <li>
              <strong>Cumplimiento legal:</strong> Datos requeridos por
              autoridades gubernamentales o procesos legales
            </li>
            <li>
              <strong>Respaldos:</strong> Copias de seguridad se eliminan
              automáticamente después de 30 días
            </li>
          </ul>
          <p className='mt-4'>
            Estos datos residuales no son accesibles para uso operacional y se
            eliminan según nuestros cronogramas de retención.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            7. Impacto en Otros Usuarios
          </h2>
          <p>
            Si participó en gastos compartidos (MoneyTags) con otros usuarios:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              Su nombre se reemplazará con <strong>'Usuario eliminado'</strong>{' '}
              en los registros históricos
            </li>
            <li>
              Los montos y transacciones permanecerán para mantener integridad
              contable
            </li>
            <li>
              Los otros usuarios podrán ver que alguien eliminó su cuenta pero
              no tendrán acceso a sus datos personales
            </li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            8. Exportar Datos Antes de Eliminar
          </h2>
          <div className='bg-muted rounded-lg border p-6'>
            <h3 className='mb-3 text-lg font-semibold'>
              💡 Recomendación: Exporte sus datos primero
            </h3>
            <p className='mb-3'>
              Antes de eliminar su cuenta, le recomendamos exportar una copia de
              sus datos:
            </p>
            <ol className='list-decimal space-y-2 pl-6'>
              <li>
                Vaya a <strong>Perfil → Configuración → Privacidad</strong>
              </li>
              <li>
                Haga clic en <strong>'Exportar mis datos'</strong>
              </li>
              <li>
                Recibirá un archivo ZIP por email con todos sus datos en formato
                CSV/JSON
              </li>
              <li>Descargue y guarde el archivo en un lugar seguro</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            9. Alternativas a la Eliminación Total
          </h2>
          <p>
            Si no está seguro de eliminar todo, considere estas alternativas:
          </p>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              <strong>Desactivar cuenta temporalmente:</strong> Oculta su perfil
              pero mantiene sus datos
            </li>
            <li>
              <strong>Eliminar transacciones específicas:</strong> Borre solo
              ciertos datos sensibles
            </li>
            <li>
              <strong>Ajustar configuración de privacidad:</strong> Controle qué
              información comparte
            </li>
            <li>
              <strong>Revocar integraciones:</strong> Desconecte servicios de
              terceros sin eliminar su cuenta
            </li>
          </ul>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            10. Preguntas Frecuentes
          </h2>
          <div className='space-y-4'>
            <div>
              <h3 className='mb-2 font-semibold'>
                ¿Puedo recuperar mi cuenta después de eliminarla?
              </h3>
              <p>
                No. La eliminación es permanente e irreversible. Sin embargo,
                hay un período de gracia de 30 días donde puede cancelar la
                solicitud.
              </p>
            </div>

            <div>
              <h3 className='mb-2 font-semibold'>
                ¿Cuánto tiempo toma el proceso completo?
              </h3>
              <p>
                Desde la aplicación es inmediato. Por email: 3-5 días hábiles.
                Por WhatsApp: 24-48 horas.
              </p>
            </div>

            <div>
              <h3 className='mb-2 font-semibold'>
                ¿Qué pasa con las deudas pendientes en MoneyTags?
              </h3>
              <p>
                Debe liquidar todas las deudas antes de eliminar su cuenta, o
                los otros miembros del grupo deberán marcarlas como resueltas.
              </p>
            </div>

            <div>
              <h3 className='mb-2 font-semibold'>
                ¿Puedo usar el mismo email en el futuro?
              </h3>
              <p>
                Sí, pero debe esperar 30 días después de la eliminación para
                crear una nueva cuenta con el mismo email.
              </p>
            </div>

            <div>
              <h3 className='mb-2 font-semibold'>
                ¿Eliminarán también mis datos de servicios de terceros?
              </h3>
              <p>
                Eliminamos los datos que tenemos control (en nuestros
                servidores). Para servicios de terceros (Google, WhatsApp),
                deberá gestionar la eliminación directamente con ellos.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='mb-3 text-2xl font-semibold'>
            11. Contacto y Soporte
          </h2>
          <p>Si tiene preguntas o problemas con el proceso de eliminación:</p>
          <ul className='list-none space-y-2 pl-0'>
            <li>
              <strong>Email de contacto:</strong>{' '}
              <a
                href='mailto:hello@monipy.pro'
                className='text-primary hover:underline'
              >
                hello@monipy.pro
              </a>
            </li>
            <li>
              <strong>Horario de atención:</strong> Lunes a Viernes, 9:00 -
              18:00 (GMT-4)
            </li>
          </ul>
        </section>

        <div className='bg-muted mt-12 rounded-lg border p-8'>
          <h3 className='mb-4 text-center text-xl font-semibold'>
            🔒 Su privacidad es nuestra prioridad
          </h3>
          <p className='text-center'>
            Procesamos todas las solicitudes de eliminación de datos con la
            máxima prioridad y respetamos su derecho a la privacidad según lo
            establecido en nuestra{' '}
            <Link
              href='/legal/privacy-policy'
              className='text-primary hover:underline'
            >
              Política de Privacidad
            </Link>
            .
          </p>
        </div>

        <div className='mt-8 border-t pt-8'>
          <p className='text-muted-foreground text-center text-sm'>
            Estas instrucciones son efectivas desde el{' '}
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
