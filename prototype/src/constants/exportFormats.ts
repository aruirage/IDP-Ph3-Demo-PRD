export type ExportFormat = 'JSON' | 'CSV' | 'EXCEL' | 'API'

export type FileExportFormat = Exclude<ExportFormat, 'API'>

export type ExportResultStatus = '成功' | '失敗'

export const EXPORT_FORMAT_OPTIONS: { value: ExportFormat | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'JSON', label: 'JSON' },
  { value: 'CSV', label: 'CSV' },
  { value: 'EXCEL', label: 'EXCEL' },
  { value: 'API', label: 'API' }
]

export const EXPORT_STATUS_OPTIONS: { value: ExportResultStatus | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: '成功', label: '成功' },
  { value: '失敗', label: '失敗' }
]

export function exportStatusTagType(
  status: ExportResultStatus
): 'success' | 'danger' | undefined {
  if (status === '成功') return 'success'
  if (status === '失敗') return 'danger'
  return undefined
}
