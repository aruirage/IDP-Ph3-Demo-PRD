import {
  buildLogicalFileName,
  logicalFileStem,
  type LogicalFileNameParts
} from '@/utils/logicalFileName'

export type MockLogicalFilePlan = LogicalFileNameParts & { fileType?: string }

export function resolveMockFileName(plan: MockLogicalFilePlan): string {
  return buildLogicalFileName(plan)
}

export function resolveMockFileStem(plan: MockLogicalFilePlan): string {
  return logicalFileStem(plan)
}

function dateBase(receivedAt: string): string {
  return receivedAt.slice(0, 10).replace(/-/g, '')
}

function extensionForDocType(docType: string, index: number): string {
  if (docType === '本人確認書類') {
    return index % 2 === 1 ? 'jpg' : 'pdf'
  }
  return 'pdf'
}

const CASE_FILE_SCENARIOS: Array<
  Pick<LogicalFileNameParts, 'documentSplitIndex' | 'imageSplitIndex'> & {
    batchSuffix?: string
  }
> = [
  {},
  { documentSplitIndex: 1 },
  { documentSplitIndex: 2 },
  { batchSuffix: '01' },
  { batchSuffix: '01', documentSplitIndex: 1 },
  { batchSuffix: '02', imageSplitIndex: 1 },
  { batchSuffix: '02', documentSplitIndex: 2, imageSplitIndex: 1 },
  { batchSuffix: '02', documentSplitIndex: 2, imageSplitIndex: 2 }
]

/** 已集约案件文件：按 PRD 6.15 生成逻辑文件名计划 */
export function planCaseLogicalFiles(input: {
  caseId: string
  receivedAt: string
  fileCount: number
  uploadedDocTypes: string[]
}): MockLogicalFilePlan[] {
  const rootBase = dateBase(input.receivedAt)
  const caseOffset = parseInt(input.caseId.replace(/\D/g, '').slice(-2), 10) || 0

  return Array.from({ length: input.fileCount }, (_, index) => {
    const docType = input.uploadedDocTypes[index % input.uploadedDocTypes.length] ?? 'その他書類'
    const scenario = CASE_FILE_SCENARIOS[(index + caseOffset) % CASE_FILE_SCENARIOS.length]
    const uploadBaseName = scenario.batchSuffix
      ? `${rootBase}${scenario.batchSuffix}`
      : rootBase

    return {
      uploadBaseName,
      documentSplitIndex: scenario.documentSplitIndex,
      imageSplitIndex: scenario.imageSplitIndex,
      extension: extensionForDocType(docType, index),
      fileType: docType
    }
  })
}

/** AI 检证任务（CLAIM-20251024000004）专用文档计划 */
export const VERIFICATION_DOCUMENT_PLANS: MockLogicalFilePlan[] = [
  { uploadBaseName: '20251024', extension: 'pdf', fileType: '保険金請求書' },
  { uploadBaseName: '20251024', documentSplitIndex: 1, extension: 'pdf', fileType: '診断書' },
  { uploadBaseName: '20251024', documentSplitIndex: 2, extension: 'pdf', fileType: '診断書' },
  { uploadBaseName: '202510241', extension: 'pdf', fileType: '領収書' },
  { uploadBaseName: '202510242', extension: 'pdf', fileType: '領収書' },
  {
    uploadBaseName: '202510243',
    documentSplitIndex: 1,
    extension: 'pdf',
    fileType: '診療明細書'
  },
  {
    uploadBaseName: '202510243',
    documentSplitIndex: 2,
    extension: 'pdf',
    fileType: '診療明細書'
  },
  {
    uploadBaseName: '202510244',
    documentSplitIndex: 2,
    imageSplitIndex: 1,
    extension: 'pdf',
    fileType: '調剤明細書'
  },
  {
    uploadBaseName: '202510244',
    documentSplitIndex: 2,
    imageSplitIndex: 2,
    extension: 'pdf',
    fileType: '調剤明細書'
  }
]

export const VERIFICATION_COMPLETENESS_FILE_NAMES: Record<string, string[]> = {
  'cmp-req-claim': [resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[0])],
  'cmp-req-diagnosis': [
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[1]),
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[2])
  ],
  'cmp-req-receipt': [
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[3]),
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[4])
  ],
  'cmp-req-detail': [
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[5]),
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[6])
  ],
  'cmp-req-pharmacy': [
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[7]),
    resolveMockFileName(VERIFICATION_DOCUMENT_PLANS[8])
  ]
}

export const PENDING_FILE_PLANS: Record<string, MockLogicalFilePlan> = {
  'pending-001': { uploadBaseName: '20260908', documentSplitIndex: 3, extension: 'pdf' },
  'pending-002': { uploadBaseName: '20260908', extension: 'jpg' },
  'pending-003': { uploadBaseName: '20260908', documentSplitIndex: 2, extension: 'pdf' },
  'pending-004': { uploadBaseName: '20260907', extension: 'tif' },
  'pending-005': { uploadBaseName: '20260908', documentSplitIndex: 1, extension: 'pdf' },
  'pending-006': { uploadBaseName: '20260909', extension: 'pdf' },
  'pending-007': { uploadBaseName: '20260908', documentSplitIndex: 4, extension: 'pdf' },
  'pending-008': { uploadBaseName: '20260908', documentSplitIndex: 1, extension: 'pdf' },
  'pending-009': { uploadBaseName: '20260908', documentSplitIndex: 3, extension: 'pdf' },
  'pending-010': { uploadBaseName: '20260908', documentSplitIndex: 4, extension: 'pdf' },
  'pending-011': { uploadBaseName: '20260908', documentSplitIndex: 5, extension: 'pdf' },
  'pending-012': { uploadBaseName: '20260908', documentSplitIndex: 6, extension: 'pdf' },
  'pending-013': { uploadBaseName: '20260908', documentSplitIndex: 7, extension: 'pdf' },
  'pending-014': { uploadBaseName: '20260908', documentSplitIndex: 2, extension: 'pdf' },
  'pending-015': { uploadBaseName: '20260905', documentSplitIndex: 4, extension: 'pdf' },
  'pending-016': { uploadBaseName: '20260905', documentSplitIndex: 5, extension: 'pdf' },
  'pending-017': { uploadBaseName: '20260831', documentSplitIndex: 3, extension: 'pdf' },
  'pending-018': { uploadBaseName: '20260831', documentSplitIndex: 4, extension: 'pdf' }
}

export function resolvePendingFileName(pendingId: string, fallbackPlan: MockLogicalFilePlan): string {
  const plan = PENDING_FILE_PLANS[pendingId] ?? fallbackPlan
  return resolveMockFileName(plan)
}

export function getCaseLogicalFileNames(input: {
  caseId: string
  receivedAt: string
  fileCount: number
  uploadedDocTypes: string[]
}): string[] {
  return planCaseLogicalFiles(input).map(resolveMockFileName)
}
