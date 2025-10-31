import * as z from 'zod';

export const configuracionSchema = z.object({
  full_name: z.string().min(1, { message: 'El nombre es requerido' }),
  email: z.string().email({ message: 'Email inválido' }),
  email_notifications: z.boolean().default(true),
  push_notifications: z.boolean().default(false),
  language: z.string().default('es-PY'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  timezone: z.string().default('America/Asuncion')
});

export type ConfiguracionFormValues = z.infer<typeof configuracionSchema>;

export const userPreferencesSchema = configuracionSchema.pick({
  email_notifications: true,
  push_notifications: true,
  language: true,
  theme: true,
  timezone: true
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
