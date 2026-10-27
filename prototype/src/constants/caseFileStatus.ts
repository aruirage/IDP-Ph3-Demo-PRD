import { t } from '@/i18n/translate'

/** 工作流内文件处理状态值（PRD 3.4 B）；未进入处理步骤时为 null，界面不展示 */
export type CaseFileProcessStatusValue =
  | 'PREPROCESSING'
  | 'PREPROCESS_REVIEW'
  | 'PREPROCESS_DONE'
  | 'PREPROCESS_FAILED'
  | 'OCR_EXTRACTING'
  | 'OCR_REVIEW'
  | 'OCR_SUCCESS'
  | 'OCR_FAILED'

export type CaseFileProcessStatus = CaseFileProcessStatusValue | null

export const CASE_FILE_PROCESS_STATUSES: CaseFileProcessStatusValue[] = [
  'PREPROCESSING',
  'PREPROCESS_REVIEW',
  'PREPROCESS_DONE',
  'PREPROCESS_FAILED',
  'OCR_EXTRACTING',
  'OCR_REVIEW',
  'OCR_SUCCESS',
  'OCR_FAILED'
]

export function caseFileProcessStatusLabel(status: CaseFileProcessStatus) {
  if (!status) return ''
  return t(`case.fileStatus.${status}`)
}

export function caseFileProcessStatusClass(status: CaseFileProcessStatus): string {
  if (!status) return ''
  if (status === 'PREPROCESS_FAILED' || status === 'OCR_FAILED') return 'is-negative'
  return ''
}
