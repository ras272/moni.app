-- =====================================================
-- Migration: Fix participants_select to show ALL participants
-- Date: 2025-10-27
-- =====================================================
-- Problem: Participants can only see their own record, not others
-- 
-- Current policy:
--   profile_id = current_user OR (you're owner)
-- 
-- Result:
--   - greenajack (owner) sees both participants ✅
--   - moniapp (participant) only sees himself ❌
--
-- Solution: Allow viewing ALL participants if you're a member
-- =====================================================

BEGIN;

DROP POLICY IF EXISTS participants_select ON group_participants;

CREATE POLICY participants_select ON group_participants
  FOR SELECT 
  USING (
    -- You can see ALL participants if you're a member of the group
    -- Uses helper function to avoid recursion
    is_group_member(
      group_id,
      (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

COMMENT ON POLICY participants_select ON group_participants IS 
  'Allow viewing ALL participants if user is member (owner or participant) of the group';

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
-- Now both greenajack AND moniapp should see both participants:
-- SELECT * FROM group_participants WHERE group_id = 'your-group-id';
