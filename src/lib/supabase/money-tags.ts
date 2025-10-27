import { supabase, getCurrentProfileId } from './client';
import type {
  MoneyTagGroup,
  GroupParticipant,
  GroupExpense,
  GroupExpenseWithRelations,
  GroupDebt
} from '@/types/database';

// =====================================================
// GROUPS
// =====================================================

export async function fetchGroups() {
  const { data, error } = await supabase
    .from('money_tag_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as MoneyTagGroup[];
}

export async function fetchGroup(id: string) {
  const { data, error } = await supabase
    .from('money_tag_groups')
    .select(
      `
      *,
      participants:group_participants(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createGroup(input: {
  name: string;
  description?: string;
  participant_ids?: string[];
  external_participants?: { name: string; phone?: string }[];
}) {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado');

  // 1. Crear grupo
  const { data: group, error: groupError } = await supabase
    .from('money_tag_groups')
    .insert({
      owner_profile_id: profileId,
      name: input.name,
      description: input.description || null
    })
    .select()
    .single();

  if (groupError || !group) throw groupError;

  // 2. Agregar participantes registrados
  if (input.participant_ids?.length) {
    const participants = input.participant_ids.map((profileId) => ({
      group_id: group.id,
      profile_id: profileId,
      name: ''
    }));

    const { error: pError } = await supabase
      .from('group_participants')
      .insert(participants);
    if (pError) throw pError;
  }

  // 3. Agregar participantes externos
  if (input.external_participants?.length) {
    const externalPart = input.external_participants.map((p) => ({
      group_id: group.id,
      profile_id: null,
      name: p.name,
      phone: p.phone || null
    }));

    const { error: eError } = await supabase
      .from('group_participants')
      .insert(externalPart);
    if (eError) throw eError;
  }

  return group as MoneyTagGroup;
}

export async function updateGroup(
  id: string,
  updates: {
    name?: string;
    description?: string;
    is_settled?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('money_tag_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MoneyTagGroup;
}

export async function deleteGroup(id: string) {
  const { error } = await supabase
    .from('money_tag_groups')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// =====================================================
// PARTICIPANTS
// =====================================================

export async function fetchParticipants(groupId: string) {
  const { data, error } = await supabase
    .from('group_participants')
    .select('*')
    .eq('group_id', groupId)
    .order('name');

  if (error) throw error;
  return data as GroupParticipant[];
}

// =====================================================
// EXPENSES
// =====================================================

export async function fetchExpenses(groupId: string) {
  const { data, error } = await supabase
    .from('group_expenses')
    .select(
      `
      *,
      paid_by:group_participants!group_expenses_paid_by_participant_id_fkey(*),
      splits:expense_splits(
        *,
        participant:group_participants(*)
      )
    `
    )
    .eq('group_id', groupId)
    .order('expense_date', { ascending: false });

  if (error) throw error;
  return data as GroupExpenseWithRelations[];
}

export async function createExpense(input: {
  group_id: string;
  description: string;
  amount: number;
  currency?: string;
  paid_by_participant_id: string;
  expense_date: string;
  split_participant_ids: string[];
}) {
  // 1. Crear gasto
  const { data: expense, error: expenseError } = await supabase
    .from('group_expenses')
    .insert({
      group_id: input.group_id,
      description: input.description,
      amount: input.amount,
      currency: input.currency || 'PYG',
      paid_by_participant_id: input.paid_by_participant_id,
      expense_date: input.expense_date
    })
    .select()
    .single();

  if (expenseError || !expense) throw expenseError;

  // 2. Crear splits
  const splits = input.split_participant_ids.map((participantId) => ({
    expense_id: expense.id,
    participant_id: participantId
  }));

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splits);

  if (splitsError) throw splitsError;

  return expense as GroupExpense;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('group_expenses').delete().eq('id', id);
  if (error) throw error;
}

// =====================================================
// DEBTS
// =====================================================

export async function calculateDebts(groupId: string) {
  const { data, error } = await supabase.rpc('calculate_group_debts', {
    group_uuid: groupId
  });

  if (error) throw error;
  return data as GroupDebt[];
}
