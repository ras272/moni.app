import { RecentSales } from '@/features/overview/components/recent-sales';
import { getRecentTransactions } from '@/lib/supabase/dashboard-stats';

export default async function Sales() {
  const transactions = await getRecentTransactions(5);
  return <RecentSales transactions={transactions} />;
}
