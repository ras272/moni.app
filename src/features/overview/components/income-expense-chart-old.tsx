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
  // Remover TODAS las variaciones de "Gs" y los puntos/comas
  const cleanStr = numStr
    .replace(/Gs\.?\s*/g, '') // Quita "Gs." o "Gs" con o sin espacio
    .replace(/\./g, '') // Quita puntos de miles
    .replace(/,/g, '') // Quita comas
    .trim();

  const num = parseFloat(cleanStr);

  if (isNaN(num)) return '0';

  // Para números negativos
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Para 1 millón o más (7+ cifras)
  if (absNum >= 1000000) {
    const millions = absNum / 1000000;
    const formatted =
      millions >= 10
        ? millions.toFixed(0) // 10M, 25M (sin decimales)
        : millions.toFixed(1); // 1.5M, 9.8M (con decimal)
    return `${isNegative ? '-' : ''}${formatted}M`;
  }
  // Para 1000 o más - SIEMPRE usar formato K
  else if (absNum >= 1000) {
    const thousands = absNum / 1000;
    const formatted =
      thousands >= 100
        ? thousands.toFixed(0) // 100K, 898K (sin decimales)
        : thousands >= 10
          ? thousands.toFixed(0) // 10K, 98K (sin decimales)
          : thousands.toFixed(1); // 1.5K, 9.8K (con 1 decimal)
    return `${isNegative ? '-' : ''}${formatted}K`;
  }

  // Para números menores a 1000
  return `${isNegative ? '-' : ''}${absNum.toFixed(0)}`;
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

  return (
    <button
      onClick={onClick}
      className='group relative flex flex-col items-center gap-3'
    >
      <div className='relative' style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className='rotate-[-90deg]' width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke='currentColor'
            strokeWidth={strokeWidth}
            fill='none'
            className='text-gray-200 dark:text-gray-800'
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
            className='transition-all duration-1000 ease-out'
          />
        </svg>

        {/* Center content */}
        <div className='absolute inset-0 flex flex-col items-center justify-center px-1'>
          <p className='text-muted-foreground mb-0.5 text-[8px] font-medium tracking-wider uppercase'>
            {label}
          </p>
          <div className='flex flex-col items-center'>
            <span className='text-muted-foreground text-[9px] font-medium'>
              Gs.
            </span>
            <p
              className='font-numbers -mt-0.5 text-base leading-tight font-extrabold sm:text-lg'
              style={{ color }}
            >
              {formatCompactNumber(value)}
            </p>
          </div>
        </div>
      </div>

      {/* Percentage badge */}
      <div className='flex flex-col items-center gap-1'>
        <Badge
          variant='secondary'
          className='px-3 py-1 text-xs font-semibold'
          style={{
            backgroundColor: `${color}10`,
            color: color,
            border: `1px solid ${color}20`
          }}
        >
          {percentage.toFixed(0)}%
        </Badge>
      </div>
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
      <div className='grid grid-cols-2 gap-4 md:gap-6'>
        {/* Card Mes Anterior */}
        <Card
          className='group shadow-modern hover:shadow-modern-lg cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1'
          onClick={() =>
            handleCircleClick('Mes Anterior', previousIncome, previousExpenses)
          }
        >
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col gap-2'>
                <CardTitle className='text-base font-bold md:text-lg'>
                  Mes Anterior
                </CardTitle>
                <Badge
                  variant='secondary'
                  className={cn(
                    'w-fit px-2.5 py-1 text-xs font-semibold',
                    previousIncome > previousExpenses
                      ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                      : 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]'
                  )}
                >
                  {previousIncome > previousExpenses ? (
                    <>
                      <TrendingUp className='mr-1 h-3.5 w-3.5' />
                      <span>Positivo</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className='mr-1 h-3.5 w-3.5' />
                      <span>Negativo</span>
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-4 pb-4 md:px-6'>
            {/* Anillos del mes anterior */}
            <div className='flex flex-col items-center justify-center gap-6 py-4 sm:flex-row sm:justify-around sm:gap-8'>
              {showIncome && (
                <CircularProgress
                  percentage={previousIncomePercentage}
                  color='#10B981'
                  size={100}
                  strokeWidth={12}
                  label='Ingresos'
                  value={formatCurrencyPY(previousIncome)}
                />
              )}
              {showExpenses && (
                <CircularProgress
                  percentage={previousExpensesPercentage}
                  color='#EF4444'
                  size={100}
                  strokeWidth={12}
                  label='Gastos'
                  value={formatCurrencyPY(previousExpenses)}
                />
              )}
            </div>
            {/* Balance */}
            <div className='bg-muted/30 mt-4 rounded-xl p-3 text-center'>
              <p className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
                Balance
              </p>
              <p className='font-numbers text-xl font-extrabold text-[#01674f] sm:text-2xl'>
                {formatCurrencyPY(previousIncome - previousExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Mes Actual */}
        <Card
          className='group shadow-modern hover:shadow-modern-lg cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1'
          onClick={() =>
            handleCircleClick('Mes Actual', currentIncome, currentExpenses)
          }
        >
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col gap-2'>
                <CardTitle className='text-base font-bold md:text-lg'>
                  Mes Actual
                </CardTitle>
                <Badge
                  variant='secondary'
                  className={cn(
                    'w-fit px-2.5 py-1 text-xs font-semibold',
                    currentIncome > currentExpenses
                      ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                      : 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]'
                  )}
                >
                  {currentIncome > currentExpenses ? (
                    <>
                      <TrendingUp className='mr-1 h-3.5 w-3.5' />
                      <span>Positivo</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className='mr-1 h-3.5 w-3.5' />
                      <span>Negativo</span>
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-4 pb-4 md:px-6'>
            {/* Anillos del mes actual */}
            <div className='flex flex-col items-center justify-center gap-6 py-4 sm:flex-row sm:justify-around sm:gap-8'>
              {showIncome && (
                <CircularProgress
                  percentage={currentIncomePercentage}
                  color='#10B981'
                  size={100}
                  strokeWidth={12}
                  label='Ingresos'
                  value={formatCurrencyPY(currentIncome)}
                />
              )}
              {showExpenses && (
                <CircularProgress
                  percentage={currentExpensesPercentage}
                  color='#EF4444'
                  size={100}
                  strokeWidth={12}
                  label='Gastos'
                  value={formatCurrencyPY(currentExpenses)}
                />
              )}
            </div>
            {/* Balance */}
            <div className='bg-muted/30 mt-4 rounded-xl p-3 text-center'>
              <p className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
                Balance
              </p>
              <p className='font-numbers text-xl font-extrabold text-[#01674f] sm:text-2xl'>
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
