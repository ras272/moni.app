'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - datos financieros no cambian tan rápido
      gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché más tiempo
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1 // Reducir reintentos para evitar latencia
    }
  }
});

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        {children}
      </ActiveThemeProvider>
    </QueryClientProvider>
  );
}
