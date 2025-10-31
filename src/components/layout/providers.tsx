'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 🚀 PERFORMANCE FIX: Reducir a 2 minutos
      gcTime: 5 * 60 * 1000, // 🚀 PERFORMANCE FIX: Reducir a 5 minutos - evitar memory bloat
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
