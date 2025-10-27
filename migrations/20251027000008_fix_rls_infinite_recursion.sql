-- =====================================================
-- Migration: Fix RLS Infinite Recursion
-- Date: 2025-10-27
-- =====================================================
-- Problem: Circular recursion between money_tag_groups 
-- and group_participants RLS policies
--
-- Solution: Use SECURITY DEFINER helper function to 
-- bypass RLS checks and avoid recursion
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Drop existing problematic policies
-- =====================================================

DROP POLICY IF EXISTS groups_select ON money_tag_groups;
DROP POLICY IF EXISTS participants_select ON group_participants;

-- =====================================================
-- Step 2: Create helper function (bypasses RLS)
-- =====================================================

CREATE OR REPLACE FUNCTION is_group_member(
  group_uuid UUID, 
  user_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is owner of the group
  IF EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE id = group_uuid 
      AND owner_profile_id = user_profile_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is participant of the group
  IF EXISTS (
    SELECT 1 FROM group_participants 
    WHERE group_id = group_uuid 
      AND profile_id = user_profile_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_group_member(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION is_group_member IS 
  'Check if a user is owner or participant of a MoneyTag group. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- Step 3: Recreate money_tag_groups SELECT policy
-- =====================================================

CREATE POLICY groups_select ON money_tag_groups
  FOR SELECT 
  USING (
    is_group_member(
      id, 
      (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

COMMENT ON POLICY groups_select ON money_tag_groups IS 
  'Allow SELECT if user is owner or participant (uses helper function to avoid recursion)';

-- =====================================================
-- Step 4: Recreate group_participants SELECT policy
-- =====================================================

CREATE POLICY participants_select ON group_participants
  FOR SELECT 
  USING (
    -- User is the participant themselves
    profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR
    -- User is owner of the group (direct check, no recursion)
    EXISTS (
      SELECT 1 FROM money_tag_groups 
      WHERE id = group_id 
        AND owner_profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

COMMENT ON POLICY participants_select ON group_participants IS 
  'Allow SELECT if user is the participant or owner of the group';

COMMIT;

-- =====================================================
-- Verification queries (run after migration)
-- =====================================================

-- Test the helper function
-- SELECT is_group_member(
--   'group-uuid-here'::UUID, 
--   (SELECT id FROM profiles WHERE auth_id = auth.uid())
-- );

-- Test SELECT on money_tag_groups
-- SELECT * FROM money_tag_groups LIMIT 5;

-- Test SELECT on group_participants
-- SELECT * FROM group_participants LIMIT 5;
