/**
 * MoniTags Hooks - Centralized Exports
 *
 * Todos los hooks de React Query para MoniTags
 */

// =====================================================
// MONITAG HOOKS
// =====================================================

export {
  useCurrentMonitag,
  useMonitagAvailability,
  useCreateMonitag,
  useMonitagWithValidation,
  monitagKeys
} from './use-monitag';

// =====================================================
// SEARCH HOOKS
// =====================================================

export {
  useSearchMonitags,
  useSuggestMonitags,
  useSmartMonitagSearch,
  searchKeys
} from './use-search-monitags';

// =====================================================
// PUBLIC GROUP HOOKS
// =====================================================

export {
  usePublicGroup,
  usePublicGroupParticipants,
  usePublicGroupExpenses,
  usePublicGroupDebts,
  useVisitorDebtSummary,
  usePublicGroupFullView,
  publicGroupKeys
} from './use-public-group';

// =====================================================
// PARTICIPANT MANAGEMENT HOOKS
// =====================================================

export {
  useAddParticipantByMonitag,
  useAddParticipantManual,
  useRemoveParticipant,
  useGroupParticipantManagement
} from './use-group-participants';
