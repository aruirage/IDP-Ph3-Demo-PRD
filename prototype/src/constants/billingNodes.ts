export type BillingNodeKey =
  | 'CASE_AGGREGATION'
  | 'AI_PREPROCESS'
  | 'OCR_EXTRACTION'
  | 'DATA_MAPPING'
  | 'AI_VERIFICATION'
  | 'IMAGE_FRAUD_DETECTION'
  | 'SENSITIVE_INFO_DETECTION'

export type BillingNodeLevel = 'file' | 'case'

/** 用量统计汇总卡片栅格最多列数（预留扩展） */
export const BILLING_SUMMARY_MAX_SLOTS = 7

export interface BillingNodeMeta {
  key: BillingNodeKey
  label: string
  level: BillingNodeLevel
}

export const BILLING_NODES: BillingNodeMeta[] = [
  { key: 'CASE_AGGREGATION', label: '案件集約', level: 'file' },
  { key: 'AI_PREPROCESS', label: 'AI前処理', level: 'file' },
  { key: 'OCR_EXTRACTION', label: 'OCR抽出', level: 'file' },
  { key: 'DATA_MAPPING', label: 'データマッピング', level: 'case' },
  { key: 'AI_VERIFICATION', label: 'AI検証', level: 'case' },
  /** AI前処理子能力；工作流不独立成节点，计费与展示单独归类 */
  { key: 'IMAGE_FRAUD_DETECTION', label: '画像不正検出', level: 'file' },
  /** AI前処理子能力；工作流不独立成节点，计费与展示单独归类 */
  { key: 'SENSITIVE_INFO_DETECTION', label: '敏感情報検出', level: 'file' }
]

export const BILLING_NODE_OPTIONS = BILLING_NODES.map((item) => ({
  value: item.key,
  label: item.label
}))

export function billingNodeLabel(key: BillingNodeKey): string {
  return BILLING_NODES.find((item) => item.key === key)?.label ?? key
}

export function billingNodeLevel(key: BillingNodeKey): BillingNodeLevel {
  return BILLING_NODES.find((item) => item.key === key)?.level ?? 'file'
}
