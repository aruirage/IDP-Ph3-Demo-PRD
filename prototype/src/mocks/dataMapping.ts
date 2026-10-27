import { ref } from 'vue'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'
import { getFieldTemplatesForDocType } from '@/constants/exportFieldTemplates'
import {
  buildStandardMappingRuleText,
  mappingRuleTemplateLabelsJa
} from '@/utils/mappingRuleTemplate'

export interface DataMappingSource {
  docType: string
  fieldId: string
  fieldLabel: string
}

export type StandardFieldDataType = 'string' | 'number' | 'date' | 'boolean'

export const STANDARD_FIELD_DATA_TYPE_OPTIONS: {
  value: StandardFieldDataType
  label: string
}[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' }
]

export interface DataMappingRule {
  id: string
  standardField: string
  displayLabel: string
  dataType: StandardFieldDataType
  sources: DataMappingSource[]
  /** 同一性映射规则（自然语言）；运行时由 LLM 做语义判定与优先级赋值 */
  standardizationRule: string
  /** 规则级：是否参与 AI 检证 · 数据一致性检证（须来源 ≥2） */
  consistencyCheckEnabled: boolean
  updatedAt: string
}

function createMappingRule(
  rule: Omit<DataMappingRule, 'standardizationRule' | 'consistencyCheckEnabled'> & {
    standardizationRule?: string
    consistencyCheckEnabled?: boolean
  }
): DataMappingRule {
  const consistencyCheckEnabled =
    rule.sources.length >= 2 ? (rule.consistencyCheckEnabled ?? true) : false

  return {
    ...rule,
    consistencyCheckEnabled,
    standardizationRule:
      rule.standardizationRule?.trim() ||
      buildStandardMappingRuleText(
        rule.displayLabel,
        rule.standardField,
        rule.sources,
        mappingRuleTemplateLabelsJa()
      )
  }
}

export function formatDataType(value: StandardFieldDataType): string {
  return STANDARD_FIELD_DATA_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

const rawMappingRules: Omit<DataMappingRule, 'standardizationRule' | 'consistencyCheckEnabled'>[] = [
  {
    id: 'map-001',
    standardField: 'insured_name',
    displayLabel: '被保険者氏名',
    dataType: 'string',
    sources: [
      { docType: '保険金請求書', fieldId: 'claim-insured', fieldLabel: '被保険者氏名' },
      { docType: '診断書', fieldId: 'diag-patient', fieldLabel: '患者氏名' },
      { docType: '領収書・診療明細書', fieldId: 'rcpt-patient', fieldLabel: '患者氏名' },
      { docType: '入院証明書', fieldId: 'adm-insured', fieldLabel: '被保険者氏名' }
    ],
    updatedAt: '2025-09-18 14:32:00'
  },
  {
    id: 'map-002',
    standardField: 'policy_number',
    displayLabel: '証券番号',
    dataType: 'string',
    sources: [
      { docType: '保険金請求書', fieldId: 'claim-policy', fieldLabel: '証券番号' },
      { docType: '診断書', fieldId: 'diag-policy', fieldLabel: '証券番号' }
    ],
    updatedAt: '2025-09-18 14:28:00'
  },
  {
    id: 'map-003',
    standardField: 'insured_birth_date',
    displayLabel: '被保険者生年月日',
    dataType: 'date',
    sources: [
      { docType: '保険金請求書', fieldId: 'claim-insured-birth', fieldLabel: '被保険者生年月日' },
      { docType: '診断書', fieldId: 'diag-birth', fieldLabel: '生年月日' }
    ],
    updatedAt: '2025-09-18 11:20:00'
  },
  {
    id: 'map-004',
    standardField: 'claim_type',
    displayLabel: '請求区分',
    dataType: 'string',
    sources: [{ docType: '保険金請求書', fieldId: 'claim-type', fieldLabel: '請求区分' }],
    updatedAt: '2025-09-17 16:05:00'
  },
  {
    id: 'map-005',
    standardField: 'disease_name',
    displayLabel: '傷病名',
    dataType: 'string',
    sources: [
      { docType: '診断書', fieldId: 'diag-disease', fieldLabel: '傷病名' },
      { docType: '入院証明書', fieldId: 'adm-disease', fieldLabel: '主病名' }
    ],
    updatedAt: '2025-09-17 14:40:00'
  },
  {
    id: 'map-006',
    standardField: 'onset_date',
    displayLabel: '発症日',
    dataType: 'date',
    sources: [{ docType: '診断書', fieldId: 'diag-onset', fieldLabel: '発症日' }],
    updatedAt: '2025-09-17 12:30:00'
  },
  {
    id: 'map-007',
    standardField: 'hospital_name',
    displayLabel: '医療機関名',
    dataType: 'string',
    sources: [
      { docType: '診断書', fieldId: 'diag-hospital', fieldLabel: '医療機関名' },
      { docType: '領収書・診療明細書', fieldId: 'rcpt-hospital', fieldLabel: '医療機関名' },
      { docType: '入院証明書', fieldId: 'adm-hospital', fieldLabel: '医療機関名' }
    ],
    updatedAt: '2025-09-16 16:40:00'
  },
  {
    id: 'map-008',
    standardField: 'medical_department',
    displayLabel: '診療科',
    dataType: 'string',
    sources: [
      { docType: '診断書', fieldId: 'diag-dept', fieldLabel: '診療科' },
      { docType: '領収書・診療明細書', fieldId: 'rcpt-dept', fieldLabel: '診療科' },
      { docType: '入院証明書', fieldId: 'adm-dept', fieldLabel: '診療科' }
    ],
    updatedAt: '2025-09-16 15:10:00'
  },
  {
    id: 'map-009',
    standardField: 'admission_date',
    displayLabel: '入院日',
    dataType: 'date',
    sources: [
      { docType: '保険金請求書', fieldId: 'claim-admit', fieldLabel: '入院日' },
      { docType: '診断書', fieldId: 'diag-admit', fieldLabel: '入院日' },
      { docType: '入院証明書', fieldId: 'adm-admit', fieldLabel: '入院日' }
    ],
    updatedAt: '2025-09-17 10:15:00'
  },
  {
    id: 'map-010',
    standardField: 'discharge_date',
    displayLabel: '退院日',
    dataType: 'date',
    sources: [
      { docType: '保険金請求書', fieldId: 'claim-discharge', fieldLabel: '退院日' },
      { docType: '診断書', fieldId: 'diag-discharge', fieldLabel: '退院日' },
      { docType: '入院証明書', fieldId: 'adm-discharge', fieldLabel: '退院日' }
    ],
    updatedAt: '2025-09-17 10:18:00'
  },
  {
    id: 'map-011',
    standardField: 'admission_days',
    displayLabel: '入院日数',
    dataType: 'number',
    sources: [
      { docType: '保険金請求書', fieldId: 'claim-days', fieldLabel: '入院日数' },
      { docType: '入院証明書', fieldId: 'adm-days', fieldLabel: '入院日数' }
    ],
    updatedAt: '2025-09-17 10:22:00'
  },
  {
    id: 'map-012',
    standardField: 'surgery_date',
    displayLabel: '手術日',
    dataType: 'date',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-visit-date', fieldLabel: '診療日（手術日）' }
    ],
    updatedAt: '2025-09-16 09:45:00'
  },
  {
    id: 'map-013',
    standardField: 'surgery_name',
    displayLabel: '手術名',
    dataType: 'string',
    sources: [{ docType: '診断書', fieldId: 'diag-summary', fieldLabel: '手術名（摘要）' }],
    updatedAt: '2025-09-16 09:50:00'
  },
  {
    id: 'map-014',
    standardField: 'treatment_date',
    displayLabel: '診療日',
    dataType: 'date',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-visit-date', fieldLabel: '診療日' }
    ],
    updatedAt: '2025-09-15 17:30:00'
  },
  {
    id: 'map-015',
    standardField: 'treatment_month',
    displayLabel: '診療年月',
    dataType: 'string',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-month', fieldLabel: '診療年月' }
    ],
    updatedAt: '2025-09-15 17:35:00'
  },
  {
    id: 'map-016',
    standardField: 'total_points',
    displayLabel: '合計点数',
    dataType: 'number',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-points-total', fieldLabel: '合計点数' }
    ],
    updatedAt: '2025-09-15 14:20:00'
  },
  {
    id: 'map-017',
    standardField: 'copay_amount',
    displayLabel: '自己負担額',
    dataType: 'number',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-copay', fieldLabel: '自己負担額' }
    ],
    updatedAt: '2025-09-15 14:25:00'
  },
  {
    id: 'map-018',
    standardField: 'receipt_amount',
    displayLabel: '領収金額',
    dataType: 'number',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-total-pay', fieldLabel: '領収金額' }
    ],
    updatedAt: '2025-09-15 14:28:00'
  },
  {
    id: 'map-019',
    standardField: 'receipt_issue_date',
    displayLabel: '領収日',
    dataType: 'date',
    sources: [
      { docType: '領収書・診療明細書', fieldId: 'rcpt-issue-date', fieldLabel: '領収日' }
    ],
    updatedAt: '2025-09-15 14:30:00'
  },
  {
    id: 'map-020',
    standardField: 'claim_amount',
    displayLabel: '請求金額',
    dataType: 'number',
    sources: [{ docType: '保険金請求書', fieldId: 'claim-amount', fieldLabel: '請求金額' }],
    updatedAt: '2025-09-14 11:00:00'
  },
  {
    id: 'map-021',
    standardField: 'bank_name',
    displayLabel: '振込先金融機関名',
    dataType: 'string',
    sources: [{ docType: '保険金請求書', fieldId: 'claim-bank', fieldLabel: '振込先金融機関名' }],
    updatedAt: '2025-09-14 10:55:00'
  },
  {
    id: 'map-022',
    standardField: 'bank_account',
    displayLabel: '口座番号',
    dataType: 'string',
    sources: [{ docType: '保険金請求書', fieldId: 'claim-account', fieldLabel: '口座番号' }],
    updatedAt: '2025-09-14 10:50:00'
  },
  {
    id: 'map-023',
    standardField: 'diagnosis_issue_date',
    displayLabel: '診断書発行日',
    dataType: 'date',
    sources: [{ docType: '診断書', fieldId: 'diag-date', fieldLabel: '発行日' }],
    updatedAt: '2025-09-14 10:40:00'
  },
  {
    id: 'map-024',
    standardField: 'attending_doctor',
    displayLabel: '担当医師氏名',
    dataType: 'string',
    sources: [{ docType: '診断書', fieldId: 'diag-doctor', fieldLabel: '担当医師氏名' }],
    updatedAt: '2025-09-13 16:20:00'
  },
  {
    id: 'map-025',
    standardField: 'pharmacy_total',
    displayLabel: '調剤合計',
    dataType: 'number',
    sources: [
      { docType: '調剤明細書', fieldId: 'pharm-total', fieldLabel: '調剤合計' }
    ],
    updatedAt: '2025-09-13 15:10:00'
  },
  {
    id: 'map-026',
    standardField: 'room_category',
    displayLabel: '病室区分',
    dataType: 'string',
    sources: [{ docType: '入院証明書', fieldId: 'adm-room', fieldLabel: '病室区分' }],
    updatedAt: '2025-09-13 14:00:00'
  }
]

export const dataMappingRules = ref<DataMappingRule[]>(
  rawMappingRules.map((rule) => createMappingRule(rule))
)

export function formatMappingSources(sources: DataMappingSource[]): string {
  return sources.map((s) => `${s.docType} › ${s.fieldLabel}`).join('、')
}

export function sourceKey(source: DataMappingSource): string {
  return `${source.docType}::${source.fieldId}`
}

export function parseSourceKey(key: string): { docType: string; fieldId: string } | null {
  const idx = key.indexOf('::')
  if (idx <= 0) return null
  return { docType: key.slice(0, idx), fieldId: key.slice(idx + 2) }
}

export function buildCurrentOcrFieldKeySet(): Set<string> {
  const keys = new Set<string>()
  for (const docType of PREPROCESS_DOC_TYPES) {
    for (const field of getFieldTemplatesForDocType(docType)) {
      keys.add(`${docType}::${field.id}`)
    }
  }
  return keys
}

/** 对照账票类型设置移除失效来源；返回是否发生变更 */
export function pruneMappingRuleSources(
  rule: DataMappingRule,
  validKeys = buildCurrentOcrFieldKeySet()
): boolean {
  const before = rule.sources.length
  rule.sources = rule.sources.filter((s) => validKeys.has(sourceKey(s)))
  if (rule.sources.length <= 1) {
    rule.consistencyCheckEnabled = false
  }
  return rule.sources.length !== before || (before > 1 && rule.sources.length <= 1)
}

export function pruneAllMappingRuleSources(): void {
  const validKeys = buildCurrentOcrFieldKeySet()
  for (const rule of dataMappingRules.value) {
    pruneMappingRuleSources(rule, validKeys)
  }
}
