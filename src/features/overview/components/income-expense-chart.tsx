'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyPY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  PieChart,
  X
} from 'lucide-react';

interface IncomeExpenseChartProps {
  currentIncome: number;
  previousIncome: number;
  currentExpenses: number;
  previousExpenses: number;
}

interface ModalData {
  period: string;
  income: number;
  expenses: number;
}

// Componente para anillos circulares de progreso
interface CircularProgressProps {
  percentage: number;
  color: string;
  size: number;
  strokeWidth: number;
  label: string;
  value: string;
  sublabel?: string;
  onClick?: () => void;
}

// Función para formatear números de forma compacta
function formatCompactNumber(numStr: string): string {
  // Remover el "Gs. " y los puntos de miles
  const cleanStr = numStr.replace('Gs. ', '').replace(/\./g, '').trim();
  const num = parseInt(cleanStr);

  if (isNaN(num)) return numStr;

  // Para 7+ cifras (millones)
  if (num >= 1000000) {
    const millions = num / 1000000;
    // Si es número entero, no mostrar decimales
    return millions % 1 === 0
      ? `Gs. ${millions.toFixed(0)}M`
      : `Gs. ${millions.toFixed(1)}M`;
  }
  // Para 4-6 cifras (miles)
  else if (num >= 100000) {
    return `Gs. ${Math.floor(num / 1000)}K`;
  }

  return numStr;
}

function CircularProgress({
  percentage,
  color,
  size,
  strokeWidth,
  label,
  value,
  sublabel,
  onClick
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Calcular tamaño de texto adaptativo según longitud del valor
  const valueLength = value.length;
  let textSizeClass = 'text-[9px] sm:text-[11px]'; // Default

  if (valueLength > 14) {
    // Números muy largos (ej: Gs. 1.850.000)
    textSizeClass = 'text-[7px] sm:text-[9px]';
  } else if (valueLength > 12) {
    // Números largos (ej: Gs. 350.000)
    textSizeClass = 'text-[8px] sm:text-[10px]';
  }

  return (
    <button
      onClick={onClick}
      className='group relative flex flex-col items-center transition-transform hover:scale-105'
    >
      <div className='relative' style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className='rotate-[-90deg]' width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke='#E5E7EB'
            strokeWidth={strokeWidth}
            fill='none'
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap='round'
            className='transition-all duration-1000 ease-in-out'
          />
        </svg>
        {/* Center content */}
        <div className='absolute inset-0 flex flex-col items-center justify-center px-4'>
          <p className='text-muted-foreground text-[7px] font-medium sm:text-[8px]'>
            {label}
          </p>
          <p
            className={`leading-tight font-bold ${textSizeClass}`}
            style={{ color }}
          >
            {value}
          </p>
          {sublabel && (
            <p className='text-muted-foreground text-[6px] sm:text-[7px]'>
              {sublabel}
            </p>
          )}
        </div>
      </div>
      {/* Percentage badge */}
      <Badge
        variant='secondary'
        className='mt-3'
        style={{
          backgroundColor: `${color}15`,
          color: color,
          borderColor: `${color}30`
        }}
      >
        {percentage.toFixed(0)}%
      </Badge>
    </button>
  );
}

export function IncomeExpenseChart({
  currentIncome,
  previousIncome,
  currentExpenses,
  previousExpenses
}: IncomeExpenseChartProps) {
  // Inicializar estados desde localStorage
  const [showIncome, setShowIncome] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('moni-chart-show-income');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showExpenses, setShowExpenses] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('moni-chart-show-expenses');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // Guardar en localStorage cuando cambien los estados
  useEffect(() => {
    localStorage.setItem('moni-chart-show-income', JSON.stringify(showIncome));
  }, [showIncome]);

  useEffect(() => {
    localStorage.setItem(
      'moni-chart-show-expenses',
      JSON.stringify(showExpenses)
    );
  }, [showExpenses]);

  const data = [
    {
      name: 'Mes Anterior',
      ingresos: previousIncome,
      gastos: previousExpenses
    },
    {
      name: 'Mes Actual',
      ingresos: currentIncome,
      gastos: currentExpenses
    }
  ];

  const handleCircleClick = (
    period: string,
    income: number,
    expenses: number
  ) => {
    setModalData({
      period,
      income,
      expenses
    });
    setModalOpen(true);
  };

  // Calcular el máximo para normalizar los porcentajes
  const maxValue = Math.max(
    previousIncome,
    currentIncome,
    previousExpenses,
    currentExpenses
  );

  // Calcular porcentajes para los anillos
  const previousIncomePercentage = (previousIncome / maxValue) * 100;
  const currentIncomePercentage = (currentIncome / maxValue) * 100;
  const previousExpensesPercentage = (previousExpenses / maxValue) * 100;
  const currentExpensesPercentage = (currentExpenses / maxValue) * 100;

  // Calcular cambios porcentuales
  const incomeChange =
    previousIncome > 0
      ? ((currentIncome - previousIncome) / previousIncome) * 100
      : 0;
  const expenseChange =
    previousExpenses > 0
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
      : 0;

  return (
    <div className='space-y-4'>
      {/* Header con controles de toggle */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Ingresos vs Gastos</h3>
        <div className='flex gap-3'>
          {/* Badge Ingresos - Interactive Toggle */}
          <button
            onClick={() => setShowIncome(!showIncome)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-all duration-200 ${
              showIncome
                ? 'bg-[#10B981]/10 hover:bg-[#10B981]/20'
                : 'bg-gray-100 opacity-50 hover:opacity-70'
            }`}
          >
            {showIncome ? (
              <Eye className='h-3 w-3 text-[#10B981]' />
            ) : (
              <EyeOff className='h-3 w-3 text-gray-400' />
            )}
            <span
              className={`text-xs font-medium ${showIncome ? 'text-[#10B981]' : 'text-gray-400'}`}
            >
              Ingresos
            </span>
          </button>
          {/* Badge Gastos - Interactive Toggle */}
          <button
            onClick={() => setShowExpenses(!showExpenses)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-all duration-200 ${
              showExpenses
                ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20'
                : 'bg-gray-100 opacity-50 hover:opacity-70'
            }`}
          >
            {showExpenses ? (
              <Eye className='h-3 w-3 text-[#EF4444]' />
            ) : (
              <EyeOff className='h-3 w-3 text-gray-400' />
            )}
            <span
              className={`text-xs font-medium ${showExpenses ? 'text-[#EF4444]' : 'text-gray-400'}`}
            >
              Gastos
            </span>
          </button>
        </div>
      </div>

      {/* Grid de 2 cards */}
      <div className='grid grid-cols-2 gap-3 md:gap-4'>
        {/* Card Mes Anterior */}
        <Card
          className='cursor-pointer transition-all hover:shadow-lg'
          onClick={() =>
            handleCircleClick('Mes Anterior', previousIncome, previousExpenses)
          }
        >
          <CardHeader className='pb-2'>
            <div className='flex flex-col gap-2'>
              <CardTitle className='text-sm font-semibold md:text-base'>
                Mes Anterior
              </CardTitle>
              <Badge
                variant='secondary'
                className={cn(
                  'w-fit text-xs',
                  previousIncome > previousExpenses
                    ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]'
                    : 'border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]'
                )}
              >
                {previousIncome > previousExpenses ? (
                  <>
                    <TrendingUp className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>Positivo</span>
                    <span className='sm:hidden'>+</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>Negativo</span>
                    <span className='sm:hidden'>-</span>
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='px-2 pb-3 md:px-6'>
            {/* Anillos del mes anterior */}
            <div className='flex flex-col items-center justify-center gap-3 py-2 sm:flex-row sm:justify-around sm:gap-4 sm:py-4'>
              {showIncome && (
                <div className='scale-100 sm:scale-125'>
                  <CircularProgress
                    percentage={previousIncomePercentage}
                    color='#10B981'
                    size={90}
                    strokeWidth={8}
                    label='Ingresos'
                    value={formatCurrencyPY(previousIncome)}
                  />
                </div>
              )}
              {showExpenses && (
                <div className='scale-100 sm:scale-125'>
                  <CircularProgress
                    percentage={previousExpensesPercentage}
                    color='#EF4444'
                    size={90}
                    strokeWidth={8}
                    label='Gastos'
                    value={formatCurrencyPY(previousExpenses)}
                  />
                </div>
              )}
            </div>
            {/* Balance */}
            <div className='mt-2 border-t pt-2 text-center sm:mt-4 sm:pt-3'>
              <p className='text-muted-foreground text-xs'>Balance</p>
              <p className='mt-1 text-base font-bold text-[#1F7D67] sm:text-xl'>
                {formatCurrencyPY(previousIncome - previousExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Mes Actual */}
        <Card
          className='cursor-pointer transition-all hover:shadow-lg'
          onClick={() =>
            handleCircleClick('Mes Actual', currentIncome, currentExpenses)
          }
        >
          <CardHeader className='pb-2'>
            <div className='flex flex-col gap-2'>
              <CardTitle className='text-sm font-semibold md:text-base'>
                Mes Actual
              </CardTitle>
              <Badge
                variant='secondary'
                className={cn(
                  'w-fit text-xs',
                  currentIncome > currentExpenses
                    ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]'
                    : 'border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]'
                )}
              >
                {currentIncome > currentExpenses ? (
                  <>
                    <TrendingUp className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>Positivo</span>
                    <span className='sm:hidden'>+</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>Negativo</span>
                    <span className='sm:hidden'>-</span>
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='px-2 pb-3 md:px-6'>
            {/* Anillos del mes actual */}
            <div className='flex flex-col items-center justify-center gap-3 py-2 sm:flex-row sm:justify-around sm:gap-4 sm:py-4'>
              {showIncome && (
                <div className='scale-100 sm:scale-125'>
                  <CircularProgress
                    percentage={currentIncomePercentage}
                    color='#10B981'
                    size={90}
                    strokeWidth={8}
                    label='Ingresos'
                    value={formatCurrencyPY(currentIncome)}
                  />
                </div>
              )}
              {showExpenses && (
                <div className='scale-100 sm:scale-125'>
                  <CircularProgress
                    percentage={currentExpensesPercentage}
                    color='#EF4444'
                    size={90}
                    strokeWidth={8}
                    label='Gastos'
                    value={formatCurrencyPY(currentExpenses)}
                  />
                </div>
              )}
            </div>
            {/* Balance */}
            <div className='mt-2 border-t pt-2 text-center sm:mt-4 sm:pt-3'>
              <p className='text-muted-foreground text-xs'>Balance</p>
              <p className='mt-1 text-base font-bold text-[#1F7D67] sm:text-xl'>
                {formatCurrencyPY(currentIncome - currentExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Interactivo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F7D67]/10'>
                  <PieChart className='h-5 w-5 text-[#1F7D67]' />
                </div>
                <div>
                  <DialogTitle className='text-xl'>
                    Resumen Financiero
                  </DialogTitle>
                  <DialogDescription className='flex items-center gap-1.5 text-sm'>
                    <Calendar className='h-3.5 w-3.5' />
                    {modalData?.period}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {modalData && (
            <div className='space-y-4'>
              {/* Tarjeta de Ingresos */}
              <div className='rounded-lg border border-[#10B981]/20 bg-[#10B981]/5 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/20'>
                      <ArrowUpRight className='h-6 w-6 text-[#10B981]' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-xs font-medium'>
                        Total Ingresos
                      </p>
                      <p className='text-2xl font-bold text-[#10B981]'>
                        {formatCurrencyPY(modalData.income)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant='secondary'
                    className='border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]'
                  >
                    Ingreso
                  </Badge>
                </div>
              </div>

              {/* Tarjeta de Gastos */}
              <div className='rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/5 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/20'>
                      <ArrowDownRight className='h-6 w-6 text-[#EF4444]' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-xs font-medium'>
                        Total Gastos
                      </p>
                      <p className='text-2xl font-bold text-[#EF4444]'>
                        {formatCurrencyPY(modalData.expenses)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant='secondary'
                    className='border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]'
                  >
                    Gasto
                  </Badge>
                </div>
              </div>

              {/* Balance Neto */}
              <div className='rounded-lg border border-[#1F7D67]/20 bg-[#1F7D67]/5 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#1F7D67]/20'>
                      <Wallet className='h-6 w-6 text-[#1F7D67]' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-xs font-medium'>
                        Balance Neto
                      </p>
                      <p className='text-2xl font-bold text-[#1F7D67]'>
                        {formatCurrencyPY(
                          modalData.income - modalData.expenses
                        )}
                      </p>
                    </div>
                  </div>
                  {modalData.income > modalData.expenses ? (
                    <Badge
                      variant='secondary'
                      className='border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]'
                    >
                      <TrendingUp className='mr-1 h-3 w-3' />
                      Positivo
                    </Badge>
                  ) : (
                    <Badge
                      variant='secondary'
                      className='border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]'
                    >
                      <TrendingDown className='mr-1 h-3 w-3' />
                      Negativo
                    </Badge>
                  )}
                </div>
              </div>

              {/* Ratio de Ahorro */}
              <div className='bg-muted/50 rounded-lg border p-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium'>Ratio de Ahorro</p>
                    <p className='text-lg font-bold text-[#1F7D67]'>
                      {modalData.income > 0
                        ? (
                            ((modalData.income - modalData.expenses) /
                              modalData.income) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                    <div
                      className='h-full bg-[#1F7D67] transition-all duration-500'
                      style={{
                        width: `${Math.min(
                          Math.max(
                            modalData.income > 0
                              ? ((modalData.income - modalData.expenses) /
                                  modalData.income) *
                                  100
                              : 0,
                            0
                          ),
                          100
                        )}%`
                      }}
                    />
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {modalData.income > modalData.expenses
                      ? 'Estás ahorrando dinero este período'
                      : 'Tus gastos superan tus ingresos'}
                  </p>
                </div>
              </div>

              {/* Botón de Acción */}
              <Button
                className='w-full bg-[#1F7D67] hover:bg-[#1F7D67]/90'
                onClick={() => setModalOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
