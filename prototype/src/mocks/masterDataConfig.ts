import { ref } from 'vue'
import { customerIcdSample } from './customerIcdSample'
import { t } from '@/i18n/translate'

export const MAX_MASTER_COLUMNS = 10
export const MAX_MASTER_IMPORT_ROWS = 100000

export type VectorizationStatus = 'processing' | 'completed' | 'failed'

export interface MasterDataColumn {
  id: string
  label: string
  isQueryCode: boolean
}

export interface MasterDataRow {
  id: string
  values: Record<string, string>
  vectorizationStatus: VectorizationStatus
  vectorizationError?: string
  updatedAt: string
  sourceRecordId?: string
  sourceUpdatedAt?: string
  previousVersion?: { values:Record<string,string>; vectorizationStatus:VectorizationStatus }
}

export interface MasterDataDefinition {
  id: string
  name: string
  columns: MasterDataColumn[]
  rows: MasterDataRow[]
  updatedAt: string
}

export interface MasterDataChangeLog {
  id: string
  masterId: string
  action: string
  operator: string
  occurredAt: string
  detail: string
}

export function vectorizationStatusLabels(): Record<VectorizationStatus, string> {
  return {
    processing: t('businessRules.masterData.vectorization.processing'),
    completed: t('businessRules.masterData.vectorization.completed'),
    failed: t('businessRules.masterData.vectorization.failed')
  }
}

/** @deprecated use vectorizationStatusLabels() */
export const VECTORIZATION_STATUS_LABELS: Record<VectorizationStatus, string> =
  vectorizationStatusLabels()

function createColumnId(): string {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function createRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function createMasterId(): string {
  return `master-${Date.now()}`
}

function createLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function nowLabel(): string {
  return new Date().toLocaleString('ja-JP', { hour12: false })
}

const BANK_BRANCH_SAMPLES: Array<[string, string]> = [
  ['021', '麹町支店'],
  ['020', '押上支店'],
  ['019', '銀座支店'],
  ['018', '日本橋支店'],
  ['017', '京橋支店'],
  ['016', '大手町支店'],
  ['015', '丸の内支店'],
  ['014', '有楽町支店'],
  ['013', '新橋支店']
]

function createBankDictionaryMaster(): MasterDataDefinition {
  const columns: MasterDataColumn[] = [
    { id: 'col-b-bank-code', label: '銀行コード', isQueryCode: true },
    { id: 'col-b-bank-name', label: '銀行名', isQueryCode: false },
    { id: 'col-b-branch-code', label: '支店コード', isQueryCode: true },
    { id: 'col-b-branch-name', label: '支店名', isQueryCode: false }
  ]

  return {
    id: 'master-dict-add',
    name: '辞書追加',
    updatedAt: '2025-09-18 10:20:00',
    columns,
    rows: BANK_BRANCH_SAMPLES.map(([branchCode, branchName], index) => ({
      id: `row-bank-${index + 1}`,
      values: {
        'col-b-bank-code': '0001',
        'col-b-bank-name': 'みずほ銀行',
        'col-b-branch-code': branchCode,
        'col-b-branch-name': branchName
      },
      vectorizationStatus: 'processing' as const,
      updatedAt: '2025-09-18 10:20:00'
    }))
  }
}

function createEmptyMasterShell(name: string, id: string): MasterDataDefinition {
  return {
    id,
    name,
    updatedAt: '2025-09-10 11:30:00',
    columns: [
      { id: `${id}-code`, label: 'コード', isQueryCode: true },
      { id: `${id}-name`, label: '名称', isQueryCode: false }
    ],
    rows: []
  }
}

export const masterDataDefinitions = ref<MasterDataDefinition[]>([
  createBankDictionaryMaster(),
  createEmptyMasterShell('マスタ追加2', 'master-add-2'),
  createEmptyMasterShell('銀行情報', 'master-bank-info'),
  createEmptyMasterShell('手術情報', 'master-surgery-info'),
  createEmptyMasterShell('医薬品情報', 'master-medicine-info'),
  {
    id: 'master-disease',
    name: '傷病名マスタ',
    updatedAt: '2025-09-18 10:20:00',
    columns: [
      { id: 'col-d-code', label: 'ICD10コード', isQueryCode: true },
      { id: 'col-d-name', label: '傷病名', isQueryCode: false },
      { id: 'col-d-disease', label: '特定疾病', isQueryCode: false },
      { id: 'col-d-disease-famix', label: '特定疾病（Famix）', isQueryCode: false },
      { id: 'col-d-site', label: '特定部位', isQueryCode: false },
      { id: 'col-d-site-famix', label: '特定部位（Famix）', isQueryCode: false }
    ],
    // Business values come from the customer export. Version timestamps are demo fixtures.
    rows: customerIcdSample.slice(0,50).map((record,index)=>({
      id:record[0],sourceRecordId:record[0],
      sourceUpdatedAt:index<3?'2026-10-21T00:00:00Z':'2026-10-22T00:00:00Z',
      values:{'col-d-code':record[1],'col-d-name':record[2]+(index<3?'（旧版・デモ）':''),'col-d-disease':record[3],'col-d-disease-famix':record[4],'col-d-site':record[5],'col-d-site-famix':record[6]},
      vectorizationStatus:'completed' as const,updatedAt:'2026-10-22 09:00:00'
    }))
  },
  {
    id: 'master-procedure',
    name: '診療行為マスタ',
    updatedAt: '2025-09-15 14:05:00',
    columns: [
      { id: 'col-p-code', label: '行為コード', isQueryCode: true },
      { id: 'col-p-name', label: '行為名', isQueryCode: false },
      { id: 'col-p-points', label: '点数', isQueryCode: false }
    ],
    rows: [
      {
        id: 'row-p-001',
        values: {
          'col-p-code': 'K637',
          'col-p-name': '腹腔鏡下虫垂切除術',
          'col-p-points': '2880'
        },
        vectorizationStatus: 'completed',
        updatedAt: '2025-09-15 14:05:00'
      },
      {
        id: 'row-p-002',
        values: {
          'col-p-code': 'K721',
          'col-p-name': '胃部分切除術',
          'col-p-points': '5420'
        },
        vectorizationStatus: 'processing',
        updatedAt: '2025-09-15 13:50:00'
      }
    ]
  },
  {
    id: 'master-chemo',
    name: '抗がん剤判定マスタ',
    updatedAt: '2025-09-10 11:30:00',
    columns: [
      { id: 'col-c-code', label: '薬剤コード', isQueryCode: true },
      { id: 'col-c-name', label: '薬剤名', isQueryCode: false },
      { id: 'col-c-flag', label: '抗がん剤区分', isQueryCode: false }
    ],
    rows: []
  }
])

export const masterDataChangeLogs = ref<MasterDataChangeLog[]>([
  {
    id: 'log-001',
    masterId: 'master-disease',
    action: '名称変更',
    operator: '山田 太郎',
    occurredAt: '2025-09-12 16:20:00',
    detail: '表記を「マスタ」に統一'
  },
  {
    id: 'log-002',
    masterId: 'master-disease',
    action: '一括インポート',
    operator: '山田 太郎',
    occurredAt: '2025-09-10 09:05:00',
    detail: 'CSV 128 件を取り込み'
  },
  {
    id: 'log-003',
    masterId: 'master-procedure',
    action: '列設定更新',
    operator: '佐藤 花子',
    occurredAt: '2025-09-08 11:40:00',
    detail: '照会コード列：行為コード'
  }
])

export function findMasterDefinition(id: string | null | undefined): MasterDataDefinition | null {
  if (!id) return null
  return masterDataDefinitions.value.find((item) => item.id === id) ?? null
}

export function appendChangeLog(
  masterId: string,
  action: string,
  detail: string,
  operator = '山田 太郎'
) {
  masterDataChangeLogs.value.unshift({
    id: createLogId(),
    masterId,
    action,
    operator,
    occurredAt: nowLabel(),
    detail
  })
}

export function getMasterChangeLogs(masterId: string): MasterDataChangeLog[] {
  return masterDataChangeLogs.value.filter((item) => item.masterId === masterId)
}

export function createEmptyColumn(label = ''): MasterDataColumn {
  return {
    id: createColumnId(),
    label,
    isQueryCode: false
  }
}

export function createMasterDefinition(name: string): MasterDataDefinition {
  const codeCol = createEmptyColumn(t('businessRules.masterData.column.defaultCode'))
  codeCol.isQueryCode = true
  return {
    id: createMasterId(),
    name,
    columns: [codeCol, createEmptyColumn(t('businessRules.masterData.column.defaultNameLabel'))],
    rows: [],
    updatedAt: nowLabel()
  }
}

export function createRowFromColumns(columns: MasterDataColumn[]): MasterDataRow {
  const values: Record<string, string> = {}
  for (const column of columns) {
    values[column.id] = ''
  }
  return {
    id: createRowId(),
    values,
    vectorizationStatus: 'processing',
    updatedAt: nowLabel()
  }
}

export async function simulateVectorization(row: MasterDataRow): Promise<void> {
  row.vectorizationStatus = 'processing'
  row.vectorizationError = undefined
  await new Promise((resolve) => setTimeout(resolve, 900))
  if (Math.random() < 0.12) {
    row.vectorizationStatus = 'failed'
    row.vectorizationError = 'ベクトル化に失敗しました'
    return
  }
  row.vectorizationStatus = 'completed'
  row.updatedAt = nowLabel()
}

export function queueVectorization(master: MasterDataDefinition, rowIds: string[]) {
  for (const row of master.rows) {
    if (!rowIds.includes(row.id)) continue
    row.vectorizationStatus = 'processing'
    row.vectorizationError = undefined
    void simulateVectorization(row)
  }
}

/** インポートファイルのデータ行数（ヘッダー除く）。CSV のみ実カウント、xlsx/xls は原型では未解析。 */
export async function countMasterImportDataRows(file: File): Promise<number | null> {
  const dotIndex = file.name.lastIndexOf('.')
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : ''
  if (ext !== '.csv') return null

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  return Math.max(0, lines.length - 1)
}
