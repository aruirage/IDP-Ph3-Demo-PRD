import type { CaseListDisplayStatus } from '@/constants/caseStatus'
import { caseListDisplayStatusLabel } from '@/constants/caseStatus'
import { t } from '@/i18n/translate'

export type PendingLinkReason =
  | 'CLASSIFY_FAILED'
  | 'CANDIDATE_CONFLICT'
  | 'NO_MATCH'
  | 'PROCESSING_TIMEOUT'

const PENDING_LINK_REASONS: PendingLinkReason[] = [
  'CLASSIFY_FAILED',
  'CANDIDATE_CONFLICT',
  'NO_MATCH',
  'PROCESSING_TIMEOUT'
]

export function pendingLinkReasonLabel(reason: PendingLinkReason) {
  return t(`case.linkReason.${reason}`)
}

/** 不参与自动案件关联的原因 */
export const PENDING_LINK_REASON_EXCLUDED_FROM_AUTO: PendingLinkReason[] = [
  'CLASSIFY_FAILED',
  'CANDIDATE_CONFLICT'
]

export function pendingLinkReasonColumnLabel() {
  return t('case.column.linkReason')
}

export function pendingLinkReasonFilterOptions(exclude: PendingLinkReason[] = []) {
  return [
    { value: '', label: t('common.filterAll') },
    ...PENDING_LINK_REASONS.filter((value) => !exclude.includes(value)).map((value) => ({
      value,
      label: pendingLinkReasonLabel(value)
    }))
  ] as const
}

export interface PendingLinkCandidateCase {
  caseId: string
  casePrimaryKey: string
  listStatus: CaseListDisplayStatus
}

export function pendingLinkCandidateLabel(candidate: PendingLinkCandidateCase) {
  const status = caseListDisplayStatusLabel(candidate.listStatus)
  return candidate.casePrimaryKey
    ? `${candidate.caseId}（${candidate.casePrimaryKey}）· ${status}`
    : `${candidate.caseId} · ${status}`
}
