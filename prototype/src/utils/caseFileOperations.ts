import type { CaseListDisplayStatus } from '@/constants/caseStatus'
import type { CaseFileProcessStatus, CaseFileProcessStatusValue } from '@/constants/caseFileStatus'
import { CASE_FILE_PREVIEW_URL } from '@/mocks/caseFiles'
import { mockCaseList, type CaseListItem } from '@/mocks/cases'
import type { CaseFileItem } from '@/mocks/caseFiles'

export { CASE_FILE_PREVIEW_URL }

const TERMINATABLE_CASE_STATUSES: CaseListDisplayStatus[] = [
  'WAITING',
  'PROCESSING',
  'MANUAL_REVIEW',
  'SUPPLEMENT',
  'EXCEPTION'
]

export function canModifyCaseFiles(caseItem: CaseListItem) {
  return caseItem.listStatus !== 'COMPLETED' && caseItem.listStatus !== 'EXPORTED'
}

/** 自动/手动关联、案件变更的目标案：不可为处理完成、已导出 */
export function canLinkOrReassignToCase(caseItem: CaseListItem) {
  return caseItem.listStatus !== 'COMPLETED' && caseItem.listStatus !== 'EXPORTED'
}

export function canAssignCase(caseItem: CaseListItem) {
  return caseItem.listStatus !== 'EXPORTED'
}

export function findCaseById(caseId: string): CaseListItem | undefined {
  return mockCaseList.find((item) => item.caseId === caseId)
}

export function findCaseFile(caseId: string, fileId: string): CaseFileItem | undefined {
  return findCaseById(caseId)?.files.find((file) => file.id === fileId)
}

function syncCaseFileCount(caseItem: CaseListItem) {
  caseItem.fileCount = caseItem.files.length
}

export function removeFileFromCase(caseId: string, fileId: string) {
  const caseItem = findCaseById(caseId)
  if (!caseItem) return false
  const next = caseItem.files.filter((file) => file.id !== fileId)
  if (next.length === caseItem.files.length) return false
  caseItem.files = next
  syncCaseFileCount(caseItem)
  return true
}

export function canTerminateCase(caseItem: CaseListItem): boolean {
  return TERMINATABLE_CASE_STATUSES.includes(caseItem.listStatus)
}

export function terminateCaseProcessing(caseId: string): boolean {
  const caseItem = findCaseById(caseId)
  if (!caseItem || !canTerminateCase(caseItem)) return false
  caseItem.listStatus = 'ABORTED'
  caseItem.pendingStage = null
  caseItem.status = 'ABORTED'
  caseItem.currentStatus = '処理中止'
  caseItem.statusLabel = '処理中止'
  return true
}

export function canRerunCase(caseItem: CaseListItem): boolean {
  return caseItem.listStatus === 'ABORTED'
}

export function canRetryCase(caseItem: CaseListItem): boolean {
  return caseItem.listStatus === 'EXCEPTION'
}

function retryEntryStatusForFile(
  status: CaseFileProcessStatus
): CaseFileProcessStatusValue | null {
  if (status === 'PREPROCESS_FAILED') return 'PREPROCESSING'
  if (status === 'OCR_FAILED') return 'OCR_EXTRACTING'
  return null
}

function syncCaseStatusAfterRetry(caseItem: CaseListItem) {
  const hasPreprocessActivity = caseItem.files.some(
    (file) =>
      file.processStatus === 'PREPROCESSING' ||
      file.processStatus === 'PREPROCESS_FAILED' ||
      file.processStatus === 'PREPROCESS_REVIEW'
  )
  const hasOcrActivity = caseItem.files.some(
    (file) =>
      file.processStatus === 'OCR_EXTRACTING' ||
      file.processStatus === 'OCR_FAILED' ||
      file.processStatus === 'OCR_REVIEW'
  )

  caseItem.listStatus = 'PROCESSING'
  caseItem.pendingStage = null

  if (hasPreprocessActivity) {
    caseItem.status = 'PREPROCESSING'
    caseItem.currentStatus = '前処理中（自動）'
    caseItem.statusLabel = '前処理中'
    return
  }

  if (hasOcrActivity) {
    caseItem.status = 'OCR_EXTRACTING'
    caseItem.currentStatus = 'OCR抽出中（自動）'
    caseItem.statusLabel = 'OCR抽出中（自動）'
    return
  }

  caseItem.status = 'UPLOADED'
  caseItem.currentStatus = '自動処理中'
  caseItem.statusLabel = '処理中'
}

export function rerunCaseWorkflow(caseId: string): boolean {
  const caseItem = findCaseById(caseId)
  if (!caseItem || !canRerunCase(caseItem)) return false
  caseItem.listStatus = 'WAITING'
  caseItem.pendingStage = null
  caseItem.status = 'UPLOADED'
  caseItem.currentStatus = 'アップロード済'
  caseItem.statusLabel = '待機中'
  caseItem.progress = 0
  caseItem.files.forEach((file) => {
    file.processStatus = null
  })
  return true
}

/** 异常案件：从失败节点重试（非工作流入口重头开始） */
export function retryCaseFromFailedNode(caseId: string): boolean {
  const caseItem = findCaseById(caseId)
  if (!caseItem || !canRetryCase(caseItem)) return false

  let retried = false
  caseItem.files.forEach((file) => {
    const next = retryEntryStatusForFile(file.processStatus)
    if (next) {
      file.processStatus = next
      retried = true
    }
  })
  if (!retried) return false

  syncCaseStatusAfterRetry(caseItem)
  return true
}

export function reassignFileToCase(fromCaseId: string, fileId: string, toCaseId: string) {
  if (fromCaseId === toCaseId) return false
  const fromCase = findCaseById(fromCaseId)
  const toCase = findCaseById(toCaseId)
  if (!fromCase || !toCase) return false
  const index = fromCase.files.findIndex((file) => file.id === fileId)
  if (index < 0) return false
  const [file] = fromCase.files.splice(index, 1)
  toCase.files.push(file)
  syncCaseFileCount(fromCase)
  syncCaseFileCount(toCase)
  return true
}

export function showReuploadAction(caseItem: CaseListItem) {
  return caseItem.status === 'QUALITY_REJECTED'
}

/** 追加書類アップロード（一覧の「補件」操作） */
export function showSupplementAction(caseItem: CaseListItem) {
  return caseItem.listStatus === 'SUPPLEMENT'
}

export function canUploadSupplementToCase(caseItem: CaseListItem | undefined) {
  return Boolean(caseItem && caseItem.listStatus === 'SUPPLEMENT')
}

export interface SupplementUploadInput {
  fileName: string
  size: number
  ext: string
}

function nowTimestamp() {
  return new Date().toLocaleString('sv-SE', { hour12: false }).replace('T', ' ')
}

/** 補件直掛：ファイルを案件へ追加し、ワークフローを再開 */
export function uploadSupplementFilesToCase(
  caseId: string,
  files: SupplementUploadInput[]
): boolean {
  const caseItem = findCaseById(caseId)
  if (!caseItem || !canUploadSupplementToCase(caseItem) || !files.length) return false

  const uploadedAt = nowTimestamp()

  files.forEach((file, index) => {
    const id = `supplement-${caseId}-${Date.now()}-${index}`
    caseItem.files.push({
      id,
      fileName: file.fileName,
      fileType: '',
      size: file.size,
      uploadedAt,
      updatedAt: uploadedAt,
      pageCount: file.ext.toLowerCase() === 'pdf' ? 1 : 1,
      processStatus: null,
      previewUrl: CASE_FILE_PREVIEW_URL
    })
  })

  syncCaseFileCount(caseItem)
  caseItem.updatedAt = uploadedAt
  caseItem.listStatus = 'PROCESSING'
  caseItem.pendingStage = null
  caseItem.status = 'UPLOADED'
  caseItem.currentStatus = '自動処理中'
  caseItem.statusLabel = '処理中'

  const newFiles = caseItem.files.slice(-files.length)
  newFiles.forEach((file) => {
    file.processStatus = 'PREPROCESSING'
  })

  return true
}

export function showExportAction(caseItem: CaseListItem) {
  return caseItem.pendingStage === 'export' || caseItem.listStatus === 'COMPLETED'
}
