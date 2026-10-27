import { ref } from 'vue'
import { t } from '@/i18n/translate'
import { CASE_SCENARIOS } from '@/constants/caseScenarios'

export type DocRequirementLevel = 'required' | 'optional' | 'conditional'
export type RuleScope = 'all_scenes' | 'selected_scenes'
export type AtomicRuleKind = 'required_field' | 'text' | 'data' | 'seal'

/** 標準フィールド横断ルールの所属帳票タイプ表示値 */
export const STANDARD_FIELD_BELONG_DOC_TYPE = '標準フィールド'

export interface CompletenessDocRule {
  docType: string
  requirement: DocRequirementLevel
  conditionDescription: string | null
}

export interface SealSignatureAtomicRule {
  id: string
  name: string
  targetDocType: string
  detectionTarget: 'seal' | 'signature' | 'both'
  /** 署名／捺印と帳票・標準フィールドの一致を検証 */
  matchConsistency: boolean
  compareStandardField: string | null
  enabled: boolean
  scope: RuleScope
  sceneIds: string[]
}

export interface RequiredFieldAtomicRule {
  id: string
  standardField: string
  displayLabel: string
  /** 所属帳票タイプ（具体帳票名、または標準フィールド） */
  belongDocType: string
  enabled: boolean
  scope: RuleScope
  sceneIds: string[]
}

export interface NaturalLanguageAtomicRule {
  id: string
  name: string
  description: string
  kind: 'text' | 'data'
  enabled: boolean
  scope: RuleScope
  sceneIds: string[]
}

export interface SceneVerificationConfig {
  sceneId: string
  completenessEnabled: boolean
  completenessDocs: CompletenessDocRule[]
  /** ライブラリで適用対象だが、このシーンでは無効化する原子ルール */
  disabledAtomicRuleIds: string[]
}

export interface VerificationRuleConfigState {
  requiredFieldRules: RequiredFieldAtomicRule[]
  textRules: NaturalLanguageAtomicRule[]
  dataRules: NaturalLanguageAtomicRule[]
  sealRules: SealSignatureAtomicRule[]
  sceneConfigs: SceneVerificationConfig[]
}

function defaultCompletenessDocs(
  docTypes: string[],
  overrides: Partial<Record<string, DocRequirementLevel>> = {}
): CompletenessDocRule[] {
  return docTypes.map((docType) => ({
    docType,
    requirement: overrides[docType] ?? 'optional',
    conditionDescription: null
  }))
}

export const verificationRuleConfig = ref<VerificationRuleConfigState>({
  requiredFieldRules: [
    // ── 全シーン共通（契約・本人・振込・診断の基礎項目）──
    {
      id: 'atom-fld-001',
      standardField: 'insured_name',
      displayLabel: '被保険者氏名',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-002',
      standardField: 'policy_number',
      displayLabel: '証券番号',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-003',
      standardField: 'insured_birth_date',
      displayLabel: '被保険者生年月日',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-004',
      standardField: 'claim_type',
      displayLabel: '請求区分',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-005',
      standardField: 'disease_name',
      displayLabel: '傷病名',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-006',
      standardField: 'onset_date',
      displayLabel: '発症日',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-007',
      standardField: 'hospital_name',
      displayLabel: '医療機関名',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-008',
      standardField: 'medical_department',
      displayLabel: '診療科',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-009',
      standardField: 'diagnosis_issue_date',
      displayLabel: '診断書発行日',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-010',
      standardField: 'attending_doctor',
      displayLabel: '担当医師氏名',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-011',
      standardField: 'claim_amount',
      displayLabel: '請求金額',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-012',
      standardField: 'bank_name',
      displayLabel: '振込先金融機関名',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    },
    {
      id: 'atom-fld-013',
      standardField: 'bank_account',
      displayLabel: '口座番号',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: [],
      belongDocType: STANDARD_FIELD_BELONG_DOC_TYPE
    }
    // 以下はデータマッピングに存在するが、一括追加デモ用に未登録のまま残す：
    // total_points, copay_amount, receipt_amount, receipt_issue_date,
    // admission_date, discharge_date, admission_days, room_category,
    // surgery_date, surgery_name, treatment_date, treatment_month, pharmacy_total
  ],
  textRules: [
    {
      id: 'atom-txt-001',
      kind: 'text',
      name: '備考不備チェック',
      description: '保険金請求書の備考に「不備」が含まれないこと',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: []
    },
    {
      id: 'atom-txt-002',
      kind: 'text',
      name: '金額記号チェック',
      description: '領収書・診療明細書の金額フィールドに記号（￥・円）を含まないこと',
      enabled: true,
      scope: 'selected_scenes',
      sceneIds: ['CLAIM']
    }
  ],
  dataRules: [
    {
      id: 'atom-dat-001',
      kind: 'data',
      name: '診療明細点数合計',
      description:
        '{{領収書・診療明細書.合計点数}} = {{領収書・診療明細書.初・再診料点数}} + {{領収書・診療明細書.医学管理等点数}} + {{領収書・診療明細書.手術点数}}',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: []
    },
    {
      id: 'atom-dat-002',
      kind: 'data',
      name: '入院日数計算',
      description:
        '{{保険金請求書.入院日数}} = {{保険金請求書.退院日}} − {{保険金請求書.入院日}} + 1',
      enabled: true,
      scope: 'selected_scenes',
      sceneIds: ['CLAIM']
    }
  ],
  sealRules: [
    {
      id: 'atom-seal-001',
      name: '請求書署名照合',
      targetDocType: '保険金請求書',
      detectionTarget: 'signature',
      matchConsistency: true,
      compareStandardField: '被保険者氏名',
      enabled: true,
      scope: 'all_scenes',
      sceneIds: []
    },
    {
      id: 'atom-seal-002',
      name: '診断書印鑑存在',
      targetDocType: '診断書',
      detectionTarget: 'seal',
      matchConsistency: false,
      compareStandardField: null,
      enabled: true,
      scope: 'selected_scenes',
      sceneIds: ['CLAIM']
    }
  ],
  sceneConfigs: [
    {
      sceneId: 'CLAIM',
      completenessEnabled: true,
      completenessDocs: defaultCompletenessDocs(
        ['保険金請求書', '診断書', '領収書・診療明細書', '入院証明書', '調剤明細書'],
        {
          保険金請求書: 'required',
          診断書: 'required',
          '領収書・診療明細書': 'required',
          入院証明書: 'conditional',
          調剤明細書: 'optional'
        }
      ),
      disabledAtomicRuleIds: []
    },
    {
      sceneId: 'NEW_BUSINESS',
      completenessEnabled: true,
      completenessDocs: defaultCompletenessDocs(
        ['申込書', '本人確認書類', '健康告知書'],
        {
          申込書: 'required',
          本人確認書類: 'required',
          健康告知書: 'required'
        }
      ),
      disabledAtomicRuleIds: []
    },
    {
      sceneId: 'PRESERVATION',
      completenessEnabled: true,
      completenessDocs: defaultCompletenessDocs(
        ['保全変更届', '本人確認書類'],
        {
          保全変更届: 'required',
          本人確認書類: 'required'
        }
      ),
      disabledAtomicRuleIds: ['atom-txt-002']
    }
  ]
})

export function belongDocTypeDisplayLabel(docType: string): string {
  if (docType === STANDARD_FIELD_BELONG_DOC_TYPE) {
    return t('businessRules.verification.standardFieldDocType')
  }
  return docType
}

export function completenessSummary(docs: CompletenessDocRule[]): string {
  const required = docs.filter((d) => d.requirement === 'required').length
  const optional = docs.filter((d) => d.requirement === 'optional').length
  const conditional = docs.filter((d) => d.requirement === 'conditional').length
  const parts = [t('businessRules.verification.completeness.requiredCount', { count: required })]
  if (optional) parts.push(t('businessRules.verification.completeness.optionalCount', { count: optional }))
  if (conditional) {
    parts.push(t('businessRules.verification.completeness.conditionalCount', { count: conditional }))
  }
  return parts.join('　')
}

export function syncCompletenessDocsForScenario(
  scenarioDocTypes: string[],
  existing: CompletenessDocRule[]
): CompletenessDocRule[] {
  return scenarioDocTypes.map((docType) => {
    const found = existing.find((d) => d.docType === docType)
    return (
      found ?? {
        docType,
        requirement: 'optional',
        conditionDescription: null
      }
    )
  })
}

export function getSceneConfig(sceneId: string): SceneVerificationConfig {
  const found = verificationRuleConfig.value.sceneConfigs.find((c) => c.sceneId === sceneId)
  if (found) return found

  const scenario = CASE_SCENARIOS.find((s) => s.id === sceneId)
  const created: SceneVerificationConfig = {
    sceneId,
    completenessEnabled: true,
    completenessDocs: defaultCompletenessDocs(scenario?.docTypes ?? []),
    disabledAtomicRuleIds: []
  }
  verificationRuleConfig.value.sceneConfigs.push(created)
  return created
}

export function ruleAppliesToScene(
  rule: { scope: RuleScope; sceneIds: string[] },
  sceneId: string
): boolean {
  if (!sceneId) return true
  if (rule.scope === 'all_scenes') return true
  return rule.sceneIds.includes(sceneId)
}

export function isAtomicRuleActiveInScene(
  rule: { id: string; enabled: boolean; scope: RuleScope; sceneIds: string[] },
  sceneId: string
): boolean {
  if (!rule.enabled) return false
  if (!ruleAppliesToScene(rule, sceneId)) return false
  const scene = getSceneConfig(sceneId)
  return !scene.disabledAtomicRuleIds.includes(rule.id)
}

export function formatRuleScopeLabel(
  rule: { scope: RuleScope; sceneIds: string[] }
): string {
  if (rule.scope === 'all_scenes') return t('businessRules.verification.scope.allScenes')
  if (!rule.sceneIds.length) return t('businessRules.verification.scope.scenesUnset')
  const names = rule.sceneIds
    .map((id) => CASE_SCENARIOS.find((s) => s.id === id)?.name ?? id)
    .join('、')
  return names
}

export function detectionTargetLabel(target: SealSignatureAtomicRule['detectionTarget']): string {
  switch (target) {
    case 'seal':
      return t('businessRules.verification.options.detectionSeal')
    case 'signature':
      return t('businessRules.verification.options.detectionSignature')
    case 'both':
      return t('businessRules.verification.options.detectionBoth')
  }
}

export function getAllDocTypes(): string[] {
  return [...new Set(CASE_SCENARIOS.flatMap((s) => s.docTypes))]
}

export interface SceneAtomicRuleItem {
  id: string
  kind: AtomicRuleKind
  label: string
  description: string
  scopeLabel: string
  active: boolean
}

export function getAtomicRulesForScene(sceneId: string): SceneAtomicRuleItem[] {
  const state = verificationRuleConfig.value
  const items: SceneAtomicRuleItem[] = []

  for (const rule of state.requiredFieldRules) {
    if (!ruleAppliesToScene(rule, sceneId)) continue
    items.push({
      id: rule.id,
      kind: 'required_field',
      label: rule.displayLabel,
      description: rule.standardField,
      scopeLabel: formatRuleScopeLabel(rule),
      active: isAtomicRuleActiveInScene(rule, sceneId)
    })
  }

  for (const rule of state.textRules) {
    if (!ruleAppliesToScene(rule, sceneId)) continue
    items.push({
      id: rule.id,
      kind: 'text',
      label: rule.name,
      description: rule.description,
      scopeLabel: formatRuleScopeLabel(rule),
      active: isAtomicRuleActiveInScene(rule, sceneId)
    })
  }

  for (const rule of state.dataRules) {
    if (!ruleAppliesToScene(rule, sceneId)) continue
    items.push({
      id: rule.id,
      kind: 'data',
      label: rule.name,
      description: rule.description,
      scopeLabel: formatRuleScopeLabel(rule),
      active: isAtomicRuleActiveInScene(rule, sceneId)
    })
  }

  for (const rule of state.sealRules) {
    if (!ruleAppliesToScene(rule, sceneId)) continue
    const detectionLabel = detectionTargetLabel(rule.detectionTarget)
    items.push({
      id: rule.id,
      kind: 'seal',
      label: rule.name,
      description: `${rule.targetDocType}（${detectionLabel}）`,
      scopeLabel: formatRuleScopeLabel(rule),
      active: isAtomicRuleActiveInScene(rule, sceneId)
    })
  }

  return items
}

export function countLibraryRules(): number {
  const s = verificationRuleConfig.value
  return (
    s.requiredFieldRules.length +
    s.textRules.length +
    s.dataRules.length +
    s.sealRules.length
  )
}

export function atomicKindLabels(): Record<AtomicRuleKind, string> {
  return {
    required_field: t('businessRules.verification.tabRequiredField'),
    text: t('businessRules.verification.tabText'),
    data: t('businessRules.verification.tabData'),
    seal: t('businessRules.verification.tabSeal')
  }
}

/** @deprecated use atomicKindLabels() */
export const ATOMIC_KIND_LABELS: Record<AtomicRuleKind, string> = atomicKindLabels()
