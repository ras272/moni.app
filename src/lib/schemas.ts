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
