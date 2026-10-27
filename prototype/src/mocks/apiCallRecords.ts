import { ref } from 'vue'
import type { ApiCallResultStatus, ApiCallType } from '@/constants/apiCallTypes'
import { apiCallTypeLabel, API_CALL_TYPES } from '@/constants/apiCallTypes'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'

export interface ApiCallRecordItem {
  requestId: string
  apiType: ApiCallType
  caseId: string
  requestedAt: string
  respondedAt: string | null
  status: ApiCallResultStatus
  docType: string | null
  docCount: number | null
}

const CASE_IDS = [
  'CLAIM-20251024000004',
  'CLAIM-20251024000003',
  'CLAIM-20251024000002',
  'CLAIM-20251024000001',
  'CLAIM-20251023000002',
  'CLAIM-20251023000001',
  'CLAIM-20251017000001',
  'CLAIM-20251016000001',
  'CLAIM-20251021000002',
  'CLAIM-20251015000001',
  'CLAIM-20251014000001',
  'CLAIM-20251013000001'
]

const API_TYPES: ApiCallType[] = API_CALL_TYPES

function docTypeForApi(apiType: ApiCallType, index: number): string | null {
  if (apiType === 'image-split' || apiType === 'image-sort') return null
  if (apiType === 'file-classify' && index % 5 === 0) return '未分類'
  return PREPROCESS_DOC_TYPES[index % PREPROCESS_DOC_TYPES.length]
}

function docCountForApi(apiType: ApiCallType, index: number): number | null {
  if (apiType === 'image-split') return 1 + (index % 4)
  if (apiType === 'image-sort') return 2 + (index % 6)
  if (apiType === 'file-classify') return 1 + (index % 3)
  if (apiType === 'ocr-extract') return 1
  return 1 + (index % 2)
}

function buildSeedRecords(): ApiCallRecordItem[] {
  const records: ApiCallRecordItem[] = []
  let seq = 480

  for (let day = 28; day >= 1; day -= 1) {
    const month = day > 14 ? 10 : 9
    const dateDay = day > 14 ? day : day + 14
    const dateStr = `2025-${String(month).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`
    const dailyCount = day % 4 === 0 ? 4 : day % 2 === 0 ? 3 : 2

    for (let slot = 0; slot < dailyCount; slot += 1) {
      const apiType = API_TYPES[(seq + slot) % API_TYPES.length]
      const caseId = CASE_IDS[(seq + slot) % CASE_IDS.length]
      const isSuccess = (seq + slot) % 7 !== 0
      const hour = 8 + ((seq + slot * 2) % 11)
      const minute = (seq * 5 + slot * 13) % 60
      const second = (seq * 3 + slot * 7) % 60
      const requestedAt = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
      const responseOffsetSec = 2 + ((seq + slot) % 18)
      const respondedMinute = minute + Math.floor((second + responseOffsetSec) / 60)
      const respondedSecond = (second + responseOffsetSec) % 60
      const respondedAt = isSuccess
        ? `${dateStr} ${String(hour).padStart(2, '0')}:${String(respondedMinute % 60).padStart(2, '0')}:${String(respondedSecond).padStart(2, '0')}`
        : null

      records.push({
        requestId: `REQ-API-2025-${String(seq).padStart(5, '0')}`,
        apiType,
        caseId,
        requestedAt,
        respondedAt,
        status: isSuccess ? '成功' : '失敗',
        docType: docTypeForApi(apiType, seq + slot),
        docCount: docCountForApi(apiType, seq + slot)
      })

      seq -= 1
    }
  }

  return records.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}

export const apiCallRecords = ref<ApiCallRecordItem[]>(buildSeedRecords())

export interface ApiCallTypeStat {
  apiType: ApiCallType
  label: string
  callCount: number
  docCountTotal: number
  successCount: number
  failCount: number
}

/** API種別ごとに帳票枚数を集計 */
export function aggregateApiCallStatsByType(
  records: ApiCallRecordItem[] = apiCallRecords.value
): ApiCallTypeStat[] {
  return API_CALL_TYPES.map((apiType) => {
    const items = records.filter((record) => record.apiType === apiType)
    return {
      apiType,
      label: apiCallTypeLabel(apiType),
      callCount: items.length,
      docCountTotal: items.reduce((sum, record) => sum + (record.docCount ?? 0), 0),
      successCount: items.filter((record) => record.status === '成功').length,
      failCount: items.filter((record) => record.status === '失敗').length
    }
  })
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function downloadApiCallRecordsCsv(
  items: ApiCallRecordItem[],
  filename?: string
): void {
  const headers = [
    'リクエスト番号',
    'API種別',
    '案件番号',
    'リクエスト日時',
    'レスポンス日時',
    'ステータス',
    '帳票タイプ',
    '帳票枚数'
  ]

  const rows = items.map((item) =>
    [
      item.requestId,
      apiCallTypeLabel(item.apiType),
      item.caseId,
      item.requestedAt,
      item.respondedAt ?? '',
      item.status,
      item.docType ?? '',
      item.docCount != null ? String(item.docCount) : ''
    ]
      .map(escapeCsvCell)
      .join(',')
  )

  const csv = `\uFEFF${headers.map(escapeCsvCell).join(',')}\n${rows.join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = filename ?? `api-call-records_${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
