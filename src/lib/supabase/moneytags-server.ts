import { createClient } from './server';
import type { MoneyTagGroup, GroupParticipant } from '@/types/database';

export type MoneyTagGroupWithParticipants = MoneyTagGroup & {
  participants: GroupParticipant[];
  participant_count: number;
};

/**
 * Fetch MoneyTag groups from server-side
 * Para usar en Server Components
 *
 * Retorna grupos donde el usuario es owner O participante
 */
export async function fetchMoneyTagGroupsServer(
  includeSettled = false
): Promise<MoneyTagGroupWithParticipants[]> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get profile_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!profile) {
    return [];
  }

  // Build query
  let query = supabase
    .from('money_tag_groups')
    .select(
      `
      *,
      participants:group_participants(*)
    `
    )
    .order('created_at', { ascending: false });

  // Filter by settled status
  if (!includeSettled) {
    query = query.eq('is_settled', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Filter groups where user is owner OR participant
  const filteredGroups = data.filter((group: any) => {
    // User is owner
    if (group.owner_profile_id === profile.id) {
      return true;
    }

    // User is participant
    const isParticipant = group.participants?.some(
      (p: GroupParticipant) => p.profile_id === profile.id
    );

    return isParticipant;
  });

  // Add participant count
  const groupsWithCount = filteredGroups.map((group: any) => ({
    ...group,
    participant_count: group.participants?.length || 0
  }));

  return groupsWithCount as MoneyTagGroupWithParticipants[];
}

/**
 * Fetch single MoneyTag group with details
 * Para usar en Server Components de detalle de grupo
 */
export async function fetchMoneyTagGroupByIdServer(
  groupId: string
): Promise<MoneyTagGroupWithParticipants | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('money_tag_groups')
    .select(
      `
      *,
      participants:group_participants(*)
    `
    )
    .eq('id', groupId)
    .single();

  if (error) {
    console.error('Error fetching group:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    participant_count: data.participants?.length || 0
  } as MoneyTagGroupWithParticipants;
}

/**
 * Fetch group expenses with relations
 * Para usar en Server Components
 */
export async function fetchGroupExpensesServer(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('group_expenses')
    .select(
      `
      *,
      paid_by:group_participants!group_expenses_paid_by_participant_id_fkey(
        id,
        name,
        avatar_url
      ),
      splits:expense_splits(
        id,
        participant:group_participants(
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq('group_id', groupId)
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  // Transform to fix array nesting from Supabase
  const expenses = (data || []).map((expense: any) => ({
    ...expense,
    paid_by: Array.isArray(expense.paid_by)
      ? expense.paid_by[0]
      : expense.paid_by
  }));

  return expenses;
}

/**
 * Calculate debts using Postgres function
 * Para usar en Server Components
 */
export async function calculateGroupDebtsServer(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('calculate_group_debts', {
    group_uuid: groupId
  });

  if (error) {
    console.error('Error calculating debts:', error);
    return [];
  }

  return data || [];
}
