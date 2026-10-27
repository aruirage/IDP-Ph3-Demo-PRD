import { dataMappingRules } from '@/mocks/dataMapping'
import type { ExportItem, ExportScalarItem, ExportTableItem } from '@/mocks/exportTask'

interface FieldMappingMeta {
  standardField: string
  displayLabel: string
}

interface MasterMatchMeta {
  masterSource: string
  masterMatchedValue: string
  masterValue: string
}

/** 案件単位の標準フィールド確定値（デモ） */
const CASE_STANDARD_VALUES: Record<string, Record<string, string>> = {
  'CLAIM-20251023000002': {
    insured_name: '高橋 真由美',
    policy_number: '02468135-008-002',
    insured_birth_date: '1992-07-18',
    claim_type: '入院給付金',
    disease_name: '急性虫垂炎',
    onset_date: '2025-09-07',
    hospital_name: '慶應大学病院',
    medical_department: '外科',
    admission_date: '2025-09-08',
    discharge_date: '2025-09-14',
    admission_days: '7',
    treatment_month: '2025年9月',
    treatment_date: '2025-09-08',
    total_points: '12450',
    copay_amount: '37350',
    receipt_amount: '51630',
    receipt_issue_date: '2025-09-15',
    claim_amount: '420000',
    bank_name: '三菱UFJ銀行 渋谷支店',
    bank_account: '普通 1234567',
    claim_received_date: '2025-09-22'
  },
  'CLAIM-20251021000001': {
    insured_name: '吉田 美咲',
    policy_number: 'POL-7723105',
    admission_date: '2025-10-02',
    discharge_date: '2025-10-09',
    admission_days: '8',
    hospital_name: '横浜市立みなと赤十字病院',
    medical_department: '消化器内科',
    disease_name: '急性胃十二指腸潰瘍',
    id_document_type: '運転免許証',
    id_holder_name: '吉田 翔太'
  }
}

/** docType:fieldId → マスタ照合結果（デモ） */
const MASTER_MATCHES: Record<string, MasterMatchMeta> = {
  '診断書:diag-disease': {
    masterSource: '傷病名マスタ',
    masterMatchedValue: '急性虫垂炎',
    masterValue: '急性虫垂炎-K35.80'
  },
  '入院証明書:adm-disease': {
    masterSource: '傷病名マスタ',
    masterMatchedValue: '急性胃十二指腸潰瘍',
    masterValue: '急性胃十二指腸潰瘍-K25.9'
  },
  '保険金請求書:claim-type': {
    masterSource: '請求区分マスタ',
    masterMatchedValue: '入院給付金',
    masterValue: '入院給付金-01'
  }
}

let mappingIndex: Map<string, FieldMappingMeta> | null = null

function getMappingIndex(): Map<string, FieldMappingMeta> {
  if (mappingIndex) return mappingIndex
  mappingIndex = new Map()
  for (const rule of dataMappingRules.value) {
    for (const source of rule.sources) {
      mappingIndex.set(`${source.docType}:${source.fieldId}`, {
        standardField: rule.standardField,
        displayLabel: rule.displayLabel
      })
    }
  }
  return mappingIndex
}

export function enrichExportField(
  caseId: string,
  docType: string,
  field: Omit<
    ExportScalarItem,
    | 'kind'
    | 'standardFieldKey'
    | 'standardFieldLabel'
    | 'standardFieldValue'
    | 'masterSource'
    | 'masterMatchedValue'
    | 'masterValue'
  >
): ExportScalarItem {
  const mapping = getMappingIndex().get(`${docType}:${field.id}`)
  const caseStandards = CASE_STANDARD_VALUES[caseId] ?? CASE_STANDARD_VALUES['CLAIM-20251023000002']
  const master = MASTER_MATCHES[`${docType}:${field.id}`]

  return {
    kind: 'field',
    ...field,
    standardFieldKey: mapping?.standardField ?? null,
    standardFieldLabel: mapping?.displayLabel ?? null,
    standardFieldValue: mapping ? (caseStandards[mapping.standardField] ?? field.value) : null,
    masterSource: master?.masterSource ?? null,
    masterMatchedValue: master?.masterMatchedValue ?? null,
    masterValue: master?.masterValue ?? null
  }
}

export function isExportScalarItem(item: ExportItem): item is ExportScalarItem {
  return item.kind === 'field'
}

export function isExportTableItem(item: ExportItem): item is ExportTableItem {
  return item.kind === 'table'
}

export interface CaseStandardFieldExport {
  standardField: string
  displayLabel: string
  value: string
}

export function getCaseStandardFields(caseId: string): CaseStandardFieldExport[] {
  const values = CASE_STANDARD_VALUES[caseId] ?? CASE_STANDARD_VALUES['CLAIM-20251023000002']
  const labelByKey = new Map<string, string>()
  for (const rule of dataMappingRules.value) {
    labelByKey.set(rule.standardField, rule.displayLabel)
  }
  return Object.entries(values).map(([standardField, value]) => ({
    standardField,
    displayLabel: labelByKey.get(standardField) ?? standardField,
    value
  }))
}

export const EXPORT_STANDARD_FIELDS_DOC_ID = '__standard-fields__'

export const EXPORT_STANDARD_FILE_BASENAME = 'standard_fields'

export interface SerializedCaseStandardField {
  standard_field: string
  display_label: string
  value: string
}

export function serializeCaseStandardField(field: CaseStandardFieldExport): SerializedCaseStandardField {
  return {
    standard_field: field.standardField,
    display_label: field.displayLabel,
    value: field.value
  }
}

export function caseStandardFieldsPayload(caseId: string) {
  return {
    case_id: caseId,
    fields: getCaseStandardFields(caseId).map(serializeCaseStandardField)
  }
}

export const STANDARD_FIELDS_CSV_HEADERS = ['標準フィールド', '標準値'] as const

export function standardFieldsToCsv(caseId: string, escapeCsvCell: (value: string) => string): string {
  const header = STANDARD_FIELDS_CSV_HEADERS.map(escapeCsvCell).join(',')
  const rows = getCaseStandardFields(caseId).map((field) =>
    [field.displayLabel, field.value].map(escapeCsvCell).join(',')
  )
  return `\uFEFF${[header, ...rows].join('\n')}`
}

export interface SerializedExportTable {
  kind: 'table'
  table_id: string
  label: string
  section: string
  columns: { column_id: string; label: string }[]
  rows: Record<string, string>[]
}

export interface SerializedExportExtractionField {
  kind: 'field'
  field_id: string
  label: string
  section: string
  ocr_value: string
  master_source: string | null
  master_match_result: string | null
}

export type SerializedExportExtractionItem = SerializedExportExtractionField | SerializedExportTable

export function serializeExtractionScalarField(field: ExportScalarItem): SerializedExportExtractionField {
  return {
    kind: 'field',
    field_id: field.id,
    label: field.label,
    section: field.section,
    ocr_value: field.value,
    master_source: field.masterSource ?? null,
    master_match_result: field.masterValue ?? null
  }
}

export function serializeExtractionItem(item: ExportItem): SerializedExportExtractionItem {
  return isExportTableItem(item) ? serializeExportTable(item) : serializeExtractionScalarField(item)
}

export interface SerializedExportScalarField {
  kind: 'field'
  field_id: string
  label: string
  section: string
  ocr_value: string
  standard_field: string | null
  standard_field_label: string | null
  standard_value: string | null
  master_source: string | null
  master_matched_value: string | null
  master_value: string | null
}

export type SerializedExportItem = SerializedExportScalarField | SerializedExportTable

export function serializeExportScalarField(field: ExportScalarItem): SerializedExportScalarField {
  return {
    kind: 'field',
    field_id: field.id,
    label: field.label,
    section: field.section,
    ocr_value: field.value,
    standard_field: field.standardFieldKey ?? null,
    standard_field_label: field.standardFieldLabel ?? null,
    standard_value: field.standardFieldValue ?? null,
    master_source: field.masterSource ?? null,
    master_matched_value: field.masterMatchedValue ?? null,
    master_value: field.masterValue ?? null
  }
}

export function serializeExportTable(table: ExportTableItem): SerializedExportTable {
  return {
    kind: 'table',
    table_id: table.id,
    label: table.label,
    section: table.section,
    columns: table.columns.map((column) => ({
      column_id: column.id,
      label: column.label
    })),
    rows: table.rows.map((row) => ({ ...row }))
  }
}

export function serializeExportItem(item: ExportItem): SerializedExportItem {
  return isExportTableItem(item) ? serializeExportTable(item) : serializeExportScalarField(item)
}

/** 抽出データのみ（標準フィールドを含まない） */
export function serializeExportItemForExtraction(item: ExportItem): SerializedExportExtractionItem {
  return serializeExtractionItem(item)
}

/** @deprecated use serializeExtractionItem */
export function serializeExportField(field: ExportScalarItem): SerializedExportScalarField {
  return serializeExportScalarField(field)
}

export const EXPORT_EXTRACTION_CSV_HEADERS = [
  'フィールド名',
  'OCR抽出値',
  '照合結果'
] as const

/** @deprecated use EXPORT_EXTRACTION_CSV_HEADERS */
export const EXPORT_FIELD_CSV_HEADERS = EXPORT_EXTRACTION_CSV_HEADERS

export function exportExtractionScalarToCsvRow(field: ExportScalarItem): string[] {
  return [field.label, field.value, field.masterValue ?? '']
}

/** @deprecated use exportExtractionScalarToCsvRow */
export function exportScalarToCsvRow(field: ExportScalarItem): string[] {
  return exportExtractionScalarToCsvRow(field)
}

/** @deprecated use exportExtractionScalarToCsvRow */
export function exportFieldToCsvRow(field: ExportScalarItem): string[] {
  return exportExtractionScalarToCsvRow(field)
}

export function exportExtractionItemsToCsvLines(
  items: ExportItem[],
  escapeCsvCell: (value: string) => string
): string[] {
  const lines: string[] = [EXPORT_EXTRACTION_CSV_HEADERS.map(escapeCsvCell).join(',')]

  for (const item of items) {
    if (isExportScalarItem(item)) {
      lines.push(exportExtractionScalarToCsvRow(item).map(escapeCsvCell).join(','))
      continue
    }

    lines.push('')
    lines.push([escapeCsvCell(`[テーブル] ${item.label}`), '', ''].join(','))
    lines.push(item.columns.map((column) => escapeCsvCell(column.label)).join(','))
    for (const row of item.rows) {
      lines.push(
        item.columns.map((column) => escapeCsvCell(row[column.id] ?? '')).join(',')
      )
    }
  }

  return lines
}

/** @deprecated use exportExtractionItemsToCsvLines */
export function exportItemsToCsvLines(
  items: ExportItem[],
  escapeCsvCell: (value: string) => string
): string[] {
  return exportExtractionItemsToCsvLines(items, escapeCsvCell)
}
