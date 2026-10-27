import { ref } from 'vue'
import { billingNodeLabel, type BillingNodeKey } from '@/constants/billingNodes'

export type ExecutionStatus = 'success' | 'failure'

export interface NodeExecutionRecord {
  id: string
  caseId: string
  businessScene: string
  fileId: string
  fileName: string
  billingNode: BillingNodeKey
  pageCountSnapshot: number
  status: ExecutionStatus
  startedAt: string
  completedAt: string
  attemptNo: number
  isBillable: boolean
  billingRecordId: string | null
  billableNote: string
  /** 当次执行所用大模型型号（每个计费节点仅对应一个模型，由节点用途配置决定） */
  invokedModel: string | null
  /** 当次执行 token 消耗合计（同案件同文件同节点、同一次执行尝试内求和） */
  tokenConsumed: number | null
}

export interface BillingRecord {
  id: string
  caseId: string
  businessScene: string
  fileId: string
  fileName: string
  billingNode: BillingNodeKey
  pageCount: number
  startedAt: string
  completedAt: string
  successExecutionCount: number
  maxPageCountExecutionId: string
  pageCountLastUpdatedAt: string | null
}

const billingSeed: BillingRecord[] = [
  {
    id: 'bill-001',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 6,
    startedAt: '2026-08-10 09:12:04',
    completedAt: '2026-08-10 09:14:22',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-001',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-002',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCount: 8,
    startedAt: '2026-08-10 09:15:01',
    completedAt: '2026-08-10 09:18:45',
    successExecutionCount: 2,
    maxPageCountExecutionId: 'exec-004',
    pageCountLastUpdatedAt: '2026-08-11 10:02:18'
  },
  {
    id: 'bill-003',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCount: 8,
    startedAt: '2026-08-10 09:20:12',
    completedAt: '2026-08-10 09:25:33',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-005',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-004',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 4,
    startedAt: '2026-08-10 09:12:08',
    completedAt: '2026-08-10 09:13:55',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-006',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-005',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCount: 5,
    startedAt: '2026-08-10 09:15:22',
    completedAt: '2026-08-10 09:17:40',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-007',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-006',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'DATA_MAPPING',
    pageCount: 8,
    startedAt: '2026-08-10 09:26:05',
    completedAt: '2026-08-10 09:28:12',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-010',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-007',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'DATA_MAPPING',
    pageCount: 5,
    startedAt: '2026-08-10 09:26:05',
    completedAt: '2026-08-10 09:28:12',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-011',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-008',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'AI_VERIFICATION',
    pageCount: 8,
    startedAt: '2026-08-10 09:29:01',
    completedAt: '2026-08-10 09:31:44',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-012',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-009',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 2,
    startedAt: '2026-08-12 14:05:18',
    completedAt: '2026-08-12 14:06:42',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-013',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-010',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCount: 3,
    startedAt: '2026-08-12 14:10:02',
    completedAt: '2026-08-12 14:12:55',
    successExecutionCount: 2,
    maxPageCountExecutionId: 'exec-016',
    pageCountLastUpdatedAt: '2026-08-13 09:15:30'
  },
  {
    id: 'bill-011',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCount: 8,
    startedAt: '2026-08-10 09:18:50',
    completedAt: '2026-08-10 09:19:44',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-017',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-012',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCount: 5,
    startedAt: '2026-08-10 09:17:45',
    completedAt: '2026-08-10 09:18:38',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-018',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-013',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCount: 8,
    startedAt: '2026-08-10 09:19:50',
    completedAt: '2026-08-10 09:20:05',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-019',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-014',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCount: 3,
    startedAt: '2026-08-12 14:08:12',
    completedAt: '2026-08-12 14:08:55',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-020',
    pageCountLastUpdatedAt: null
  },
  // —— 2026年9月 ——
  {
    id: 'bill-015',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 5,
    startedAt: '2026-09-05 10:08:22',
    completedAt: '2026-09-05 10:10:15',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-021',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-016',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCount: 6,
    startedAt: '2026-09-05 10:11:03',
    completedAt: '2026-09-05 10:14:28',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-022',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-017',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCount: 6,
    startedAt: '2026-09-05 10:15:40',
    completedAt: '2026-09-05 10:20:12',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-023',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-018',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'DATA_MAPPING',
    pageCount: 6,
    startedAt: '2026-09-05 10:21:05',
    completedAt: '2026-09-05 10:23:18',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-024',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-019',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'AI_VERIFICATION',
    pageCount: 6,
    startedAt: '2026-09-05 10:24:00',
    completedAt: '2026-09-05 10:27:33',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-025',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-020',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCount: 6,
    startedAt: '2026-09-05 10:14:32',
    completedAt: '2026-09-05 10:15:20',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-026',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-021',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCount: 6,
    startedAt: '2026-09-05 10:15:25',
    completedAt: '2026-09-05 10:15:38',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-027',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-022',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 3,
    startedAt: '2026-09-18 14:22:10',
    completedAt: '2026-09-18 14:23:45',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-028',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-023',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCount: 4,
    startedAt: '2026-09-18 14:24:18',
    completedAt: '2026-09-18 14:26:52',
    successExecutionCount: 2,
    maxPageCountExecutionId: 'exec-044',
    pageCountLastUpdatedAt: '2026-09-19 09:40:05'
  },
  {
    id: 'bill-024',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCount: 4,
    startedAt: '2026-09-18 14:28:05',
    completedAt: '2026-09-18 14:31:22',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-031',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-025',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'DATA_MAPPING',
    pageCount: 4,
    startedAt: '2026-09-18 14:32:10',
    completedAt: '2026-09-18 14:34:08',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-032',
    pageCountLastUpdatedAt: null
  },
  // —— 2026年10月 ——
  {
    id: 'bill-026',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 2,
    startedAt: '2026-10-02 09:35:12',
    completedAt: '2026-10-02 09:36:40',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-033',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-027',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCount: 2,
    startedAt: '2026-10-02 09:37:22',
    completedAt: '2026-10-02 09:39:15',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-034',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-028',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCount: 2,
    startedAt: '2026-10-02 09:40:05',
    completedAt: '2026-10-02 09:42:50',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-035',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-029',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'AI_VERIFICATION',
    pageCount: 2,
    startedAt: '2026-10-02 09:44:10',
    completedAt: '2026-10-02 09:46:28',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-036',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-030',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCount: 2,
    startedAt: '2026-10-02 09:39:20',
    completedAt: '2026-10-02 09:39:35',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-037',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-031',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCount: 4,
    startedAt: '2026-10-15 11:12:30',
    completedAt: '2026-10-15 11:14:05',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-038',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-032',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCount: 5,
    startedAt: '2026-10-15 11:15:18',
    completedAt: '2026-10-15 11:18:42',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-039',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-033',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCount: 5,
    startedAt: '2026-10-15 11:20:05',
    completedAt: '2026-10-15 11:24:18',
    successExecutionCount: 2,
    maxPageCountExecutionId: 'exec-041',
    pageCountLastUpdatedAt: '2026-10-16 08:22:10'
  },
  {
    id: 'bill-034',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'DATA_MAPPING',
    pageCount: 5,
    startedAt: '2026-10-15 11:25:30',
    completedAt: '2026-10-15 11:27:45',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-042',
    pageCountLastUpdatedAt: null
  },
  {
    id: 'bill-035',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCount: 5,
    startedAt: '2026-10-15 11:18:48',
    completedAt: '2026-10-15 11:19:32',
    successExecutionCount: 1,
    maxPageCountExecutionId: 'exec-043',
    pageCountLastUpdatedAt: null
  }
]

type ExecutionSeedItem = Omit<NodeExecutionRecord, 'invokedModel' | 'tokenConsumed'>

const executionSeed: ExecutionSeedItem[] = [
  {
    id: 'exec-001',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-08-10 09:12:04',
    completedAt: '2026-08-10 09:14:22',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-001',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-002',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 6,
    status: 'failure',
    startedAt: '2026-08-10 09:15:01',
    completedAt: '2026-08-10 09:16:12',
    attemptNo: 1,
    isBillable: false,
    billingRecordId: null,
    billableNote: '処理失敗・対象外'
  },
  {
    id: 'exec-003',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 7,
    status: 'success',
    startedAt: '2026-08-10 09:16:45',
    completedAt: '2026-08-10 09:18:45',
    attemptNo: 2,
    isBillable: true,
    billingRecordId: 'bill-002',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-004',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 8,
    status: 'success',
    startedAt: '2026-08-11 10:00:02',
    completedAt: '2026-08-11 10:02:18',
    attemptNo: 3,
    isBillable: false,
    billingRecordId: 'bill-002',
    billableNote: '重複成功・枚数更新（8枚）'
  },
  {
    id: 'exec-005',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 8,
    status: 'success',
    startedAt: '2026-08-10 09:20:12',
    completedAt: '2026-08-10 09:25:33',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-003',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-006',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 4,
    status: 'success',
    startedAt: '2026-08-10 09:12:08',
    completedAt: '2026-08-10 09:13:55',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-004',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-007',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-08-10 09:15:22',
    completedAt: '2026-08-10 09:17:40',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-005',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-008',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 5,
    status: 'failure',
    startedAt: '2026-08-10 09:20:30',
    completedAt: '2026-08-10 09:21:05',
    attemptNo: 1,
    isBillable: false,
    billingRecordId: null,
    billableNote: '処理失敗・対象外'
  },
  {
    id: 'exec-009',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-08-10 09:22:18',
    completedAt: '2026-08-10 09:24:02',
    attemptNo: 2,
    isBillable: true,
    billingRecordId: null,
    billableNote: '初回成功・集計（別ファイル未登録デモ省略）'
  },
  {
    id: 'exec-010',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'DATA_MAPPING',
    pageCountSnapshot: 8,
    status: 'success',
    startedAt: '2026-08-10 09:26:05',
    completedAt: '2026-08-10 09:28:12',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-006',
    billableNote: '参与ファイル・初回成功・集計'
  },
  {
    id: 'exec-011',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'DATA_MAPPING',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-08-10 09:26:05',
    completedAt: '2026-08-10 09:28:12',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-007',
    billableNote: '参与ファイル・初回成功・集計'
  },
  {
    id: 'exec-012',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'AI_VERIFICATION',
    pageCountSnapshot: 8,
    status: 'success',
    startedAt: '2026-08-10 09:29:01',
    completedAt: '2026-08-10 09:31:44',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-008',
    billableNote: '参与ファイル・初回成功・集計'
  },
  {
    id: 'exec-013',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-08-12 14:05:18',
    completedAt: '2026-08-12 14:06:42',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-009',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-014',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-08-12 14:10:02',
    completedAt: '2026-08-12 14:12:55',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-010',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-015',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 2,
    status: 'failure',
    startedAt: '2026-08-13 08:55:10',
    completedAt: '2026-08-13 08:56:22',
    attemptNo: 2,
    isBillable: false,
    billingRecordId: null,
    billableNote: '処理失敗・対象外'
  },
  {
    id: 'exec-016',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 3,
    status: 'success',
    startedAt: '2026-08-13 09:12:40',
    completedAt: '2026-08-13 09:15:30',
    attemptNo: 3,
    isBillable: false,
    billingRecordId: 'bill-010',
    billableNote: '重複成功・枚数更新（3枚）'
  },
  {
    id: 'exec-017',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCountSnapshot: 8,
    status: 'success',
    startedAt: '2026-08-10 09:18:50',
    completedAt: '2026-08-10 09:19:44',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-011',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-018',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-002',
    fileName: '診療明細_002.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-08-10 09:17:45',
    completedAt: '2026-08-10 09:18:38',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-012',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-019',
    caseId: 'CLAIM-20260810000128',
    businessScene: '保険金請求',
    fileId: 'file-001',
    fileName: '請求書類_001.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCountSnapshot: 8,
    status: 'success',
    startedAt: '2026-08-10 09:19:50',
    completedAt: '2026-08-10 09:20:05',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-013',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-020',
    caseId: 'CLAIM-20260812000135',
    businessScene: '保険金請求',
    fileId: 'file-010',
    fileName: '入院証明書.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCountSnapshot: 3,
    status: 'success',
    startedAt: '2026-08-12 14:08:12',
    completedAt: '2026-08-12 14:08:55',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-014',
    billableNote: '初回成功・集計'
  },
  // —— 2026年9月 ——
  {
    id: 'exec-021',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-09-05 10:08:22',
    completedAt: '2026-09-05 10:10:15',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-015',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-022',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-09-05 10:11:03',
    completedAt: '2026-09-05 10:14:28',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-016',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-023',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-09-05 10:15:40',
    completedAt: '2026-09-05 10:20:12',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-017',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-024',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'DATA_MAPPING',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-09-05 10:21:05',
    completedAt: '2026-09-05 10:23:18',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-018',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-025',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'AI_VERIFICATION',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-09-05 10:24:00',
    completedAt: '2026-09-05 10:27:33',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-019',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-026',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-09-05 10:14:32',
    completedAt: '2026-09-05 10:15:20',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-020',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-027',
    caseId: 'CLAIM-20260905000241',
    businessScene: '保険金請求',
    fileId: 'file-020',
    fileName: '手術費用明細.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCountSnapshot: 6,
    status: 'success',
    startedAt: '2026-09-05 10:15:25',
    completedAt: '2026-09-05 10:15:38',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-021',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-028',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 3,
    status: 'success',
    startedAt: '2026-09-18 14:22:10',
    completedAt: '2026-09-18 14:23:45',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-022',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-029',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 3,
    status: 'failure',
    startedAt: '2026-09-18 14:24:18',
    completedAt: '2026-09-18 14:25:02',
    attemptNo: 1,
    isBillable: false,
    billingRecordId: null,
    billableNote: '処理失敗・対象外'
  },
  {
    id: 'exec-030',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 3,
    status: 'success',
    startedAt: '2026-09-18 14:25:40',
    completedAt: '2026-09-18 14:26:52',
    attemptNo: 2,
    isBillable: true,
    billingRecordId: 'bill-023',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-044',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 4,
    status: 'success',
    startedAt: '2026-09-19 09:38:12',
    completedAt: '2026-09-19 09:40:05',
    attemptNo: 3,
    isBillable: false,
    billingRecordId: 'bill-023',
    billableNote: '重複成功・枚数更新（4枚）'
  },
  {
    id: 'exec-031',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 4,
    status: 'success',
    startedAt: '2026-09-18 14:28:05',
    completedAt: '2026-09-18 14:31:22',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-024',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-032',
    caseId: 'CLAIM-20260918000312',
    businessScene: '保険金請求',
    fileId: 'file-021',
    fileName: '診断書.pdf',
    billingNode: 'DATA_MAPPING',
    pageCountSnapshot: 4,
    status: 'success',
    startedAt: '2026-09-18 14:32:10',
    completedAt: '2026-09-18 14:34:08',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-025',
    billableNote: '初回成功・集計'
  },
  // —— 2026年10月 ——
  {
    id: 'exec-033',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-10-02 09:35:12',
    completedAt: '2026-10-02 09:36:40',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-026',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-034',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-10-02 09:37:22',
    completedAt: '2026-10-02 09:39:15',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-027',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-035',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-10-02 09:40:05',
    completedAt: '2026-10-02 09:42:50',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-028',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-036',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'AI_VERIFICATION',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-10-02 09:44:10',
    completedAt: '2026-10-02 09:46:28',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-029',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-037',
    caseId: 'CLAIM-20261002000405',
    businessScene: '保険金請求',
    fileId: 'file-030',
    fileName: '死亡診断書.pdf',
    billingNode: 'SENSITIVE_INFO_DETECTION',
    pageCountSnapshot: 2,
    status: 'success',
    startedAt: '2026-10-02 09:39:20',
    completedAt: '2026-10-02 09:39:35',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-030',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-038',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'CASE_AGGREGATION',
    pageCountSnapshot: 4,
    status: 'success',
    startedAt: '2026-10-15 11:12:30',
    completedAt: '2026-10-15 11:14:05',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-031',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-039',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'AI_PREPROCESS',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-10-15 11:15:18',
    completedAt: '2026-10-15 11:18:42',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-032',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-040',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 4,
    status: 'failure',
    startedAt: '2026-10-15 11:20:05',
    completedAt: '2026-10-15 11:20:48',
    attemptNo: 1,
    isBillable: false,
    billingRecordId: null,
    billableNote: '処理失敗・対象外'
  },
  {
    id: 'exec-041',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'OCR_EXTRACTION',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-10-16 08:18:22',
    completedAt: '2026-10-16 08:22:10',
    attemptNo: 2,
    isBillable: false,
    billingRecordId: 'bill-033',
    billableNote: '重複成功・枚数更新（5枚）'
  },
  {
    id: 'exec-042',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'DATA_MAPPING',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-10-15 11:25:30',
    completedAt: '2026-10-15 11:27:45',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-034',
    billableNote: '初回成功・集計'
  },
  {
    id: 'exec-043',
    caseId: 'CLAIM-20261015000489',
    businessScene: '保険金請求',
    fileId: 'file-031',
    fileName: '通院証明書.pdf',
    billingNode: 'IMAGE_FRAUD_DETECTION',
    pageCountSnapshot: 5,
    status: 'success',
    startedAt: '2026-10-15 11:18:48',
    completedAt: '2026-10-15 11:19:32',
    attemptNo: 1,
    isBillable: true,
    billingRecordId: 'bill-035',
    billableNote: '初回成功・集計'
  }
]

/** 执行履历模型用量 mock（Python 汇总 → Java 落库；七类节点均经大模型，成功必有） */
const executionModelUsageOverrides: Record<
  string,
  { invokedModel: string; tokenConsumed: number }
> = {
  'exec-001': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 1180 },
  'exec-003': { invokedModel: 'gpt-4.1', tokenConsumed: 11240 },
  'exec-004': { invokedModel: 'gpt-4.1', tokenConsumed: 12480 },
  'exec-005': { invokedModel: 'gpt-4.1', tokenConsumed: 8420 },
  'exec-006': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 960 },
  'exec-007': { invokedModel: 'gpt-4.1', tokenConsumed: 8960 },
  'exec-009': { invokedModel: 'gpt-4.1', tokenConsumed: 5260 },
  'exec-010': { invokedModel: 'gpt-4.1', tokenConsumed: 4320 },
  'exec-011': { invokedModel: 'gpt-4.1', tokenConsumed: 3840 },
  'exec-012': { invokedModel: 'gpt-4.1', tokenConsumed: 6180 },
  'exec-013': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 740 },
  'exec-014': { invokedModel: 'gpt-4.1', tokenConsumed: 3080 },
  'exec-016': { invokedModel: 'gpt-4.1', tokenConsumed: 4650 },
  'exec-017': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 2100 },
  'exec-018': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 1680 },
  'exec-019': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 1850 },
  'exec-020': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 920 },
  'exec-021': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 1020 },
  'exec-022': { invokedModel: 'gpt-4.1', tokenConsumed: 9680 },
  'exec-023': { invokedModel: 'gpt-4.1', tokenConsumed: 7120 },
  'exec-025': { invokedModel: 'gpt-4.1', tokenConsumed: 5580 },
  'exec-028': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 880 },
  'exec-030': { invokedModel: 'gpt-4.1', tokenConsumed: 6420 },
  'exec-044': { invokedModel: 'gpt-4.1', tokenConsumed: 6980 },
  'exec-031': { invokedModel: 'gpt-4.1', tokenConsumed: 4280 },
  'exec-033': { invokedModel: 'gpt-4.1-mini', tokenConsumed: 680 },
  'exec-034': { invokedModel: 'gpt-4.1', tokenConsumed: 3820 },
  'exec-035': { invokedModel: 'gpt-4.1', tokenConsumed: 3180 },
  'exec-036': { invokedModel: 'gpt-4.1', tokenConsumed: 4920 },
  'exec-039': { invokedModel: 'gpt-4.1', tokenConsumed: 8120 },
  'exec-041': { invokedModel: 'gpt-4.1', tokenConsumed: 5480 },
  'exec-042': { invokedModel: 'gpt-4.1', tokenConsumed: 3960 }
}

const defaultModelByNode: Record<BillingNodeKey, string> = {
  CASE_AGGREGATION: 'gpt-4.1-mini',
  AI_PREPROCESS: 'gpt-4.1',
  OCR_EXTRACTION: 'gpt-4.1',
  DATA_MAPPING: 'gpt-4.1',
  AI_VERIFICATION: 'gpt-4.1',
  IMAGE_FRAUD_DETECTION: 'gpt-4.1-mini',
  SENSITIVE_INFO_DETECTION: 'gpt-4.1-mini'
}

const tokenBaseByNode: Record<BillingNodeKey, number> = {
  CASE_AGGREGATION: 420,
  AI_PREPROCESS: 2800,
  OCR_EXTRACTION: 2400,
  DATA_MAPPING: 2200,
  AI_VERIFICATION: 5200,
  IMAGE_FRAUD_DETECTION: 780,
  SENSITIVE_INFO_DETECTION: 620
}

function estimateTokenConsumed(
  billingNode: BillingNodeKey,
  pageCountSnapshot: number,
  attemptNo: number
): number {
  return tokenBaseByNode[billingNode] + pageCountSnapshot * 310 + attemptNo * 95
}

function attachModelUsage(record: ExecutionSeedItem): NodeExecutionRecord {
  if (record.status !== 'success') {
    return { ...record, invokedModel: null, tokenConsumed: null }
  }

  const usage = executionModelUsageOverrides[record.id]
  return {
    ...record,
    invokedModel: usage?.invokedModel ?? defaultModelByNode[record.billingNode],
    tokenConsumed:
      usage?.tokenConsumed ??
      estimateTokenConsumed(
        record.billingNode,
        record.pageCountSnapshot,
        record.attemptNo
      )
  }
}

export const billingRecords = ref<BillingRecord[]>([...billingSeed])
export const nodeExecutionRecords = ref<NodeExecutionRecord[]>(
  executionSeed.map(attachModelUsage)
)

export interface UsageSearchFilters {
  caseId: string
  fileName: string
  completedFrom: string
  completedTo: string
  billingNodes: BillingNodeKey[]
}

function matchesBillingNodes(
  billingNode: BillingNodeKey,
  selected: BillingNodeKey[]
): boolean {
  if (!selected.length) return true
  return selected.includes(billingNode)
}

export function matchesCompletedRange(
  completedAt: string,
  completedFrom: string,
  completedTo: string
): boolean {
  if (completedFrom && completedAt < completedFrom) return false
  if (completedTo && completedAt > `${completedTo} 23:59:59`) return false
  return true
}

export function filterBillingRecords(
  records: BillingRecord[],
  filters: UsageSearchFilters
): BillingRecord[] {
  return records.filter((item) => {
    if (
      filters.caseId &&
      !item.caseId.toLowerCase().includes(filters.caseId.trim().toLowerCase())
    ) {
      return false
    }
    if (
      filters.fileName &&
      !item.fileName.toLowerCase().includes(filters.fileName.trim().toLowerCase())
    ) {
      return false
    }
    if (!matchesCompletedRange(item.completedAt, filters.completedFrom, filters.completedTo)) {
      return false
    }
    if (!matchesBillingNodes(item.billingNode, filters.billingNodes)) {
      return false
    }
    return true
  })
}

export function filterExecutionRecords(
  records: NodeExecutionRecord[],
  filters: UsageSearchFilters
): NodeExecutionRecord[] {
  return records.filter((item) => {
    if (
      filters.caseId &&
      !item.caseId.toLowerCase().includes(filters.caseId.trim().toLowerCase())
    ) {
      return false
    }
    if (
      filters.fileName &&
      !item.fileName.toLowerCase().includes(filters.fileName.trim().toLowerCase())
    ) {
      return false
    }
    if (!matchesCompletedRange(item.completedAt, filters.completedFrom, filters.completedTo)) {
      return false
    }
    if (!matchesBillingNodes(item.billingNode, filters.billingNodes)) {
      return false
    }
    return true
  })
}

export function aggregateBillingPageCountByNode(records: BillingRecord[]) {
  const totals = new Map<BillingNodeKey, number>()
  for (const record of records) {
    totals.set(record.billingNode, (totals.get(record.billingNode) ?? 0) + record.pageCount)
  }
  return totals
}

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

function downloadUsageCsv(headers: string[], rows: string[], filename: string): void {
  const csv = `\uFEFF${headers.map(escapeCsvCell).join(',')}\n${rows.join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const BILLING_CSV_HEADERS = [
  '案件ID',
  '業務シーン',
  'ファイル名',
  '帳票枚数',
  '処理ノード',
  '処理開始日時',
  '処理完了日時'
] as const

const EXECUTION_CSV_HEADERS = [
  '案件ID',
  '業務シーン',
  'ファイル名',
  '帳票枚数',
  '処理ノード',
  '実行結果',
  '集計対象',
  '処理開始日時',
  '処理完了日時'
] as const

export function formatTokenConsumed(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

export function formatInvokedModel(value: string | null | undefined): string {
  if (!value?.trim()) return '—'
  return value
}

export function downloadBillingRecordsCsv(
  records: BillingRecord[],
  filename?: string
): void {
  const date = new Date().toISOString().slice(0, 10)
  const rows = records.map((item) =>
    [
      item.caseId,
      item.businessScene,
      item.fileName,
      item.pageCount,
      billingNodeLabel(item.billingNode),
      item.startedAt,
      item.completedAt
    ]
      .map(escapeCsvCell)
      .join(',')
  )

  downloadUsageCsv(
    [...BILLING_CSV_HEADERS],
    rows,
    filename ?? `usage-billing_${date}.csv`
  )
}

export function downloadExecutionRecordsCsv(
  records: NodeExecutionRecord[],
  filename?: string
): void {
  const date = new Date().toISOString().slice(0, 10)
  const rows = records.map((item) =>
    [
      item.caseId,
      item.businessScene,
      item.fileName,
      item.pageCountSnapshot,
      billingNodeLabel(item.billingNode),
      item.status === 'success' ? '成功' : '失敗',
      item.isBillable ? '対象' : '対象外',
      item.startedAt,
      item.completedAt
    ]
      .map(escapeCsvCell)
      .join(',')
  )

  downloadUsageCsv(
    [...EXECUTION_CSV_HEADERS],
    rows,
    filename ?? `usage-execution_${date}.csv`
  )
}
