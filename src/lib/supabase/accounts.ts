import { supabase, getCurrentProfileId } from './client';
import type { Account, AccountType } from '@/types/database';

export async function fetchAccounts(includeInactive = false) {
  let query = supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Account[];
}

export async function fetchAccount(id: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Account;
}

export async function createAccount(input: {
  name: string;
  type: AccountType;
  institution?: string;
  currency?: string;
  initial_balance?: number;
  color?: string;
  icon?: string;
}) {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      profile_id: profileId,
      name: input.name,
      type: input.type,
      institution: input.institution || null,
      currency: input.currency || 'PYG',
      initial_balance: input.initial_balance || 0,
      current_balance: input.initial_balance || 0,
      color: input.color || '#3B82F6',
      icon: input.icon || 'wallet',
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data as Account;
}

export async function updateAccount(
  id: string,
  updates: {
    name?: string;
    type?: AccountType;
    institution?: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Account;
}

export async function deleteAccount(id: string) {
  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}
