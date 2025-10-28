import { AreaGraph } from '@/features/overview/components/area-graph';
import { getDailyCashFlow } from '@/lib/supabase/dashboard-stats';

export default async function AreaStats() {
  const dailyCashFlow = await getDailyCashFlow(90);
  return <AreaGraph data={dailyCashFlow} />;
}
