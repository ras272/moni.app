import {
  Inter,
  Plus_Jakarta_Sans,
  Manrope,
  Geist_Mono
} from 'next/font/google';

import { cn } from '@/lib/utils';

// Fuente general para texto
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

// Fuente para títulos y encabezados
const fontHeading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap'
});

// Fuente para números grandes (saldos)
const fontNumbers = Manrope({
  subsets: ['latin'],
  variable: '--font-numbers',
  display: 'swap',
  weight: ['700', '800']
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

export const fontVariables = cn(
  fontSans.variable,
  fontHeading.variable,
  fontNumbers.variable,
  fontMono.variable
);
