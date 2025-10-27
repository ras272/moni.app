import { supabase, getCurrentProfileId } from './client';
import type { Category, CategoryType } from '@/types/database';

export async function fetchCategories(type?: CategoryType) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: {
  name: string;
  icon: string;
  color?: string;
  type?: CategoryType;
}) {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('categories')
    .insert({
      profile_id: profileId,
      name: input.name,
      icon: input.icon,
      color: input.color || '#3B82F6',
      type: input.type || 'expense',
      is_system: false
    })
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  updates: { name?: string; icon?: string; color?: string }
) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
