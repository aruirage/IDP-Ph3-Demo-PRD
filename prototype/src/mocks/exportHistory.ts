import { ref } from 'vue'
import type { ExportFormat, ExportResultStatus } from '@/constants/exportFormats'

export interface ExportHistoryItem {
  exportId: string
  exportedAt: string
  caseId: string
  caseOrigin: string | null
  sourceFolderName: string
  format: ExportFormat
  operator: string
  status: ExportResultStatus
  /** JSON / CSV のファイル名。API の場合は null */
  fileName: string | null
  fileSize: string | null
  /** API 連携時のコールバック概要 */
  apiNote: string | null
}

const OPERATORS = ['山田 太郎', '鈴木 花子', '佐藤 一郎', '田中美咲', '高橋 健']

const CASE_SEEDS: {
  caseId: string
  caseOrigin: string | null
  sourceFolderName: string
}[] = [
  { caseId: 'CLAIM-20251024000004', caseOrigin: 'REQ-2025-0018912', sourceFolderName: '田中花子_入院請求' },
  { caseId: 'CLAIM-20251024000003', caseOrigin: 'REQ-2025-0018908', sourceFolderName: '田中花子_手術請求' },
  { caseId: 'CLAIM-20251024000002', caseOrigin: null, sourceFolderName: '佐藤健_入院請求' },
  { caseId: 'CLAIM-20251024000001', caseOrigin: null, sourceFolderName: '鈴木美咲_請求' },
  { caseId: 'CLAIM-20251023000002', caseOrigin: 'REQ-2025-0018890', sourceFolderName: '高橋誠_手術請求' },
  { caseId: 'CLAIM-20251023000001', caseOrigin: 'REQ-2025-0018885', sourceFolderName: '伊藤由美_入院請求' },
  { caseId: 'CLAIM-20251017000001', caseOrigin: 'REQ-2025-0018820', sourceFolderName: '高橋誠_診療明細' },
  { caseId: 'CLAIM-20251016000001', caseOrigin: 'REQ-2025-0018701', sourceFolderName: '伊藤美咲_請求書類' },
  { caseId: 'CLAIM-20251021000002', caseOrigin: null, sourceFolderName: '加藤真理_請求' },
  { caseId: 'CLAIM-20251015000001', caseOrigin: 'REQ-2025-0018503', sourceFolderName: '渡辺剛_保険金請求' },
  { caseId: 'CLAIM-20251014000001', caseOrigin: 'REQ-2025-0018401', sourceFolderName: '中村優子_入院' },
  { caseId: 'CLAIM-20251013000001', caseOrigin: 'REQ-2025-0018310', sourceFolderName: '小林直樹_通院' },
  { caseId: 'CLAIM-20251012000001', caseOrigin: 'REQ-2025-0018205', sourceFolderName: '松本彩_入院請求' },
  { caseId: 'CLAIM-20251011000001', caseOrigin: null, sourceFolderName: '井上翔太_診断書' },
  { caseId: 'CLAIM-20251010000001', caseOrigin: 'REQ-2025-0018102', sourceFolderName: '木村恵_領収書' },
  { caseId: 'CLAIM-20251009000001', caseOrigin: 'REQ-2025-0018008', sourceFolderName: '林太郎_保険金' },
  { caseId: 'CLAIM-20251008000001', caseOrigin: null, sourceFolderName: '清水裕子_明細' },
  { caseId: 'CLAIM-20251007000001', caseOrigin: 'REQ-2025-0017901', sourceFolderName: '山本大輔_請求' }
]

function buildSeedRecords(): ExportHistoryItem[] {
  const records: ExportHistoryItem[] = []
  let seq = 200

  const scenarios: {
    format: ExportFormat
    status: ExportResultStatus
    weight: number
  }[] = [
    { format: 'CSV', status: '成功', weight: 3 },
    { format: 'JSON', status: '成功', weight: 3 },
    { format: 'EXCEL', status: '成功', weight: 3 },
    { format: 'API', status: '成功', weight: 3 },
    { format: 'CSV', status: '失敗', weight: 1 },
    { format: 'JSON', status: '失敗', weight: 1 },
    { format: 'API', status: '失敗', weight: 1 }
  ]

  const flatScenarios = scenarios.flatMap((item) => Array.from({ length: item.weight }, () => item))

  for (let day = 24; day >= 1; day -= 1) {
    const month = day > 15 ? 10 : 9
    const dateDay = day > 15 ? day : day + 15
    const dateStr = `2025-${String(month).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`

    const dailyCount = day % 3 === 0 ? 3 : day % 2 === 0 ? 2 : 1
    for (let slot = 0; slot < dailyCount; slot += 1) {
      const caseSeed = CASE_SEEDS[(seq + slot) % CASE_SEEDS.length]
      const scenario = flatScenarios[(seq + slot) % flatScenarios.length]
      const hour = 9 + ((seq + slot * 3) % 9)
      const minute = (seq * 7 + slot * 11) % 60

      const exportId = `EXP-2025-${String(seq).padStart(5, '0')}`
      const operator = OPERATORS[(seq + slot) % OPERATORS.length]
      const isSuccess = scenario.status === '成功'
      const isApi = scenario.format === 'API'

      records.push({
        exportId,
        exportedAt: `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        caseId: caseSeed.caseId,
        caseOrigin: caseSeed.caseOrigin,
        sourceFolderName: caseSeed.sourceFolderName,
        format: scenario.format,
        operator,
        status: scenario.status,
        fileName: isApi
          ? null
          : isSuccess
            ? `${caseSeed.caseId}_export.${
                scenario.format === 'CSV'
                  ? 'csv'
                  : scenario.format === 'EXCEL'
                    ? 'xlsx'
                    : 'json'
              }`
            : null,
        fileSize:
          isApi || !isSuccess
            ? null
            : `${32 + ((seq + slot) % 90)} KB`,
        apiNote: isApi
          ? isSuccess
            ? 'コアシステム連携完了（200）'
            : slot % 2 === 0
              ? 'タイムアウト（504）'
              : '認証エラー（401）'
          : !isSuccess && !isApi
            ? 'ファイル生成エラー'
            : null
      })

      seq -= 1
    }
  }

  return records.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt))
}

/** プロトタイプ用の可変エクスポート履歴ストア */
export const exportHistoryRecords = ref<ExportHistoryItem[]>(buildSeedRecords())

/** @deprecated mockExportHistory の互換エイリアス */
export const mockExportHistory = exportHistoryRecords.value

export function getExportHistoryRecords(): ExportHistoryItem[] {
  return exportHistoryRecords.value
}

export function addExportHistoryRecord(record: ExportHistoryItem): void {
  exportHistoryRecords.value = [record, ...exportHistoryRecords.value]
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function fileDisplay(item: ExportHistoryItem): string {
  if (item.fileName) return item.fileName
  if (item.apiNote) return item.apiNote
  return ''
}

/** 検索結果を CSV ファイルとしてダウンロード */
export function downloadExportHistoryCsv(
  items: ExportHistoryItem[],
  filename?: string
): void {
  const headers = [
    'エクスポートID',
    'エクスポート日時',
    '業務キー',
    '形式',
    'ファイル',
    'サイズ',
    '実行者',
    '結果'
  ]

  const rows = items.map((item) =>
    [
      item.exportId,
      item.exportedAt,
      item.caseOrigin ?? '',
      item.format,
      fileDisplay(item),
      item.fileSize ?? '',
      item.operator,
      item.status
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
  link.download = filename ?? `export-history_${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
