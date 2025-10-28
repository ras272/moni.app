/**
 * WhatsApp Bot - Help Handler
 * 
 * Muestra ayuda y ejemplos de comandos
 */

import type { HandlerResponse } from '../types';

// =====================================================
// HANDLE HELP
// =====================================================

export async function handleHelp(): Promise<HandlerResponse> {
  const message = `
🤖 *MONI Bot - Comandos Disponibles*

*💸 Registrar Gastos:*
• "Gasté 50.000 en almuerzo"
• "Pagué 150k supermercado"
• "Compré 25 mil en farmacia"
• "300000 taxi"

*💰 Registrar Ingresos:*
• "Cobré 500.000 de sueldo"
• "Recibí 100k freelance"
• "Ingresó 200k trabajo"

*📊 Consultas:*
• "¿Cuánto tengo?"
• "Balance"
• "Saldo"
• "Resumen de hoy"
• "¿Cuánto gasté hoy?"

*🔗 Vincular Cuenta:*
• "Vincular ABC123XYZ"
(Genera el código desde el dashboard)

*💡 Notas:*
• Los montos se detectan automáticamente
• Soporto múltiples formatos: 50.000, 150k, 25 mil
• Las categorías se asignan automáticamente

*🌐 Dashboard:*
https://moni.app/dashboard

¿En qué puedo ayudarte? 😊
  `.trim();

  return {
    success: true,
    message,
    buttons: [
      { id: 'balance', title: 'Ver Balance' },
      { id: 'summary', title: 'Resumen de Hoy' },
      { id: 'expense', title: 'Registrar Gasto' }
    ]
  };
}
