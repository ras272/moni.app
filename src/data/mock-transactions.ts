import { BadgeProps } from '@/components/ui/badge';

export type TransactionStatus = 'procesado' | 'pendiente';
export type TransactionCategory =
  | 'Supermercado'
  | 'Transporte'
  | 'Restaurante'
  | 'Servicios'
  | 'Ocio'
  | 'Salud';

export type Transaction = {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: TransactionCategory;
  cuenta: 'Billetera' | 'Visión Banco' | 'Tigo Money';
  status: TransactionStatus;
};

export const getCategoryVariant = (
  categoria: TransactionCategory
): BadgeProps['variant'] => {
  switch (categoria) {
    case 'Supermercado':
      return 'default';
    case 'Transporte':
      return 'secondary';
    case 'Restaurante':
      return 'outline';
    case 'Servicios':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const mockTransactions: Transaction[] = [
  {
    id: 'TX-001',
    fecha: '2024-10-25',
    descripcion: 'Compras en Biggie',
    monto: -150000,
    categoria: 'Supermercado',
    cuenta: 'Visión Banco',
    status: 'procesado'
  },
  {
    id: 'TX-002',
    fecha: '2024-10-25',
    descripcion: 'Viaje en MUV',
    monto: -35000,
    categoria: 'Transporte',
    cuenta: 'Billetera',
    status: 'procesado'
  },
  {
    id: 'TX-003',
    fecha: '2024-10-24',
    descripcion: 'Cena en Bolsi',
    monto: -250000,
    categoria: 'Restaurante',
    cuenta: 'Visión Banco',
    status: 'procesado'
  },
  {
    id: 'TX-004',
    fecha: '2024-10-23',
    descripcion: 'Pago de ANDE',
    monto: -180000,
    categoria: 'Servicios',
    cuenta: 'Tigo Money',
    status: 'procesado'
  },
  {
    id: 'TX-005',
    fecha: '2024-10-22',
    descripcion: 'Farmacia Catedral',
    monto: -85000,
    categoria: 'Salud',
    cuenta: 'Billetera',
    status: 'pendiente'
  },
  {
    id: 'TX-006',
    fecha: '2024-10-21',
    descripcion: 'Carga de Tigo',
    monto: -50000,
    categoria: 'Servicios',
    cuenta: 'Tigo Money',
    status: 'procesado'
  },
  {
    id: 'TX-007',
    fecha: '2024-10-20',
    descripcion: 'Super Stock',
    monto: -450000,
    categoria: 'Supermercado',
    cuenta: 'Visión Banco',
    status: 'procesado'
  },
  {
    id: 'TX-008',
    fecha: '2024-10-19',
    descripcion: 'Almuerzo en Lido Bar',
    monto: -120000,
    categoria: 'Restaurante',
    cuenta: 'Billetera',
    status: 'procesado'
  },
  {
    id: 'TX-009',
    fecha: '2024-10-18',
    descripcion: 'Taxi',
    monto: -25000,
    categoria: 'Transporte',
    cuenta: 'Billetera',
    status: 'procesado'
  },
  {
    id: 'TX-010',
    fecha: '2024-10-17',
    descripcion: 'Cine en Shopping del Sol',
    monto: -80000,
    categoria: 'Ocio',
    cuenta: 'Visión Banco',
    status: 'procesado'
  }
];
