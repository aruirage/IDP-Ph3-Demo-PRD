import type { PipelineStage, StageOutcome } from '@/constants/caseStageResults'
import type { CaseListDisplayStatus } from '@/constants/caseStatus'
import type { CaseFileItem } from '@/mocks/caseFiles'
import { CASE_FILE_PREVIEW_URL, generateCaseFiles } from '@/mocks/caseFiles'
import { TASK_ASSIGNEES } from '@/constants/taskAssignees'

export interface CaseListItem {
  caseId: string
  caseOrigin: string | null
  sourceFolderName: string
  caseType: string
  casePrimaryKey: string
  fileCount: number
  files: CaseFileItem[]
  uploadedDocTypes: string[]
  missingDocTypes: string[]
  listStatus: CaseListDisplayStatus
  receivedAt: string
  updatedAt: string
  status: string
  currentStatus: string
  pendingStage: PipelineStage | null
  preprocess: StageOutcome | null
  ocr: StageOutcome | null
  verification: StageOutcome | null
  export: StageOutcome | null
  judgment: 'OK' | 'NG' | '要確認' | null
  progress: number
  statusLabel: string
  /** 案件担当者（管理者が改派可） */
  assigneeName: string | null
  /** 节点经办备注（如补件说明），按节点 ID 索引 */
  nodeRemarks?: Partial<Record<string, string>>
}

const AUTO = 'システム（自動）'
const OP = '山田 太郎'

function latestTime(...values: Array<string | null | undefined>): string {
  const times = values.filter(Boolean) as string[]
  return times.length ? times[times.length - 1] : ''
}

function buildCase(
  base: Omit<
    CaseListItem,
    'updatedAt' | 'progress' | 'statusLabel' | 'files' | 'assigneeName'
  > & {
    progress?: number
    statusLabel?: string
    files?: CaseFileItem[]
    assigneeName?: string | null
  }
): CaseListItem {
  const progress =
    base.progress ??
    (base.export
      ? 4
      : base.verification
        ? 3
        : base.ocr
          ? 2
          : base.preprocess
            ? 1
            : 0)

  return {
    ...base,
    progress,
    statusLabel: base.statusLabel ?? base.currentStatus,
    updatedAt: latestTime(
      base.preprocess?.processedAt,
      base.ocr?.processedAt,
      base.verification?.processedAt,
      base.export?.processedAt,
      base.receivedAt
    ),
    files: base.files ?? [],
    assigneeName: base.assigneeName ?? null
  }
}

export const rawMockCaseList: CaseListItem[] = [
  buildCase({
    caseId: 'CLAIM-20251024000004',
    caseOrigin: 'REQ-2025-0018912',
    sourceFolderName: '渡辺拓也_入院請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018912',
    fileCount: 5,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書'],
    missingDocTypes: ['本人確認書類'],
    listStatus: 'MANUAL_REVIEW',
    receivedAt: '2025-10-24 10:15',
    status: 'VERIFYING',
    currentStatus: 'AI検証確認待ち',
    pendingStage: 'verification',
    preprocess: { outcome: '確認完了', operator: OP, processedAt: '2025-10-24 14:20' },
    ocr: { outcome: '確認完了', operator: OP, processedAt: '2025-10-24 16:05' },
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251024000003',
    caseOrigin: 'REQ-2025-0018908',
    sourceFolderName: '田中花子_手術請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018908',
    fileCount: 4,
    uploadedDocTypes: ['保険金請求書', '診断書'],
    missingDocTypes: ['領収書・診療明細書', '本人確認書類'],
    listStatus: 'MANUAL_REVIEW',
    receivedAt: '2025-10-24 09:40',
    status: 'OCR_EXTRACTING',
    currentStatus: 'OCR抽出確認待ち',
    pendingStage: 'ocr',
    preprocess: { outcome: '確認完了', operator: OP, processedAt: '2025-10-24 13:10' },
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251024000002',
    caseOrigin: null,
    sourceFolderName: '佐藤健_入院請求',
    caseType: '保険金請求',
    casePrimaryKey: '佐藤健',
    fileCount: 3,
    uploadedDocTypes: ['保険金請求書', '診断書'],
    missingDocTypes: ['領収書・診療明細書'],
    listStatus: 'MANUAL_REVIEW',
    receivedAt: '2025-10-24 09:10',
    status: 'PREPROCESSING',
    currentStatus: '前処理確認待ち',
    pendingStage: 'preprocess',
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251024000001',
    caseOrigin: null,
    sourceFolderName: '鈴木美咲_請求',
    caseType: '保険金請求',
    casePrimaryKey: '鈴木美咲',
    fileCount: 2,
    uploadedDocTypes: ['保険金請求書'],
    missingDocTypes: ['診断書', '領収書・診療明細書', '本人確認書類'],
    listStatus: 'WAITING',
    receivedAt: '2025-10-24 08:55',
    status: 'QUALITY_REJECTED',
    currentStatus: '画質不合格',
    pendingStage: null,
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251023000002',
    caseOrigin: 'REQ-2025-0018890',
    sourceFolderName: '高橋誠_手術請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018890',
    fileCount: 6,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書', '本人確認書類'],
    missingDocTypes: [],
    listStatus: 'COMPLETED',
    receivedAt: '2025-10-23 16:20',
    status: 'READY_EXPORT',
    currentStatus: 'エクスポート待ち',
    pendingStage: 'export',
    preprocess: { outcome: '自動完了', operator: AUTO, processedAt: '2025-10-23 16:35' },
    ocr: { outcome: '自動完了', operator: AUTO, processedAt: '2025-10-23 17:05' },
    verification: { outcome: '確認完了（エクスポート可）', operator: OP, processedAt: '2025-10-24 14:05' },
    export: null,
    judgment: 'OK'
  }),
  buildCase({
    caseId: 'CLAIM-20251023000001',
    caseOrigin: 'REQ-2025-0018885',
    sourceFolderName: '伊藤由美_入院請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018885',
    fileCount: 5,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書', '本人確認書類'],
    missingDocTypes: [],
    listStatus: 'EXPORTED',
    receivedAt: '2025-10-23 14:00',
    status: 'EXPORTED',
    currentStatus: 'エクスポート済',
    pendingStage: null,
    preprocess: { outcome: '自動完了', operator: AUTO, processedAt: '2025-10-23 14:18' },
    ocr: { outcome: '自動完了', operator: AUTO, processedAt: '2025-10-23 14:42' },
    verification: { outcome: '自動完了', operator: AUTO, processedAt: '2025-10-23 15:10' },
    export: { outcome: '出力完了', operator: OP, processedAt: '2025-10-24 11:30' },
    judgment: 'OK'
  }),
  buildCase({
    caseId: 'CLAIM-20251024000005',
    caseOrigin: null,
    sourceFolderName: '山本大輔_請求',
    caseType: '保険金請求',
    casePrimaryKey: '山本大輔',
    fileCount: 3,
    uploadedDocTypes: ['保険金請求書', '診断書'],
    missingDocTypes: ['領収書・診療明細書'],
    listStatus: 'PROCESSING',
    receivedAt: '2025-10-24 11:05',
    status: 'UPLOADED',
    currentStatus: '自動処理中',
    pendingStage: null,
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251022000002',
    caseOrigin: 'REQ-2025-0018872',
    sourceFolderName: '中村恵_手術請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018872',
    fileCount: 4,
    uploadedDocTypes: ['保険金請求書', '診断書'],
    missingDocTypes: ['領収書・診療明細書', '本人確認書類'],
    listStatus: 'SUPPLEMENT',
    receivedAt: '2025-10-22 13:45',
    status: 'PENDING_SUPPLEMENT',
    currentStatus: '補件待ち',
    pendingStage: null,
    preprocess: { outcome: '確認完了', operator: OP, processedAt: '2025-10-22 15:20' },
    ocr: { outcome: '確認完了', operator: OP, processedAt: '2025-10-22 16:45' },
    verification: { outcome: '確認完了（補件）', operator: OP, processedAt: '2025-10-23 18:20' },
    export: null,
    judgment: 'NG',
    nodeRemarks: {
      verify_review: '領収書・診療明細書、本人確認書類の再提出を依頼'
    }
  }),
  buildCase({
    caseId: 'CLAIM-20251022000001',
    caseOrigin: 'REQ-2025-0018865',
    sourceFolderName: '小林直樹_入院請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018865',
    fileCount: 4,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書'],
    missingDocTypes: ['本人確認書類'],
    listStatus: 'PROCESSING',
    receivedAt: '2025-10-22 10:30',
    status: 'OCR_EXTRACTING',
    currentStatus: 'OCR抽出中（自動）',
    pendingStage: null,
    preprocess: { outcome: '自動完了', operator: AUTO, processedAt: '2025-10-22 10:48' },
    ocr: null,
    verification: null,
    export: null,
    judgment: null,
    statusLabel: 'OCR抽出中（自動）'
  }),
  buildCase({
    caseId: 'CLAIM-20251021000002',
    caseOrigin: null,
    sourceFolderName: '加藤真理_請求',
    caseType: '保険金請求',
    casePrimaryKey: '加藤真理',
    fileCount: 2,
    uploadedDocTypes: ['保険金請求書'],
    missingDocTypes: ['診断書', '領収書・診療明細書'],
    listStatus: 'PROCESSING',
    receivedAt: '2025-10-21 17:00',
    status: 'PREPROCESSING',
    currentStatus: '前処理中（自動）',
    pendingStage: null,
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null,
    statusLabel: '前処理中'
  }),
  buildCase({
    caseId: 'CLAIM-20251021000001',
    caseOrigin: 'REQ-2025-0018850',
    sourceFolderName: '吉田翔太_手術請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018850',
    fileCount: 5,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書'],
    missingDocTypes: ['本人確認書類'],
    listStatus: 'COMPLETED',
    receivedAt: '2025-10-21 11:20',
    status: 'READY_EXPORT',
    currentStatus: 'エクスポート待ち',
    pendingStage: 'export',
    preprocess: { outcome: '確認完了', operator: OP, processedAt: '2025-10-21 13:05' },
    ocr: { outcome: '確認完了', operator: OP, processedAt: '2025-10-21 15:40' },
    verification: { outcome: '確認完了（エクスポート可）', operator: OP, processedAt: '2025-10-22 08:30' },
    export: null,
    judgment: '要確認'
  }),
  buildCase({
    caseId: 'CLAIM-20251020000002',
    caseOrigin: null,
    sourceFolderName: '松本彩_入院請求',
    caseType: '保険金請求',
    casePrimaryKey: '松本彩',
    fileCount: 1,
    uploadedDocTypes: ['保険金請求書'],
    missingDocTypes: ['診断書', '領収書・診療明細書', '本人確認書類'],
    listStatus: 'WAITING',
    receivedAt: '2025-10-20 15:40',
    status: 'QUALITY_REJECTED',
    currentStatus: '画質不合格',
    pendingStage: null,
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251020000001',
    caseOrigin: 'REQ-2025-0018835',
    sourceFolderName: '森田亮_入院請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018835',
    fileCount: 4,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書'],
    missingDocTypes: ['本人確認書類'],
    listStatus: 'EXCEPTION',
    receivedAt: '2025-10-20 11:25',
    status: 'PREPROCESSING',
    currentStatus: 'AI前処理失敗',
    pendingStage: null,
    preprocess: { outcome: '処理失敗', operator: AUTO, processedAt: '2025-10-20 12:10' },
    ocr: null,
    verification: null,
    export: null,
    judgment: null,
    statusLabel: '異常対応'
  }),
  buildCase({
    caseId: 'CLAIM-20251019000001',
    caseOrigin: 'REQ-2025-0018828',
    sourceFolderName: '石井優子_手術請求',
    caseType: '保険金請求',
    casePrimaryKey: 'REQ-2025-0018828',
    fileCount: 3,
    uploadedDocTypes: ['保険金請求書', '診断書', '領収書・診療明細書'],
    missingDocTypes: ['本人確認書類'],
    listStatus: 'ABORTED',
    receivedAt: '2025-10-19 14:30',
    status: 'ABORTED',
    currentStatus: '処理中止',
    pendingStage: null,
    preprocess: { outcome: '確認完了', operator: OP, processedAt: '2025-10-19 15:05' },
    ocr: null,
    verification: null,
    export: null,
    judgment: null,
    statusLabel: '処理中止',
    nodeRemarks: {
      abort: 'OCR 抽出失敗が継続し、手動処理を中止'
    }
  }),
  buildCase({
    caseId: 'CLAIM-20251021000050',
    caseOrigin: 'REQ-2025-0018920',
    sourceFolderName: '伊藤花_請求',
    caseType: '保険金請求',
    casePrimaryKey: '伊藤花',
    fileCount: 2,
    uploadedDocTypes: ['保険金請求書'],
    missingDocTypes: ['診断書', '領収書・診療明細書'],
    listStatus: 'PROCESSING',
    receivedAt: '2025-10-21 14:20',
    status: 'PREPROCESSING',
    currentStatus: '自動処理中',
    pendingStage: 'preprocess',
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  }),
  buildCase({
    caseId: 'CLAIM-20251021000051',
    caseOrigin: 'REQ-2025-0018918',
    sourceFolderName: '古田誠_請求',
    caseType: '保険金請求',
    casePrimaryKey: '古田誠',
    fileCount: 2,
    uploadedDocTypes: ['保険金請求書'],
    missingDocTypes: ['診断書', '領収書・診療明細書'],
    listStatus: 'PROCESSING',
    receivedAt: '2025-10-21 16:05',
    status: 'PREPROCESSING',
    currentStatus: '自動処理中',
    pendingStage: 'preprocess',
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null
  })
]

export const mockCaseList: CaseListItem[] = rawMockCaseList.map((item, index) => ({
  ...item,
  assigneeName:
    item.assigneeName ??
    (index % 4 === 0 ? null : TASK_ASSIGNEES[index % TASK_ASSIGNEES.length].name),
  files: generateCaseFiles(item)
}))

function appendClassifyFailedCaseFile(caseId: string, fileName: string, receivedAt: string) {
  const caseItem = mockCaseList.find((c) => c.caseId === caseId)
  if (!caseItem) return
  caseItem.files.push({
    id: `${caseId}-file-classify-fail-${caseItem.files.length + 1}`,
    fileName,
    fileType: '',
    size: 802_816,
    uploadedAt: receivedAt,
    updatedAt: receivedAt,
    pageCount: 1,
    processStatus: null,
    previewUrl: CASE_FILE_PREVIEW_URL
  })
  caseItem.fileCount = caseItem.files.length
}

appendClassifyFailedCaseFile(
  'CLAIM-20251024000004',
  '20251024010415_D1.pdf',
  '2025-10-24 10:18'
)
appendClassifyFailedCaseFile(
  'CLAIM-20251021000051',
  '20251021160500_REQ-2025-0018918_03.pdf',
  '2025-10-21 16:08'
)

export function assignCaseAssignee(caseId: string, assigneeName: string): boolean {
  const item = mockCaseList.find((c) => c.caseId === caseId)
  if (!item) return false
  item.assigneeName = assigneeName
  return true
}

export function markCaseAsSupplement(caseId: string): boolean {
  const item = mockCaseList.find((c) => c.caseId === caseId)
  if (!item) return false
  if (item.listStatus === 'SUPPLEMENT' || item.listStatus === 'EXPORTED') return false
  item.listStatus = 'SUPPLEMENT'
  item.status = 'PENDING_SUPPLEMENT'
  item.currentStatus = '補件待ち'
  item.pendingStage = null
  return true
}

export function findCaseById(caseId: string): CaseListItem | undefined {
  return mockCaseList.find((item) => item.caseId === caseId)
}

export function isStagePending(item: CaseListItem, stage: PipelineStage): boolean {
  return item.pendingStage === stage
}

export function currentStatusTagType(
  status: string
): 'success' | 'warning' | 'danger' | 'info' | undefined {
  if (status === 'QUALITY_REJECTED' || status === 'PENDING_SUPPLEMENT') return 'danger'
  if (status === 'READY_EXPORT' || status === 'EXPORTED') return 'success'
  if (status === 'VERIFYING' || status === 'OCR_EXTRACTING' || status === 'PREPROCESSING') {
    return 'warning'
  }
  return 'info'
}
