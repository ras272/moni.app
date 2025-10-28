/**
 * WhatsApp Bot - Category Detector
 * 
 * Detecta automáticamente la categoría basándose en keywords
 * Optimizado para gastos comunes en Paraguay
 */

import { createClient } from '@/lib/supabase/server';

// =====================================================
// MAPEO DE KEYWORDS → CATEGORÍAS
// =====================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Comida y Bebidas': [
    'almuerzo',
    'cena',
    'desayuno',
    'merienda',
    'restaurante',
    'resto',
    'supermercado',
    'super',
    'stock',
    'comida',
    'bebida',
    'café',
    'bar',
    'parrilla',
    'asado',
    'chipa',
    'empanada',
    'pizza',
    'hamburguesa',
    'sushi',
    'delivery'
  ],
  Transporte: [
    'taxi',
    'uber',
    'bolt',
    'muv',
    'gasolina',
    'combustible',
    'nafta',
    'diesel',
    'estacionamiento',
    'peaje',
    'bus',
    'colectivo',
    'pasaje',
    'viaje',
    'remis'
  ],
  Salud: [
    'farmacia',
    'médico',
    'doctor',
    'medicina',
    'medicamento',
    'remedio',
    'consulta',
    'hospital',
    'sanatorio',
    'clínica',
    'laboratorio',
    'análisis',
    'dentista',
    'odontólogo'
  ],
  Compras: [
    'ropa',
    'shopping',
    'mall',
    'zapatillas',
    'zapatos',
    'tienda',
    'boutique',
    'vestido',
    'camisa',
    'pantalón',
    'remera'
  ],
  Servicios: [
    'electricidad',
    'ande',
    'agua',
    'essap',
    'internet',
    'tigo',
    'personal',
    'claro',
    'copaco',
    'celular',
    'cable',
    'netflix',
    'spotify',
    'disney'
  ],
  Entretenimiento: [
    'cine',
    'película',
    'teatro',
    'concierto',
    'show',
    'fiesta',
    'boliche',
    'disco',
    'club',
    'evento'
  ],
  Educación: [
    'colegio',
    'escuela',
    'universidad',
    'facultad',
    'curso',
    'libro',
    'material',
    'matrícula',
    'cuota',
    'academia'
  ],
  'Hogar y Servicios': [
    'alquiler',
    'condominio',
    'gas',
    'limpieza',
    'mantenimiento',
    'reparación',
    'plomero',
    'electricista',
    'pintor'
  ]
};

// =====================================================
// DETECTAR CATEGORÍA
// =====================================================

/**
 * Detecta la categoría de un gasto basándose en la descripción
 * Retorna el ID de la categoría encontrada o null
 */
export async function detectCategory(
  description: string,
  profileId: string
): Promise<string | null> {
  const supabase = await createClient();
  const lower = description.toLowerCase();

  // 1. Buscar por keywords
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hasKeyword = keywords.some((keyword) => lower.includes(keyword));

    if (hasKeyword) {
      // Buscar categoría del usuario con ese nombre
      // Puede ser categoría del usuario o del sistema
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('type', 'expense')
        .or(`profile_id.eq.${profileId},is_system.eq.true`)
        .limit(1)
        .single();

      if (data) return data.id;
    }
  }

  // 2. Fallback: Categoría "Otros Gastos"
  const { data: otherCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Otros Gastos')
    .eq('type', 'expense')
    .or(`profile_id.eq.${profileId},is_system.eq.true`)
    .limit(1)
    .single();

  return otherCategory?.id || null;
}

// =====================================================
// OBTENER NOMBRE DE CATEGORÍA
// =====================================================

/**
 * Obtiene el nombre de una categoría por su ID
 * Útil para respuestas al usuario
 */
export async function getCategoryName(categoryId: string): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();

  return data?.name || 'Sin categoría';
}

// =====================================================
// DETECTAR CATEGORÍA DE INGRESO
// =====================================================

/**
 * Detecta la categoría de un ingreso basándose en la descripción
 */
export async function detectIncomeCategory(
  description: string,
  profileId: string
): Promise<string | null> {
  const supabase = await createClient();
  const lower = description.toLowerCase();

  // Keywords para ingresos
  const incomeKeywords: Record<string, string[]> = {
    Salario: ['sueldo', 'salario', 'pago', 'nomina'],
    Freelance: ['freelance', 'trabajo', 'proyecto', 'cliente'],
    Ventas: ['venta', 'vendí', 'vendido'],
    Inversiones: ['inversión', 'dividendo', 'interés', 'rendimiento'],
    Regalo: ['regalo', 'obsequio', 'donación']
  };

  // Buscar por keywords
  for (const [categoryName, keywords] of Object.entries(incomeKeywords)) {
    const hasKeyword = keywords.some((keyword) => lower.includes(keyword));

    if (hasKeyword) {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('type', 'income')
        .or(`profile_id.eq.${profileId},is_system.eq.true`)
        .limit(1)
        .single();

      if (data) return data.id;
    }
  }

  // Fallback: Categoría "Otros Ingresos"
  const { data: otherCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Otros Ingresos')
    .eq('type', 'income')
    .or(`profile_id.eq.${profileId},is_system.eq.true`)
    .limit(1)
    .single();

  return otherCategory?.id || null;
}
