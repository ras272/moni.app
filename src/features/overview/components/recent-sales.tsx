import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { formatCurrencyPY } from '@/lib/utils';

type Transaction = {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  merchant: string | null;
  transaction_date: string;
  category: {
    name: string;
    icon: string;
    color: string;
  } | null;
};

type RecentSalesProps = {
  transactions: Transaction[];
};

export function RecentSales({ transactions }: RecentSalesProps) {
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTransactionSign = (type: string) => {
    if (type === 'income') return '+';
    if (type === 'expense') return '-';
    return '';
  };

  const safeTransactions = transactions || [];

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Últimas Transacciones</CardTitle>
        <CardDescription>
          {safeTransactions.length > 0
            ? `Tus ${safeTransactions.length} transacciones más recientes`
            : 'No hay transacciones registradas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {safeTransactions.length === 0 ? (
          <div className='flex min-h-[200px] items-center justify-center'>
            <p className='text-muted-foreground text-sm'>
              No hay transacciones para mostrar
            </p>
          </div>
        ) : (
          <div className='space-y-8'>
            {safeTransactions.map((transaction) => (
              <div key={transaction.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback
                    style={{
                      backgroundColor: transaction.category?.color || '#94a3b8'
                    }}
                    className='text-white'
                  >
                    {transaction.merchant
                      ? getInitials(transaction.merchant)
                      : getInitials(transaction.description)}
                  </AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1'>
                  <p className='text-sm leading-none font-medium'>
                    {transaction.merchant || transaction.description}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {transaction.category?.name || 'Sin categoría'}
                  </p>
                </div>
                <div
                  className={`ml-auto font-medium ${
                    transaction.type === 'income'
                      ? 'text-green-600'
                      : transaction.type === 'expense'
                        ? 'text-red-600'
                        : ''
                  }`}
                >
                  {getTransactionSign(transaction.type)}
                  {formatCurrencyPY(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
