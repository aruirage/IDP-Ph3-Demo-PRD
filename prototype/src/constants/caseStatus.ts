import { t } from '@/i18n/translate'

/** 案件一覧の現在状態 */
export type CaseListDisplayStatus =
  | 'WAITING'
  | 'PROCESSING'
  | 'MANUAL_REVIEW'
  | 'SUPPLEMENT'
  | 'EXCEPTION'
  | 'ABORTED'
  | 'COMPLETED'
  | 'EXPORTED'

const CASE_LIST_STATUSES: CaseListDisplayStatus[] = [
  'WAITING',
  'PROCESSING',
  'MANUAL_REVIEW',
  'SUPPLEMENT',
  'EXCEPTION',
  'ABORTED',
  'COMPLETED',
  'EXPORTED'
]

export function caseStatusOptions() {
  return [
    { value: '', label: t('common.filterAll') },
    { value: 'UPLOADED', label: t('case.processStatus.UPLOADED') },
    { value: 'QUALITY_REJECTED', label: t('case.processStatus.QUALITY_REJECTED') },
    { value: 'PREPROCESSING', label: t('case.processStatus.PREPROCESSING') },
    { value: 'OCR_EXTRACTING', label: t('case.processStatus.OCR_EXTRACTING') },
    { value: 'VERIFYING', label: t('case.processStatus.VERIFYING') },
    { value: 'PENDING_SUPPLEMENT', label: t('case.processStatus.PENDING_SUPPLEMENT') },
    { value: 'READY_EXPORT', label: t('case.processStatus.READY_EXPORT') },
    { value: 'EXPORTED', label: t('case.processStatus.EXPORTED') }
  ] as const
}

export function caseListDisplayStatusLabel(status: CaseListDisplayStatus): string {
  return t(`case.listStatus.${status}`)
}

export function caseListStatusOptions() {
  return [
    { value: '', label: t('common.filterAll') },
    ...CASE_LIST_STATUSES.map((value) => ({
      value,
      label: caseListDisplayStatusLabel(value)
    }))
  ] as const
}

export function caseStatusColumnLabel() {
  return t('case.column.caseStatus')
}

export function fileProcessStatusColumnLabel() {
  return t('case.column.fileStatus')
}

export function pendingLinkStatusColumnLabel() {
  return t('case.column.linkStatus')
}

export type Judgment = 'OK' | 'NG' | '要確認'

export function judgmentOptions() {
  return [
    { value: '', label: t('common.filterAll') },
    { value: 'OK', label: 'OK' },
    { value: 'NG', label: 'NG' },
    { value: '要確認', label: t('case.judgment.needsReview') },
    { value: 'NONE', label: t('case.judgment.none') }
  ] as const
}

export function stageLabels() {
  return [
    t('case.stage.input'),
    t('case.stage.preprocess'),
    t('case.stage.ocr'),
    t('case.stage.verification'),
    t('case.stage.export')
  ] as const
}

export type CaseRoutingDecision = 'EXPORTABLE' | 'SUPPLEMENT'

export function judgmentTagType(j: string | null): 'success' | 'warning' | 'danger' | undefined {
  if (!j) return undefined
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    OK: 'success',
    要確認: 'warning',
    NG: 'danger'
  }
  return map[j]
}

export function routingDecisionLabel(decision: CaseRoutingDecision): string {
  return decision === 'SUPPLEMENT' ? t('case.routing.supplement') : t('case.routing.exportable')
}

export function caseListDisplayStatusClass(status: CaseListDisplayStatus): string {
  if (status === 'COMPLETED' || status === 'EXPORTED') return 'is-positive'
  if (status === 'WAITING' || status === 'PROCESSING') return 'is-muted'
  if (status === 'ABORTED') return 'is-negative'
  return 'is-attention'
}

/** 案件一覧・案件状態列バッジ（COMPLETED=緑、EXCEPTION/SUPPLEMENT=赤、他=灰） */
export type CaseListStatusBadgeVariant = 'is-success' | 'is-danger' | 'is-neutral'

export function caseListStatusBadgeVariant(
  status: CaseListDisplayStatus
): CaseListStatusBadgeVariant {
  if (status === 'COMPLETED') return 'is-success'
  if (status === 'EXCEPTION' || status === 'SUPPLEMENT') return 'is-danger'
  return 'is-neutral'
}

export function caseListStatusShowsSpinner(status: CaseListDisplayStatus): boolean {
  return status === 'PROCESSING' || status === 'WAITING'
}

/** @deprecated 互換用。新規は caseListDisplayStatusLabel を使用 */
export function getCaseListDisplayStatusLabels(): Record<CaseListDisplayStatus, string> {
  return Object.fromEntries(
    CASE_LIST_STATUSES.map((status) => [status, caseListDisplayStatusLabel(status)])
  ) as Record<CaseListDisplayStatus, string>
}
