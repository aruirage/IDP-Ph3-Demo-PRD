import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'

export type ApiCallType =
  | 'image-split'
  | 'file-classify'
  | 'image-sort'
  | 'ocr-extract'
  | 'ai-verify'

export type ApiCallResultStatus = '成功' | '失敗'

export const API_CALL_TYPE_OPTIONS: { value: ApiCallType | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'image-split', label: '画像分割' },
  { value: 'file-classify', label: 'ファイル分類' },
  { value: 'image-sort', label: '画像整列' },
  { value: 'ocr-extract', label: 'OCR抽出' },
  { value: 'ai-verify', label: 'AI検証' }
]

export const API_CALL_DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'すべて' },
  ...PREPROCESS_DOC_TYPES.map((type) => ({ value: type, label: type })),
  { value: '未分類', label: '未分類' }
]

const API_CALL_TYPE_LABELS: Record<ApiCallType, string> = {
  'image-split': '画像分割',
  'file-classify': 'ファイル分類',
  'image-sort': '画像整列',
  'ocr-extract': 'OCR抽出',
  'ai-verify': 'AI検証'
}

export function apiCallTypeLabel(type: ApiCallType): string {
  return API_CALL_TYPE_LABELS[type]
}

export function apiCallStatusTagType(
  status: ApiCallResultStatus
): 'success' | 'danger' | undefined {
  if (status === '成功') return 'success'
  if (status === '失敗') return 'danger'
  return undefined
}

export const API_CALL_TYPES: ApiCallType[] = [
  'image-split',
  'file-classify',
  'image-sort',
  'ocr-extract',
  'ai-verify'
]
