import { PieGraph } from '@/features/overview/components/pie-graph';
import { getExpensesByCategory } from '@/lib/supabase/dashboard-stats';

export default async function Stats() {
  const categoryExpenses = await getExpensesByCategory();
  return <PieGraph data={categoryExpenses} />;
}
