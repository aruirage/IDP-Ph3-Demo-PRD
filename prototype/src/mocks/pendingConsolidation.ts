import { ref } from 'vue'
import type { BusinessScenarioValue } from '@/constants/businessScenarios'
import { businessScenarioLabel } from '@/constants/businessScenarios'
import type { PendingLinkStatus } from '@/constants/pendingLinkStatus'
import {
  PENDING_LINK_REASON_EXCLUDED_FROM_AUTO,
  type PendingLinkCandidateCase,
  type PendingLinkReason
} from '@/constants/pendingLinkReason'
import {
  PENDING_FILE_PLANS,
  resolvePendingFileName
} from '@/mocks/mockLogicalFilePlans'
import { mockCaseList, type CaseListItem } from '@/mocks/cases'
import type { CaseFileItem } from '@/mocks/caseFiles'
import { generateCaseId } from '@/utils/caseId'
import { MOCK_SAMPLE_MEDIA_URL } from '@/constants/mockSampleMedia'

export interface PendingAssociationField {
  key: string
  value: string
}

/** @deprecated 三期已删除可忽略队列，仅保留 review */
export type PendingQueueKind = 'review'

/** @deprecated 三期已删除 7 日自动清空逻辑 */
export const IGNORE_RETENTION_DAYS = 7

export interface PendingConsolidationFile {
  id: string
  fileName: string
  /** 分割前的上传源文件 */
  sourceFileId: string
  sourceFileName: string
  /** 内部取込元（操作端不展示） */
  sourceFolderName: string
  businessScene: BusinessScenarioValue
  fileType: string | null
  uploadedAt: string
  updatedAt: string
  size: number
  ext: string
  /** 未紐付け理由（単一） */
  pendingReason: PendingLinkReason | null
  /** 主关联键（案件集约规则匹配用，由关联字段派生，界面不单独展示） */
  relatedKeyValue: string | null
  /** Phase1 按账票类型配置抽取的关联字段（可多项，界面展示） */
  associationFields: PendingAssociationField[]
  previewUrl: string
  linkStatus: PendingLinkStatus
  /** 候補衝突時の命中案件 */
  candidateCases: PendingLinkCandidateCase[]
  /** 逻辑清空时间；非空则不再出现在未集约列表 */
  logicallyClearedAt: string | null
  /** 是否已调用过识别分类（处理超时且为 false 时可「重新执行」） */
  classificationInvoked: boolean
}

export interface PendingSourceGroup {
  sourceFileId: string
  sourceFileName: string
  sourceFolderName: string
  businessScene: BusinessScenarioValue
  uploadedAt: string
  updatedAt: string
  files: PendingConsolidationFile[]
  remainingDays: number | null
}

export interface UploadPendingInput {
  fileName: string
  folderName: string
  size: number
  ext: string
}

const SAMPLE_PREVIEW = MOCK_SAMPLE_MEDIA_URL

const MAIN_DOC_TYPE_BY_SCENE: Partial<Record<BusinessScenarioValue, string>> = {
  CLAIM: '保険金請求書'
}

function inferFileTypeFromName(fileName: string, ext: string) {
  const name = fileName.toLowerCase()
  if (name.includes('診断書')) return '診断書'
  if (name.includes('請求書') || name.includes('請求')) return '保険金請求書'
  if (name.includes('領収') || name.includes('明細')) return '領収書・診療明細書'
  if (name.includes('本人確認')) return '本人確認書類'
  return ext.toUpperCase()
}

function mockAssociationFields(
  fileName: string,
  relatedKeyValue: string | null
): PendingAssociationField[] {
  const fields: PendingAssociationField[] = []
  if (relatedKeyValue) {
    fields.push({ key: '請求番号', value: relatedKeyValue })
  }
  const nameMatch = fileName.match(/^(.+?)_/)
  if (nameMatch) {
    fields.push({ key: '被保険者氏名', value: nameMatch[1].replace(/_/g, ' ') })
  }
  return fields
}

function mockRelatedKeyValue(fileName: string, seq: number): string | null {
  const embedded = fileName.match(/REQ-\d{4}-\d+/i)
  if (embedded) return embedded[0].toUpperCase()
  if (fileName.includes('本人確認')) return '鈴木美咲'
  return `REQ-2025-${String(1_890_000 + seq).slice(-7)}`
}

function formatUploadTimestamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function touchPendingFileUpdatedAt(file: PendingConsolidationFile) {
  file.updatedAt = formatUploadTimestamp()
}

function formatAssociationFields(fields: PendingAssociationField[]): string {
  if (!fields.length) return '—'
  return fields.map((item) => `${item.key}：${item.value}`).join(' / ')
}

export function getPendingAssociationFields(
  file: PendingConsolidationFile
): PendingAssociationField[] {
  if (!file.fileType) return []
  return file.associationFields
}

export function formatPendingAssociationFields(file: PendingConsolidationFile): string {
  return formatAssociationFields(getPendingAssociationFields(file))
}

export function parsePendingTimestamp(value: string): Date {
  const [datePart, timePart = '00:00'] = value.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0)
}

export function daysAgoTimestamp(days: number, time = '10:18') {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours || 0, minutes || 0, 0, 0)
  return formatUploadTimestamp(date)
}

export function getIgnoreRemainingDays(file: PendingConsolidationFile, now = new Date()): number {
  const start = parsePendingTimestamp(file.updatedAt)
  const expire = new Date(start)
  expire.setDate(expire.getDate() + IGNORE_RETENTION_DAYS)
  return Math.ceil((expire.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
}

export function isPendingFileLogicallyCleared(file: PendingConsolidationFile): boolean {
  return Boolean(file.logicallyClearedAt)
}

/** @deprecated 三期已删除可忽略自动清空 */
export function purgeExpiredIgnoreFiles() {}

export function getVisiblePendingFiles(
  _queue: PendingQueueKind = 'review'
): PendingConsolidationFile[] {
  return pendingConsolidationFiles.value.filter((file) => !isPendingFileLogicallyCleared(file))
}

function collectPendingAssociationKeys(file: PendingConsolidationFile): Set<string> {
  const keys = new Set<string>()
  if (file.relatedKeyValue?.trim()) {
    keys.add(file.relatedKeyValue.trim())
  }
  for (const field of file.associationFields) {
    if (field.value.trim()) {
      keys.add(field.value.trim())
    }
  }
  if (file.sourceFolderName?.trim()) {
    const folderKey = file.sourceFolderName.trim()
    keys.add(folderKey)
    const underscoreIndex = folderKey.indexOf('_')
    if (underscoreIndex > 0) {
      keys.add(folderKey.slice(0, underscoreIndex))
    }
  }
  return keys
}

/** 同一源文件下关联到的案件 ID（去重；极少出现多个） */
export function getRelatedCaseIdsBySourceFile(sourceFileId: string): string[] {
  const siblings = pendingConsolidationFiles.value.filter(
    (file) => file.sourceFileId === sourceFileId && !isPendingFileLogicallyCleared(file)
  )
  const caseIds = new Set<string>()
  const associationKeys = new Set<string>()

  for (const file of siblings) {
    for (const candidate of file.candidateCases) {
      caseIds.add(candidate.caseId)
    }
    for (const key of collectPendingAssociationKeys(file)) {
      associationKeys.add(key)
    }
  }

  for (const caseItem of mockCaseList) {
    if (associationKeys.has(caseItem.casePrimaryKey)) {
      caseIds.add(caseItem.caseId)
    }
    if (caseItem.sourceFolderName && associationKeys.has(caseItem.sourceFolderName)) {
      caseIds.add(caseItem.caseId)
    }
  }

  return [...caseIds].sort()
}

export function groupPendingFilesBySource(
  files: PendingConsolidationFile[]
): PendingSourceGroup[] {
  const groups = new Map<string, PendingSourceGroup>()

  for (const file of files) {
    const existing = groups.get(file.sourceFileId)
    if (!existing) {
      groups.set(file.sourceFileId, {
        sourceFileId: file.sourceFileId,
        sourceFileName: file.sourceFileName,
        sourceFolderName: file.sourceFolderName,
        businessScene: file.businessScene,
        uploadedAt: file.uploadedAt,
        updatedAt: file.updatedAt,
        files: [file],
        remainingDays:
          file.pendingReason === 'CLASSIFY_FAILED' ? getIgnoreRemainingDays(file) : null
      })
      continue
    }

    existing.files.push(file)
    if (file.uploadedAt > existing.uploadedAt) existing.uploadedAt = file.uploadedAt
    if (file.updatedAt > existing.updatedAt) existing.updatedAt = file.updatedAt
    if (file.pendingReason === 'CLASSIFY_FAILED') {
      const days = getIgnoreRemainingDays(file)
      existing.remainingDays =
        existing.remainingDays == null ? days : Math.min(existing.remainingDays, days)
    }
  }

  return [...groups.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function isEligibleForCaseLinking(file: PendingConsolidationFile): boolean {
  if (isPendingFileLogicallyCleared(file)) return false
  if (file.linkStatus === 'LINKING') return false
  if (file.pendingReason === 'CLASSIFY_FAILED') return false
  return !file.pendingReason || !PENDING_LINK_REASON_EXCLUDED_FROM_AUTO.includes(file.pendingReason)
}

export function getCaseLinkingPool(): PendingConsolidationFile[] {
  return pendingConsolidationFiles.value.filter(isEligibleForCaseLinking)
}

function pendingFileToCaseFile(file: PendingConsolidationFile): CaseFileItem {
  return {
    id: `case-file-${file.id}`,
    fileName: file.fileName,
    fileType: file.fileType ?? '',
    size: file.size,
    uploadedAt: file.uploadedAt,
    updatedAt: file.updatedAt,
    pageCount: file.ext.toLowerCase() === 'pdf' ? 1 : 1,
    processStatus: null,
    previewUrl: file.previewUrl
  }
}

function createCaseFromPendingGroup(
  mainFile: PendingConsolidationFile,
  groupFiles: PendingConsolidationFile[]
): CaseListItem {
  const caseId = generateCaseId(mainFile.uploadedAt)
  const uploadedDocTypes = [
    ...new Set(groupFiles.map((item) => item.fileType).filter((type): type is string => Boolean(type)))
  ]
  const files = groupFiles.map(pendingFileToCaseFile)

  const caseItem: CaseListItem = {
    caseId,
    caseOrigin: mainFile.relatedKeyValue,
    sourceFolderName: mainFile.sourceFolderName,
    caseType: businessScenarioLabel(mainFile.businessScene),
    casePrimaryKey: mainFile.relatedKeyValue ?? mainFile.fileName,
    fileCount: files.length,
    files,
    uploadedDocTypes,
    missingDocTypes: ['本人確認書類'].filter((type) => !uploadedDocTypes.includes(type)),
    listStatus: 'WAITING',
    receivedAt: mainFile.uploadedAt,
    updatedAt: mainFile.uploadedAt,
    status: 'UPLOADED',
    currentStatus: 'アップロード済',
    pendingStage: null,
    preprocess: null,
    ocr: null,
    verification: null,
    export: null,
    judgment: null,
    progress: 0,
    statusLabel: 'アップロード済',
    assigneeName: null
  }

  mockCaseList.unshift(caseItem)
  return caseItem
}

function caseMatchesPendingKey(caseItem: CaseListItem, key: string): boolean {
  return caseItem.casePrimaryKey === key || caseItem.caseOrigin === key
}

function findUniqueExistingCase(file: PendingConsolidationFile): CaseListItem | null {
  if (!file.relatedKeyValue) return null
  const sceneLabel = businessScenarioLabel(file.businessScene)
  const matches = mockCaseList.filter(
    (item) =>
      item.caseType === sceneLabel && caseMatchesPendingKey(item, file.relatedKeyValue!)
  )
  if (matches.length !== 1) return null
  return matches[0]
}

function linkPendingFileToExistingCase(
  file: PendingConsolidationFile,
  caseItem: CaseListItem
): void {
  const caseFile = pendingFileToCaseFile(file)
  caseItem.files.push(caseFile)
  caseItem.fileCount = caseItem.files.length
  if (file.fileType && !caseItem.uploadedDocTypes.includes(file.fileType)) {
    caseItem.uploadedDocTypes = [...caseItem.uploadedDocTypes, file.fileType]
    caseItem.missingDocTypes = caseItem.missingDocTypes.filter((type) => type !== file.fileType)
  }
  caseItem.updatedAt = file.uploadedAt
}

function createCopiedCaseFile(file: PendingConsolidationFile): CaseFileItem {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return {
    ...pendingFileToCaseFile(file),
    id: `case-file-${file.id}-${uniqueSuffix}`
  }
}

/** 多案件候选冲突：将待关联文件复制挂入多个案件（每案独立文件 ID，非共享） */
export function copyPendingFileIntoCases(
  file: PendingConsolidationFile,
  caseIds: string[]
): number {
  let linked = 0
  for (const caseId of caseIds) {
    const caseItem = mockCaseList.find((item) => item.caseId === caseId)
    if (!caseItem) continue
    const caseFile = createCopiedCaseFile(file)
    caseItem.files.push(caseFile)
    caseItem.fileCount = caseItem.files.length
    if (file.fileType && !caseItem.uploadedDocTypes.includes(file.fileType)) {
      caseItem.uploadedDocTypes = [...caseItem.uploadedDocTypes, file.fileType]
      caseItem.missingDocTypes = caseItem.missingDocTypes.filter((type) => type !== file.fileType)
    }
    caseItem.updatedAt = file.uploadedAt
    linked += 1
  }
  return linked
}

export interface CaseLinkingResult {
  processed: number
  casesCreated: number
  casesLinked: number
}

export type CaseLinkingCompleteHandler = (result: CaseLinkingResult) => void

const CASE_LINKING_MOCK_DELAY_MS = 2500

let caseLinkingTimer: ReturnType<typeof setTimeout> | null = null

function isInLinkingBatch(file: PendingConsolidationFile, batchIds: Set<string>): boolean {
  return batchIds.has(file.id) && file.linkStatus === 'LINKING'
}

function finishCaseConsolidationLinking(batchIds: string[]): CaseLinkingResult {
  const batchSet = new Set(batchIds)
  const linkedIds = new Set<string>()
  let casesCreated = 0

  const linkingTargets = pendingConsolidationFiles.value.filter((file) =>
    isInLinkingBatch(file, batchSet)
  )
  const scenes = [...new Set(linkingTargets.map((file) => file.businessScene))]

  for (const scene of scenes) {
    const mainType = MAIN_DOC_TYPE_BY_SCENE[scene]
    if (!mainType) continue

    const scenePool = pendingConsolidationFiles.value.filter(
      (file) => file.businessScene === scene && isInLinkingBatch(file, batchSet)
    )

    const mains = scenePool.filter((file) => file.fileType === mainType)

    for (const main of mains) {
      if (linkedIds.has(main.id)) continue
      if (!main.relatedKeyValue) continue

      const group = scenePool.filter(
        (file) => file.relatedKeyValue === main.relatedKeyValue && !linkedIds.has(file.id)
      )

      if (!group.length) continue

      createCaseFromPendingGroup(main, group)
      group.forEach((file) => linkedIds.add(file.id))
      casesCreated += 1
    }
  }

  const linkedExistingCaseIds = new Set<string>()
  const remaining = pendingConsolidationFiles.value.filter(
    (file) => isInLinkingBatch(file, batchSet) && !linkedIds.has(file.id)
  )

  for (const file of remaining) {
    const targetCase = findUniqueExistingCase(file)
    if (!targetCase) continue
    linkPendingFileToExistingCase(file, targetCase)
    linkedIds.add(file.id)
    linkedExistingCaseIds.add(targetCase.caseId)
  }

  if (linkedIds.size) {
    pendingConsolidationFiles.value = pendingConsolidationFiles.value.filter(
      (file) => !linkedIds.has(file.id)
    )
  }

  for (const file of pendingConsolidationFiles.value) {
    if (batchSet.has(file.id) && file.linkStatus === 'LINKING') {
      file.linkStatus = 'FAILED'
      file.pendingReason = 'NO_MATCH'
      touchPendingFileUpdatedAt(file)
    }
  }

  return {
    processed: linkedIds.size,
    casesCreated,
    casesLinked: linkedExistingCaseIds.size
  }
}

/** Phase2：提交案件关联任务，文件进入关联中；完成后回调结果 */
export function startCaseConsolidationLinking(
  fileIds?: string[],
  onComplete?: CaseLinkingCompleteHandler
): { started: number } {
  const pool = getCaseLinkingPool()
  const targets = fileIds?.length ? pool.filter((file) => fileIds.includes(file.id)) : pool
  const batchIds = targets.map((file) => file.id)
  if (!batchIds.length) return { started: 0 }

  for (const file of pendingConsolidationFiles.value) {
    if (batchIds.includes(file.id)) {
      file.linkStatus = 'LINKING'
      file.pendingReason = null
      touchPendingFileUpdatedAt(file)
    }
  }

  if (caseLinkingTimer) clearTimeout(caseLinkingTimer)
  caseLinkingTimer = setTimeout(() => {
    caseLinkingTimer = null
    const result = finishCaseConsolidationLinking(batchIds)
    onComplete?.(result)
  }, CASE_LINKING_MOCK_DELAY_MS)

  return { started: batchIds.length }
}

/** @deprecated 原型请使用 startCaseConsolidationLinking */
export function runCaseConsolidationLinking(fileIds?: string[]): CaseLinkingResult {
  const pool = getCaseLinkingPool()
  const targets = fileIds?.length ? pool.filter((file) => fileIds.includes(file.id)) : pool
  const batchIds = targets.map((file) => file.id)
  if (!batchIds.length) {
    return { processed: 0, casesCreated: 0, casesLinked: 0 }
  }

  for (const file of pendingConsolidationFiles.value) {
    if (batchIds.includes(file.id)) {
      file.linkStatus = 'LINKING'
      file.pendingReason = null
      touchPendingFileUpdatedAt(file)
    }
  }

  return finishCaseConsolidationLinking(batchIds)
}

let uploadSeq = 0

/** Phase1：分类 / 分割 / 关联字段抽取后写入待关联列表 */
export function addPendingFilesFromUpload(
  files: UploadPendingInput[],
  businessScene: BusinessScenarioValue
) {
  if (!files.length) return

  const uploadedAt = formatUploadTimestamp()
  const ingestId = Date.now()

  const newItems: PendingConsolidationFile[] = files.map((file) => {
    uploadSeq += 1
    const fileType = inferFileTypeFromName(file.fileName, file.ext)
    const relatedKeyValue = mockRelatedKeyValue(file.fileName, uploadSeq)
    const associationFields = mockAssociationFields(file.fileName, relatedKeyValue)

    return {
      id: `pending-${ingestId}-${uploadSeq}`,
      fileName: file.fileName,
      sourceFileId: `src-${ingestId}-${uploadSeq}`,
      sourceFileName: file.fileName,
      sourceFolderName: file.folderName,
      businessScene,
      fileType,
      uploadedAt,
      updatedAt: uploadedAt,
      size: file.size,
      ext: file.ext.toLowerCase(),
      pendingReason: null,
      relatedKeyValue,
      associationFields,
      previewUrl: SAMPLE_PREVIEW,
      linkStatus: 'LINKING',
      candidateCases: [],
      logicallyClearedAt: null,
      classificationInvoked: true
    }
  })

  pendingConsolidationFiles.value = [...newItems, ...pendingConsolidationFiles.value]
}

interface SourceFileSeed {
  sourceFileId: string
  sourceFileName: string
  sourceFolderName: string
}

const SOURCE_WATANABE: SourceFileSeed = {
  sourceFileId: 'src-watanabe',
  sourceFileName: '渡辺拓也_入院請求.pdf',
  sourceFolderName: '渡辺拓也_入院請求'
}

const SOURCE_RECEIPT: SourceFileSeed = {
  sourceFileId: 'src-receipt',
  sourceFileName: '未分類_領収明細.jpg',
  sourceFolderName: '未分類_20260908'
}

const SOURCE_YAMAMOTO: SourceFileSeed = {
  sourceFileId: 'src-yamamoto',
  sourceFileName: '山本大輔_請求.pdf',
  sourceFolderName: '山本大輔_請求'
}

const SOURCE_SUZUKI: SourceFileSeed = {
  sourceFileId: 'src-suzuki',
  sourceFileName: '鈴木美咲_請求.tif',
  sourceFolderName: '鈴木美咲_請求'
}

const SOURCE_SATO: SourceFileSeed = {
  sourceFileId: 'src-sato',
  sourceFileName: '佐藤健_入院請求.pdf',
  sourceFolderName: '佐藤健_入院請求'
}

const SOURCE_TAKAHASHI: SourceFileSeed = {
  sourceFileId: 'src-takahashi',
  sourceFileName: '高橋誠_請求.pdf',
  sourceFolderName: '高橋誠_請求'
}

function pendingName(id: string) {
  const plan = PENDING_FILE_PLANS[id] ?? { uploadBaseName: id, extension: 'pdf' }
  return resolvePendingFileName(id, plan)
}

function createPendingFile(
  partial: Omit<
    PendingConsolidationFile,
    'previewUrl' | 'logicallyClearedAt' | 'candidateCases' | 'classificationInvoked'
  > &
    Partial<
      Pick<
        PendingConsolidationFile,
        'previewUrl' | 'logicallyClearedAt' | 'candidateCases' | 'classificationInvoked'
      >
    >
): PendingConsolidationFile {
  return {
    previewUrl: SAMPLE_PREVIEW,
    logicallyClearedAt: null,
    candidateCases: [],
    ...partial,
    classificationInvoked: partial.classificationInvoked ?? true
  }
}

export function canRetrySourceConsolidation(file: PendingConsolidationFile): boolean {
  return (
    file.pendingReason === 'PROCESSING_TIMEOUT' &&
    !file.classificationInvoked &&
    file.linkStatus !== 'LINKING'
  )
}

function applyMockClassification(file: PendingConsolidationFile) {
  uploadSeq += 1
  file.fileType = inferFileTypeFromName(file.sourceFileName, file.ext)
  file.relatedKeyValue = mockRelatedKeyValue(file.sourceFileName, uploadSeq)
  file.associationFields = mockAssociationFields(file.sourceFileName, file.relatedKeyValue)
  file.classificationInvoked = true
  touchPendingFileUpdatedAt(file)
}

function consolidateSourceByFilenameOrOrigin(sourceFileId: string): CaseLinkingResult {
  const group = pendingConsolidationFiles.value.filter((file) => file.sourceFileId === sourceFileId)
  if (!group.length) {
    return { processed: 0, casesCreated: 0, casesLinked: 0 }
  }

  const mainType = MAIN_DOC_TYPE_BY_SCENE[group[0].businessScene]
  const main =
    group.find((file) => file.fileType === mainType) ??
    group.find((file) => file.relatedKeyValue) ??
    group[0]

  const existing = main.relatedKeyValue ? findUniqueExistingCase(main) : null
  if (existing) {
    for (const file of group) {
      linkPendingFileToExistingCase(file, existing)
    }
    pendingConsolidationFiles.value = pendingConsolidationFiles.value.filter(
      (file) => file.sourceFileId !== sourceFileId
    )
    return { processed: group.length, casesCreated: 0, casesLinked: 1 }
  }

  createCaseFromPendingGroup(main, group)
  pendingConsolidationFiles.value = pendingConsolidationFiles.value.filter(
    (file) => file.sourceFileId !== sourceFileId
  )
  return { processed: group.length, casesCreated: 1, casesLinked: 0 }
}

const SOURCE_RETRY_MOCK_DELAY_MS = 1800

let sourceRetryTimer: ReturnType<typeof setTimeout> | null = null

/** 未集约 · 处理超时且未识别分类的源文件：等同新增上传执行案件集约 */
export function retryPendingSourceConsolidation(
  sourceFileId: string,
  aiCaseLinkEnabled: boolean,
  onComplete?: CaseLinkingCompleteHandler
): { started: boolean } {
  const targets = pendingConsolidationFiles.value.filter(
    (file) => file.sourceFileId === sourceFileId && canRetrySourceConsolidation(file)
  )
  if (!targets.length) return { started: false }

  for (const file of pendingConsolidationFiles.value) {
    if (file.sourceFileId !== sourceFileId || !canRetrySourceConsolidation(file)) continue
    file.linkStatus = 'LINKING'
    file.pendingReason = null
    touchPendingFileUpdatedAt(file)
  }

  if (sourceRetryTimer) clearTimeout(sourceRetryTimer)
  sourceRetryTimer = setTimeout(() => {
    sourceRetryTimer = null
    const group = pendingConsolidationFiles.value.filter((file) => file.sourceFileId === sourceFileId)
    for (const file of group) {
      if (!file.classificationInvoked) {
        applyMockClassification(file)
      }
    }

    const fileIds = group.map((file) => file.id)
    if (aiCaseLinkEnabled) {
      startCaseConsolidationLinking(fileIds, onComplete)
      return
    }

    const result = consolidateSourceByFilenameOrOrigin(sourceFileId)
    onComplete?.(result)
  }, SOURCE_RETRY_MOCK_DELAY_MS)

  return { started: true }
}

const initialPendingFiles: PendingConsolidationFile[] = [
  createPendingFile({
    id: 'pending-001',
    fileName: pendingName('pending-001'),
    ...SOURCE_WATANABE,
    businessScene: 'CLAIM',
    fileType: '診断書',
    uploadedAt: daysAgoTimestamp(1, '10:18'),
    updatedAt: daysAgoTimestamp(1, '10:22'),
    size: 1_842_560,
    ext: 'pdf',
    pendingReason: 'NO_MATCH',
    relatedKeyValue: null,
    associationFields: [],
    linkStatus: 'FAILED'
  }),
  createPendingFile({
    id: 'pending-007',
    fileName: pendingName('pending-007'),
    ...SOURCE_WATANABE,
    businessScene: 'CLAIM',
    fileType: '診断書',
    uploadedAt: daysAgoTimestamp(1, '10:18'),
    updatedAt: daysAgoTimestamp(1, '10:22'),
    size: 1_572_864,
    ext: 'pdf',
    pendingReason: 'NO_MATCH',
    relatedKeyValue: null,
    associationFields: [],
    linkStatus: 'FAILED'
  }),
  createPendingFile({
    id: 'pending-002',
    fileName: pendingName('pending-002'),
    ...SOURCE_RECEIPT,
    businessScene: 'CLAIM',
    fileType: '領収書・診療明細書',
    uploadedAt: daysAgoTimestamp(1, '09:52'),
    updatedAt: daysAgoTimestamp(1, '09:58'),
    size: 524_288,
    ext: 'jpg',
    pendingReason: 'NO_MATCH',
    relatedKeyValue: 'REQ-2025-0018908',
    associationFields: mockAssociationFields(pendingName('pending-002'), 'REQ-2025-0018908'),
    linkStatus: 'FAILED'
  }),
  createPendingFile({
    id: 'pending-008',
    fileName: pendingName('pending-008'),
    ...SOURCE_YAMAMOTO,
    businessScene: 'CLAIM',
    fileType: '診断書',
    uploadedAt: daysAgoTimestamp(0, '11:08'),
    updatedAt: daysAgoTimestamp(0, '11:12'),
    size: 1_310_720,
    ext: 'pdf',
    pendingReason: 'NO_MATCH',
    relatedKeyValue: null,
    associationFields: [],
    linkStatus: 'FAILED'
  }),
  createPendingFile({
    id: 'pending-004',
    fileName: SOURCE_SUZUKI.sourceFileName,
    ...SOURCE_SUZUKI,
    businessScene: 'CLAIM',
    fileType: null,
    uploadedAt: daysAgoTimestamp(2, '08:58'),
    updatedAt: daysAgoTimestamp(2, '09:12'),
    size: 3_145_728,
    ext: 'tif',
    pendingReason: 'PROCESSING_TIMEOUT',
    relatedKeyValue: null,
    associationFields: [],
    linkStatus: 'FAILED',
    classificationInvoked: false
  }),
  createPendingFile({
    id: 'pending-005',
    fileName: pendingName('pending-005'),
    ...SOURCE_SATO,
    businessScene: 'CLAIM',
    fileType: '領収書・診療明細書',
    uploadedAt: daysAgoTimestamp(1, '09:15'),
    updatedAt: daysAgoTimestamp(1, '09:20'),
    size: 786_432,
    ext: 'pdf',
    pendingReason: 'CANDIDATE_CONFLICT',
    relatedKeyValue: 'REQ-2025-0018865',
    associationFields: mockAssociationFields(pendingName('pending-005'), 'REQ-2025-0018865'),
    linkStatus: 'FAILED',
    candidateCases: [
      {
        caseId: 'CLAIM-20251021000042',
        casePrimaryKey: 'REQ-2025-0018865',
        listStatus: 'SUPPLEMENT'
      },
      {
        caseId: 'CLAIM-20251022000001',
        casePrimaryKey: 'REQ-2025-0018865',
        listStatus: 'PROCESSING'
      }
    ]
  }),
  createPendingFile({
    id: 'pending-014',
    fileName: pendingName('pending-014'),
    ...SOURCE_SATO,
    businessScene: 'CLAIM',
    fileType: '領収書・診療明細書',
    uploadedAt: daysAgoTimestamp(1, '09:15'),
    updatedAt: daysAgoTimestamp(1, '09:20'),
    size: 655_360,
    ext: 'pdf',
    pendingReason: 'CANDIDATE_CONFLICT',
    relatedKeyValue: 'REQ-2025-0018865',
    associationFields: mockAssociationFields(pendingName('pending-014'), 'REQ-2025-0018865'),
    linkStatus: 'FAILED',
    candidateCases: [
      {
        caseId: 'CLAIM-20251021000042',
        casePrimaryKey: 'REQ-2025-0018865',
        listStatus: 'SUPPLEMENT'
      },
      {
        caseId: 'CLAIM-20251022000001',
        casePrimaryKey: 'REQ-2025-0018865',
        listStatus: 'PROCESSING'
      }
    ]
  }),
  createPendingFile({
    id: 'pending-006',
    fileName: pendingName('pending-006'),
    ...SOURCE_TAKAHASHI,
    businessScene: 'CLAIM',
    fileType: '診断書',
    uploadedAt: daysAgoTimestamp(0, '07:40'),
    updatedAt: daysAgoTimestamp(0, '07:40'),
    size: 942_080,
    ext: 'pdf',
    pendingReason: null,
    relatedKeyValue: 'REQ-2025-0099007',
    associationFields: [
      { key: '請求番号', value: 'REQ-2025-0099007' },
      { key: '被保険者氏名', value: '高橋誠' }
    ],
    linkStatus: 'LINKING'
  }),
]

export const pendingConsolidationFiles = ref<PendingConsolidationFile[]>(
  initialPendingFiles.map((item) => ({
    ...item,
    associationFields: [...item.associationFields],
    candidateCases: [...item.candidateCases],
    classificationInvoked: item.classificationInvoked ?? true
  }))
)

purgeExpiredIgnoreFiles()

export function formatPendingFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
