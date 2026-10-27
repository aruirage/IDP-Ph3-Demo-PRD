import { t } from '@/i18n/translate'
import { getTaskById } from '@/mocks/tasks'
import type { OcrExtractionField, OcrFieldBbox } from '@/mocks/ocrExtractionTask'
import mockData from './verificationMockData.json'

/** AI判定：通過 / 要確認 の2段階 */
export type VerificationVerdict = 'PASS' | 'REVIEW'
export type HumanVerdict = 'OK' | 'NG' | null

export type VerificationReviewReason =
  | 'low-similarity'
  | 'empty-master-value'
  | 'low-llm-confidence'

const DEFAULT_MASTER_SIMILARITY_THRESHOLD = 85
const DEFAULT_LLM_REVIEW_THRESHOLD = 85

export type VerificationCategory =
  | 'completeness'
  | 'mapping'
  | 'master'
  | 'text'
  | 'data'
  | 'seal'
export type DocRequirementLevel = 'required' | 'conditional' | 'optional'
export type TextRuleType = 'master' | 'natural_language'
export type MasterMatchMethod = 'code' | 'similarity'
export type SealDetectionTarget = 'seal' | 'signature' | 'both'
export type SealCompareTargetType = 'standard' | 'doc_field'

export interface SealCompareTarget {
  type: SealCompareTargetType
  standardField?: string
  displayLabel?: string
  docType?: string
  fieldLabel?: string
  fileId?: string
  fieldId?: string | null
  expectedValue: string
}

export type VerificationScene =
  | 'required_field'
  | 'required_document'
  | 'date_format'
  | 'amount_format'
  | 'number_format'
  | 'char_type'
  | 'cross_file_name'
  | 'hospitalization_days'
  | 'billing_amount'
  | 'treatment_period'
  | 'mapping_consistency'
  | 'presence'
  | 'signature_consistency'

export interface MasterRelatedCode {
  label: string
  value: string
}

export interface MasterMatchCandidate {
  id: string
  matchMethod: MasterMatchMethod
  displayText: string
  similarityScore?: number
  relatedCodes: MasterRelatedCode[]
  isRecommended?: boolean
}

export interface CompletenessRequirement {
  id: string
  docType: string
  requirement: DocRequirementLevel
  conditionDescription: string | null
  presentCount: number
  fileNames: string[]
  status: 'present' | 'missing'
  aiVerdict: VerificationVerdict
  supplementRequired?: boolean
  humanVerdict: HumanVerdict
  comment: string
}

export interface CompletenessFieldRequirement {
  id: string
  standardField: string
  displayLabel: string
  targetDocTypes: string[]
  requirement: DocRequirementLevel
  conditionDescription: string | null
  status: 'present' | 'missing'
  missingDocTypes: string[]
  aiVerdict: VerificationVerdict
  humanVerdict: HumanVerdict
  comment: string
}

export interface MappingSourceValue {
  docType: string
  fieldLabel: string
  value: string
  fileId?: string
  fieldId?: string | null
}

export interface RuleVerificationField {
  docType: string
  fieldLabel: string
  appliedOcrValue: string
  fileId?: string
  fieldId?: string | null
}

export type DataEquationOperandRole = 'breakdown' | 'aggregate' | 'factor' | 'target' | 'computed'

export interface DataEquationOperand {
  role: DataEquationOperandRole
  displayLabel: string
  value: string
  docType?: string
  fieldLabel?: string
  fileId?: string
  fieldId?: string | null
  operatorText?: string
}

/** 数据检证：公式引用的 OCR 操作数（引擎返回） */
export interface DataVerificationEquation {
  formulaText: string
  leftLabel: string
  leftValue: string
  operator: string
  rightLabel: string
  rightValue: string
  calculatedValue?: string
  operands: DataEquationOperand[]
}

export interface StandardFieldSource {
  docType: string
  fieldLabel: string
  value: string
  fileId?: string
  fieldId?: string | null
}

export interface VerificationStandardField {
  id: string
  standardField: string
  displayLabel: string
  value: string
  resolvedValue: string
  sources: StandardFieldSource[]
}

/** 规则跳转目标（文件 Tab + 字段） */
export interface RuleFieldRef {
  fileId: string
  fieldId: string | null
  docType: string
  fieldLabel: string
  fileName: string
  displayName?: string
}

export interface VerificationRule {
  id: string
  category: VerificationCategory
  categoryLabel: string
  scene?: VerificationScene
  sceneLabel?: string
  targetDocType: string
  targetFileId: string | null
  targetFieldId: string | null
  targetFieldLabel: string | null
  /** 规则配置端录入的自然语言描述 */
  ruleDescription: string
  /** バックエンド返却：AI検証結果表示用 */
  ruleName: string
  /** 文本/数据检证：要確認時の判定説明（日语短句） */
  judgmentExplanation?: string
  /** 数据检证：公式引用的 OCR 操作数 */
  dataEquation?: DataVerificationEquation
  appliedOcrValue: string
  ruleMatched: boolean
  extractedValue: string
  aiResult: string
  aiVerdict: VerificationVerdict
  mandatory: boolean
  supplementRequired?: boolean
  bbox?: OcrFieldBbox
  humanVerdict: HumanVerdict
  comment: string
  /** 文本核验 */
  ruleType?: TextRuleType
  masterSource?: string
  masterValue?: string | null
  /** マスタ照合 */
  masterCandidates?: MasterMatchCandidate[]
  selectedMasterId?: string | null
  relatedCodes?: MasterRelatedCode[]
  /** 数据核验 / 文本核验（跨字段） */
  referenceValues?: string[]
  /** 標準データ整合性 */
  standardField?: string
  standardFieldLabel?: string
  mappingSourceValues?: MappingSourceValue[]
  verificationFields?: RuleVerificationField[]
  /** 印章核验 */
  detectionTarget?: SealDetectionTarget
  detectionLabel?: string
  compareTargets?: SealCompareTarget[]
  similarityThreshold?: number
  requiredContent?: string[]
  /** マスタ照合：要確認理由 */
  reviewReasons?: VerificationReviewReason[]
  llmReviewConfidence?: number | null
}

export interface VerificationDocument {
  id: string
  docType: string
  fileName: string
  /** 作業画面用の表示名（システムファイル名とは別） */
  displayName: string
  imageUrl: string
  pageCount?: number
  fields: OcrExtractionField[]
}

export interface VerificationTaskDetail {
  taskId: string
  caseId: string
  caseOrigin: string | null
  sourceFolderName: string
  policyNumber: string
  insuredName: string
  documents: VerificationDocument[]
  completeness: CompletenessRequirement[]
  completenessFields: CompletenessFieldRequirement[]
  standardFields: VerificationStandardField[]
  rules: VerificationRule[]
}

export const STANDARD_FIELDS_SCOPE = 'standard-fields' as const

export type VerificationScope = 'summary' | typeof STANDARD_FIELDS_SCOPE | string

export const CATEGORY_ORDER: VerificationCategory[] = [
  'completeness',
  'mapping',
  'text',
  'data',
  'seal'
]

export type CaseRoutingDecision = 'EXPORTABLE' | 'SUPPLEMENT'

interface RawCompletenessField {
  id: string
  standard_field: string
  display_label: string
  target_doc_types: string[]
  requirement: DocRequirementLevel
  condition_description: string | null
  status: 'present' | 'missing'
  missing_doc_types: string[]
  result: string
}

interface RawVerificationResultFields {
  rule_name: string
  applied_ocr_value: string
  rule_matched: boolean
}

interface RawMappingRule extends RawVerificationResultFields {
  id: string
  standard_field: string
  display_label: string
  rule_description: string
  source_values: { doc_type: string; field_label: string; value: string }[]
  result: string
  ai_result: string
  mandatory: boolean
  supplement_required?: boolean
}

interface RawCompleteness {
  id: string
  doc_type: string
  requirement: DocRequirementLevel
  condition_description: string | null
  present_count: number
  file_names: string[]
  status: 'present' | 'missing'
  result: string
  supplement_required?: boolean
}

interface RawJudgmentExplanationFields {
  judgment_explanation?: string
  ai_result: string
  result: string
}

interface RawTextRule extends RawVerificationResultFields, RawJudgmentExplanationFields {
  id: string
  scene?: VerificationScene
  rule_type: TextRuleType
  standard_field?: string
  display_label?: string
  target_doc_type: string
  target_field_label: string
  target_file_id: string | null
  target_field_id?: string | null
  rule_description: string
  extracted_value?: string
  reference_values?: string[]
  verification_fields?: {
    doc_type: string
    field_label: string
    applied_ocr_value: string
    target_file_id?: string | null
    target_field_id?: string | null
  }[]
  result: string
  ai_result: string
  mandatory: boolean
  supplement_required?: boolean
  bbox?: OcrFieldBbox
}

interface RawDataEquationOperand {
  role: DataEquationOperandRole
  display_label: string
  value: string
  doc_type?: string
  field_label?: string
  target_file_id?: string | null
  target_field_id?: string | null
  operator_text?: string
}

interface RawDataEquation {
  formula_text: string
  left_label: string
  left_value: string
  operator: string
  right_label: string
  right_value: string
  calculated_value?: string
  operands?: RawDataEquationOperand[]
}

interface RawDataRule extends RawVerificationResultFields, RawJudgmentExplanationFields {
  id: string
  scene?: VerificationScene
  data_equation?: RawDataEquation
  standard_field?: string
  display_label?: string
  target_doc_type: string
  target_field_label: string
  target_file_id: string | null
  target_field_id?: string | null
  rule_description: string
  extracted_value?: string
  reference_values?: string[]
  verification_fields?: {
    doc_type: string
    field_label: string
    applied_ocr_value: string
    target_file_id?: string | null
    target_field_id?: string | null
  }[]
  result: string
  ai_result: string
  mandatory: boolean
  supplement_required?: boolean
  bbox?: OcrFieldBbox
}

interface RawSealRule extends RawVerificationResultFields {
  id: string
  scene?: VerificationScene
  target_doc_type: string
  target_file_id: string | null
  detection_target: SealDetectionTarget
  detection_label?: string
  rule_description?: string
  similarity_threshold?: number
  required_content?: string[]
  compare_targets?: {
    type: SealCompareTargetType
    standard_field?: string
    display_label?: string
    doc_type?: string
    field_label?: string
    target_file_id?: string | null
    target_field_id?: string | null
    expected_value: string
  }[]
  extracted_value?: string
  result: string
  ai_result: string
  mandatory: boolean
  supplement_required?: boolean
  bbox?: OcrFieldBbox
}

interface RawStandardField {
  id: string
  standard_field: string
  display_label: string
  value: string
  resolved_value: string
  sources: { doc_type: string; field_label: string; value: string }[]
}

function mapStandardField(raw: RawStandardField): VerificationStandardField {
  return {
    id: raw.id,
    standardField: raw.standard_field,
    displayLabel: raw.display_label,
    value: raw.value,
    resolvedValue: raw.resolved_value,
    sources: raw.sources.map((source) => ({
      docType: source.doc_type,
      fieldLabel: source.field_label,
      value: source.value
    }))
  }
}

function mapCompleteness(raw: RawCompleteness): CompletenessRequirement {
  return {
    id: raw.id,
    docType: raw.doc_type,
    requirement: raw.requirement,
    conditionDescription: raw.condition_description,
    presentCount: raw.present_count,
    fileNames: raw.file_names,
    status: raw.status,
    aiVerdict: raw.result as VerificationVerdict,
    supplementRequired: raw.supplement_required ?? false,
    humanVerdict: null,
    comment: ''
  }
}

function mapCompletenessField(raw: RawCompletenessField): CompletenessFieldRequirement {
  return {
    id: raw.id,
    standardField: raw.standard_field,
    displayLabel: raw.display_label,
    targetDocTypes: raw.target_doc_types,
    requirement: raw.requirement,
    conditionDescription: raw.condition_description,
    status: raw.status,
    missingDocTypes: raw.missing_doc_types,
    aiVerdict: raw.result as VerificationVerdict,
    humanVerdict: null,
    comment: ''
  }
}

function resolveSceneLabel(scene?: VerificationScene): string | undefined {
  return scene ? sceneLabel(scene) : undefined
}

function mapVerificationResultFields(
  raw: RawVerificationResultFields
): Pick<VerificationRule, 'ruleName' | 'appliedOcrValue' | 'ruleMatched'> {
  return {
    ruleName: raw.rule_name,
    appliedOcrValue: raw.applied_ocr_value,
    ruleMatched: raw.rule_matched
  }
}

function resolveJudgmentExplanation(raw: RawJudgmentExplanationFields): string | undefined {
  if (raw.judgment_explanation?.trim()) {
    return raw.judgment_explanation.trim()
  }
  if (raw.ai_result?.trim()) {
    return raw.ai_result.trim()
  }
  return undefined
}

function mapMappingRule(raw: RawMappingRule): VerificationRule {
  const primarySource = raw.source_values[0]
  return {
    id: raw.id,
    category: 'mapping',
    categoryLabel: categoryLabel('mapping'),
    scene: 'mapping_consistency',
    sceneLabel: sceneLabel('mapping_consistency'),
    targetDocType: primarySource?.doc_type ?? '—',
    targetFileId: null,
    targetFieldId: null,
    targetFieldLabel: raw.display_label,
    standardField: raw.standard_field,
    standardFieldLabel: raw.display_label,
    ruleDescription: raw.rule_description,
    ...mapVerificationResultFields(raw),
    mappingSourceValues: raw.source_values.map((s) => ({
      docType: s.doc_type,
      fieldLabel: s.field_label,
      value: s.value
    })),
    extractedValue: raw.applied_ocr_value,
    aiResult: raw.ai_result,
    aiVerdict: raw.result as VerificationVerdict,
    mandatory: raw.mandatory,
    supplementRequired: raw.supplement_required ?? false,
    humanVerdict: null,
    comment: ''
  }
}

export function getDisplayMasterCandidates(
  candidates: MasterMatchCandidate[]
): MasterMatchCandidate[] {
  return candidates
    .filter((candidate) => candidate.matchMethod === 'similarity')
    .sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0))
    .slice(0, 3)
}

function mapTextRule(raw: RawTextRule): VerificationRule {
  return {
    id: raw.id,
    category: 'text',
    categoryLabel: categoryLabel('text'),
    scene: raw.scene,
    sceneLabel: resolveSceneLabel(raw.scene),
    standardField: raw.standard_field,
    standardFieldLabel: raw.display_label,
    targetDocType: raw.target_doc_type,
    targetFileId: raw.target_file_id,
    targetFieldId: raw.target_field_id ?? null,
    targetFieldLabel: raw.target_field_label,
    ruleDescription: raw.rule_description,
    ruleType: raw.rule_type,
    ...mapVerificationResultFields(raw),
    extractedValue: raw.extracted_value ?? raw.applied_ocr_value,
    referenceValues: raw.reference_values,
    verificationFields: raw.verification_fields?.map((field) => ({
      docType: field.doc_type,
      fieldLabel: field.field_label,
      appliedOcrValue: field.applied_ocr_value,
      fileId: field.target_file_id ?? undefined,
      fieldId: field.target_field_id ?? null
    })),
    aiResult: raw.ai_result,
    aiVerdict: raw.result as VerificationVerdict,
    judgmentExplanation: resolveJudgmentExplanation(raw),
    mandatory: raw.mandatory,
    supplementRequired: raw.supplement_required ?? false,
    bbox: raw.bbox,
    humanVerdict: null,
    comment: ''
  }
}

function mapDataEquation(raw?: RawDataEquation): DataVerificationEquation | undefined {
  if (!raw) return undefined
  return {
    formulaText: raw.formula_text,
    leftLabel: raw.left_label,
    leftValue: raw.left_value,
    operator: raw.operator,
    rightLabel: raw.right_label,
    rightValue: raw.right_value,
    calculatedValue: raw.calculated_value,
    operands: (raw.operands ?? []).map((operand) => ({
      role: operand.role,
      displayLabel: operand.display_label,
      value: operand.value,
      docType: operand.doc_type,
      fieldLabel: operand.field_label,
      fileId: operand.target_file_id ?? undefined,
      fieldId: operand.target_field_id ?? null,
      operatorText: operand.operator_text
    }))
  }
}

function mapDataRule(raw: RawDataRule): VerificationRule {
  return {
    id: raw.id,
    category: 'data',
    categoryLabel: categoryLabel('data'),
    scene: raw.scene,
    sceneLabel: resolveSceneLabel(raw.scene),
    standardField: raw.standard_field,
    standardFieldLabel: raw.display_label,
    targetDocType: raw.target_doc_type,
    targetFileId: raw.target_file_id,
    targetFieldId: raw.target_field_id ?? null,
    targetFieldLabel: raw.target_field_label,
    ruleDescription: raw.rule_description,
    ...mapVerificationResultFields(raw),
    dataEquation: mapDataEquation(raw.data_equation),
    extractedValue: raw.extracted_value ?? raw.applied_ocr_value,
    referenceValues: raw.reference_values,
    verificationFields: raw.verification_fields?.map((field) => ({
      docType: field.doc_type,
      fieldLabel: field.field_label,
      appliedOcrValue: field.applied_ocr_value,
      fileId: field.target_file_id ?? undefined,
      fieldId: field.target_field_id ?? null
    })),
    aiResult: raw.ai_result,
    aiVerdict: raw.result as VerificationVerdict,
    judgmentExplanation: resolveJudgmentExplanation(raw),
    mandatory: raw.mandatory,
    supplementRequired: raw.supplement_required ?? false,
    bbox: raw.bbox,
    humanVerdict: null,
    comment: ''
  }
}

function mapSealRule(raw: RawSealRule): VerificationRule {
  const detectionLabel = raw.detection_label ?? raw.required_content?.[0]
  return {
    id: raw.id,
    category: 'seal',
    categoryLabel: categoryLabel('seal'),
    scene: raw.scene ?? 'signature_consistency',
    sceneLabel: resolveSceneLabel(raw.scene ?? 'signature_consistency'),
    targetDocType: raw.target_doc_type,
    targetFileId: raw.target_file_id,
    targetFieldId: null,
    targetFieldLabel: detectionLabel ?? null,
    ruleDescription: raw.rule_description ?? '',
    detectionTarget: raw.detection_target,
    detectionLabel,
    similarityThreshold: raw.similarity_threshold,
    requiredContent: raw.required_content,
    compareTargets: raw.compare_targets?.map((target) => ({
      type: target.type,
      standardField: target.standard_field,
      displayLabel: target.display_label,
      docType: target.doc_type,
      fieldLabel: target.field_label,
      fileId: target.target_file_id ?? undefined,
      fieldId: target.target_field_id ?? null,
      expectedValue: target.expected_value
    })),
    ...mapVerificationResultFields(raw),
    extractedValue: raw.extracted_value ?? raw.applied_ocr_value,
    aiResult: raw.ai_result,
    aiVerdict: raw.result as VerificationVerdict,
    mandatory: raw.mandatory,
    supplementRequired: raw.supplement_required ?? false,
    bbox: raw.bbox,
    humanVerdict: null,
    comment: ''
  }
}

function buildVerificationDataFromMock() {
  const completeness = (mockData.completeness_requirements as RawCompleteness[]).map(
    mapCompleteness
  )
  const completenessFields = (
    mockData.completeness_field_requirements as RawCompletenessField[]
  ).map(mapCompletenessField)
  const standardFields = (mockData.standard_field_values as RawStandardField[]).map(
    mapStandardField
  )
  // Master 照合在 OCR 抽出确认环节处理，不计入 AI 检证待确认规则
  const rules: VerificationRule[] = [
    ...(mockData.mapping_consistency_rules as RawMappingRule[]).map(mapMappingRule),
    ...(mockData.text_verification_rules as RawTextRule[]).map(mapTextRule),
    ...(mockData.data_verification_rules as RawDataRule[]).map(mapDataRule),
    ...(mockData.seal_signature_verification as RawSealRule[]).map(mapSealRule)
  ]
  const documents: VerificationDocument[] = mockData.extraction_documents.map((doc) => ({
    id: doc.id,
    docType: doc.doc_type,
    fileName: doc.file_name,
    displayName: doc.display_name ?? doc.file_name.replace(/\.[^.]+$/, ''),
    imageUrl: doc.image_url,
    fields: doc.fields.map((f) => ({
      id: f.id,
      section: f.section,
      label: f.label,
      value: f.value,
      ocrOriginalValue: f.value,
      confidence: f.confidence,
      required: f.required,
      bbox: f.bbox
    }))
  }))
  for (const rule of rules) {
    if (rule.mappingSourceValues?.length) {
      rule.mappingSourceValues = enrichMappingSourceValues(documents, rule.mappingSourceValues)
    }
    if (rule.verificationFields?.length) {
      rule.verificationFields = enrichVerificationFields(documents, rule.verificationFields)
    }
  }
  for (const field of standardFields) {
    field.sources = enrichStandardFieldSources(documents, field.sources)
  }
  return { completeness, completenessFields, standardFields, rules, documents }
}

export function getVerificationArchiveByCaseId(caseId: string) {
  if (caseId !== mockData.case_id) return null
  return buildVerificationDataFromMock()
}

function buildTaskFromMock(taskId: string): VerificationTaskDetail | null {
  const task = getTaskById(taskId)
  if (!task || task.taskType !== 'verification') return null
  if (task.caseId !== mockData.case_id) return null

  const { completeness, completenessFields, standardFields, rules, documents } =
    buildVerificationDataFromMock()

  return {
    taskId,
    caseId: mockData.case_id,
    caseOrigin: mockData.case_origin,
    sourceFolderName: mockData.source_folder,
    policyNumber: mockData.policy_number,
    insuredName: mockData.insured_name,
    documents,
    completeness,
    completenessFields,
    standardFields,
    rules
  }
}

export function getVerificationTask(taskId: string): VerificationTaskDetail | null {
  return buildTaskFromMock(taskId)
}

export function categoryLabel(category: VerificationCategory): string {
  return t(`tasks.verification.category.${category}`)
}

export function sceneLabel(scene: VerificationScene): string {
  return t(`tasks.verification.scene.${scene}`)
}

export function requirementLabel(level: DocRequirementLevel): string {
  return t(`tasks.verification.requirement.${level}`)
}

export function textRuleTypeLabel(type: TextRuleType): string {
  return t(`tasks.verification.textRule.${type}`)
}

export function masterMatchMethodLabel(method: MasterMatchMethod): string {
  return t(`tasks.verification.masterMatch.${method}`)
}

export function masterCandidateLabel(candidate: MasterMatchCandidate): string {
  return `${masterMatchMethodLabel(candidate.matchMethod)} ${candidate.displayText}`
}

export function getSelectedMasterCandidate(
  rule: VerificationRule
): MasterMatchCandidate | null {
  if (!rule.masterCandidates?.length) return null
  if (rule.selectedMasterId) {
    return rule.masterCandidates.find((candidate) => candidate.id === rule.selectedMasterId) ?? null
  }
  return null
}

const SEAL_DETECTION_CONTENT_I18N: Record<SealDetectionTarget, string> = {
  seal: 'tasks.verification.sealContent.seal',
  signature: 'tasks.verification.sealContent.signature',
  both: 'tasks.verification.sealContent.both'
}

export function sealDetectionContentLabel(target: SealDetectionTarget | undefined): string {
  if (!target) return '—'
  return t(SEAL_DETECTION_CONTENT_I18N[target])
}

const DETECTION_TARGET_I18N_KEYS: Record<SealDetectionTarget, string> = {
  seal: 'businessRules.verification.options.detectionSeal',
  signature: 'businessRules.verification.options.detectionSignature',
  both: 'businessRules.verification.options.detectionBoth'
}

export function detectionTargetLabel(target: SealDetectionTarget): string {
  return t(DETECTION_TARGET_I18N_KEYS[target])
}

const REVIEW_REASON_I18N_KEYS: Record<VerificationReviewReason, string> = {
  'low-similarity': 'tasks.verification.reviewReason.lowSimilarity',
  'empty-master-value': 'tasks.verification.reviewReason.emptyMaster',
  'low-llm-confidence': 'tasks.verification.reviewReason.lowLlmConfidence'
}

export function verificationReviewReasonLabel(reason: VerificationReviewReason): string {
  return t(REVIEW_REASON_I18N_KEYS[reason])
}

export function ruleMatchedLabel(matched: boolean): string {
  return matched
    ? t('tasks.verification.verdict.matched')
    : t('tasks.verification.verdict.unmatched')
}

export function getRuleDisplayName(rule: VerificationRule): string {
  return rule.sceneLabel ?? rule.ruleDescription
}

export function getMasterMatchDisplayValue(rule: VerificationRule): string {
  if (rule.masterValue) return rule.masterValue
  return '—'
}

export function getMasterReviewReasons(rule: VerificationRule): VerificationReviewReason[] {
  if (rule.reviewReasons?.length) return rule.reviewReasons

  const reasons: VerificationReviewReason[] = []
  const similarityThreshold = rule.similarityThreshold ?? DEFAULT_MASTER_SIMILARITY_THRESHOLD
  const llmThreshold = DEFAULT_LLM_REVIEW_THRESHOLD
  const selected = getSelectedMasterCandidate(rule)

  if (!rule.masterValue) {
    reasons.push('empty-master-value')
  }
  if (selected?.similarityScore != null && selected.similarityScore < similarityThreshold) {
    reasons.push('low-similarity')
  }
  if (rule.llmReviewConfidence != null && rule.llmReviewConfidence < llmThreshold) {
    reasons.push('low-llm-confidence')
  }
  return reasons
}

export function getSealDetectedLabel(rule: VerificationRule): string {
  const value = `${rule.extractedValue ?? ''} ${rule.aiResult ?? ''}`
  if (/未検出/.test(value)) return t('tasks.verification.verdict.notDetected')
  if (/検出/.test(value) && !/未検出/.test(value)) return t('tasks.verification.verdict.detected')
  return rule.extractedValue || rule.aiResult || '—'
}

export function needsHumanReview(item: { aiVerdict: VerificationVerdict }): boolean {
  return item.aiVerdict === 'REVIEW'
}

/** 已命中（触发）的核验项 */
export function isTriggeredItem(item: { aiVerdict: VerificationVerdict }): boolean {
  return item.aiVerdict === 'REVIEW'
}

const STANDARD_FIELD_LABELS: Record<string, string[]> = {
  insured_name: ['被保険者氏名', '患者氏名'],
  birth_date: ['生年月日'],
  hospital_name: ['医療機関名'],
  hospitalization_period: ['入院期間', '入院日'],
  discharge_date: ['退院日'],
  contact_phone: ['連絡先電話番号', '電話番号'],
  illness_name: ['事故・傷病名', '傷病名']
}

export function resolveFieldRef(
  documents: VerificationDocument[],
  docType: string,
  fieldLabel: string,
  fileId?: string | null
): RuleFieldRef | null {
  const doc = fileId
    ? documents.find((d) => d.id === fileId) ?? null
    : documents.find((d) => d.docType === docType) ?? null
  if (!doc) return null
  const field = doc.fields.find((f) => f.label === fieldLabel)
  return {
    fileId: doc.id,
    fieldId: field?.id ?? null,
    docType: doc.docType,
    fieldLabel: field?.label ?? fieldLabel,
    fileName: doc.fileName,
    displayName: doc.displayName
  }
}

function expandSourcesByDocumentInstances<
  T extends {
    docType: string
    fieldLabel: string
    fileId?: string
    fieldId?: string | null
  }
>(
  documents: VerificationDocument[],
  sources: T[],
  patch: (source: T, doc: VerificationDocument, fieldId: string | null) => T
): T[] {
  const expanded: T[] = []
  for (const source of sources) {
    if (source.fileId) {
      const doc = documents.find((d) => d.id === source.fileId)
      if (!doc) {
        expanded.push(source)
        continue
      }
      const field = doc.fields.find((f) => f.label === source.fieldLabel)
      expanded.push(patch(source, doc, field?.id ?? source.fieldId ?? null))
      continue
    }
    const sameTypeDocs = documents.filter((d) => d.docType === source.docType)
    if (sameTypeDocs.length === 0) {
      expanded.push(source)
      continue
    }
    for (const doc of sameTypeDocs) {
      const field = doc.fields.find((f) => f.label === source.fieldLabel)
      expanded.push(patch(source, doc, field?.id ?? null))
    }
  }
  return expanded
}

export function enrichVerificationFields(
  documents: VerificationDocument[],
  fields: RuleVerificationField[]
): RuleVerificationField[] {
  return expandSourcesByDocumentInstances(documents, fields, (field, doc, fieldId) => {
    const ocrField = doc.fields.find((f) => f.label === field.fieldLabel)
    return {
      ...field,
      fileId: doc.id,
      fieldId,
      appliedOcrValue: ocrField?.value ?? field.appliedOcrValue
    }
  })
}

export function enrichMappingSourceValues(
  documents: VerificationDocument[],
  sources: MappingSourceValue[]
): MappingSourceValue[] {
  return expandSourcesByDocumentInstances(documents, sources, (source, doc, fieldId) => {
    const ocrField = doc.fields.find((f) => f.label === source.fieldLabel)
    return {
      ...source,
      fileId: doc.id,
      fieldId,
      value: ocrField?.value ?? source.value
    }
  })
}

export function enrichStandardFieldSources(
  documents: VerificationDocument[],
  sources: StandardFieldSource[]
): StandardFieldSource[] {
  return expandSourcesByDocumentInstances(documents, sources, (source, doc, fieldId) => {
    const ocrField = doc.fields.find((f) => f.label === source.fieldLabel)
    return {
      ...source,
      fileId: doc.id,
      fieldId,
      value: ocrField?.value ?? source.value
    }
  })
}

export function findStandardFieldByKey(
  fields: VerificationStandardField[],
  standardField: string
): VerificationStandardField | null {
  return fields.find((field) => field.standardField === standardField) ?? null
}

export function getCompletenessFieldRefs(
  item: CompletenessFieldRequirement,
  documents: VerificationDocument[]
): RuleFieldRef[] {
  const labels = STANDARD_FIELD_LABELS[item.standardField] ?? [item.displayLabel]
  const docTypes =
    item.status === 'missing' && item.missingDocTypes.length > 0
      ? item.missingDocTypes
      : item.targetDocTypes

  const refs: RuleFieldRef[] = []
  for (const docType of docTypes) {
    const doc = documents.find((d) => d.docType === docType)
    if (!doc) continue
    const field = doc.fields.find((f) => labels.includes(f.label))
    refs.push({
      fileId: doc.id,
      fieldId: field?.id ?? null,
      docType,
      fieldLabel: field?.label ?? item.displayLabel,
      fileName: doc.fileName,
      displayName: doc.displayName
    })
  }
  return refs
}

export function getCompletenessDocRefs(
  item: CompletenessRequirement,
  documents: VerificationDocument[]
): RuleFieldRef[] {
  const refs: RuleFieldRef[] = []
  if (item.fileNames.length) {
    for (const fileName of item.fileNames) {
      const doc = documents.find((d) => d.fileName === fileName)
      if (!doc) continue
      refs.push({
        fileId: doc.id,
        fieldId: null,
        docType: doc.docType,
        fieldLabel: doc.docType,
        fileName: doc.fileName,
        displayName: doc.displayName
      })
    }
    return refs
  }
  const doc = documents.find((d) => d.docType === item.docType)
  if (doc) {
    return [
      {
        fileId: doc.id,
        fieldId: null,
        docType: doc.docType,
        fieldLabel: doc.docType,
        fileName: doc.fileName,
        displayName: doc.displayName
      }
    ]
  }
  return []
}

export function getRuleFieldRefs(
  rule: VerificationRule,
  documents: VerificationDocument[]
): RuleFieldRef[] {
  if (rule.category === 'mapping' && rule.mappingSourceValues?.length) {
    return rule.mappingSourceValues
      .map((source) => {
        if (source.fileId) {
          const doc = documents.find((d) => d.id === source.fileId)
          return {
            fileId: source.fileId,
            fieldId: source.fieldId ?? null,
            docType: source.docType,
            fieldLabel: source.fieldLabel,
            fileName: doc?.fileName ?? source.docType,
            displayName: doc?.displayName
          }
        }
        return resolveFieldRef(documents, source.docType, source.fieldLabel)
      })
      .filter((ref): ref is RuleFieldRef => ref !== null)
  }

  if (rule.verificationFields?.length) {
    return rule.verificationFields
      .map((field) => {
        if (field.fileId) {
          const doc = documents.find((d) => d.id === field.fileId)
          return {
            fileId: field.fileId,
            fieldId: field.fieldId ?? null,
            docType: field.docType,
            fieldLabel: field.fieldLabel,
            fileName: doc?.fileName ?? field.docType,
            displayName: doc?.displayName
          }
        }
        return resolveFieldRef(documents, field.docType, field.fieldLabel)
      })
      .filter((ref): ref is RuleFieldRef => ref !== null)
  }

  if (rule.category === 'seal' && rule.compareTargets?.length) {
    const refs = rule.compareTargets
      .filter((target) => target.type === 'doc_field' && target.docType && target.fieldLabel)
      .map((target) => {
        if (target.fileId) {
          const doc = documents.find((d) => d.id === target.fileId)
          return {
            fileId: target.fileId,
            fieldId: target.fieldId ?? null,
            docType: target.docType!,
            fieldLabel: target.fieldLabel!,
            fileName: doc?.fileName ?? target.docType!,
            displayName: doc?.displayName
          }
        }
        return resolveFieldRef(documents, target.docType!, target.fieldLabel!)
      })
      .filter((ref): ref is RuleFieldRef => ref !== null)

    if (refs.length) return refs
  }

  if (rule.targetFileId) {
    const doc = documents.find((d) => d.id === rule.targetFileId)
    if (!doc) return []
    return [
      {
        fileId: rule.targetFileId,
        fieldId: rule.targetFieldId,
        docType: rule.targetDocType,
        fieldLabel: rule.targetFieldLabel ?? rule.targetDocType,
        fileName: doc.fileName,
        displayName: doc.displayName
      }
    ]
  }

  return []
}

export function countVerdicts(
  completeness: CompletenessRequirement[],
  completenessFields: CompletenessFieldRequirement[],
  rules: VerificationRule[]
) {
  const all = [
    ...completeness.map((c) => c.aiVerdict),
    ...completenessFields.map((c) => c.aiVerdict),
    ...rules.map((r) => r.aiVerdict)
  ]
  return all.reduce(
    (acc, verdict) => {
      acc[verdict] += 1
      return acc
    },
    { PASS: 0, REVIEW: 0 }
  )
}

function isMissingCompletenessGroupPending(
  items: Array<{ status: string; aiVerdict: VerificationVerdict; humanVerdict: HumanVerdict }>
): boolean {
  const reviewItems = items.filter((item) => item.status === 'missing' && needsHumanReview(item))
  if (!reviewItems.length) return false
  return !reviewItems.every((item) => isHumanConfirmed(item.humanVerdict))
}

export function countPendingReview(
  completeness: CompletenessRequirement[],
  completenessFields: CompletenessFieldRequirement[],
  rules: VerificationRule[]
): number {
  let pending = 0
  if (isMissingCompletenessGroupPending(completeness)) pending += 1
  if (isMissingCompletenessGroupPending(completenessFields)) pending += 1
  pending += rules.filter(
    (r) => needsHumanReview(r) && !isHumanConfirmed(r.humanVerdict)
  ).length
  return pending
}

export function isHumanConfirmed(humanVerdict: HumanVerdict): boolean {
  return humanVerdict === 'OK'
}

export function toggleHumanConfirm(humanVerdict: HumanVerdict): HumanVerdict {
  return isHumanConfirmed(humanVerdict) ? null : 'OK'
}

export function canCompleteVerification(
  completeness: CompletenessRequirement[],
  completenessFields: CompletenessFieldRequirement[],
  rules: VerificationRule[]
): boolean {
  const completenessOk = completeness
    .filter(needsHumanReview)
    .every((c) => isHumanConfirmed(c.humanVerdict))
  const fieldCompletenessOk = completenessFields
    .filter(needsHumanReview)
    .every((c) => isHumanConfirmed(c.humanVerdict))
  const rulesOk = rules.filter(needsHumanReview).every((r) => isHumanConfirmed(r.humanVerdict))
  return completenessOk && fieldCompletenessOk && rulesOk
}

export function completeBlockReason(
  completeness: CompletenessRequirement[],
  completenessFields: CompletenessFieldRequirement[],
  rules: VerificationRule[]
): string {
  const pending = countPendingReview(completeness, completenessFields, rules)
  if (pending > 0) {
    return t('tasks.verification.messages.blockPending', { count: pending })
  }
  return ''
}

export function getRulesByCategory(rules: VerificationRule[]) {
  return CATEGORY_ORDER.filter((c) => c !== 'completeness').map((category) => ({
    category,
    label: categoryLabel(category),
    rules: rules.filter((r) => r.category === category)
  }))
}

export function getRulesForDocument(rules: VerificationRule[], docId: string): VerificationRule[] {
  return rules.filter((r) => r.targetFileId === docId)
}

export function verdictLabel(verdict: VerificationVerdict): string {
  return verdict === 'PASS'
    ? t('tasks.verification.verdict.pass')
    : t('tasks.verification.verdict.review')
}

export function verdictTagType(
  verdict: VerificationVerdict
): 'success' | 'warning' {
  return verdict === 'PASS' ? 'success' : 'warning'
}

export function getCaseRoutingDecision(
  completeness: CompletenessRequirement[],
  rules: VerificationRule[]
): CaseRoutingDecision {
  const supplementItems = [
    ...completeness.filter((c) => c.supplementRequired),
    ...rules.filter((r) => r.supplementRequired)
  ]

  const hasSupplementNg = supplementItems.some((item) => item.humanVerdict === 'NG')
  if (hasSupplementNg) return 'SUPPLEMENT'

  const hasOpenSupplement = supplementItems.some(
    (item) => needsHumanReview(item) && item.humanVerdict !== 'OK'
  )
  if (hasOpenSupplement) return 'SUPPLEMENT'

  return 'EXPORTABLE'
}

export function getConfirmedValue(rule: VerificationRule): string | null {
  if (rule.humanVerdict !== 'OK') return null
  if (rule.masterValue) return rule.masterValue
  return rule.extractedValue
}

export function applyMasterSelection(
  rule: VerificationRule,
  selection: string
): void {
  const displayCandidates = getDisplayMasterCandidates(rule.masterCandidates ?? [])
  const candidate = displayCandidates.find((item) => item.id === selection)
  if (candidate) {
    rule.selectedMasterId = candidate.id
    rule.masterValue = candidate.displayText
    rule.relatedCodes = []
    return
  }

  rule.selectedMasterId = null
  rule.masterValue = selection
  rule.relatedCodes = []
}

export function routingDecisionHint(decision: CaseRoutingDecision): string {
  if (decision === 'SUPPLEMENT') {
    return t('tasks.verification.routing.supplement')
  }
  return t('tasks.verification.routing.exportable')
}

export function displayStatusLabel(
  aiVerdict: VerificationVerdict,
  humanVerdict: HumanVerdict
): string {
  if (aiVerdict === 'REVIEW' && humanVerdict) return t('tasks.verification.verdict.confirmed')
  return verdictLabel(aiVerdict)
}

export function displayStatusTagType(
  aiVerdict: VerificationVerdict,
  humanVerdict: HumanVerdict
): 'success' | 'warning' {
  if (aiVerdict === 'REVIEW' && humanVerdict) return 'success'
  return verdictTagType(aiVerdict)
}

export function humanVerdictLabel(verdict: HumanVerdict): string | null {
  if (verdict === 'OK' || verdict === 'NG') return t('tasks.verification.verdict.confirmed')
  return null
}

export function completenessStatusLabel(item: CompletenessRequirement): string {
  if (item.status === 'present') {
    return t('tasks.verification.completenessStatus.present', { count: item.presentCount })
  }
  return '—'
}

export function completenessFieldStatusLabel(item: CompletenessFieldRequirement): string {
  if (item.status === 'present') return t('tasks.verification.completenessStatus.extracted')
  if (item.missingDocTypes.length) {
    return t('tasks.verification.completenessStatus.missing', {
      docs: item.missingDocTypes.join('、')
    })
  }
  return t('tasks.verification.completenessStatus.missingShort')
}
