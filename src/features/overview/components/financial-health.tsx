'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyPY } from '@/lib/utils';
import { SegmentedProgressBar } from './segmented-progress-bar';

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

export function TopExpenseCategories({
  categories
}: TopExpenseCategoriesProps) {
  return (
    <Card>
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
            <div key={index} className='space-y-2'>
              {/* Header con nombre y monto */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div
                    className='h-2 w-2 rounded-full'
                    style={{ backgroundColor: category.color }}
                  />
                  <span className='text-sm font-medium'>{category.name}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-semibold tabular-nums'>
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
