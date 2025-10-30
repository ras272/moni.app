/**
 * Server Actions - Centralized Exports
 *
 * Todas las server actions de MoniTags exportadas desde un solo lugar
 * para imports consistentes y fáciles de mantener
 */

// =====================================================
// MONITAG ACTIONS
// =====================================================

export {
  createMonitag,
  checkMonitagAvailability,
  searchMonitags,
  suggestMonitags,
  getCurrentUserMonitag
} from './monitag';

export type {
  CreateMonitagInput,
  CheckMonitagAvailabilityInput,
  SearchMonitagsInput,
  SuggestMonitagsInput,
  MonitagAvailabilityResponse,
  MonitagSearchResult
} from '@/lib/validations/monitag';

// =====================================================
// PUBLIC GROUPS ACTIONS
// =====================================================

export {
  getPublicGroup,
  getPublicGroupParticipants,
  getPublicGroupExpenses,
  getPublicGroupDebts,
  getVisitorDebtSummary
} from './public-groups';

export type {
  GetPublicGroupInput,
  PublicGroupInfo
} from '@/lib/validations/monitag';

// =====================================================
// GROUP PARTICIPANTS ACTIONS
// =====================================================

export {
  addParticipantByMonitag,
  addParticipantManual,
  removeParticipant
} from './group-participants';

export type { AddParticipantByMonitagInput } from '@/lib/validations/monitag';
