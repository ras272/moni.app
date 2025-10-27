-- =====================================================
-- Migration: 20251027200000_definitive_rls_insert_fix
-- Fix: Ensure RLS INSERT policies are set to WITH CHECK (true)
-- and explicitly granted TO authenticated.
-- =====================================================

BEGIN;

-- 1. MONEY_TAG_GROUPS (CRÍTICO)
-- Drop existing policy
DROP POLICY IF EXISTS groups_insert_own ON money_tag_groups;

-- Recreate policy, explicitly allowing authenticated role to INSERT with no RLS check
CREATE POLICY groups_insert_own ON money_tag_groups
    FOR INSERT
    TO authenticated  -- ¡CLAVE! Asegura que el rol 'authenticated' pueda usarla
    WITH CHECK (true);

COMMENT ON POLICY groups_insert_own ON money_tag_groups IS 
  'Allow INSERT for authenticated users. Server Action validates owner_profile_id.';

-- 2. GROUP_PARTICIPANTS (Por si acaso)
DROP POLICY IF EXISTS participants_insert_owner ON group_participants;
CREATE POLICY participants_insert_owner ON group_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON POLICY participants_insert_owner ON group_participants IS 
  'Allow INSERT for authenticated users. Server Action validates permissions.';

-- 3. GROUP_EXPENSES (Por si acaso)
DROP POLICY IF EXISTS expenses_insert_members ON group_expenses;
CREATE POLICY expenses_insert_members ON group_expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON POLICY expenses_insert_members ON group_expenses IS 
  'Allow INSERT for authenticated users. Server Action validates permissions.';

-- 4. EXPENSE_SPLITS (Por si acaso)
DROP POLICY IF EXISTS splits_insert_expense_owner ON expense_splits;
CREATE POLICY splits_insert_expense_owner ON expense_splits
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON POLICY splits_insert_expense_owner ON expense_splits IS 
  'Allow INSERT for authenticated users. Server Action validates permissions.';

COMMIT;

-- =====================================================
-- VERIFICACIÓN MANUAL POST-MIGRACIÓN
-- =====================================================
-- Ejecuta esto en tu cliente SQL (con el rol 'authenticated') para confirmar:
-- INSERT INTO money_tag_groups (owner_profile_id, name, description) 
-- VALUES ('<tu_profile_id_aqui>', 'Test 3', 'Test RLS');
-- Si esto funciona, la Server Action funcionará.
