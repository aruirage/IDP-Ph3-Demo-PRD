import JSZip from 'jszip'
import type { ExportFormat, FileExportFormat } from '@/constants/exportFormats'
import { getFieldTemplatesForDocType } from '@/constants/exportFieldTemplates'
import { EXPORT_OCR_FOLDER_NAME } from '@/constants/exportPaths'
import { getTableTemplatesForDocType } from '@/constants/exportTableTemplates'
import {
  EXPORT_STANDARD_FILE_BASENAME,
  caseStandardFieldsPayload,
  enrichExportField,
  exportExtractionItemsToCsvLines,
  serializeExtractionItem,
  standardFieldsToCsv
} from '@/mocks/exportFieldEnrichment'
import { t } from '@/i18n/translate'
import { addExportHistoryRecord, type ExportHistoryItem } from '@/mocks/exportHistory'
import { getTaskById } from '@/mocks/tasks'
import { rawMockCaseList } from '@/mocks/cases'
import { planCaseLogicalFiles, resolveMockFileName } from '@/mocks/mockLogicalFilePlans'

export interface ExportTableColumn {
  id: string
  label: string
}

export interface ExportScalarItem {
  kind: 'field'
  id: string
  label: string
  section: string
  value: string
  selected: boolean
  sortOrder: number
  standardFieldKey: string | null
  standardFieldLabel: string | null
  standardFieldValue: string | null
  masterSource: string | null
  masterMatchedValue: string | null
  masterValue: string | null
}

export interface ExportTableItem {
  kind: 'table'
  id: string
  label: string
  section: string
  selected: boolean
  sortOrder: number
  columns: ExportTableColumn[]
  rows: Record<string, string>[]
}

export type ExportItem = ExportScalarItem | ExportTableItem

/** @deprecated use ExportScalarItem */
export type ExportFieldItem = ExportScalarItem

export interface ExportDocumentItem {
  id: string
  docType: string
  fileName: string
  preprocessFileName: string
  includedInBatch: boolean
  fields: ExportItem[]
}

export interface ExportTaskDetail {
  taskId: string
  caseId: string
  caseOrigin: string | null
  sourceFolderName: string
  documents: ExportDocumentItem[]
}

const CASE_DOCUMENTS: Record<string, { docType: string }[]> = {
  'CLAIM-20251023000002': [
    { docType: '保険金請求書' },
    { docType: '診断書' },
    { docType: '診断書' },
    { docType: '領収書・診療明細書' },
    { docType: '領収書・診療明細書' }
  ],
  'CLAIM-20251021000001': [
    { docType: '保険金請求書' },
    { docType: '入院証明書' },
    { docType: '入院証明書' },
    { docType: '本人確認書類' }
  ]
}

function buildExportItems(caseId: string, docType: string): ExportItem[] {
  const fieldTemplates = getFieldTemplatesForDocType(docType)
  const tableTemplates = getTableTemplatesForDocType(docType)

  const scalarItems: ExportScalarItem[] = fieldTemplates.map((template, index) =>
    enrichExportField(caseId, docType, {
      id: template.id,
      label: template.label,
      section: template.section,
      value: template.demoValue,
      selected: true,
      sortOrder: index
    })
  )

  const tableItems: ExportTableItem[] = tableTemplates.map((template, tableIndex) => ({
    kind: 'table' as const,
    id: template.id,
    label: template.label,
    section: template.section,
    selected: true,
    sortOrder: fieldTemplates.length + tableIndex,
    columns: template.columns.map((column) => ({ ...column })),
    rows: template.demoRows.map((row) => ({ ...row }))
  }))

  return [...scalarItems, ...tableItems]
}

function buildDocuments(caseId: string): ExportDocumentItem[] {
  const seeds = CASE_DOCUMENTS[caseId] ?? CASE_DOCUMENTS['CLAIM-20251023000002']
  const caseItem = rawMockCaseList.find((item) => item.caseId === caseId)
  const plans = caseItem
    ? planCaseLogicalFiles({
        caseId: caseItem.caseId,
        receivedAt: caseItem.receivedAt,
        fileCount: caseItem.fileCount,
        uploadedDocTypes: caseItem.uploadedDocTypes
      })
    : []

  return seeds.map((seed, index) => {
    const fileName = plans[index]
      ? resolveMockFileName(plans[index])
      : resolveMockFileName({
          uploadBaseName: '20251021',
          documentSplitIndex: index > 0 ? index : undefined,
          extension: 'pdf'
        })

    return {
      id: `${caseId}-doc-${index + 1}`,
      docType: seed.docType,
      fileName,
      preprocessFileName: fileName,
      includedInBatch: true,
      fields: buildExportItems(caseId, seed.docType)
    }
  })
}

export function getExportTask(taskId: string): ExportTaskDetail | null {
  const task = getTaskById(taskId)
  if (!task || task.taskType !== 'export') return null

  return {
    taskId: task.taskId,
    caseId: task.caseId,
    caseOrigin: task.caseOrigin,
    sourceFolderName: task.sourceFolderName,
    documents: buildDocuments(task.caseId)
  }
}

export function getSelectedFields(doc: ExportDocumentItem): ExportItem[] {
  return [...doc.fields]
    .filter((item) => item.selected)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function nowTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nowExportId(): string {
  return `EXP-2025-${String(Math.floor(Math.random() * 90000) + 10000)}`
}

function documentExtractionPayload(task: ExportTaskDetail, doc: ExportDocumentItem) {
  return {
    case_id: task.caseId,
    doc_type: doc.docType,
    file_name: doc.fileName,
    fields: getSelectedFields(doc).map(serializeExtractionItem)
  }
}

function extractionItemsToCsv(items: ExportItem[]): string {
  return `\uFEFF${exportExtractionItemsToCsvLines(items, escapeCsvCell).join('\n')}`
}

function standardFileExt(format: FileExportFormat): string {
  if (format === 'JSON') return 'json'
  if (format === 'EXCEL') return 'xlsx'
  return 'csv'
}

function buildStandardFileContent(caseId: string, format: FileExportFormat): string {
  if (format === 'JSON') {
    return JSON.stringify(caseStandardFieldsPayload(caseId), null, 2)
  }
  return standardFieldsToCsv(caseId, escapeCsvCell)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function recordExport(
  task: ExportTaskDetail,
  format: ExportFormat,
  fileName: string | null,
  fileSize: string | null,
  apiNote: string | null,
  status: ExportHistoryItem['status'] = t('tasks.export.messages.statusSuccess') as ExportHistoryItem['status']
) {
  const record: ExportHistoryItem = {
    exportId: nowExportId(),
    exportedAt: nowTimestamp(),
    caseId: task.caseId,
    caseOrigin: task.caseOrigin,
    sourceFolderName: task.sourceFolderName,
    format,
    operator: '山田 太郎',
    status,
    fileName,
    fileSize,
    apiNote
  }
  addExportHistoryRecord(record)
  return record
}

export function exportDocumentCsv(task: ExportTaskDetail, doc: ExportDocumentItem) {
  const items = getSelectedFields(doc)
  if (!items.length) return false

  const csv = extractionItemsToCsv(items)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const baseName = doc.fileName.replace(/\.[^.]+$/, '')
  triggerDownload(blob, `${baseName}.csv`)

  recordExport(task, 'CSV', `${baseName}.csv`, `${Math.max(4, items.length * 2)} KB`, null)
  return true
}

export function exportDocumentJson(task: ExportTaskDetail, doc: ExportDocumentItem) {
  const items = getSelectedFields(doc)
  if (!items.length) return false

  const payload: Record<string, unknown> = {
    ...documentExtractionPayload(task, doc),
    routing_decision: 'PROCEED'
  }

  const baseName = doc.fileName.replace(/\.[^.]+$/, '')
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  triggerDownload(blob, `${baseName}.json`)

  recordExport(task, 'JSON', `${baseName}.json`, `${Math.max(6, Math.round(json.length / 1024))} KB`, null)
  return true
}

export async function exportBatchZip(
  task: ExportTaskDetail,
  documents: ExportDocumentItem[],
  format: FileExportFormat
) {
  const targets = documents.filter((doc) => doc.includedInBatch && getSelectedFields(doc).length)
  if (!targets.length) return false

  const zip = new JSZip()
  const ext = standardFileExt(format)

  for (const doc of targets) {
    const baseName = doc.fileName.replace(/\.[^.]+$/, '')
    const items = getSelectedFields(doc)
    if (format === 'JSON') {
      zip.file(
        `${EXPORT_OCR_FOLDER_NAME}/${doc.docType}/${baseName}.json`,
        JSON.stringify(
          { ...documentExtractionPayload(task, doc), routing_decision: 'PROCEED' },
          null,
          2
        )
      )
    } else {
      const csv = extractionItemsToCsv(items)
      zip.file(`${EXPORT_OCR_FOLDER_NAME}/${doc.docType}/${baseName}.${ext}`, csv)
    }
  }

  zip.file(
    `標準フィールド/${EXPORT_STANDARD_FILE_BASENAME}.${ext}`,
    buildStandardFileContent(task.caseId, format)
  )

  const blob = await zip.generateAsync({ type: 'blob' })
  const zipName = `export_${task.caseId}.zip`
  triggerDownload(blob, zipName)

  const sizeKb = Math.max(24, targets.length * 12)
  recordExport(task, format, zipName, `${sizeKb} KB`, null)
  return true
}

export async function exportPreprocessZip(task: ExportTaskDetail, documents: ExportDocumentItem[]) {
  if (!documents.length) return false

  const zip = new JSZip()
  for (const doc of documents) {
    const folder = zip.folder(doc.docType)
    folder?.file(
      doc.preprocessFileName,
      `${t('tasks.export.messages.recordPreprocessDemo', { name: doc.preprocessFileName })}\n案件: ${task.caseId}`
    )
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const zipName = `preprocess_${task.caseId}.zip`
  triggerDownload(blob, zipName)

  recordExport(
    task,
    'CSV',
    zipName,
    `${documents.length * 18} KB`,
    t('tasks.export.messages.recordPreprocessFolder')
  )
  return true
}

export function exportViaApi(
  task: ExportTaskDetail,
  doc: ExportDocumentItem | null,
  mockFail = false
) {
  const items = doc ? getSelectedFields(doc) : []
  if (doc && !items.length) return { ok: false as const, reason: 'no-fields' as const }

  const payload = doc
    ? documentExtractionPayload(task, doc)
    : {
        case_id: task.caseId,
        routing_decision: 'PROCEED',
        extraction: {
          documents: task.documents
            .filter((item) => item.includedInBatch)
            .map((item) => documentExtractionPayload(task, item))
        },
        standard_fields: caseStandardFieldsPayload(task.caseId)
      }

  if (mockFail) {
    recordExport(
      task,
      'API',
      null,
      null,
      t('tasks.export.messages.apiAuthError'),
      t('tasks.export.messages.statusFailed') as ExportHistoryItem['status']
    )
    return { ok: false as const, reason: 'api-fail' as const }
  }

  recordExport(
    task,
    'API',
    null,
    null,
    t('tasks.export.messages.apiCoreSuccess'),
    t('tasks.export.messages.statusSuccess') as ExportHistoryItem['status']
  )
  return { ok: true as const, payload }
}

export function reorderField(
  doc: ExportDocumentItem,
  fieldId: string,
  targetIndex: number
): void {
  const sorted = [...doc.fields].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentIndex = sorted.findIndex((field) => field.id === fieldId)
  if (currentIndex < 0) return

  const clamped = Math.max(0, Math.min(targetIndex, sorted.length - 1))
  if (currentIndex === clamped) return

  const [moved] = sorted.splice(currentIndex, 1)
  sorted.splice(clamped, 0, moved)
  sorted.forEach((field, index) => {
    field.sortOrder = index
  })
}

export function moveField(doc: ExportDocumentItem, fieldId: string, direction: -1 | 1) {
  const sorted = [...doc.fields].sort((a, b) => a.sortOrder - b.sortOrder)
  const index = sorted.findIndex((field) => field.id === fieldId)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return

  const currentOrder = sorted[index].sortOrder
  sorted[index].sortOrder = sorted[targetIndex].sortOrder
  sorted[targetIndex].sortOrder = currentOrder
}

export function applyTemplateToSameDocType(
  documents: ExportDocumentItem[],
  sourceDoc: ExportDocumentItem
) {
  for (const doc of documents) {
    if (doc.id === sourceDoc.id || doc.docType !== sourceDoc.docType) continue
    const selection = new Map(sourceDoc.fields.map((field) => [field.id, field.selected]))
    const order = new Map(sourceDoc.fields.map((field) => [field.id, field.sortOrder]))
    for (const field of doc.fields) {
      if (selection.has(field.id)) field.selected = selection.get(field.id)!
      if (order.has(field.id)) field.sortOrder = order.get(field.id)!
    }
  }
}
