import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, {
    message: 'El nombre debe ser descriptivo (ej: Visión Banco, Billetera).'
  }),
  initial_balance: z.number(),
  currency: z.enum(['PYG', 'USD']),
  is_active: z.boolean()
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export type Account = {
  id: string;
  name: string;
  current_balance: number;
  currency: 'PYG' | 'USD';
  icon: string;
  is_active: boolean;
};

export const mockAccounts: Account[] = [
  {
    id: 'ACC-001',
    name: 'Billetera (Efectivo)',
    current_balance: 550000,
    currency: 'PYG',
    icon: 'Wallet',
    is_active: true
  },
  {
    id: 'ACC-002',
    name: 'Visión Banco',
    current_balance: 10250000,
    currency: 'PYG',
    icon: 'Banknote',
    is_active: true
  },
  {
    id: 'ACC-003',
    name: 'Tigo Money',
    current_balance: 350000,
    currency: 'PYG',
    icon: 'Smartphone',
    is_active: true
  },
  {
    id: 'ACC-004',
    name: 'Ahorro USD',
    current_balance: 500 * 7500,
    currency: 'USD',
    icon: 'DollarSign',
    is_active: true
  }
];
