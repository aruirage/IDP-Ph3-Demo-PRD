import { compareSimilarityCandidates } from './masterCandidateOrder'
import { autoAdoptScenarioFields, manualReviewScenarioFields } from './masterMatchScenarioFixtures'
import { customerIcdSample } from './customerIcdSample'
import { MOCK_SAMPLE_MEDIA_URL } from '@/constants/mockSampleMedia'
import { t } from '@/i18n/translate'
import { rawMockCaseList } from '@/mocks/cases'
import { planCaseLogicalFiles, resolveMockFileName } from '@/mocks/mockLogicalFilePlans'
import { getTaskById } from '@/mocks/tasks'
import type { MasterMatchConfirmRule } from '@/mocks/docTypeSettings'

export const OCR_CONFIDENCE_THRESHOLD = 85
/** Master 照合 · 混合检索返回相似度最高的候选项数量 */
export const MASTER_MATCH_SIMILARITY_TOP_N = 3

export type OcrMasterMatchSearchStrategy = 'ocr' | 'match' | 'code' | 'hybrid' | 'parent'

export interface OcrMasterMatchCandidate {
  sourceRecordId?: string
  hierarchyOfficial?:boolean
  hierarchyLevel?:number
  hierarchyPath?:string
  value: string
  strategy: OcrMasterMatchSearchStrategy
  /** 选中后写入各关联字段的值 */
  linkedValues?: Record<string, string>
  /** 混合检索相似度（0–100），用于排序取 Top N */
  similarityScore?: number
}

export type OcrFieldAlert =
  | 'none'
  | 'low-confidence'
  | 'model-conflict'
  | 'value-out-of-range'
  | 'required-empty'
  | 'master-low-similarity'
  | 'master-empty-result'
  | 'master-low-confidence'
  | 'master-execution-error'

export interface OcrFieldBbox {
  top: number
  left: number
  width: number
  height: number
}

export interface OcrExtractionField {
  id: string
  section: string
  label: string
  value: string
  /** OCR 抽出時の原始値（元に戻す用）；未指定時は value と同値 */
  ocrOriginalValue?: string
  ocrEditedValue?: string
  masterMatchError?:string
  phase3Matched?:boolean
  masterAutoAdopted?:boolean
  masterMatchStrategy?:OcrMasterMatchSearchStrategy
  masterMatchSimilarity?:number
  masterHierarchyOfficial?:boolean
  masterHierarchyLevel?:number
  masterHierarchyPath?:string
  masterReviewEnabled?:boolean
  masterDataColumnId?:string
  masterCodeColumnId?:string
  masterDataId?:string
  phase3ModelTrusted?:boolean
  confidence: number
  required: boolean
  bbox: OcrFieldBbox
  modelAlternatives?: string[]
  /** 抽出値が帳票タイプ定義の正常値範囲外 */
  valueOutOfRange?: boolean
  /** Master 照合要確認：最细规则维度（相似度低 / 结果为空 / 置信度低） */
  masterMatchConfirmRule?: MasterMatchConfirmRule
  /** Master 照合候補（類似度低時など） */
  masterMatchCandidates?: OcrMasterMatchCandidate[]
  /** Master 照合 · 按 code 检索时联合参与查询的 OCR 字段 */
  masterMatchCodeFieldRefs?: { fieldId: string; label: string; masterColumnId?: string }[]
  /** 关联至主 Master 照合字段（共享候选项与要确认状态） */
  masterMatchLinkedTo?: string
  /** Master 照合値（信頼度低時の照合結果） */
  masterMatchedValue?: string
  /** 要確認フィールドの手動確認（トグル可） */
  userConfirmed?: boolean
}

export interface OcrTableColumn {
  id: string
  label: string
}

export interface OcrExtractionTable {
  id: string
  label: string
  section: string
  columns: OcrTableColumn[]
  rows: Record<string, string>[]
}

export interface OcrDocumentPage {
  id: string
  docType: string
  fileName: string
  imageUrl: string
  pageCount?: number
  fields: OcrExtractionField[]
  tables: OcrExtractionTable[]
}

export interface OcrExtractionTaskDetail {
  taskId: string
  caseId: string
  caseOrigin: string | null
  sourceFolderName: string
  pages: OcrDocumentPage[]
}

/** 保険金請求書（HA21-001）デモ用フィールド — 座標は PDF プレビューに合わせて調整 */
function createClaimFormFields(): OcrExtractionField[] {
  return [
    {
      id: 'f-policy-no',
      section: '契約情報',
      label: '証券番号',
      value: '01848019-004-001',
      confidence: 96,
      required: true,
      bbox: { top: 14.8, left: 56.5, width: 24.5, height: 2.0 }
    },
    {
      id: 'f-contractor-name',
      section: '契約情報',
      label: 'ご契約者氏名',
      value: '山田 太郎',
      confidence: 91,
      required: true,
      bbox: { top: 18.6, left: 38.5, width: 18.5, height: 2.0 },
      modelAlternatives: ['山田 太朗', '山田太郎']
    },
    {
      id: 'f-contractor-kana',
      section: '契約情報',
      label: 'ご契約者氏名（カナ）',
      value: 'ヤマダタロウ',
      confidence: 78,
      required: true,
      bbox: { top: 21.8, left: 38.5, width: 20.5, height: 2.0 }
    },
    {
      id: 'f-insured-name',
      section: '被保険者情報',
      label: '被保険者氏名',
      value: '山田 花子',
      confidence: 94,
      required: true,
      bbox: { top: 29.2, left: 38.5, width: 18.5, height: 2.0 }
    },
    {
      id: 'f-birth-date',
      section: '被保険者情報',
      label: '生年月日',
      value: '1985-03-15',
      confidence: 89,
      required: true,
      bbox: { top: 36.8, left: 38.5, width: 15.5, height: 2.0 }
    },
    {
      id: 'f-address',
      section: '被保険者情報',
      label: '住所',
      value: '東京都千代田区千代田1-1',
      confidence: 72,
      required: true,
      bbox: { top: 43.2, left: 38.5, width: 38.5, height: 2.2 }
    },
    {
      id: 'f-illness',
      section: '請求内容',
      label: '事故・傷病名',
      value: '急性虫垂炎',
      confidence: 86,
      required: true,
      bbox: { top: 52.4, left: 38.5, width: 22.5, height: 2.0 },
      modelAlternatives: ['急性虫垂炎', '急性虫垂炎（術後）']
    },
    {
      id: 'f-admission-date',
      section: '請求内容',
      label: '入院日',
      value: '2025-09-20',
      confidence: 88,
      required: true,
      bbox: { top: 59.6, left: 38.5, width: 13.5, height: 2.0 }
    },
    {
      id: 'f-discharge-date',
      section: '請求内容',
      label: '退院日',
      value: '2025-09-28',
      confidence: 91,
      required: false,
      bbox: { top: 59.6, left: 58.5, width: 13.5, height: 2.0 }
    },
    {
      id: 'f-bank-name',
      section: '振込先',
      label: '金融機関名',
      value: 'みずほ銀行',
      confidence: 94,
      required: true,
      bbox: { top: 71.8, left: 38.5, width: 19.5, height: 2.0 }
    },
    {
      id: 'f-account-no',
      section: '振込先',
      label: '口座番号',
      value: '1234567',
      confidence: 91,
      required: true,
      bbox: { top: 78.6, left: 51.5, width: 13.5, height: 2.0 }
    },
    {
      id: 'f-form-date',
      section: 'その他',
      label: '記入日',
      value: '2025-10-13',
      confidence: 97,
      required: true,
      bbox: { top: 89.8, left: 73.5, width: 13.5, height: 1.8 }
    }
  ]
}

function createMasterSimilarityDemoFields():OcrExtractionField[]{
 const scenarios=[
  {id:'d-demo-adopt',label:'傷病名（類似度一致）',original:'脈絡膜の悪性黒色腫',records:[0,1,10],scores:[96,86,80]},
  {id:'d-demo-candidates',label:'傷病名（複数候補）',original:'悪性腫瘍',records:[0,10,20],scores:[88,85,81]},
  {id:'d-demo-parent',label:'傷病名（上位分類を採用）',original:'眼の悪性腫瘍',records:[0,1,2],scores:[88,85,81]},
  {id:'d-demo-tie',label:'傷病名（同率候補）',original:'毛様体の悪性腫瘍',records:[1,2,3],scores:[93,93,86]}
 ]
 return scenarios.map((demo,index)=>({id:demo.id,section:'診断内容',label:demo.label,value:demo.original,ocrOriginalValue:demo.original,confidence:97,required:true,bbox:{top:28+index*3,left:32,width:28,height:2.2},masterDataId:'master-disease',masterDataColumnId:'col-d-name',masterCodeColumnId:'col-d-code',masterMatchCandidates:demo.records.map((record,i)=>({value:customerIcdSample[record][2],strategy:'hybrid' as const,similarityScore:demo.scores[i],linkedValues:{[demo.id]:customerIcdSample[record][2],[demo.id+'-icd']:customerIcdSample[record][1]}}))}))
}

/** 診断書デモ用フィールド */
function createDiagnosisFormFields(): OcrExtractionField[] {
  return [
    {
      id: 'd-patient-name',
      section: '患者情報',
      label: '患者氏名',
      value: '山田 花子',
      confidence: 93,
      required: true,
      bbox: { top: 12.5, left: 32.0, width: 22.0, height: 2.2 }
    },
    {
      id: 'd-disease',
      masterDataId:'master-disease',masterDataColumnId:'col-d-name', masterCodeColumnId:'col-d-code',
      section: '診断内容',
      label: '傷病名',
      value: '脈絡膜腫瘍',
      ocrOriginalValue: '脈絡膜腫瘍',
      confidence: 71,
      required: true,
      masterMatchConfirmRule: 'low-similarity',
      masterMatchCodeFieldRefs: [
        { fieldId: 'd-disease', label: '傷病名', masterColumnId:'col-d-name' },
        { fieldId: 'd-icd10', label: 'ICD10', masterColumnId:'col-d-code' }
      ],
      masterMatchCandidates: [
        {
          value: '脈絡膜悪性黒色腫',
          strategy: 'code',
          linkedValues: { 'd-disease': '脈絡膜悪性黒色腫', 'd-icd10': 'C693' }
        },
        {
          value: '脈絡膜悪性黒色腫',
          strategy: 'hybrid',
          similarityScore: 92,
          linkedValues: { 'd-disease': '脈絡膜悪性黒色腫', 'd-icd10': 'C693' }
        },
        {
          value: 'ぶどう膜悪性黒色腫',
          strategy: 'hybrid',
          similarityScore: 86,
          linkedValues: { 'd-disease': 'ぶどう膜悪性黒色腫', 'd-icd10': 'C694' }
        },
        {
          value: '眼窩悪性腫瘍',
          strategy: 'hybrid',
          similarityScore: 81,
          linkedValues: { 'd-disease': '眼窩悪性腫瘍', 'd-icd10': 'C696' }
        }
      ],
      bbox: { top: 28.4, left: 32.0, width: 28.0, height: 2.2 }
    },
    {
      id: 'd-icd10',
      section: '診断内容',
      label: 'ICD10',
      value: 'C69.3',
      ocrOriginalValue: 'C69.3',
      confidence: 89,
      required: false,
      masterMatchLinkedTo: 'd-disease',
      bbox: { top: 28.4, left: 62.0, width: 14.0, height: 2.2 }
    },
    {
      id: 'd-surgery',
      section: '診断内容',
      label: '手術名',
      value: '',
      ocrOriginalValue: '開腹虫垂切除術',
      confidence: 72,
      required: true,
      masterMatchConfirmRule: 'empty-result',
      bbox: { top: 31.6, left: 32.0, width: 28.0, height: 2.2 }
    },
    {id:'d-demo-code-parent',section:'診断内容',label:'傷病名（コード複数候補）',value:'毛様体腫瘍',ocrOriginalValue:'毛様体腫瘍',confidence:97,required:true,bbox:{top:28,left:32,width:28,height:2.2},masterDataId:'master-disease',masterDataColumnId:'col-d-name',masterCodeColumnId:'col-d-code',masterMatchCandidates:[...[1,2].map(i=>({value:customerIcdSample[i][2],strategy:'code' as const,linkedValues:{'d-demo-code-parent':customerIcdSample[i][2],'d-demo-code-parent-icd':customerIcdSample[i][1]}})),...[1,2,3].map((i,index)=>({value:customerIcdSample[i][2],strategy:'hybrid' as const,similarityScore:[88,85,81][index],linkedValues:{'d-demo-code-parent':customerIcdSample[i][2],'d-demo-code-parent-icd':customerIcdSample[i][1]}}))]},
    ...createMasterSimilarityDemoFields(),
    {id:'d-bank-name',section:'振込先',label:'振込先金融機関名（グループ照合）',value:'瀬戸',ocrOriginalValue:'瀬戸',confidence:97,required:true,masterDataId:'master-bank-info',masterMatchConfirmRule:'low-similarity',masterMatchCodeFieldRefs:[{fieldId:'d-bank-name',label:'金融機関名'},{fieldId:'d-branch-name',label:'支店名'}],masterMatchCandidates:[['瀬戸信用金庫','瑞穂通支店'],['大垣共立銀行','瀬戸支店'],['岡崎信用金庫','瑞穂支店']].map(([bank,branch],i)=>({value:bank+'-'+branch,strategy:'hybrid' as const,similarityScore:[88,85,81][i],linkedValues:{'d-bank-name':bank,'d-branch-name':branch}})),bbox:{top:60,left:32,width:28,height:2.2}},
    {id:'d-branch-name',section:'振込先',label:'振込先支店名（グループ照合）',value:'瑞穂通',ocrOriginalValue:'瑞穂通',confidence:97,required:true,masterMatchLinkedTo:'d-bank-name',bbox:{top:63,left:32,width:28,height:2.2}},

    {
      id: 'd-diagnosis-date',
      section: '診断内容',
      label: '診断日',
      value: '2025-09-20',
      confidence: 88,
      required: true,
      bbox: { top: 34.8, left: 32.0, width: 16.0, height: 2.2 }
    },
    {
      id: 'd-hospital',
      section: '医療機関',
      label: '医療機関名',
      value: '東京中央病院',
      confidence: 91,
      required: true,
      bbox: { top: 48.2, left: 32.0, width: 30.0, height: 2.2 }
    },
    {
      id: 'd-doctor',
      section: '医療機関',
      label: '担当医師氏名',
      value: '佐藤 健一',
      confidence: 90,
      required: true,
      bbox: { top: 54.6, left: 32.0, width: 22.0, height: 2.2 }
    }
  ]
}

/** 領収書・診療明細書デモ用フィールド */
function createReceiptDetailFields(): OcrExtractionField[] {
  return [
    {
      id: 'r-patient',
      section: '基本情報',
      label: '患者氏名',
      value: '山田 花子',
      confidence: 94,
      required: true,
      bbox: { top: 10.2, left: 28.0, width: 22.0, height: 2.0 }
    },
    {
      id: 'r-hospital',
      section: '基本情報',
      label: '医療機関名',
      value: '慶應大学病院',
      confidence: 92,
      required: true,
      bbox: { top: 14.6, left: 28.0, width: 30.0, height: 2.0 }
    },
    {
      id: 'r-month',
      section: '明細',
      label: '診療年月',
      value: '2025年9月',
      confidence: 88,
      required: true,
      bbox: { top: 20.4, left: 28.0, width: 16.0, height: 2.0 }
    },
    {
      id: 'r-dept',
      section: '明細',
      label: '診療科',
      value: '外科',
      confidence: 90,
      required: false,
      bbox: { top: 24.2, left: 28.0, width: 14.0, height: 2.0 }
    },
    {
      id: 'r-surgery',
      section: '明細',
      label: '手術名',
      value: 'K633-腹腔鏡下虫垂切除術',
      ocrOriginalValue: '腹腔鏡下虫垂切除術',
      masterMatchedValue: 'K633-腹腔鏡下虫垂切除術',
      confidence: 64,
      required: true,
      masterMatchConfirmRule: 'low-confidence',
      bbox: { top: 26.4, left: 28.0, width: 32.0, height: 2.0 }
    },
    {
      id: 'r-visit-date',
      section: '明細',
      label: '診療日',
      value: '2025-09-08',
      confidence: 91,
      required: false,
      bbox: { top: 28.0, left: 28.0, width: 14.0, height: 2.0 }
    },
    {
      id: 'r-points-total',
      section: '明細',
      label: '合計点数',
      value: '12,450',
      confidence: 93,
      required: true,
      bbox: { top: 72.4, left: 58.0, width: 14.0, height: 2.0 }
    },
    {
      id: 'r-copay-ratio',
      section: '明細',
      label: '自己負担割合',
      value: '30%',
      confidence: 89,
      required: false,
      bbox: { top: 76.2, left: 58.0, width: 10.0, height: 2.0 }
    },
    {
      id: 'r-copay',
      section: '明細',
      label: '自己負担額',
      value: '37,350',
      confidence: 87,
      required: true,
      bbox: { top: 80.0, left: 58.0, width: 14.0, height: 2.0 }
    },
    {
      id: 'r-total-pay',
      section: '明細',
      label: '領収金額',
      value: '51,630',
      confidence: 95,
      required: true,
      bbox: { top: 84.2, left: 58.0, width: 14.0, height: 2.0 }
    },
    {
      id: 'r-issue-date',
      section: '明細',
      label: '領収日',
      value: '2025-09-15',
      confidence: 92,
      required: false,
      bbox: { top: 88.4, left: 58.0, width: 14.0, height: 2.0 }
    }
  ]
}

function createReceiptLineItemsTable(): OcrExtractionTable {
  return {
    id: 'r-line-items',
    label: '診療項目明細',
    section: '明細',
    columns: [
      { id: 'visit_date', label: '診療日' },
      { id: 'category', label: '区分' },
      { id: 'item_name', label: '項目名' },
      { id: 'points', label: '点数' },
      { id: 'count', label: '回数' },
      { id: 'total_points', label: '合計点数' }
    ],
    rows: [
      {
        visit_date: '2025-09-08',
        category: '初・再診',
        item_name: '再診料',
        points: '288',
        count: '1',
        total_points: '288'
      },
      {
        visit_date: '2025-09-08',
        category: '医学管理等',
        item_name: '管理料',
        points: '415',
        count: '3',
        total_points: '1,245'
      },
      {
        visit_date: '2025-09-09',
        category: '手術',
        item_name: '腹腔鏡下虫垂切除術',
        points: '4,480',
        count: '2',
        total_points: '8,960'
      },
      {
        visit_date: '2025-09-10',
        category: '処置',
        item_name: '創傷処置',
        points: '120',
        count: '2',
        total_points: '240'
      },
      {
        visit_date: '2025-09-11',
        category: '検査',
        item_name: '血液検査',
        points: '358',
        count: '1',
        total_points: '358'
      },
      {
        visit_date: '2025-09-12',
        category: '投薬',
        item_name: '抗生剤投与',
        points: '359',
        count: '1',
        total_points: '359'
      }
    ]
  }
}

const RICH_TASKS: Record<string, Omit<OcrExtractionTaskDetail, 'taskId'>> = {
  'TASK-OCR-001': {
    caseId: 'CLAIM-20251024000003',
    caseOrigin: 'REQ-2025-0018908',
    sourceFolderName: '田中花子_手術請求',
    pages: [
      {
        id: 'page-claim-1',
        docType: '保険金請求書',
        fileName: '',
        imageUrl: MOCK_SAMPLE_MEDIA_URL,
        pageCount: 4,
        fields: createClaimFormFields(),
        tables: []
      },
      {
        id: 'page-diagnosis-1',
        docType: '診断書',
        fileName: '',
        imageUrl: MOCK_SAMPLE_MEDIA_URL,
        pageCount: 2,
        fields: createDiagnosisFormFields(),
        tables: []
      },
      {id:'page-master-auto',docType:'マスタ照合（自動採用）',fileName:'',imageUrl:MOCK_SAMPLE_MEDIA_URL,pageCount:1,fields:autoAdoptScenarioFields(),tables:[]},
      {id:'page-master-review',docType:'マスタ照合（要確認）',fileName:'',imageUrl:MOCK_SAMPLE_MEDIA_URL,pageCount:1,fields:manualReviewScenarioFields(),tables:[]},
      {
        id: 'page-receipt-detail-1',
        docType: '領収書・診療明細書',
        fileName: '',
        imageUrl: MOCK_SAMPLE_MEDIA_URL,
        pageCount: 1,
        fields: createReceiptDetailFields(),
        tables: [createReceiptLineItemsTable()]
      }
    ]
  },
  'TASK-OCR-002': {
    caseId: 'CLAIM-20251022000001',
    caseOrigin: 'REQ-2025-0018865',
    sourceFolderName: '小林直樹_入院請求',
    pages: [
      {
        id: 'page-claim-2',
        docType: '保険金請求書',
        fileName: '',
        imageUrl: MOCK_SAMPLE_MEDIA_URL,
        fields: createClaimFormFields().map((field) => {
          if (field.id === 'f-insured-name') {
            return { ...field, value: '小林 直樹', confidence: 88 }
          }
          if (field.id === 'f-contractor-name') {
            return { ...field, value: '小林 直樹', modelAlternatives: undefined }
          }
          if (field.id === 'f-illness') {
            return { ...field, value: '腰椎ヘルニア', confidence: 81, modelAlternatives: undefined }
          }
          if (field.id === 'f-admission-date') {
            return { ...field, value: '2025-08-12', confidence: 86 }
          }
          if (field.id === 'f-address') {
            return { ...field, value: '神奈川県横浜市西区みなとみらい2-2-1', confidence: 63 }
          }
          if (field.id === 'f-account-no') {
            return { ...field, value: '7654321', confidence: 74 }
          }
          return field
        }),
        tables: []
      }
    ]
  }
}

function normalizeField(field: OcrExtractionField): OcrExtractionField {
  const ocrOriginalValue = field.ocrOriginalValue ?? field.value
  const value =
    field.masterMatchConfirmRule === 'empty-result' && !field.value.trim() && ocrOriginalValue.trim()
      ? ocrOriginalValue
      : field.value

  return {
    ...field,
    value,
    ocrOriginalValue,
    userConfirmed: field.userConfirmed ?? false,
    bbox: { ...field.bbox },
    modelAlternatives: field.modelAlternatives ? [...field.modelAlternatives] : undefined,
    masterMatchCandidates: field.masterMatchCandidates
      ? field.masterMatchCandidates.map((item) => ({
          ...item,
          linkedValues: item.linkedValues ? { ...item.linkedValues } : undefined
        }))
      : undefined,
    masterMatchCodeFieldRefs: field.masterMatchCodeFieldRefs
      ? field.masterMatchCodeFieldRefs.map((item) => ({ ...item }))
      : undefined
  }
}

function cloneTables(tables: OcrExtractionTable[]): OcrExtractionTable[] {
  return tables.map((table) => ({
    ...table,
    columns: table.columns.map((column) => ({ ...column })),
    rows: table.rows.map((row) => ({ ...row }))
  }))
}

function cloneFields(fields: OcrExtractionField[]): OcrExtractionField[] {
  return fields.map((field) => normalizeField(field))
}

/** 要確認（赤枠）かつ未確認 */
export function getMasterMatchPrimaryField(
  field: OcrExtractionField,
  allFields: OcrExtractionField[] = []
): OcrExtractionField {
  if (field.masterMatchLinkedTo) {
    const primary = allFields.find((item) => item.id === field.masterMatchLinkedTo)
    if (primary) return primary
  }
  return field
}

export function getMasterMatchGroupFieldIds(primary: OcrExtractionField): string[] {
  const refs = primary.masterMatchCodeFieldRefs
  if (refs?.length) return refs.map((ref) => ref.fieldId)
  return [primary.id]
}

export function isFieldUserConfirmed(
  field: OcrExtractionField,
  allFields: OcrExtractionField[] = []
): boolean {
  const primary = getMasterMatchPrimaryField(field, allFields)
  if (primary.masterMatchConfirmRule && field.masterMatchLinkedTo) {
    return primary.userConfirmed ?? false
  }
  return field.userConfirmed ?? false
}

export function needsFieldReview(
  field: OcrExtractionField,
  allFields: OcrExtractionField[] = []
): boolean {
  return getFieldAlert(field, allFields) !== 'none' && !isFieldUserConfirmed(field, allFields)
}

function masterMatchAlertFromRule(rule: MasterMatchConfirmRule): OcrFieldAlert {
  switch (rule) {
    case 'low-similarity':
      return 'master-low-similarity'
    case 'empty-result':
      return 'master-empty-result'
    case 'low-confidence':
      return 'master-low-confidence'
  }
}

export function hasMasterMatchReview(field: OcrExtractionField): boolean {
  return Boolean(field.masterMatchConfirmRule) && !field.masterAutoAdopted && getMasterMatchDropdownOptions(field).some(item => item.strategy !== 'ocr')
}

export function getMasterMatchConfirmRuleLabel(_rule: MasterMatchConfirmRule): string {
  return t('phase3.masterReview')
}

export function getFieldAlert(
  field: OcrExtractionField,
  allFields: OcrExtractionField[] = []
): OcrFieldAlert {
  const primary = getMasterMatchPrimaryField(field, allFields)
  if(field.masterMatchError||primary.masterMatchError)return 'master-execution-error'
  if (primary.masterMatchConfirmRule && primary.masterReviewEnabled!==false && !primary.masterAutoAdopted && getMasterMatchDropdownOptions(primary, allFields).some(item => item.strategy !== 'ocr')) {
    return masterMatchAlertFromRule(primary.masterMatchConfirmRule)
  }
  const hasMasterValue=!!field.masterMatchStrategy&&field.masterMatchStrategy!=='ocr'
  if (!hasMasterValue && !field.masterAutoAdopted && field.modelAlternatives?.length) return 'model-conflict'
  if (field.valueOutOfRange) return 'value-out-of-range'
  if (!field.value.trim() && field.required) return 'required-empty'
  if (!hasMasterValue && !field.masterAutoAdopted && field.confidence < OCR_CONFIDENCE_THRESHOLD) return 'low-confidence'
  return 'none'
}

export function hasModelConflict(field: OcrExtractionField): boolean {
  return Boolean(field.modelAlternatives?.length)
}

export function getModelResultOptions(field: OcrExtractionField): string[] {
  const options = [field.value, ...(field.modelAlternatives ?? [])]
    .map((item) => item.trim())
    .filter(Boolean)
  return [...new Set(options)]
}

/** OCR 抽出原始値 */
export function getOcrExtractedValue(field: OcrExtractionField): string {
  return (field.ocrOriginalValue ?? field.value).trim()
}

function buildOcrLinkedValues(
  primary: OcrExtractionField,
  allFields: OcrExtractionField[]
): Record<string, string> {
  const linkedValues: Record<string, string> = {}
  for (const fieldId of getMasterMatchGroupFieldIds(primary)) {
    const source = allFields.find((item) => item.id === fieldId)
    if (source) linkedValues[fieldId] = getOcrExtractedValue(source)
  }
  return linkedValues
}

export function applyMasterMatchSelection(
  allFields: OcrExtractionField[],
  candidate: OcrMasterMatchCandidate
): void {
  const linkedValues = candidate.linkedValues
  if (linkedValues && Object.keys(linkedValues).length > 0) {
    for (const [fieldId, value] of Object.entries(linkedValues)) {
      const target = allFields.find((item) => item.id === fieldId)
      if (target) {
        target.masterAutoAdopted=false
        target.masterHierarchyOfficial=candidate.hierarchyOfficial
        target.masterHierarchyLevel=candidate.hierarchyLevel
        target.masterHierarchyPath=candidate.hierarchyPath
        target.masterMatchStrategy=candidate.strategy
        target.masterMatchSimilarity=candidate.similarityScore
        target.value = value
        target.userConfirmed = false
      }
    }
    return
  }

  const target = allFields.find((item) =>
    getMasterMatchDropdownOptions(item, allFields).some(
      (option) => option.value === candidate.value && option.strategy === candidate.strategy
    )
  )
  if (target) {
    target.masterAutoAdopted=false
        target.masterHierarchyOfficial=candidate.hierarchyOfficial
        target.masterHierarchyLevel=candidate.hierarchyLevel
        target.masterHierarchyPath=candidate.hierarchyPath
        target.masterMatchStrategy=candidate.strategy
        target.masterMatchSimilarity=candidate.similarityScore
    target.value = candidate.value
    target.userConfirmed = false
  }
}

export function restoreMasterMatchGroup(
  field: OcrExtractionField,
  allFields: OcrExtractionField[]
): void {
  const primary=getMasterMatchPrimaryField(field,allFields)
  for(const id of getMasterMatchGroupFieldIds(primary)){
    const target=allFields.find(member=>member.id===id)
    if(!target)continue
    delete target.masterAutoAdopted
    delete target.masterHierarchyOfficial
    delete target.masterHierarchyLevel
    delete target.masterHierarchyPath
    delete target.masterMatchStrategy
    delete target.masterMatchSimilarity
    target.value=target.ocrOriginalValue??target.value
    target.userConfirmed=false
  }
}

export function toggleMasterMatchGroupConfirm(
  field: OcrExtractionField,
  allFields: OcrExtractionField[]
): void {
  const primary = getMasterMatchPrimaryField(field, allFields)
  if (!primary.masterMatchConfirmRule) {
    field.userConfirmed = !(field.userConfirmed ?? false)
    return
  }

  const next = !(primary.userConfirmed ?? false)
  for (const fieldId of getMasterMatchGroupFieldIds(primary)) {
    const target = allFields.find((item) => item.id === fieldId)
    if (target) target.userConfirmed = next
  }
}

export function isMasterMatchGroupRestored(
  field: OcrExtractionField,
  allFields: OcrExtractionField[]
): boolean {
  const primary=getMasterMatchPrimaryField(field,allFields)
  return getMasterMatchGroupFieldIds(primary).every(id=>{
    const target=allFields.find(member=>member.id===id)
    return !target||target.value===(target.ocrOriginalValue??target.value)
  })
}

/** Master 照合候補：code 検索を先頭、混合检索按相似度取 Top N */
export function getSortedMasterMatchCandidates(
  field: OcrExtractionField
): OcrMasterMatchCandidate[] {
  const list = [...new Map((field.masterMatchCandidates ?? []).map(item=>[`${item.strategy}:${item.value}:${JSON.stringify(item.linkedValues||{})}`,item])).values()]
  const exact = list.filter(item=>item.strategy==='code')
  const codeItems = exact
  const hybridItems = list
    .filter((item) => item.strategy === 'hybrid')
    .sort(compareSimilarityCandidates)
    .slice(0, MASTER_MATCH_SIMILARITY_TOP_N)
  return [...codeItems, ...hybridItems, ...list.filter(item => item.strategy === 'parent' || item.strategy === 'match')]
}

/** Master 照合要確認フィールドのドロップダウン候補 */
export function getMasterMatchDropdownOptions(
  field: OcrExtractionField,
  allFields: OcrExtractionField[] = []
): OcrMasterMatchCandidate[] {
  const primary = getMasterMatchPrimaryField(field, allFields)
  const rule = primary.masterMatchConfirmRule
  if (!rule && !primary.masterMatchStrategy && !primary.masterMatchCandidates?.length) return []

  const ocrDisplay = getOcrExtractedValue(field)
  const seen = new Set<string>()
  const options: OcrMasterMatchCandidate[] = []

  const pushCandidate = (candidate: OcrMasterMatchCandidate) => {
    const groupIds=getMasterMatchGroupFieldIds(primary)
    const trimmed = groupIds.length>1&&candidate.linkedValues?groupIds.map(id=>candidate.linkedValues?.[id]?.trim()||'（空欄）').join('-'):(candidate.linkedValues?.[field.id] ?? candidate.value).trim()
    const key = `${candidate.strategy}:${trimmed}`
    if (!trimmed || seen.has(key)) return
    seen.add(key)
    options.push({
      ...candidate,
      value: trimmed,
      linkedValues: candidate.linkedValues ? { ...candidate.linkedValues } : undefined
    })
  }

  if (rule === 'low-confidence') {
    if (ocrDisplay) {
      pushCandidate({
        strategy: 'ocr',
        value: ocrDisplay,
        linkedValues: { [field.id]: ocrDisplay }
      })
    }
    const matched = primary.masterMatchedValue?.trim()
    if (matched) {
      pushCandidate({
        strategy: 'match',
        value: matched,
        linkedValues: { [field.id]: matched }
      })
    }
    return options
  }

  if (rule === 'low-similarity') {
    const ocrLinkedValues = buildOcrLinkedValues(primary, allFields)
    if (ocrDisplay) {
      pushCandidate({
        strategy: 'ocr',
        value: ocrDisplay,
        linkedValues: ocrLinkedValues
      })
    }
    for (const candidate of getSortedMasterMatchCandidates(primary)) {
      pushCandidate(candidate)
    }
    return options
  }

  const ocrLinkedValues = buildOcrLinkedValues(primary, allFields)
  if (ocrDisplay) pushCandidate({strategy:'ocr', value:ocrDisplay, linkedValues:ocrLinkedValues})
  for (const candidate of getSortedMasterMatchCandidates(primary)) pushCandidate(candidate)
  return options
}

export function hasMasterMatchDropdown(
  field: OcrExtractionField,
  allFields: OcrExtractionField[] = []
): boolean {
  const primary = getMasterMatchPrimaryField(field, allFields)
  if (!primary.masterMatchConfirmRule && !primary.masterMatchStrategy && !primary.masterMatchCandidates?.length) return false
  return getMasterMatchDropdownOptions(field, allFields).some(item => item.strategy !== 'ocr')
}

export function getMasterMatchOptionLabel(strategy: OcrMasterMatchSearchStrategy): string {
  switch (strategy) {
    case 'ocr':
      return t('tasks.ocr.masterOption.ocrValue')
    case 'parent':
      return t('phase3.parentMatch')
    case 'match':
      return t('tasks.ocr.masterOption.matchValue')
    case 'code':
      return t('businessRules.docType.options.strategyCode')
    case 'hybrid':
      return t('businessRules.docType.options.strategyHybrid')
  }
}

export type OcrManualReviewRuleKey = Extract<OcrFieldAlert, 'low-confidence' | 'model-conflict' | 'value-out-of-range'> | 'low-confidence-out-of-range'

export function getOcrManualReviewRuleOptions(): { key: OcrManualReviewRuleKey; label: string }[] {
  return [
    { key: 'low-confidence', label: t('tasks.ocr.alerts.lowConfidence') },
    { key: 'model-conflict', label: t('tasks.ocr.alerts.modelConflict') }
  ]
}

/** @deprecated 互換用。新規は getOcrManualReviewRuleOptions() を使用 */
export const OCR_MANUAL_REVIEW_RULE_OPTIONS = getOcrManualReviewRuleOptions()

export function getFieldAlertLabel(alert: OcrFieldAlert): string | null {
  switch (alert) {
    case 'low-confidence':
      return t('tasks.ocr.alerts.lowConfidence')
    case 'model-conflict':
      return t('tasks.ocr.alerts.modelConflict')
    case 'value-out-of-range':
      return t('tasks.ocr.alerts.outOfRange')
    case 'required-empty':
      return t('tasks.ocr.alerts.requiredEmpty')
    case 'master-low-similarity':
      return getMasterMatchConfirmRuleLabel('low-similarity')
    case 'master-empty-result':
      return getMasterMatchConfirmRuleLabel('empty-result')
    case 'master-low-confidence':
      return getMasterMatchConfirmRuleLabel('low-confidence')
    case 'master-execution-error':
      return t('phase3.matchExecutionError')
    default:
      return null
  }
}

export function countFieldAlerts(fields: OcrExtractionField[]): Record<OcrFieldAlert, number> {
  const counts: Record<OcrFieldAlert, number> = {
    none: 0,
    'low-confidence': 0,
    'model-conflict': 0,
    'value-out-of-range': 0,
    'required-empty': 0,
    'master-low-similarity': 0,
    'master-empty-result': 0,
    'master-low-confidence': 0,
    'master-execution-error': 0
  }
  fields.forEach((field) => {
    if (needsFieldReview(field, fields)) {
      counts[getFieldAlert(field, fields)] += 1
    }
  })
  return counts
}

export function countPendingReviews(fields: OcrExtractionField[]): number {
  return fields.filter(
    (field) => !field.masterMatchLinkedTo && needsFieldReview(field, fields)
  ).length
}

export function canCompleteOcr(fields: OcrExtractionField[]): boolean {
  return !fields.some((field) => needsFieldReview(field, fields))
}

export function completeBlockReason(fields: OcrExtractionField[]): string {
  const pending = fields.filter((field) => needsFieldReview(field, fields))
  const masterMatch = pending.filter((field) => hasMasterMatchReview(field)).length
  const modelConflict = pending.filter((field) => getFieldAlert(field, fields) === 'model-conflict').length
  const outOfRange = pending.filter((field) => getFieldAlert(field, fields) === 'value-out-of-range').length
  const lowConfidence = pending.filter((field) => getFieldAlert(field, fields) === 'low-confidence').length
  if (masterMatch > 0) {
    return t('tasks.ocr.messages.blockMasterMatch', { count: masterMatch })
  }
  if (modelConflict > 0) {
    return t('tasks.ocr.messages.blockModelConflict', { count: modelConflict })
  }
  if (outOfRange > 0) {
    return t('tasks.ocr.messages.blockOutOfRange', { count: outOfRange })
  }
  if (lowConfidence > 0) {
    return t('tasks.ocr.messages.blockLowConfidence', { count: lowConfidence })
  }
  return ''
}

export function groupFieldsBySection(
  fields: OcrExtractionField[]
): { section: string; fields: OcrExtractionField[] }[] {
  const map = new Map<string, OcrExtractionField[]>()
  fields.forEach((field) => {
    const list = map.get(field.section) ?? []
    list.push(field)
    map.set(field.section, list)
  })
  return Array.from(map.entries()).map(([section, sectionFields]) => ({
    section,
    fields: sectionFields
  }))
}

function withLogicalPageFileNames(
  caseId: string,
  pages: OcrDocumentPage[],
  fallback: { receivedAt: string; fileCount: number; uploadedDocTypes: string[] }
): OcrDocumentPage[] {
  const caseItem = rawMockCaseList.find((item) => item.caseId === caseId)
  const plans = planCaseLogicalFiles({
    caseId,
    receivedAt: caseItem?.receivedAt ?? fallback.receivedAt,
    fileCount: Math.max(caseItem?.fileCount ?? fallback.fileCount, pages.length),
    uploadedDocTypes: caseItem?.uploadedDocTypes ?? fallback.uploadedDocTypes
  })

  return pages.map((page, index) => ({
    ...page,
    fileName: resolveMockFileName(plans[index] ?? plans[0]!)
  }))
}

export function getOcrExtractionTask(taskId: string): OcrExtractionTaskDetail | null {
  const task = getTaskById(taskId)
  if (!task || task.taskType !== 'ocr-extraction') return null

  const rich = RICH_TASKS[taskId]
  if (rich) {
    return {
      taskId,
      ...rich,
      pages: withLogicalPageFileNames(rich.caseId, rich.pages, {
        receivedAt: '2025-10-24',
        fileCount: rich.pages.length,
        uploadedDocTypes: rich.pages.map((page) => page.docType)
      }).map((page) => ({
        ...page,
        fields: cloneFields(page.fields),
        tables: cloneTables(page.tables ?? [])
      }))
    }
  }

  return {
    taskId,
    caseId: task.caseId,
    caseOrigin: task.caseOrigin,
    sourceFolderName: task.sourceFolderName,
    pages: withLogicalPageFileNames(
      task.caseId,
      [
        {
          id: 'page-default',
          docType: '保険金請求書',
          fileName: '',
          imageUrl: MOCK_SAMPLE_MEDIA_URL,
          fields: cloneFields(createClaimFormFields()),
          tables: []
        }
      ],
      {
        receivedAt: '2025-10-24',
        fileCount: 1,
        uploadedDocTypes: ['保険金請求書']
      }
    )
  }
}
