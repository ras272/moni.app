/**
 * Script de prueba para el sistema de extracción de transacciones con IA
 *
 * Cómo usar:
 * 1. Asegurarte que AI_CONFIG.ENABLED = true en src/lib/ai/config.ts
 * 2. (Opcional) Agregar GROQ_API_KEY en .env.local
 * 3. Correr: npx tsx test-ai-extraction.ts
 */

// Cargar variables de entorno desde .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { extractTransaction, getAIStats, type AIResponse } from './src/lib/ai';

// Casos de prueba
const TEST_CASES = [
  // Casos simples (deberían resolverse con reglas)
  {
    message: 'gasté 50 mil en biggie',
    expected: { amount: 50000, type: 'expense', category: 'Compras' }
  },
  {
    message: 'pagué 120 lucas de nafta',
    expected: { amount: 120000, type: 'expense', category: 'Transporte' }
  },
  {
    message: 'compré en el super 75k',
    expected: { amount: 75000, type: 'expense', category: 'Compras' }
  },
  {
    message: 'cargué combustible 150',
    expected: { amount: 150000, type: 'expense', category: 'Transporte' }
  },
  {
    message: 'gasté 35 en netflix',
    expected: { amount: 35000, type: 'expense', category: 'Entretenimiento' }
  },

  // Casos que requieren más contexto (probablemente usen IA)
  {
    message: 'compr é ropa por 180 en el shopping',
    expected: { amount: 180000, type: 'expense' }
  },
  {
    message: 'me depositaron el sueldo',
    expected: { type: 'income', amount: null }
  },
  {
    message: 'cobré 3500000',
    expected: { amount: 3500000, type: 'income' }
  },

  // Casos complejos
  {
    message: 'salí a comer con amigos, gastamos 250 entre todos',
    expected: { amount: 250000, type: 'expense', category: 'Comida' }
  },
  {
    message: 'uber al aeropuerto 45 lucas',
    expected: { amount: 45000, type: 'expense', category: 'Transporte' }
  }
];

/**
 * Ejecuta los tests
 */
async function runTests() {
  console.log(
    '🧪 Iniciando tests del sistema de extracción de transacciones\n'
  );
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;
  let usedAI = 0;
  let usedRules = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`\n📝 Test ${i + 1}/${TEST_CASES.length}`);
    console.log(`   Mensaje: "${testCase.message}"`);

    try {
      const result = await extractTransaction(testCase.message);

      if (!result.success || !result.data) {
        console.log('   ❌ FAIL: No se pudo extraer');
        failed++;
        continue;
      }

      const tx = result.data;

      // Verificar expectations
      let testPassed = true;
      const errors: string[] = [];

      if (testCase.expected.amount !== undefined) {
        if (tx.amount !== testCase.expected.amount) {
          errors.push(
            `Monto: esperaba ${testCase.expected.amount}, obtuvo ${tx.amount}`
          );
          testPassed = false;
        }
      }

      if (testCase.expected.type !== undefined) {
        if (tx.type !== testCase.expected.type) {
          errors.push(
            `Tipo: esperaba ${testCase.expected.type}, obtuvo ${tx.type}`
          );
          testPassed = false;
        }
      }

      if (testCase.expected.category !== undefined) {
        if (tx.category !== testCase.expected.category) {
          errors.push(
            `Categoría: esperaba ${testCase.expected.category}, obtuvo ${tx.category}`
          );
          testPassed = false;
        }
      }

      // Resultado
      if (testPassed) {
        console.log('   ✅ PASS');
        passed++;
      } else {
        console.log('   ❌ FAIL');
        errors.forEach((err) => console.log(`      - ${err}`));
        failed++;
      }

      // Info de la extracción
      console.log(`   📊 Resultado:`);
      console.log(`      - Monto: ₲${tx.amount?.toLocaleString() || 'N/A'}`);
      console.log(`      - Tipo: ${tx.type}`);
      console.log(`      - Categoría: ${tx.category || 'N/A'}`);
      console.log(`      - Comercio: ${tx.merchant || 'N/A'}`);
      console.log(
        `      - Método: ${tx.method === 'rules' ? '⚡ Reglas' : '🤖 IA'}`
      );
      console.log(`      - Confianza: ${Math.round(tx.confidence * 100)}%`);

      if (tx.method === 'ai') usedAI++;
      if (tx.method === 'rules') usedRules++;
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }

    // Pequeño delay para no saturar
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Resumen
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMEN DE TESTS\n');
  console.log(`✅ Pasados: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Fallados: ${failed}/${TEST_CASES.length}`);
  console.log(
    `📈 Tasa de éxito: ${Math.round((passed / TEST_CASES.length) * 100)}%`
  );
  console.log(`\n⚡ Resueltos con reglas: ${usedRules}`);
  console.log(`🤖 Resueltos con IA: ${usedAI}`);

  // Estadísticas de IA
  const stats = getAIStats();
  console.log(`\n📊 Estadísticas de IA:`);
  console.log(`   - Requests hoy: ${stats.dailyRequests}/${stats.dailyLimit}`);
  console.log(`   - % usado: ${stats.percentageUsed.toFixed(1)}%`);
  console.log(`   - Puede hacer más: ${stats.canMakeRequest ? 'Sí' : 'No'}`);

  console.log('\n' + '='.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron!');
  } else {
    console.log(`\n⚠️ ${failed} test(s) fallaron. Revisar implementación.`);
  }
}

// Ejecutar tests
runTests().catch((error) => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});
