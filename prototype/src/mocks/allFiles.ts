import { computed, type ComputedRef } from 'vue'
import {
  CASE_FILE_PROCESS_STATUSES,
  caseFileProcessStatusClass,
  caseFileProcessStatusLabel,
  type CaseFileProcessStatusValue
} from '@/constants/caseFileStatus'
import type { PendingLinkStatus } from '@/constants/pendingLinkStatus'
import { pendingLinkStatusLabel } from '@/constants/pendingLinkStatus'
import { t } from '@/i18n/translate'
import { mockCaseList } from '@/mocks/cases'
import { pendingConsolidationFiles } from '@/mocks/pendingConsolidation'

export type AllFileRowKind = 'linked' | 'pending'

export type AllFileStatusKey = CaseFileProcessStatusValue | NonNullable<PendingLinkStatus>

export interface AllFileListItem {
  id: string
  kind: AllFileRowKind
  fileName: string
  relatedCaseId: string | null
  relatedCasePrimaryKey: string | null
  sourceFolderName: string
  fileType: string
  size: number
  uploadedAt: string
  updatedAt: string
  pageCount: number | null
  statusKey: AllFileStatusKey | null
}

export function allFileStatusLabel(statusKey: AllFileStatusKey | null) {
  if (!statusKey) return ''
  if (statusKey === 'LINKING' || statusKey === 'FAILED') {
    return pendingLinkStatusLabel(statusKey)
  }
  return caseFileProcessStatusLabel(statusKey)
}

export function allFileStatusClass(statusKey: AllFileStatusKey | null) {
  if (!statusKey) return ''
  if (statusKey === 'FAILED') return 'is-negative'
  if (statusKey === 'LINKING') return ''
  return caseFileProcessStatusClass(statusKey)
}

export function useAllFilesList(): ComputedRef<AllFileListItem[]> {
  return computed(() => {
    const linked = mockCaseList.flatMap((caseItem) =>
      caseItem.files.map((file) => ({
        id: file.id,
        kind: 'linked' as const,
        fileName: file.fileName,
        relatedCaseId: caseItem.caseId,
        relatedCasePrimaryKey: caseItem.casePrimaryKey,
        sourceFolderName: caseItem.sourceFolderName,
        fileType: file.fileType,
        size: file.size,
        uploadedAt: file.uploadedAt,
        updatedAt: file.updatedAt,
        pageCount: file.pageCount,
        statusKey: file.processStatus
      }))
    )

    const pending = pendingConsolidationFiles.value
      .filter((file) => !file.logicallyClearedAt)
      .map((file) => ({
      id: file.id,
      kind: 'pending' as const,
      fileName: file.fileName,
      relatedCaseId: null,
      relatedCasePrimaryKey: null,
      sourceFolderName: file.sourceFolderName,
      fileType: file.fileType ?? '',
      size: file.size,
      uploadedAt: file.uploadedAt,
      updatedAt: file.updatedAt,
      pageCount: null,
      statusKey: file.linkStatus
    }))

    return [...linked, ...pending].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  })
}

export function allFileStatusFilterOptions() {
  const keys = [...CASE_FILE_PROCESS_STATUSES, 'LINKING', 'FAILED'] as const
  return [
    { value: '', label: t('common.filterAll') },
    ...keys.map((value) => ({
      value,
      label:
        value === 'LINKING' || value === 'FAILED'
          ? t(`case.linkStatus.${value}`)
          : t(`case.fileStatus.${value}`)
    }))
  ] as const
}
