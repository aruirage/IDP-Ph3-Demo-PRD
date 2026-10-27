import { ref } from 'vue'
import { t } from '@/i18n/translate'
import type { ModelUsageKey } from '@/mocks/modelSettings'

export type ModelCallCaller =
  | { type: 'system' }
  | { type: 'user'; userName: string }

export type ModelCallTriggerMode = 'workflow' | 'manual'

/** 工作流用途：一案一节点一次执行一条记录（后台合计当次节点内多次 API 调用的 token） */
export const WORKFLOW_MODEL_USAGE_TYPES: ModelUsageKey[] = [
  'aiPreprocessing',
  'ocrExtraction',
  'coordinatePositioning',
  'aiVerification',
  'masterMatching',
  'caseConsolidation',
  'dataMapping'
]

/** 人工触发用途：每次点击一条记录 */
export const MANUAL_MODEL_USAGE_TYPES: ModelUsageKey[] = ['aiAssist']

export function isWorkflowModelUsage(type: ModelUsageKey): boolean {
  return WORKFLOW_MODEL_USAGE_TYPES.includes(type)
}

export interface ModelCallRecord {
  id: string
  /** 工作流调用必有；配置端 AI 辅助等无案件上下文时为 null */
  caseId: string | null
  businessScene: string | null
  usageType: ModelUsageKey
  triggerMode: ModelCallTriggerMode
  /** 工作流节点当次执行序号（同案件同节点类型下从 1 递增，仅后台落库用，列表不展示） */
  attemptNo: number | null
  invokedModel: string
  caller: ModelCallCaller
  /** 当次节点执行或单次触发的首个 API 请求发起时间 */
  startedAt: string
  /** 当次节点执行或单次触发的末个 API 响应完成时间 */
  respondedAt: string
  /** 当次呈现记录内全部 API 调用的输入 token 合计 */
  inputTokens: number
  /** 当次呈现记录内全部 API 调用的输出 token 合计 */
  outputTokens: number
}

export interface ModelCallSearchFilters {
  caseId: string
  completedFrom: string
  completedTo: string
  usageTypes: ModelUsageKey[]
}

/** 与模型设置用途指派顺序一致 */
export const MODEL_USAGE_TYPE_ORDER: ModelUsageKey[] = [
  'aiAssist',
  'aiPreprocessing',
  'ocrExtraction',
  'coordinatePositioning',
  'aiVerification',
  'masterMatching',
  'caseConsolidation',
  'dataMapping'
]

export function modelUsageTypeLabel(key: ModelUsageKey): string {
  return t(`businessRules.model.usage.${key}`)
}

export function modelUsageTypeOptions(): { value: ModelUsageKey; label: string }[] {
  return MODEL_USAGE_TYPE_ORDER.map((value) => ({
    value,
    label: modelUsageTypeLabel(value)
  }))
}

export function formatModelCallCaller(caller: ModelCallCaller): string {
  if (caller.type === 'system') {
    return t('usageStatistics.caller.system')
  }
  return caller.userName
}

export function formatTokenCount(value: number): string {
  return value.toLocaleString()
}

const modelCallSeed: ModelCallRecord[] = [
  // —— 2026年8月 ——
  {
    id: 'mcall-001',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    usageType: 'caseConsolidation',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'claude-sonnet-4-20250514',
    caller: { type: 'system' },
    startedAt: '2026-08-10 09:12:04',
    respondedAt: '2026-08-10 09:14:22',
    inputTokens: 4820,
    outputTokens: 960
  },
  {
    id: 'mcall-002',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    usageType: 'aiPreprocessing',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-08-10 09:15:01',
    respondedAt: '2026-08-10 09:18:45',
    inputTokens: 19840,
    outputTokens: 3620
  },
  {
    id: 'mcall-003',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    usageType: 'ocrExtraction',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-08-10 09:20:12',
    respondedAt: '2026-08-10 09:25:33',
    inputTokens: 28640,
    outputTokens: 12420
  },
  {
    id: 'mcall-004',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    usageType: 'dataMapping',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-08-10 09:26:05',
    respondedAt: '2026-08-10 09:28:12',
    inputTokens: 9280,
    outputTokens: 4320
  },
  {
    id: 'mcall-005',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    usageType: 'aiVerification',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-08-10 09:29:01',
    respondedAt: '2026-08-10 09:31:44',
    inputTokens: 15200,
    outputTokens: 8180
  },
  {
    id: 'mcall-006',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    usageType: 'caseConsolidation',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'claude-sonnet-4-20250514',
    caller: { type: 'system' },
    startedAt: '2026-08-12 14:05:18',
    respondedAt: '2026-08-12 14:06:42',
    inputTokens: 2180,
    outputTokens: 520
  },
  {
    id: 'mcall-007',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    usageType: 'ocrExtraction',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-08-12 14:10:02',
    respondedAt: '2026-08-12 14:12:55',
    inputTokens: 5420,
    outputTokens: 3080
  },
  {
    id: 'mcall-024',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    usageType: 'ocrExtraction',
    triggerMode: 'workflow',
    attemptNo: 2,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-08-13 09:12:40',
    respondedAt: '2026-08-13 09:15:30',
    inputTokens: 6180,
    outputTokens: 4650
  },
  {
    id: 'mcall-008',
    caseId: null,
    businessScene: null,
    usageType: 'aiAssist',
    triggerMode: 'manual',
    attemptNo: null,
    invokedModel: 'gpt-4.1',
    caller: { type: 'user', userName: '山田 太郎' },
    startedAt: '2026-08-15 16:22:40',
    respondedAt: '2026-08-15 16:22:58',
    inputTokens: 1840,
    outputTokens: 620
  },
  // —— 2026年9月 ——
  {
    id: 'mcall-009',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    usageType: 'caseConsolidation',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'claude-sonnet-4-20250514',
    caller: { type: 'system' },
    startedAt: '2026-09-05 10:08:22',
    respondedAt: '2026-09-05 10:10:15',
    inputTokens: 3960,
    outputTokens: 880
  },
  {
    id: 'mcall-010',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    usageType: 'aiPreprocessing',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-09-05 10:11:03',
    respondedAt: '2026-09-05 10:14:28',
    inputTokens: 7120,
    outputTokens: 2560
  },
  {
    id: 'mcall-011',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    usageType: 'coordinatePositioning',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gemini-2.0-flash',
    caller: { type: 'system' },
    startedAt: '2026-09-05 10:14:35',
    respondedAt: '2026-09-05 10:15:48',
    inputTokens: 4280,
    outputTokens: 1920
  },
  {
    id: 'mcall-012',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    usageType: 'ocrExtraction',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-09-05 10:15:40',
    respondedAt: '2026-09-05 10:20:12',
    inputTokens: 24280,
    outputTokens: 11120
  },
  {
    id: 'mcall-013',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    usageType: 'masterMatching',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'claude-sonnet-4-20250514',
    caller: { type: 'system' },
    startedAt: '2026-09-05 10:20:18',
    respondedAt: '2026-09-05 10:21:42',
    inputTokens: 5640,
    outputTokens: 1280
  },
  {
    id: 'mcall-014',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    usageType: 'aiPreprocessing',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-09-18 14:24:18',
    respondedAt: '2026-09-18 14:25:02',
    inputTokens: 3120,
    outputTokens: 680
  },
  {
    id: 'mcall-025',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    usageType: 'aiPreprocessing',
    triggerMode: 'workflow',
    attemptNo: 2,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-09-18 14:25:40',
    respondedAt: '2026-09-18 14:26:52',
    inputTokens: 4680,
    outputTokens: 1420
  },
  {
    id: 'mcall-015',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    usageType: 'dataMapping',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-09-18 14:32:10',
    respondedAt: '2026-09-18 14:34:08',
    inputTokens: 6120,
    outputTokens: 2840
  },
  {
    id: 'mcall-016',
    caseId: null,
    businessScene: null,
    usageType: 'aiAssist',
    triggerMode: 'manual',
    attemptNo: null,
    invokedModel: 'gpt-4.1',
    caller: { type: 'user', userName: '佐藤 花子' },
    startedAt: '2026-09-22 11:05:12',
    respondedAt: '2026-09-22 11:05:35',
    inputTokens: 2260,
    outputTokens: 840
  },
  {
    id: 'mcall-026',
    caseId: null,
    businessScene: null,
    usageType: 'aiAssist',
    triggerMode: 'manual',
    attemptNo: null,
    invokedModel: 'gpt-4.1',
    caller: { type: 'user', userName: '佐藤 花子' },
    startedAt: '2026-09-22 14:18:20',
    respondedAt: '2026-09-22 14:18:48',
    inputTokens: 1980,
    outputTokens: 720
  },
  // —— 2026年10月 ——
  {
    id: 'mcall-017',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    usageType: 'caseConsolidation',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'claude-sonnet-4-20250514',
    caller: { type: 'system' },
    startedAt: '2026-10-02 09:35:12',
    respondedAt: '2026-10-02 09:36:40',
    inputTokens: 1920,
    outputTokens: 480
  },
  {
    id: 'mcall-018',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    usageType: 'aiPreprocessing',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-10-02 09:37:22',
    respondedAt: '2026-10-02 09:39:15',
    inputTokens: 2840,
    outputTokens: 980
  },
  {
    id: 'mcall-019',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    usageType: 'aiVerification',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-10-02 09:44:10',
    respondedAt: '2026-10-02 09:46:28',
    inputTokens: 4860,
    outputTokens: 4920
  },
  {
    id: 'mcall-020',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    usageType: 'ocrExtraction',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-10-15 11:20:05',
    respondedAt: '2026-10-15 11:20:48',
    inputTokens: 4820,
    outputTokens: 1260
  },
  {
    id: 'mcall-027',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    usageType: 'ocrExtraction',
    triggerMode: 'workflow',
    attemptNo: 2,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-10-16 08:18:22',
    respondedAt: '2026-10-16 08:22:10',
    inputTokens: 11840,
    outputTokens: 5480
  },
  {
    id: 'mcall-021',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    usageType: 'dataMapping',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gpt-4.1',
    caller: { type: 'system' },
    startedAt: '2026-10-15 11:25:30',
    respondedAt: '2026-10-15 11:27:45',
    inputTokens: 7640,
    outputTokens: 3960
  },
  {
    id: 'mcall-022',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    usageType: 'coordinatePositioning',
    triggerMode: 'workflow',
    attemptNo: 1,
    invokedModel: 'gemini-2.0-flash',
    caller: { type: 'system' },
    startedAt: '2026-10-15 11:18:48',
    respondedAt: '2026-10-15 11:19:32',
    inputTokens: 3520,
    outputTokens: 1640
  },
  {
    id: 'mcall-023',
    caseId: null,
    businessScene: null,
    usageType: 'aiAssist',
    triggerMode: 'manual',
    attemptNo: null,
    invokedModel: 'gpt-4.1',
    caller: { type: 'user', userName: '鈴木 一郎' },
    startedAt: '2026-10-20 09:18:05',
    respondedAt: '2026-10-20 09:18:28',
    inputTokens: 3120,
    outputTokens: 1120
  }
]

export const modelCallRecords = ref<ModelCallRecord[]>([...modelCallSeed])

function matchesUsageTypes(usageType: ModelUsageKey, selected: ModelUsageKey[]): boolean {
  if (!selected.length) return true
  return selected.includes(usageType)
}

export function filterModelCallRecords(
  records: ModelCallRecord[],
  filters: ModelCallSearchFilters
): ModelCallRecord[] {
  return records.filter((item) => {
    if (
      filters.caseId &&
      !(item.caseId ?? '').toLowerCase().includes(filters.caseId.trim().toLowerCase())
    ) {
      return false
    }
    if (filters.completedFrom && item.respondedAt < filters.completedFrom) {
      return false
    }
    if (filters.completedTo && item.respondedAt > `${filters.completedTo} 23:59:59`) {
      return false
    }
    if (!matchesUsageTypes(item.usageType, filters.usageTypes)) {
      return false
    }
    return true
  })
}

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

function downloadCsv(headers: string[], rows: string[], filename: string): void {
  const csv = `\uFEFF${headers.map(escapeCsvCell).join(',')}\n${rows.join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const MODEL_CALL_CSV_HEADERS = [
  '案件ID',
  '業務シーン',
  'ノード種別',
  '使用モデル',
  '入力トークン',
  '出力トークン',
  '呼び出し元',
  '呼び出し開始日時',
  'モデル応答日時'
] as const

export function downloadModelCallRecordsCsv(
  records: ModelCallRecord[],
  filename?: string
): void {
  const date = new Date().toISOString().slice(0, 10)
  const rows = records.map((item) =>
    [
      item.caseId ?? '—',
      item.businessScene ?? '—',
      modelUsageTypeLabel(item.usageType),
      item.invokedModel,
      item.inputTokens,
      item.outputTokens,
      formatModelCallCaller(item.caller),
      item.startedAt,
      item.respondedAt
    ]
      .map(escapeCsvCell)
      .join(',')
  )

  downloadCsv([...MODEL_CALL_CSV_HEADERS], rows, filename ?? `usage-model-calls_${date}.csv`)
}
