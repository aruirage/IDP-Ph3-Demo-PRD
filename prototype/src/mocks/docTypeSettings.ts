import { ref } from 'vue'
import { t } from '@/i18n/translate'
import { MOCK_SAMPLE_MEDIA_URL } from '@/constants/mockSampleMedia'
import { getOcrExtractionModelIds } from '@/mocks/modelSettings'
import type { OcrManualReviewRuleKey } from '@/mocks/ocrExtractionTask'

export type DocTypeWizardStep = 'classify' | 'ocr' | 'rule' | 'image' | 'test'

export function docTypeWizardSteps(): { key: DocTypeWizardStep; label: string }[] {
  return [
    { key: 'classify', label: t('businessRules.docType.step.classify') },
    { key: 'ocr', label: t('businessRules.docType.step.ocr') },
    { key: 'rule', label: t('businessRules.docType.step.rule') },
    { key: 'image', label: t('businessRules.docType.step.image') },
    { key: 'test', label: t('businessRules.docType.step.test') }
  ]
}

/** @deprecated 互換用。新規は computed(() => docTypeWizardSteps()) を使用 */
export const DOC_TYPE_WIZARD_STEPS = docTypeWizardSteps()

export interface DocTypeOcrField {
  id: string
  itemName: string
  prompt: string
  correctSample: string
  required: boolean
}

export interface DocTypeOcrTableColumn {
  id: string
  columnKey: string
  prompt: string
  correctSample: string
  required: boolean
}

export interface DocTypeOcrTable {
  id: string
  name: string
  extractionCondition: string
  collapsed: boolean
  columns: DocTypeOcrTableColumn[]
}

export interface DocTypeOcrReadConfig {
  multipleQrEnabled?:boolean
  globalPrompt: string
  textFields: DocTypeOcrField[]
  tables: DocTypeOcrTable[]
}

export interface DocTypeReadModelConfig {
  masterReviewEnabled?:boolean
  autoAdoptThreshold?:number
  mainModelId: string | null
  verificationModelId: string | null
  manualReviewRules: OcrManualReviewRuleKey[]
}

export type ProcessRuleType =
  | 'qrcode'
  | 'master_match'
  | 'date'
  | 'western_year'
  | 'western_month'
  | 'western_day'
  | 'amount_jpy'
  | 'amount_usd'
  | 'zip_code'
  | 'remove_spaces'
  | ''

export type MasterMatchStrategy = 'hybrid' | 'code'

export const DEFAULT_MASTER_MATCH_STRATEGIES: MasterMatchStrategy[] = ['hybrid', 'code']

export type MasterMatchConfirmRule = 'low-similarity' | 'empty-result' | 'low-confidence'

export interface MasterMatchCascaderOption {
  value: string
  label: string
  children?: MasterMatchCascaderOption[]
}

export interface DocTypeProcessRuleFields {
  ruleType: ProcessRuleType
  confidence: number
  qrMode?:'full'|'split'
  qrDelimiter?:string
  qrIndex?:number
  masterMatchRef?: string[]
  matchStrategies?: MasterMatchStrategy[]
  manualConfirmRules?: MasterMatchConfirmRule[]
  /** 照合グループ番号（例：1、2） */
  matchGroup?: string
}

export interface DocTypeTextFieldRule extends DocTypeProcessRuleFields {
  fieldId: string
}

export interface DocTypeTableColumnRule extends DocTypeProcessRuleFields {
  tableId: string
  columnId: string
}

export interface DocTypeProcessRules {
  textFields: DocTypeTextFieldRule[]
  tableColumns: DocTypeTableColumnRule[]
}

export type ImageSortOrder = 'asc' | 'desc'

export type ImageSortFieldType = 'date' | 'number'

export type MultiPageOcrMode = 'split' | 'merge'

export interface DocTypeImageProcessConfig {
  imageSplitEnabled: boolean
  imageCombineEnabled: boolean
  /** 画像組合：値がすべて一致必須の OCR テキスト項目 ID */
  splitCombineRequiredFieldIds: string[]
  /** 画像組合：いずれか 1 項目一致でよい OCR テキスト項目 ID */
  splitCombineOptionalFieldIds: string[]
  imageSortEnabled: boolean
  sortFieldId: string
  sortFieldType: ImageSortFieldType
  sortOrder: ImageSortOrder
  multiPageOcrMode: MultiPageOcrMode
  splitConfidenceThreshold: number
  sortConfidenceThreshold: number
}

export interface DocTypeDefinition {
  id: string
  name: string
  description: string
  /** 案件集約・同类型内分割（S4）用自然语言规则 */
  fileSplitRule: string
  sampleImageUrl: string
  ocrRead: DocTypeOcrReadConfig
  readModel: DocTypeReadModelConfig
  processRules: DocTypeProcessRules
  imageProcess: DocTypeImageProcessConfig
}

const DEFAULT_SAMPLE = MOCK_SAMPLE_MEDIA_URL

export const DESCRIPTION_MAX_LENGTH = 200
export const FILE_SPLIT_RULE_MAX_LENGTH = 500
export function fileSplitRulePlaceholder() {
  return t('businessRules.docType.classify.fileSplitPlaceholder')
}
export function fileSplitRuleHint() {
  return t('businessRules.docType.classify.fileSplitHint')
}
/** @deprecated use fileSplitRulePlaceholder() */
export const FILE_SPLIT_RULE_PLACEHOLDER = fileSplitRulePlaceholder()
/** @deprecated use fileSplitRuleHint() */
export const FILE_SPLIT_RULE_HINT = fileSplitRuleHint()
export const OCR_GLOBAL_PROMPT_MAX_LENGTH = 2000
export const OCR_FIELD_MAX_COUNT = 200
export const OCR_TABLE_MAX_COUNT = 15
export const OCR_TABLE_COLUMN_MAX_COUNT = 10
export const DEFAULT_PROCESS_CONFIDENCE = 95
export const DEFAULT_IMAGE_CONFIDENCE_THRESHOLD = 80

export function imageSortOrderOptions(): { value: ImageSortOrder; label: string }[] {
  return [
    { value: 'asc', label: t('businessRules.docType.options.sortAsc') },
    { value: 'desc', label: t('businessRules.docType.options.sortDesc') }
  ]
}

export function imageSortFieldTypeOptions(): { value: ImageSortFieldType; label: string }[] {
  return [
    { value: 'date', label: t('businessRules.docType.options.fieldTypeDate') },
    { value: 'number', label: t('businessRules.docType.options.fieldTypeNumber') }
  ]
}

export function multiPageOcrModeOptions(): { value: MultiPageOcrMode; label: string }[] {
  return [
    { value: 'split', label: t('businessRules.docType.options.ocrPerImage') },
    { value: 'merge', label: t('businessRules.docType.options.ocrMergeImages') }
  ]
}

export function processRuleOptions(): { value: ProcessRuleType; label: string }[] {
  return [
    { value:'qrcode',label:'QR code' },
    { value: 'master_match', label: t('businessRules.docType.options.processMasterMatch') },
    { value: 'date', label: t('businessRules.docType.options.processDate') },
    { value: 'western_year', label: t('businessRules.docType.options.processWesternYear') },
    { value: 'western_month', label: t('businessRules.docType.options.processWesternMonth') },
    { value: 'western_day', label: t('businessRules.docType.options.processWesternDay') },
    { value: 'amount_jpy', label: t('businessRules.docType.options.processAmountJpy') },
    { value: 'amount_usd', label: t('businessRules.docType.options.processAmountUsd') },
    { value: 'zip_code', label: t('businessRules.docType.options.processZipCode') },
    { value: 'remove_spaces', label: t('businessRules.docType.options.processRemoveSpaces') }
  ]
}

/** @deprecated use imageSortOrderOptions() */
export const IMAGE_SORT_ORDER_OPTIONS = imageSortOrderOptions()
/** @deprecated use imageSortFieldTypeOptions() */
export const IMAGE_SORT_FIELD_TYPE_OPTIONS = imageSortFieldTypeOptions()
/** @deprecated use multiPageOcrModeOptions() */
export const MULTI_PAGE_OCR_MODE_OPTIONS = multiPageOcrModeOptions()
/** @deprecated use processRuleOptions() */
export const PROCESS_RULE_OPTIONS = processRuleOptions()

export const MASTER_MATCH_CASCADER_OPTIONS: MasterMatchCascaderOption[] = [
  { value: 'dict-add-1', label: '辞書追加1' },
  { value: 'dict-add', label: '辞書追加' },
  {
    value: 'clinic-name-address',
    label: '診療所名・住所',
    children: [
      { value: 'clinic-id', label: '診療所ID' },
      { value: 'clinic-name', label: '診療所名' },
      { value: 'clinic-short', label: '診療所略称' },
      { value: 'clinic-location', label: '診療所所在地' }
    ]
  },
  {
    value: 'hospital-name-address',
    label: '病院名・住所',
    children: [
      { value: 'hospital-id', label: '病院ID' },
      { value: 'hospital-name', label: '病院名' },
      { value: 'hospital-address', label: '病院所在地' }
    ]
  },
  {
    value: 'surgery-k-code',
    label: '手術名・Kコード',
    children: [
      { value: 'surgery-name', label: '手術名' },
      { value: 'k-code', label: 'Kコード' }
    ]
  },
  {
    value: 'bank-branch-code',
    label: '銀行名・支店名・コード',
    children: [
      { value: 'bank-name', label: '銀行名' },
      { value: 'branch-name', label: '支店名' },
      { value: 'bank-code', label: '銀行コード' }
    ]
  },
  {
    value: 'disease-icd10',
    label: '傷病名・ICD10',
    children: [
      { value: 'disease-name', label: '傷病名' },
      { value: 'icd10', label: 'ICD10' }
    ]
  },
  {
    value: 'medicine-code',
    label: '薬剤名・コード',
    children: [
      { value: 'medicine-name', label: '薬剤名' },
      { value: 'medicine-code', label: '薬剤コード' }
    ]
  }
]

export function masterMatchStrategyOptions(): {
  value: MasterMatchStrategy
  label: string
}[] {
  return [
    { value: 'hybrid', label: t('businessRules.docType.options.strategyHybrid') },
    { value: 'code', label: t('businessRules.docType.options.strategyCode') }
  ]
}

export function getMasterMatchStrategyLabels(): string[] {
  return masterMatchStrategyOptions().map((option) => option.label)
}

export function masterMatchConfirmRuleOptions(): {
  value: MasterMatchConfirmRule
  label: string
}[] {
  return [
    { value: 'low-similarity', label: t('businessRules.docType.options.confirmLowSimilarity') },
    { value: 'empty-result', label: t('businessRules.docType.options.confirmEmptyResult') },
    { value: 'low-confidence', label: t('businessRules.docType.options.confirmLowConfidence') }
  ]
}

/** @deprecated use masterMatchStrategyOptions() */
export const MASTER_MATCH_STRATEGY_OPTIONS = masterMatchStrategyOptions()
/** @deprecated use masterMatchConfirmRuleOptions() */
export const MASTER_MATCH_CONFIRM_RULE_OPTIONS = masterMatchConfirmRuleOptions()

export function isMasterMatchRule(ruleType: ProcessRuleType): boolean {
  return ruleType === 'master_match'
}

export function syncMasterMatchRuleFields(rule: DocTypeProcessRuleFields) {
  if (isMasterMatchRule(rule.ruleType)) {
    if (!rule.masterMatchRef) rule.masterMatchRef = []
    rule.matchStrategies = [...DEFAULT_MASTER_MATCH_STRATEGIES]
    if (rule.matchGroup === undefined) rule.matchGroup = ''
    return
  }
  rule.masterMatchRef = undefined
  rule.matchStrategies = undefined
  rule.manualConfirmRules = undefined
  rule.matchGroup = undefined
}

const APPLICATION_TEXT_FIELDS: DocTypeOcrField[] = [
  { id: 'ocr-1', itemName: '申込年月日', prompt: '帳票右上の申込日を抽出', correctSample: '2025年4月1日', required: true },
  { id: 'ocr-2', itemName: '保護者 住所', prompt: '保護者欄の住所を全文抽出', correctSample: '東京都千代田区丸の内1-1-1', required: false },
  { id: 'ocr-3', itemName: '保護者 氏名', prompt: '保護者欄の氏名を抽出', correctSample: '山田 太郎', required: true },
  { id: 'ocr-4', itemName: '被保険者 氏名', prompt: '被保険者欄の氏名を抽出', correctSample: '山田 花子', required: true },
  { id: 'ocr-5', itemName: '被保険者 生年月日', prompt: '被保険者の生年月日を抽出', correctSample: '2015年8月20日', required: true },
  { id: 'ocr-6', itemName: '契約者 氏名', prompt: '契約者欄の氏名を抽出', correctSample: '山田 太郎', required: false },
  { id: 'ocr-7', itemName: '契約者 住所', prompt: '契約者欄の住所を抽出', correctSample: '東京都千代田区丸の内1-1-1', required: false },
  { id: 'ocr-8', itemName: '電話番号', prompt: '連絡先電話番号を抽出', correctSample: '03-1234-5678', required: false },
  { id: 'ocr-9', itemName: 'メールアドレス', prompt: 'メールアドレス欄を抽出', correctSample: 'taro.yamada@example.co.jp', required: false },
  { id: 'ocr-10', itemName: '保険種類', prompt: '選択された保険種類を抽出', correctSample: '終身保険', required: true },
  { id: 'ocr-11', itemName: '保険金額', prompt: '保険金額欄の数値を抽出', correctSample: '300万円', required: true },
  { id: 'ocr-12', itemName: '払込方法', prompt: '払込方法の選択肢を抽出', correctSample: '月払', required: false },
  { id: 'ocr-13', itemName: '申込人 署名', prompt: '申込人署名欄の有無を判定', correctSample: '署名あり', required: true },
  { id: 'ocr-14', itemName: '告知事項 有無', prompt: '告知事項の回答有無を抽出', correctSample: 'なし', required: false },
  { id: 'ocr-15', itemName: '代理店コード', prompt: '代理店コード欄を抽出', correctSample: 'AG-1024', required: false },
  { id: 'ocr-16', itemName: '募集人 氏名', prompt: '募集人氏名欄を抽出', correctSample: '佐藤 一郎', required: false },
  { id: 'ocr-17', itemName: '申込書 番号', prompt: '申込書番号を抽出', correctSample: 'APP-2025-000128', required: false },
  { id: 'ocr-18', itemName: '備考', prompt: '備考欄の自由記述を抽出', correctSample: '—', required: false }
]

const APPLICATION_TABLES: DocTypeOcrTable[] = [
  {
    id: 'table-1',
    name: 'テーブル1',
    extractionCondition: '',
    collapsed: false,
    columns: [
      {
        id: 'col-1',
        columnKey: '111',
        prompt: '',
        correctSample: '',
        required: false
      },
      {
        id: 'col-2',
        columnKey: '222',
        prompt: '',
        correctSample: '',
        required: false
      }
    ]
  },
  {
    id: 'table-2',
    name: 'テーブル2',
    extractionCondition: '',
    collapsed: false,
    columns: [
      {
        id: 'col-3',
        columnKey: '111',
        prompt: '',
        correctSample: '',
        required: false
      }
    ]
  }
]

function inferProcessRuleFromLabel(label: string): ProcessRuleType {
  const text = label.trim()
  if (!text) return ''
  if (/生年月日|年月日|申込日|発行日|診断日|日付/.test(text)) return 'date'
  if (/金額|保険金|請求|領収|円/.test(text)) return 'amount_jpy'
  if (/郵便/.test(text)) return 'zip_code'
  if (/住所|氏名|電話|メール/.test(text)) return 'remove_spaces'
  return ''
}

function createTextFieldRule(
  fieldId: string,
  itemName: string,
  ruleType?: ProcessRuleType
): DocTypeTextFieldRule {
  return {
    fieldId,
    ruleType: ruleType ?? inferProcessRuleFromLabel(itemName),
    confidence: DEFAULT_PROCESS_CONFIDENCE
  }
}

function createDefaultProcessRules(ocrRead: DocTypeOcrReadConfig): DocTypeProcessRules {
  return {
    textFields: ocrRead.textFields.map((field) => createTextFieldRule(field.id, field.itemName)),
    tableColumns: ocrRead.tables.flatMap((table) =>
      table.columns.map((column) => ({
        tableId: table.id,
        columnId: column.id,
        ruleType: inferProcessRuleFromLabel(column.columnKey),
        confidence: DEFAULT_PROCESS_CONFIDENCE
      }))
    )
  }
}

export function syncProcessRules(
  ocrRead: DocTypeOcrReadConfig,
  processRules: DocTypeProcessRules
): DocTypeProcessRules {
  const textFields = ocrRead.textFields.map((field) => {
    const existing = processRules.textFields.find((rule) => rule.fieldId === field.id)
    return (
      existing ?? {
        fieldId: field.id,
        ruleType: inferProcessRuleFromLabel(field.itemName),
        confidence: DEFAULT_PROCESS_CONFIDENCE
      }
    )
  })

  const tableColumns = ocrRead.tables.flatMap((table) =>
    table.columns.map((column) => {
      const existing = processRules.tableColumns.find(
        (rule) => rule.tableId === table.id && rule.columnId === column.id
      )
      return (
        existing ?? {
          tableId: table.id,
          columnId: column.id,
          ruleType: inferProcessRuleFromLabel(column.columnKey),
          confidence: DEFAULT_PROCESS_CONFIDENCE
        }
      )
    })
  )

  return { textFields, tableColumns }
}

export function inferProcessRuleForLabel(label: string): ProcessRuleType {
  return inferProcessRuleFromLabel(label)
}

function createDefaultImageProcessConfig(
  docTypeName: string,
  ocrRead: DocTypeOcrReadConfig
): DocTypeImageProcessConfig {
  const receiptLike = docTypeName.includes('領収書') || docTypeName.includes('診療明細')
  const requiredField =
    ocrRead.textFields.find((field) => /発行日/.test(field.itemName)) ??
    ocrRead.textFields.find((field) => /診療日/.test(field.itemName))
  const optionalFields = ocrRead.textFields.filter(
    (field) =>
      field.id !== requiredField?.id &&
      /診療機関|病院名|患者番号|患者氏名/.test(field.itemName)
  )

  return {
    imageSplitEnabled: receiptLike,
    imageCombineEnabled: receiptLike,
    splitCombineRequiredFieldIds: receiptLike && requiredField ? [requiredField.id] : [],
    splitCombineOptionalFieldIds: receiptLike ? optionalFields.map((field) => field.id) : [],
    imageSortEnabled: receiptLike,
    sortFieldId: requiredField?.id ?? '',
    sortFieldType: 'date',
    sortOrder: 'asc',
    multiPageOcrMode: receiptLike ? 'split' : 'merge',
    splitConfidenceThreshold: DEFAULT_IMAGE_CONFIDENCE_THRESHOLD,
    sortConfidenceThreshold: DEFAULT_IMAGE_CONFIDENCE_THRESHOLD
  }
}

export function createDefaultReadModelConfig(): DocTypeReadModelConfig {
  const ocrModelIds = getOcrExtractionModelIds()
  return {
    mainModelId: ocrModelIds[0] ?? null,
    verificationModelId: null,
    masterReviewEnabled:true,autoAdoptThreshold:90,
    manualReviewRules: ['low-confidence', 'model-conflict']
  }
}

/** 读取模型设置：人工确认规则（五项，Master 照合统一展示） */
export function getReadModelManualReviewRuleLabels(): string[] {
  return [
    t('tasks.ocr.alerts.lowConfidence'),
    t('tasks.ocr.alerts.modelConflict'),
    t('phase3.masterReview'),
    t('phase3.rangeReview'),
    t('phase3.lowRangeReview')
  ]
}

function createDocTypeSeed(name: string) {
  const ocrRead = createDefaultOcrReadConfig(name)
  return {
    ocrRead,
    readModel: createDefaultReadModelConfig(),
    processRules: createDefaultProcessRules(ocrRead),
    imageProcess: createDefaultImageProcessConfig(name, ocrRead)
  }
}

const OCR_TEXT_FIELDS_BY_DOC_TYPE: Record<
  string,
  Array<Pick<DocTypeOcrField, 'itemName' | 'prompt' | 'correctSample' | 'required'>>
> = {
  保険金請求書: [
    { itemName: '被保険者氏名', prompt: '被保険者氏名を抽出', correctSample: '山田 花子', required: true },
    { itemName: '請求日', prompt: '請求日を抽出', correctSample: '2025年10月1日', required: true },
    { itemName: '契約者氏名', prompt: '契約者氏名を抽出', correctSample: '山田 太郎', required: false }
  ],
  診断書: [
    { itemName: '被保険者氏名', prompt: '被保険者氏名を抽出', correctSample: '山田 花子', required: true },
    { itemName: '診断名', prompt: '診断名を抽出', correctSample: '急性虫垂炎', required: true },
    { itemName: '医師署名', prompt: '医師署名欄を抽出', correctSample: '署名あり', required: false }
  ],
  '領収書・診療明細書': [
    { itemName: '患者氏名', prompt: '患者氏名を抽出', correctSample: '山田 花子', required: true },
    { itemName: '患者番号', prompt: '患者番号を抽出', correctSample: 'P-102938', required: false },
    { itemName: '診療日', prompt: '診療日を抽出', correctSample: '2025年10月5日', required: true },
    { itemName: '診療機関', prompt: '診療機関名を抽出', correctSample: '〇〇クリニック', required: false },
    { itemName: '発行日', prompt: '領収書の発行日を抽出', correctSample: '2025年10月5日', required: false }
  ],
  本人確認書類: [
    { itemName: '氏名', prompt: '本人氏名を抽出', correctSample: '山田 太郎', required: true },
    { itemName: '住所', prompt: '住所を抽出', correctSample: '東京都千代田区', required: true }
  ],
  保全変更届: [
    { itemName: '契約者氏名', prompt: '契約者氏名を抽出', correctSample: '山田 太郎', required: true },
    { itemName: '変更内容', prompt: '変更内容を抽出', correctSample: '受取人変更', required: true }
  ]
}

function createDefaultOcrReadConfig(docTypeName: string): DocTypeOcrReadConfig {
  const presetFields = OCR_TEXT_FIELDS_BY_DOC_TYPE[docTypeName]
  if (presetFields) {
    return {
      globalPrompt: '',
      textFields: presetFields.map((field, index) => ({
        id: `ocr-${docTypeName}-${index}`,
        itemName: field.itemName,
        prompt: field.prompt,
        correctSample: field.correctSample ?? '',
        required: field.required ?? false
      })),
      tables: []
    }
  }

  if (docTypeName === '申込書') {
    return {
      globalPrompt:
        '本帳票は保険加入申込書です。日付は和暦または西暦表記のまま抽出し、住所は都道府県から記載してください。',
      textFields: APPLICATION_TEXT_FIELDS.map((field) => ({ ...field })),
      tables: APPLICATION_TABLES.map((table) => ({
        ...table,
        columns: table.columns.map((column) => ({ ...column }))
      }))
    }
  }

  return {
    globalPrompt: '',
    textFields: [],
    tables: []
  }
}

export function createOcrFieldId(): string {
  return `ocr-${Date.now().toString(36)}`
}

export function createOcrTableId(): string {
  return `table-${Date.now().toString(36)}`
}

export function createOcrTableColumnId(): string {
  return `col-${Date.now().toString(36)}`
}

export function createEmptyOcrTable(index: number): DocTypeOcrTable {
  return {
    id: createOcrTableId(),
    name: `テーブル${index}`,
    extractionCondition: '',
    collapsed: false,
    columns: [
      {
        id: createOcrTableColumnId(),
        columnKey: '',
        prompt: '',
        correctSample: '',
        required: false
      }
    ]
  }
}

export const docTypeDefinitions = ref<DocTypeDefinition[]>([
  {
    id: '1000000000000000001',
    name: '申込書',
    description: '保険加入申込に使用する帳票タイプです。',
    fileSplitRule: '',
    sampleImageUrl: DEFAULT_SAMPLE,
    ...createDocTypeSeed('申込書')
  },
  {
    id: '1000000000000000002',
    name: '保険金請求書',
    description: '',
    fileSplitRule: '',
    sampleImageUrl: DEFAULT_SAMPLE,
    ...createDocTypeSeed('保険金請求書')
  },
  {
    id: '1000000000000000003',
    name: '診断書',
    description: '',
    fileSplitRule: '',
    sampleImageUrl: DEFAULT_SAMPLE,
    ...createDocTypeSeed('診断書')
  },
  {
    id: '1000000000000000004',
    name: '領収書・診療明細書',
    description: '',
    fileSplitRule: '発注日が異なる箇所でそれぞれ別ファイルに分割する',
    sampleImageUrl: DEFAULT_SAMPLE,
    ...createDocTypeSeed('領収書・診療明細書')
  },
  {
    id: '1000000000000000005',
    name: '本人確認書類',
    description: '',
    fileSplitRule: '',
    sampleImageUrl: DEFAULT_SAMPLE,
    ...createDocTypeSeed('本人確認書類')
  }
])

const docSettingsStorage='neosai-phase3-document-settings'
try{const saved=JSON.parse(localStorage.getItem(docSettingsStorage)||'{}');for(const doc of docTypeDefinitions.value){const item=saved[doc.id];if(item){Object.assign(doc.readModel,item.readModel);doc.ocrRead.multipleQrEnabled=!!item.multipleQrEnabled}}}catch{}
export function savePhase3DocSettings(doc:DocTypeDefinition){let saved:Record<string,unknown>={};try{saved=JSON.parse(localStorage.getItem(docSettingsStorage)||'{}')}catch{}saved[doc.id]={readModel:doc.readModel,multipleQrEnabled:doc.ocrRead.multipleQrEnabled};localStorage.setItem(docSettingsStorage,JSON.stringify(saved))}

export function getConfiguredDocTypeNames(): string[] {
  return docTypeDefinitions.value
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b, 'ja'))
}

export function createDocTypeId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.padEnd(19, '0').slice(0, 19)
}

export function createDocTypeDefinition(name: string): DocTypeDefinition {
  return {
    id: createDocTypeId(),
    name,
    description: '',
    fileSplitRule: '',
    sampleImageUrl: DEFAULT_SAMPLE,
    ...createDocTypeSeed(name)
  }
}

export interface DocTypeChangeLog {
  id: string
  docTypeId: string
  action: string
  operator: string
  occurredAt: string
  detail: string
}

function createChangeLogId(): string {
  return `doc-log-${Date.now().toString(36)}`
}

function changeLogTimestamp(): string {
  return new Date().toLocaleString('ja-JP', { hour12: false })
}

export const docTypeChangeLogs = ref<DocTypeChangeLog[]>([
  {
    id: 'doc-log-001',
    docTypeId: '1000000000000000001',
    action: '設定更新',
    operator: '山田 太郎',
    occurredAt: '2025-09-18 14:32:00',
    detail: 'AI読取設定を更新'
  }
])

export function appendDocTypeChangeLog(
  docTypeId: string,
  action: string,
  detail: string,
  operator = '山田 太郎'
) {
  docTypeChangeLogs.value.unshift({
    id: createChangeLogId(),
    docTypeId,
    action,
    operator,
    occurredAt: changeLogTimestamp(),
    detail
  })
}

export function getDocTypeChangeLogs(docTypeId: string): DocTypeChangeLog[] {
  return docTypeChangeLogs.value.filter((item) => item.docTypeId === docTypeId)
}

function resolveCopyName(baseName: string, existingNames: string[]): string {
  const first = `${baseName}_コピー`
  if (!existingNames.includes(first)) return first
  let index = 2
  while (existingNames.includes(`${baseName}_コピー${index}`)) {
    index += 1
  }
  return `${baseName}_コピー${index}`
}

export function cloneDocTypeDefinition(
  source: DocTypeDefinition,
  existingNames: string[]
): DocTypeDefinition {
  const textFields = source.ocrRead.textFields.map((field) => ({
    ...field,
    id: createOcrFieldId()
  }))
  const fieldIdMap = new Map(
    source.ocrRead.textFields.map((field, index) => [field.id, textFields[index].id])
  )

  const tables = source.ocrRead.tables.map((table, tableIndex) => {
    const columns = table.columns.map((column) => ({
      ...column,
      id: createOcrTableColumnId()
    }))
    return {
      ...table,
      id: createOcrTableId(),
      name: table.name || `テーブル${tableIndex + 1}`,
      columns
    }
  })

  const tableColumnIdMap = new Map<string, string>()
  source.ocrRead.tables.forEach((table, tableIndex) => {
    table.columns.forEach((column, columnIndex) => {
      tableColumnIdMap.set(column.id, tables[tableIndex].columns[columnIndex].id)
    })
  })
  const tableIdMap = new Map(
    source.ocrRead.tables.map((table, index) => [table.id, tables[index].id])
  )

  return {
    id: createDocTypeId(),
    name: resolveCopyName(source.name, existingNames),
    description: source.description,
    fileSplitRule: source.fileSplitRule,
    sampleImageUrl: source.sampleImageUrl,
    ocrRead: {
      multipleQrEnabled:source.ocrRead.multipleQrEnabled,
      globalPrompt: source.ocrRead.globalPrompt,
      textFields,
      tables
    },
    readModel: {
      masterReviewEnabled:source.readModel.masterReviewEnabled,autoAdoptThreshold:source.readModel.autoAdoptThreshold,
      mainModelId: source.readModel.mainModelId,
      verificationModelId: source.readModel.verificationModelId,
      manualReviewRules: [...source.readModel.manualReviewRules]
    },
    processRules: {
      textFields: source.processRules.textFields.map((rule) => ({
        ...rule,
        fieldId: fieldIdMap.get(rule.fieldId) ?? createOcrFieldId(),
        masterMatchRef: rule.masterMatchRef ? [...rule.masterMatchRef] : undefined,
        matchStrategies: rule.matchStrategies ? [...rule.matchStrategies] : undefined,
        manualConfirmRules: rule.manualConfirmRules ? [...rule.manualConfirmRules] : undefined
      })),
      tableColumns: source.processRules.tableColumns.map((rule) => ({
        ...rule,
        tableId: tableIdMap.get(rule.tableId) ?? createOcrTableId(),
        columnId: tableColumnIdMap.get(rule.columnId) ?? createOcrTableColumnId(),
        masterMatchRef: rule.masterMatchRef ? [...rule.masterMatchRef] : undefined,
        matchStrategies: rule.matchStrategies ? [...rule.matchStrategies] : undefined,
        manualConfirmRules: rule.manualConfirmRules ? [...rule.manualConfirmRules] : undefined
      }))
    },
    imageProcess: {
      ...source.imageProcess,
      imageCombineEnabled: source.imageProcess.imageCombineEnabled ?? false,
      splitCombineRequiredFieldIds: source.imageProcess.splitCombineRequiredFieldIds
        .map((fieldId) => fieldIdMap.get(fieldId))
        .filter((fieldId): fieldId is string => Boolean(fieldId)),
      splitCombineOptionalFieldIds: source.imageProcess.splitCombineOptionalFieldIds
        .map((fieldId) => fieldIdMap.get(fieldId))
        .filter((fieldId): fieldId is string => Boolean(fieldId))
    }
  }
}

export function getOcrTextFieldNamesForDocType(docTypeName: string): string[] {
  const definition = docTypeDefinitions.value.find((item) => item.name === docTypeName)
  if (!definition) return []
  return definition.ocrRead.textFields.map((field) => field.itemName).filter(Boolean)
}
