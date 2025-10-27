-- Migration: create_rls_policies
-- Description: Implementa Row Level Security en todas las tablas
-- Created: 2025-10-27
-- Version: 1.0
-- Dependencies: 20251027000001, 20251027000002, 20251027000003

BEGIN;

-- =====================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_tag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. RLS POLICIES: profiles
-- =====================================================

-- SELECT: Solo tu propio perfil
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT 
  USING (auth_id = auth.uid());

-- INSERT: Solo al registrarse (Supabase Auth maneja esto)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT 
  WITH CHECK (auth_id = auth.uid());

-- UPDATE: Solo tu propio perfil
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE 
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- DELETE: No permitido (se maneja desde Auth)
-- Intencionalmente no creamos política DELETE

-- =====================================================
-- 3. RLS POLICIES: categories
-- =====================================================

-- SELECT: Categorías del sistema + tus propias categorías
CREATE POLICY categories_select ON categories
  FOR SELECT 
  USING (
    is_system = TRUE 
    OR profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- INSERT: Solo puedes crear tus propias categorías (no sistema)
CREATE POLICY categories_insert_own ON categories
  FOR INSERT 
  WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) 
    AND is_system = FALSE
  );

-- UPDATE: Solo tus propias categorías (no sistema)
CREATE POLICY categories_update_own ON categories
  FOR UPDATE 
  USING (
    profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) 
    AND is_system = FALSE
  )
  WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) 
    AND is_system = FALSE
  );

-- DELETE: Solo tus propias categorías (no sistema)
CREATE POLICY categories_delete_own ON categories
  FOR DELETE 
  USING (
    profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) 
    AND is_system = FALSE
  );

-- =====================================================
-- 4. RLS POLICIES: accounts
-- =====================================================

-- Una política ALL simplificada para cuentas
CREATE POLICY accounts_all_own ON accounts
  FOR ALL 
  USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- =====================================================
-- 5. RLS POLICIES: transactions
-- =====================================================

-- Una política ALL simplificada para transacciones
CREATE POLICY transactions_all_own ON transactions
  FOR ALL 
  USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- =====================================================
-- 6. RLS POLICIES: money_tag_groups
-- =====================================================

-- SELECT: Grupos donde eres owner O participante
CREATE POLICY groups_select ON money_tag_groups
  FOR SELECT 
  USING (
    owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 
      FROM group_participants 
      WHERE group_id = money_tag_groups.id 
        AND profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- INSERT: Solo puedes crear grupos propios
CREATE POLICY groups_insert_own ON money_tag_groups
  FOR INSERT 
  WITH CHECK (owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- UPDATE: Solo el owner puede modificar
CREATE POLICY groups_update_owner ON money_tag_groups
  FOR UPDATE 
  USING (owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- DELETE: Solo el owner puede eliminar
CREATE POLICY groups_delete_owner ON money_tag_groups
  FOR DELETE 
  USING (owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- =====================================================
-- 7. RLS POLICIES: group_participants
-- =====================================================

-- SELECT: Ver participantes de grupos donde estás
CREATE POLICY participants_select ON group_participants
  FOR SELECT 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
    OR group_id IN (
      SELECT group_id 
      FROM group_participants 
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- INSERT: Solo el owner del grupo puede agregar participantes
CREATE POLICY participants_insert_owner ON group_participants
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- UPDATE: Solo el owner puede modificar participantes
CREATE POLICY participants_update_owner ON group_participants
  FOR UPDATE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- DELETE: Solo el owner puede eliminar participantes
CREATE POLICY participants_delete_owner ON group_participants
  FOR DELETE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- 8. RLS POLICIES: group_expenses
-- =====================================================

-- SELECT: Ver gastos de grupos donde participas
CREATE POLICY expenses_select ON group_expenses
  FOR SELECT 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
    OR group_id IN (
      SELECT group_id 
      FROM group_participants 
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- INSERT: Cualquier participante del grupo puede agregar gastos
CREATE POLICY expenses_insert_participant ON group_expenses
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
    OR group_id IN (
      SELECT group_id 
      FROM group_participants 
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- UPDATE: Solo owner del grupo o quien pagó
CREATE POLICY expenses_update_owner_or_payer ON group_expenses
  FOR UPDATE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
    OR paid_by_participant_id IN (
      SELECT id 
      FROM group_participants 
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
    OR paid_by_participant_id IN (
      SELECT id 
      FROM group_participants 
      WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- DELETE: Solo owner del grupo
CREATE POLICY expenses_delete_owner ON group_expenses
  FOR DELETE 
  USING (
    group_id IN (
      SELECT id 
      FROM money_tag_groups 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- 9. RLS POLICIES: expense_splits
-- =====================================================

-- SELECT: Ver splits de gastos de tus grupos
CREATE POLICY splits_select ON expense_splits
  FOR SELECT 
  USING (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
      OR group_id IN (
        SELECT group_id 
        FROM group_participants 
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    )
  );

-- INSERT: Cualquier participante puede agregar splits al crear gasto
CREATE POLICY splits_insert_participant ON expense_splits
  FOR INSERT 
  WITH CHECK (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
      OR group_id IN (
        SELECT group_id 
        FROM group_participants 
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    )
  );

-- UPDATE: Solo owner del grupo
CREATE POLICY splits_update_owner ON expense_splits
  FOR UPDATE 
  USING (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    )
  );

-- DELETE: Solo owner del grupo
CREATE POLICY splits_delete_owner ON expense_splits
  FOR DELETE 
  USING (
    expense_id IN (
      SELECT id 
      FROM group_expenses 
      WHERE group_id IN (
        SELECT id 
        FROM money_tag_groups 
        WHERE owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    )
  );

COMMIT;
