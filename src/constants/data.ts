import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Resumen',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['r', 'r'],
    items: []
  },
  {
    title: 'Transacciones',
    url: '/dashboard/transacciones',
    icon: 'receipt',
    shortcut: ['t', 't'],
    isActive: false,
    items: []
  },
  {
    title: 'Cuentas',
    url: '/dashboard/cuentas',
    icon: 'wallet',
    shortcut: ['c', 'c'],
    isActive: false,
    items: []
  }
];

export const navItemsTools: NavItem[] = [
  {
    title: 'MoneyTags',
    url: '/dashboard/moneytags',
    icon: 'tags',
    shortcut: ['m', 'm'],
    isActive: false,
    items: []
  }
];

export const navItemsOthers: NavItem[] = [
  {
    title: 'WhatsApp Bot',
    url: '/dashboard/settings/whatsapp',
    icon: 'message',
    shortcut: ['w', 'w'],
    isActive: false,
    items: []
  },
  {
    title: 'Configuración',
    url: '/dashboard/configuracion',
    icon: 'settings',
    shortcut: ['s', 's'],
    isActive: false,
    items: []
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Biggie',
    email: 'Supermercado',
    amount: '₲ 450.000',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'BG'
  },
  {
    id: 2,
    name: 'Stock',
    email: 'Supermercado',
    amount: '₲ 320.000',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'ST'
  },
  {
    id: 3,
    name: 'MUV',
    email: 'Transporte',
    amount: '₲ 75.000',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'MV'
  },
  {
    id: 4,
    name: 'Pago ANDE',
    email: 'Servicios',
    amount: '₲ 280.000',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'AN'
  },
  {
    id: 5,
    name: 'Farmacia Catedral',
    email: 'Salud',
    amount: '₲ 120.000',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'FC'
  }
];
