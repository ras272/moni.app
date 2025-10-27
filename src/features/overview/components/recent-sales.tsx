import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { formatCurrencyPY } from '@/lib/utils';

const salesData = [
  {
    name: 'Biggie',
    email: 'Supermercado',
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    fallback: 'BG',
    amount: 450000
  },
  {
    name: 'Stock',
    email: 'Supermercado',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    fallback: 'ST',
    amount: 320000
  },
  {
    name: 'MUV',
    email: 'Transporte',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    fallback: 'MV',
    amount: 75000
  },
  {
    name: 'Pago ANDE',
    email: 'Servicios',
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    fallback: 'AN',
    amount: 280000
  },
  {
    name: 'Farmacia Catedral',
    email: 'Salud',
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    fallback: 'FC',
    amount: 120000
  }
];

export function RecentSales() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Últimas Transacciones</CardTitle>
        <CardDescription>
          Registraste 50 transacciones este mes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {salesData.map((sale, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage src={sale.avatar} alt='Avatar' />
                <AvatarFallback>{sale.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{sale.name}</p>
                <p className='text-muted-foreground text-sm'>{sale.email}</p>
              </div>
              <div className='ml-auto font-medium'>
                {formatCurrencyPY(sale.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
