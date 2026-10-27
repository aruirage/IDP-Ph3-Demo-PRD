import type { PipelineStage, StageOutcome } from '@/constants/caseStageResults'
import type { CaseListDisplayStatus } from '@/constants/caseStatus'
import type { CaseFileProcessStatus } from '@/constants/caseFileStatus'
import { planCaseLogicalFiles, resolveMockFileName } from '@/mocks/mockLogicalFilePlans'
import { MOCK_SAMPLE_MEDIA_URL } from '@/constants/mockSampleMedia'

export const CASE_FILE_PREVIEW_URL = MOCK_SAMPLE_MEDIA_URL

export interface CaseFileItem {
  id: string
  fileName: string
  fileType: string
  size: number
  uploadedAt: string
  updatedAt: string
  pageCount: number
  processStatus: CaseFileProcessStatus
  previewUrl: string
}

export interface CaseFileGeneratorInput {
  caseId: string
  sourceFolderName: string
  fileCount: number
  uploadedDocTypes: string[]
  receivedAt: string
  status: string
  listStatus?: CaseListDisplayStatus
  pendingStage: PipelineStage | null
  preprocess: StageOutcome | null
  ocr: StageOutcome | null
  verification: StageOutcome | null
  export: StageOutcome | null
}

const FILE_NAME_SUFFIX = ['', '_01', '_02', '_追加分', '_コピー']

function buildFileName(
  item: CaseFileGeneratorInput,
  index: number,
  docType: string
): string {
  const plans = planCaseLogicalFiles({
    caseId: item.caseId,
    receivedAt: item.receivedAt,
    fileCount: item.fileCount,
    uploadedDocTypes: item.uploadedDocTypes
  })
  const plan = plans[index]
  if (plan) return resolveMockFileName(plan)

  const suffix = FILE_NAME_SUFFIX[index % FILE_NAME_SUFFIX.length]
  const ext = docType === '本人確認書類' && index % 2 === 1 ? 'jpg' : 'pdf'
  const base = docType.replace(/・/g, '_')
  if (index === 0 && docType === '保険金請求書') {
    return `${item.sourceFolderName.split('_')[0]}_請求書${suffix}.${ext}`
  }
  return `${base}${suffix}.${ext}`
}

function deriveFileStatuses(item: CaseFileGeneratorInput): CaseFileProcessStatus[] {
  const n = item.fileCount

  if (item.listStatus === 'ABORTED') {
    return Array.from({ length: n }, (_, i) => {
      if (i === 0) return 'PREPROCESS_FAILED'
      if (i === 1 && n > 1) return 'OCR_FAILED'
      return null
    })
  }

  if (item.listStatus === 'EXCEPTION') {
    return Array.from({ length: n }, (_, i) => {
      if (i === 0) return 'PREPROCESS_FAILED'
      if (i === 1) return 'OCR_FAILED'
      if (i < n - 1) return 'PREPROCESS_DONE'
      return 'OCR_EXTRACTING'
    })
  }

  if (item.status === 'QUALITY_REJECTED') {
    return Array.from({ length: n }, () => null)
  }

  if (item.status === 'UPLOADED') {
    return Array.from({ length: n }, (_, i) => (i < n - 1 ? 'PREPROCESSING' : null))
  }

  if (item.pendingStage === 'preprocess') {
    return Array.from({ length: n }, (_, i) => {
      if (i < n - 1) return 'PREPROCESS_DONE'
      return 'PREPROCESS_REVIEW'
    })
  }

  if (item.pendingStage === 'ocr') {
    return Array.from({ length: n }, (_, i) => {
      if (i < n - 1) return 'OCR_SUCCESS'
      return 'OCR_REVIEW'
    })
  }

  if (item.status === 'PREPROCESSING' && !item.pendingStage) {
    return Array.from({ length: n }, (_, i) => {
      if (i < Math.ceil(n / 2)) return 'PREPROCESS_DONE'
      if (i < n - 1) return 'PREPROCESSING'
      return null
    })
  }

  if (item.status === 'OCR_EXTRACTING' && !item.pendingStage) {
    return Array.from({ length: n }, (_, i) => {
      if (i === 0) return 'OCR_FAILED'
      if (i < n - 1) return 'OCR_EXTRACTING'
      return 'PREPROCESS_DONE'
    })
  }

  if (item.preprocess && !item.ocr) {
    return Array.from({ length: n }, (_, i) => {
      if (i === n - 1) return 'OCR_EXTRACTING'
      return 'PREPROCESS_DONE'
    })
  }

  if (item.ocr && !item.verification) {
    return Array.from({ length: n }, (_, i) => (i < n - 1 ? 'OCR_SUCCESS' : 'OCR_REVIEW'))
  }

  if (item.verification || item.export) {
    return Array.from({ length: n }, () => 'OCR_SUCCESS')
  }

  return Array.from({ length: n }, () => null)
}

function offsetTime(base: string, minutes: number) {
  const [datePart, timePart] = base.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  const date = new Date(y, m - 1, d, hh, mm + minutes)
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function updatedAtForStatus(uploadedAt: string, status: CaseFileProcessStatus, index: number) {
  if (!status) return uploadedAt
  const offsets: Record<NonNullable<CaseFileProcessStatus>, number> = {
    PREPROCESSING: 12 + index * 3,
    PREPROCESS_REVIEW: 22 + index * 4,
    PREPROCESS_DONE: 18 + index * 3,
    PREPROCESS_FAILED: 15 + index * 2,
    OCR_EXTRACTING: 28 + index * 4,
    OCR_REVIEW: 45 + index * 5,
    OCR_FAILED: 36 + index * 2,
    OCR_SUCCESS: 52 + index * 6
  }
  return offsetTime(uploadedAt, offsets[status])
}

function pageCountForType(docType: string, index: number) {
  if (docType === '領収書・診療明細書') return 2 + (index % 4)
  if (docType === '診断書') return 1 + (index % 2)
  return 1
}

export function generateCaseFiles(item: CaseFileGeneratorInput): CaseFileItem[] {
  const types = item.uploadedDocTypes.length
    ? [...item.uploadedDocTypes]
    : ['その他書類']
  const statuses = deriveFileStatuses(item)

  return Array.from({ length: item.fileCount }, (_, index) => {
    const fileType = types[index % types.length] ?? 'その他書類'
    const processStatus = statuses[index] ?? null
    return {
      id: `${item.caseId}-file-${index + 1}`,
      fileName: buildFileName(item, index, fileType),
      fileType,
      size: 420_000 + index * 186_000 + fileType.length * 12_000,
      uploadedAt: item.receivedAt,
      updatedAt: updatedAtForStatus(item.receivedAt, processStatus, index),
      pageCount: pageCountForType(fileType, index),
      processStatus,
      previewUrl: CASE_FILE_PREVIEW_URL
    }
  })
}

export function formatCaseFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
