'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyPY } from '@/lib/utils';
import { SegmentedProgressBar } from './segmented-progress-bar';
import {
  Car,
  ShoppingBag,
  Home,
  Utensils,
  Heart,
  Tv,
  GraduationCap,
  Plane,
  Gift,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface CategoryExpense {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface TopExpenseCategoriesProps {
  categories: CategoryExpense[];
}

// Mapeo de nombres de categorías a iconos
const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    transporte: <Car className='h-4 w-4' />,
    compras: <ShoppingBag className='h-4 w-4' />,
    hogar: <Home className='h-4 w-4' />,
    comida: <Utensils className='h-4 w-4' />,
    salud: <Heart className='h-4 w-4' />,
    entretenimiento: <Tv className='h-4 w-4' />,
    educación: <GraduationCap className='h-4 w-4' />,
    viajes: <Plane className='h-4 w-4' />,
    regalos: <Gift className='h-4 w-4' />,
    inversiones: <TrendingUp className='h-4 w-4' />
  };

  const normalizedName = categoryName.toLowerCase();
  return iconMap[normalizedName] || <DollarSign className='h-4 w-4' />;
};

export function TopExpenseCategories({
  categories
}: TopExpenseCategoriesProps) {
  return (
    <Card className='shadow-modern rounded-xl'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold'>
              Top Categorías de Gasto
            </CardTitle>
            <p className='text-muted-foreground mt-1 text-xs'>
              Donde se va tu dinero
            </p>
          </div>
          <Tabs defaultValue='month'>
            <TabsList>
              <TabsTrigger value='month' className='text-xs'>
                Este Mes
              </TabsTrigger>
              <TabsTrigger value='60d' className='text-xs'>
                60D
              </TabsTrigger>
              <TabsTrigger value='90d' className='text-xs'>
                90D
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {categories.map((category, index) => (
            <div
              key={index}
              className='animate-in fade-in slide-in-from-right-4 space-y-2'
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Header con nombre y monto */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2.5'>
                  <div
                    className='flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-110'
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span style={{ color: category.color }}>
                      {getCategoryIcon(category.name)}
                    </span>
                  </div>
                  <span className='text-sm font-medium'>{category.name}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-numbers text-sm font-semibold tabular-nums'>
                    {formatCurrencyPY(category.amount)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {category.percentage}%
                  </span>
                </div>
              </div>

              {/* Barra de progreso segmentada */}
              <SegmentedProgressBar
                percentage={category.percentage}
                color={category.color}
                segmentCount={20}
                animated={true}
              />
            </div>
          ))}

          {categories.length === 0 && (
            <div className='flex min-h-[120px] items-center justify-center'>
              <p className='text-muted-foreground text-sm'>
                No hay gastos para mostrar
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
