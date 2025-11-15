import { z } from 'zod';

export const transactionSchema = z.object({
  descripcion: z.string().min(3, {
    message: 'La descripción debe tener al menos 3 caracteres.'
  }),
  monto: z.number().min(1, {
    message: 'El monto debe ser mayor a 0 (en Guaraníes).'
  }),
  fecha: z.date(),
  categoria: z.string().min(1, {
    message: 'Debes seleccionar una categoría.'
  }),
  cuenta: z.string().min(1, {
    message: 'Debes seleccionar una cuenta.'
  }),
  tipo: z.enum(['INGRESS', 'EXPENSE'])
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

// =====================================================
// SCHEMA: Recurring Transaction Form
// =====================================================

export const recurringTransactionSchema = z
  .object({
    // Detalles de la transacción
    tipo: z.enum(['EXPENSE', 'INCOME'], {
      required_error: 'Debes seleccionar el tipo de transacción.'
    }),
    descripcion: z
      .string()
      .min(3, {
        message: 'La descripción debe tener al menos 3 caracteres.'
      })
      .max(255, {
        message: 'La descripción no puede exceder 255 caracteres.'
      }),
    monto: z.coerce
      .number({
        required_error: 'El monto es requerido.',
        invalid_type_error: 'El monto debe ser un número.'
      })
      .min(1, {
        message: 'El monto debe ser mayor a 0 (en Guaraníes).'
      })
      .positive({
        message: 'El monto debe ser un número positivo.'
      }),
    categoria: z.string().optional().or(z.literal('')),
    cuenta: z.string().min(1, {
      message: 'Debes seleccionar una cuenta.'
    }),
    comercio: z.string().max(255).optional().or(z.literal('')),
    notas: z.string().max(500).optional().or(z.literal('')),

    // Configuración de recurrencia
    frecuencia: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly'], {
      required_error: 'Debes seleccionar la frecuencia.',
      invalid_type_error: 'Frecuencia inválida.'
    }),
    intervalo: z
      .number()
      .int()
      .min(1, { message: 'El intervalo debe ser al menos 1.' })
      .max(12, { message: 'El intervalo no puede exceder 12.' })
      .default(1),
    diaPeriodo: z.number().int().min(1).max(31).optional(),
    fechaInicio: z.date({
      required_error: 'La fecha de inicio es requerida.'
    }),
    fechaFin: z.date().optional(),
    tieneFechaFin: z.boolean().default(false)
  })
  .refine(
    (data) => {
      // Si es mensual, día del período es requerido
      if (data.frecuencia === 'monthly') {
        return (
          data.diaPeriodo !== undefined &&
          data.diaPeriodo >= 1 &&
          data.diaPeriodo <= 31
        );
      }
      return true;
    },
    {
      message:
        'Para recurrencia mensual, debes especificar el día del mes (1-31).',
      path: ['diaPeriodo']
    }
  )
  .refine(
    (data) => {
      // Si es semanal, día del período es requerido
      if (data.frecuencia === 'weekly') {
        return (
          data.diaPeriodo !== undefined &&
          data.diaPeriodo >= 1 &&
          data.diaPeriodo <= 7
        );
      }
      return true;
    },
    {
      message:
        'Para recurrencia semanal, debes especificar el día de la semana (1-7).',
      path: ['diaPeriodo']
    }
  )
  .refine(
    (data) => {
      // Si tiene fecha de fin, debe ser posterior a la fecha de inicio
      if (data.tieneFechaFin && data.fechaFin) {
        return data.fechaFin > data.fechaInicio;
      }
      return true;
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
      path: ['fechaFin']
    }
  )
  .refine(
    (data) => {
      // Para daily, biweekly, yearly NO debe tener día del período
      if (['daily', 'biweekly', 'yearly'].includes(data.frecuencia)) {
        return data.diaPeriodo === undefined;
      }
      return true;
    },
    {
      message: 'Este tipo de recurrencia no requiere día del período.',
      path: ['diaPeriodo']
    }
  );

export type RecurringTransactionFormValues = z.infer<
  typeof recurringTransactionSchema
>;

// =====================================================
// SCHEMA: Update Recurring Transaction
// =====================================================

export const updateRecurringTransactionSchema = z.object({
  descripcion: z
    .string()
    .min(3, { message: 'La descripción debe tener al menos 3 caracteres.' })
    .max(255)
    .optional(),
  monto: z.number().min(1).positive().optional(),
  categoria: z.string().optional(),
  cuenta: z.string().optional(),
  comercio: z.string().max(255).optional(),
  notas: z.string().max(500).optional(),
  fechaFin: z.date().optional()
});

export type UpdateRecurringTransactionFormValues = z.infer<
  typeof updateRecurringTransactionSchema
>;
