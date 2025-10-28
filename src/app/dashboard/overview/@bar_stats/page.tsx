import { BarGraph } from '@/features/overview/components/bar-graph';
import { getDailyCashFlow } from '@/lib/supabase/dashboard-stats';

export default async function BarStats() {
  const dailyCashFlow = await getDailyCashFlow(90);

  return <BarGraph data={dailyCashFlow} />;
}
