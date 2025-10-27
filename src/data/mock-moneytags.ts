import { z } from 'zod';

// --- Participantes (Mocked Users) ---
export type Participant = {
  id: string;
  name: string;
};

export const mockParticipants: Participant[] = [
  { id: 'P-001', name: 'Usuario (Tú)' },
  { id: 'P-002', name: 'Juan (Amigo 1)' },
  { id: 'P-003', name: 'Ana (Amiga 2)' },
  { id: 'P-004', name: 'Pedro (Amigo 3)' }
];

// --- Grupos de Gastos ---
export type MoneyTagGroup = {
  id: string;
  name: string;
  participants: Participant[];
  total_spent: number;
  date_created: string;
  is_settled: boolean;
};

export const mockMoneyTagGroups: MoneyTagGroup[] = [
  {
    id: 'G-001',
    name: 'Asado Sábado 🍖',
    participants: mockParticipants.slice(0, 3),
    total_spent: 850000,
    date_created: '2025-10-20',
    is_settled: false
  },
  {
    id: 'G-002',
    name: 'Viaje Encarnación 2026',
    participants: mockParticipants,
    total_spent: 5000000,
    date_created: '2025-08-15',
    is_settled: false
  },
  {
    id: 'G-003',
    name: 'Alquiler Depto Noviembre',
    participants: mockParticipants.slice(0, 2),
    total_spent: 2800000,
    date_created: '2025-11-01',
    is_settled: true
  }
];

// --- Gastos dentro de un Grupo ---
export type GroupExpense = {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: Participant;
  split_among: Participant[];
  date: string;
};

export const mockGroupExpenses: Record<string, GroupExpense[]> = {
  'G-001': [
    {
      id: 'GE-001',
      group_id: 'G-001',
      description: 'Carbón y Carne (Asado)',
      amount: 350000,
      paid_by: mockParticipants[0],
      split_among: mockParticipants.slice(0, 3),
      date: '2025-10-20'
    },
    {
      id: 'GE-002',
      group_id: 'G-001',
      description: 'Cervezas Biggie',
      amount: 150000,
      paid_by: mockParticipants[1],
      split_among: mockParticipants.slice(0, 3),
      date: '2025-10-20'
    },
    {
      id: 'GE-003',
      group_id: 'G-001',
      description: 'Pan y Chimichurri',
      amount: 50000,
      paid_by: mockParticipants[2],
      split_among: mockParticipants.slice(0, 3),
      date: '2025-10-20'
    },
    {
      id: 'GE-004',
      group_id: 'G-001',
      description: 'Hielo y Refrescos',
      amount: 80000,
      paid_by: mockParticipants[0],
      split_among: mockParticipants.slice(0, 3),
      date: '2025-10-20'
    },
    {
      id: 'GE-005',
      group_id: 'G-001',
      description: 'Carbón Extra',
      amount: 220000,
      paid_by: mockParticipants[1],
      split_among: mockParticipants.slice(0, 3),
      date: '2025-10-20'
    }
  ],
  'G-002': [
    {
      id: 'GE-006',
      group_id: 'G-002',
      description: 'Alojamiento Hotel',
      amount: 2500000,
      paid_by: mockParticipants[0],
      split_among: mockParticipants,
      date: '2025-08-15'
    },
    {
      id: 'GE-007',
      group_id: 'G-002',
      description: 'Pasajes de Bus',
      amount: 800000,
      paid_by: mockParticipants[1],
      split_among: mockParticipants,
      date: '2025-08-15'
    },
    {
      id: 'GE-008',
      group_id: 'G-002',
      description: 'Comidas del Viaje',
      amount: 1200000,
      paid_by: mockParticipants[2],
      split_among: mockParticipants,
      date: '2025-08-16'
    },
    {
      id: 'GE-009',
      group_id: 'G-002',
      description: 'Tour Ruinas Jesuíticas',
      amount: 500000,
      paid_by: mockParticipants[3],
      split_among: mockParticipants,
      date: '2025-08-17'
    }
  ],
  'G-003': []
};

// --- Schemas para formularios ---
export const groupSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: 'El nombre del grupo debe tener al menos 3 caracteres.'
    }),
  participant_ids: z
    .array(z.string())
    .min(2, { message: 'Debes seleccionar al menos 2 participantes.' })
});

export type GroupFormValues = z.infer<typeof groupSchema>;

export const expenseSchema = z.object({
  description: z.string().min(3, { message: 'La descripción debe ser clara.' }),
  amount: z.number().min(1, { message: 'El monto debe ser mayor a 0.' }),
  paid_by_id: z.string().min(1, { message: 'Selecciona quién pagó.' }),
  split_among_ids: z
    .array(z.string())
    .min(1, { message: 'Selecciona al menos una persona.' })
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// --- Utility: Calcular deudas (algoritmo simplificado) ---
export type Debt = {
  from: Participant;
  to: Participant;
  amount: number;
};

export function calculateDebts(
  expenses: GroupExpense[],
  participants: Participant[]
): Debt[] {
  // Balance por persona: cuánto pagó vs cuánto debe
  const balances: Record<string, number> = {};

  participants.forEach((p) => {
    balances[p.id] = 0;
  });

  expenses.forEach((expense) => {
    const sharePerPerson = expense.amount / expense.split_among.length;

    // El que pagó tiene crédito
    balances[expense.paid_by.id] += expense.amount;

    // Los que participan tienen deuda
    expense.split_among.forEach((person) => {
      balances[person.id] -= sharePerPerson;
    });
  });

  // Crear lista de deudores y acreedores
  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([id, balance]) => {
    if (balance < -0.01) {
      debtors.push({ id, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    }
  });

  // Simplificar deudas (algoritmo greedy)
  const debts: Debt[] = [];

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    const fromParticipant = participants.find((p) => p.id === debtor.id)!;
    const toParticipant = participants.find((p) => p.id === creditor.id)!;

    debts.push({
      from: fromParticipant,
      to: toParticipant,
      amount: Math.round(amount)
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return debts;
}
