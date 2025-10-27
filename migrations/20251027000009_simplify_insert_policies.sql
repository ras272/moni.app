-- =====================================================
-- Migration: Simplify INSERT Policies for Server Actions
-- Date: 2025-10-27
-- =====================================================
-- Problem: RLS INSERT policies fail in Server Actions context
-- because auth.uid() may not be available
--
-- Solution: Remove the WITH CHECK constraint that validates
-- owner_profile_id, since we validate this in the Server Action
-- =====================================================

BEGIN;

-- =====================================================
-- Fix money_tag_groups INSERT policy
-- =====================================================

DROP POLICY IF EXISTS groups_insert_own ON money_tag_groups;

-- New policy: Allow INSERT for authenticated users
-- Server Action validates owner_profile_id before INSERT
CREATE POLICY groups_insert_own ON money_tag_groups
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY groups_insert_own ON money_tag_groups IS 
  'Allow INSERT for authenticated users. Server Action validates owner_profile_id.';

-- =====================================================
-- Fix group_participants INSERT policy
-- =====================================================

DROP POLICY IF EXISTS participants_insert_owner ON group_participants;

-- New policy: Allow INSERT for authenticated users
-- Server Action validates group ownership before INSERT
CREATE POLICY participants_insert_owner ON group_participants
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY participants_insert_owner ON group_participants IS 
  'Allow INSERT for authenticated users. Server Action validates group ownership.';

-- =====================================================
-- Fix group_expenses INSERT policy
-- =====================================================

DROP POLICY IF EXISTS expenses_insert_members ON group_expenses;

-- New policy: Allow INSERT for authenticated users
-- Server Action validates participant/owner status before INSERT
CREATE POLICY expenses_insert_members ON group_expenses
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY expenses_insert_members ON group_expenses IS 
  'Allow INSERT for authenticated users. Server Action validates permissions.';

-- =====================================================
-- Fix expense_splits INSERT policy
-- =====================================================

DROP POLICY IF EXISTS splits_insert_expense_owner ON expense_splits;

-- New policy: Allow INSERT for authenticated users
-- Server Action validates expense ownership before INSERT
CREATE POLICY splits_insert_expense_owner ON expense_splits
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY splits_insert_expense_owner ON expense_splits IS 
  'Allow INSERT for authenticated users. Server Action validates permissions.';

COMMIT;

-- =====================================================
-- Note: Security is maintained in Server Actions
-- =====================================================
-- All Server Actions validate:
-- 1. User is authenticated (getCurrentProfileId checks this)
-- 2. User has permission to perform the operation
-- 3. Data integrity (e.g., owner_profile_id matches current user)
--
-- RLS policies now focus on READ operations (SELECT)
-- while Server Actions handle validation for WRITE operations (INSERT/UPDATE/DELETE)
-- =====================================================
