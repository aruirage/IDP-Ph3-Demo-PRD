import { t } from '@/i18n/translate'

/** 集约关联状态：仅关联执行中与失败时展示；入库后默认无状态 */
export type PendingLinkStatus = 'LINKING' | 'FAILED' | null

export function pendingLinkStatusLabel(status: PendingLinkStatus) {
  if (!status) return ''
  return t(`case.linkStatus.${status}`)
}

export function pendingLinkStatusClass(status: PendingLinkStatus): string {
  if (!status) return ''
  if (status === 'FAILED') return 'is-negative'
  if (status === 'LINKING') return 'is-linking'
  return ''
}
