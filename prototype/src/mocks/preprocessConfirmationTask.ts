import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'
import { MOCK_SAMPLE_MEDIA_URL, mockDocumentPreviewSrc } from '@/constants/mockSampleMedia'

export type PreprocessReviewType =
  | 'classification'
  | 'segmentation'
  | 'sorting'
  | 'imageIntegrity'
  | 'sensitiveInfo'

/** @deprecated 使用 PreprocessReviewType */
export type PreprocessLowConfidenceType = PreprocessReviewType

export const PREPROCESS_REVIEW_TYPE_ORDER: PreprocessReviewType[] = [
  'classification',
  'segmentation',
  'sorting',
  'imageIntegrity',
  'sensitiveInfo'
]

/** 待复核且展示红色光晕边框的复核类型（敏感情報仅标签、无光晕） */
export const PREPROCESS_REVIEW_RED_HIGHLIGHT_TYPES: PreprocessReviewType[] = [
  'classification',
  'segmentation',
  'sorting',
  'imageIntegrity'
]

/** 需要经办点击确认的复核类型（敏感情報仅脱敏编辑，不需确认） */
export const PREPROCESS_REVIEW_CONFIRMATION_TYPES: PreprocessReviewType[] = [
  'classification',
  'segmentation',
  'sorting',
  'imageIntegrity'
]

/** 侧栏删除逻辑文件后，其下逻辑页归入未分类池（不在侧栏展示为独立文件行） */
export const UNCLASSIFIED_LOGICAL_FILE_ID = '__unclassified__'

export function isUnclassifiedPage(page: PreprocessPage): boolean {
  return page.logicalFileId === UNCLASSIFIED_LOGICAL_FILE_ID
}

export function countUnclassifiedPages(pages: PreprocessPage[]): number {
  return pages.filter(isUnclassifiedPage).length
}

/** 画像分割编辑 Tab 仅对診療明細書开放 */
export const IMAGE_SPLIT_DOC_TYPE = '診療明細書'

/** 不正检测（imageIntegrity）仅对診断書・診療明細書开放 */
export const IMAGE_FRAUD_DOC_TYPES = ['診断書', IMAGE_SPLIT_DOC_TYPE] as const

/** 画像不正の子分類 */
export type ImageFraudSubType =
  | 'ps'
  | 'aiGenerated'
  | 'templateMismatch'
  | 'handwritingMismatch'

export const IMAGE_FRAUD_SUB_TYPE_ORDER: ImageFraudSubType[] = [
  'ps',
  'aiGenerated',
  'templateMismatch',
  'handwritingMismatch'
]

export type ImageFraudScope = 'region' | 'fullPage'

export interface ImageFraudFinding {
  id: string
  subType: ImageFraudSubType
  /** 默认 region；fullPage 表示整张画像命中（如 AI 生成整图） */
  scope?: ImageFraudScope
  childPageId: string
  /** 笔迹不一致子类：区分两种笔迹样式（演示用） */
  handwritingVariant?: 1 | 2
  x: number
  y: number
  width: number
  height: number
}

export function isFullPageFraudFinding(finding: Pick<ImageFraudFinding, 'scope'>): boolean {
  return finding.scope === 'fullPage'
}

export function fraudFindingBox(
  finding: ImageFraudFinding
): Pick<ImageFraudFinding, 'x' | 'y' | 'width' | 'height'> {
  if (isFullPageFraudFinding(finding)) {
    return { x: 0, y: 0, width: 100, height: 100 }
  }
  return {
    x: finding.x,
    y: finding.y,
    width: finding.width,
    height: finding.height
  }
}

/** 演示样张共用：不正局部区域固定坐标（各画面位置一致，整体上移便于展示全部子类） */
const DEMO_FRAUD_REGION_PRESETS: Record<
  ImageFraudSubType,
  Pick<ImageFraudFinding, 'x' | 'y' | 'width' | 'height'>
> = {
  ps: { x: 6, y: 46, width: 28, height: 8 },
  aiGenerated: { x: 36, y: 26, width: 24, height: 10 },
  templateMismatch: { x: 10, y: 4, width: 78, height: 8 },
  handwritingMismatch: { x: 52, y: 60, width: 36, height: 8 }
}

const DEMO_FRAUD_FULL_PAGE_BOX: Pick<ImageFraudFinding, 'x' | 'y' | 'width' | 'height'> = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
}

type DemoFraudHit = {
  id: string
  subType: ImageFraudSubType
  scope?: ImageFraudScope
  /** 默认单个子页；分割场景用 split-1 … split-4 */
  childPageId?: string
  handwritingVariant?: 1 | 2
  box?: Pick<ImageFraudFinding, 'x' | 'y' | 'width' | 'height'>
}

export function getDefaultChildPageId(pageId: string): string {
  return `${pageId}::child-1`
}

function resolveDemoChildPageId(pageId: string, childRef?: string): string {
  if (!childRef || childRef === 'child-1') return getDefaultChildPageId(pageId)
  return childRef
}

/** 各页命中的不正子类（坐标对齐样张手写/命中区域） */
const DEMO_FRAUD_HITS: Record<string, DemoFraudHit[]> = {
  'pre-page-3': [
    { id: 'fraud-ps-1', subType: 'ps', box: { x: 5, y: 43, width: 24, height: 9 } },
    { id: 'fraud-ai-1', subType: 'aiGenerated', box: { x: 54, y: 16.5, width: 26, height: 5.5 } },
    { id: 'fraud-tpl-1', subType: 'templateMismatch', box: { x: 8, y: 2.5, width: 72, height: 6.5 } },
    {
      id: 'fraud-hw-1',
      subType: 'handwritingMismatch',
      handwritingVariant: 1,
      box: { x: 22, y: 31.5, width: 35, height: 5 }
    },
    {
      id: 'fraud-hw-2',
      subType: 'handwritingMismatch',
      handwritingVariant: 2,
      box: { x: 50, y: 39.5, width: 32, height: 5 }
    }
  ],
  'pre-page-11': [
    { id: 'fraud-ps-2', subType: 'ps', box: { x: 5, y: 43, width: 24, height: 9 } },
    {
      id: 'fraud-hw-11a',
      subType: 'handwritingMismatch',
      handwritingVariant: 1,
      box: { x: 22, y: 31.5, width: 35, height: 5 }
    },
    {
      id: 'fraud-hw-11b',
      subType: 'handwritingMismatch',
      handwritingVariant: 2,
      box: { x: 58, y: 81, width: 22, height: 6 }
    }
  ],
  'pre-page-1': [
    { id: 'fraud-ai-full', subType: 'aiGenerated', scope: 'fullPage' },
    { id: 'fraud-tpl-3', subType: 'templateMismatch' }
  ],
  'pre-page-9': [
    { id: 'fraud-ps-9', subType: 'ps', childPageId: 'split-1' },
    { id: 'fraud-ai-9', subType: 'aiGenerated', childPageId: 'split-2' },
    { id: 'fraud-tpl-9', subType: 'templateMismatch', childPageId: 'split-3' },
    {
      id: 'fraud-hw-9a',
      subType: 'handwritingMismatch',
      handwritingVariant: 1,
      childPageId: 'split-4',
      box: { x: 22, y: 31.5, width: 35, height: 5 }
    },
    {
      id: 'fraud-hw-9b',
      subType: 'handwritingMismatch',
      handwritingVariant: 2,
      childPageId: 'split-4',
      box: { x: 50, y: 39.5, width: 32, height: 5 }
    }
  ]
}

function buildDemoFraudFinding(hit: DemoFraudHit, pageId: string): ImageFraudFinding {
  const childPageId = resolveDemoChildPageId(pageId, hit.childPageId)
  if (hit.scope === 'fullPage') {
    return {
      id: hit.id,
      subType: hit.subType,
      scope: 'fullPage',
      childPageId,
      handwritingVariant: hit.handwritingVariant,
      ...DEMO_FRAUD_FULL_PAGE_BOX
    }
  }
  const box = hit.box ?? DEMO_FRAUD_REGION_PRESETS[hit.subType]
  return {
    id: hit.id,
    subType: hit.subType,
    scope: 'region',
    childPageId,
    handwritingVariant: hit.handwritingVariant,
    ...box
  }
}

export function getImageFraudFindingsForPage(pageId: string): ImageFraudFinding[] {
  return (DEMO_FRAUD_HITS[pageId] ?? []).map((hit) => buildDemoFraudFinding(hit, pageId))
}

/** 系统自动标注的脱敏区域 */
export interface MaskingRegion {
  id: string
  childPageId: string
  x: number
  y: number
  width: number
  height: number
  label: string
}

/** 演示样张共用：脱敏区域固定坐标（名称在 UI 层按序号生成） */
const DEMO_MASKING_REGION_PRESETS: Array<Omit<MaskingRegion, 'childPageId' | 'label'>> = [
  { id: 'mask-1', x: 52, y: 10, width: 28, height: 8 },
  { id: 'mask-2', x: 52, y: 18, width: 34, height: 8 },
  { id: 'mask-3', x: 35, y: 32, width: 22, height: 8 },
  { id: 'mask-4', x: 8, y: 48, width: 26, height: 10 }
]

type DemoMaskingAssignment = {
  pageId: string
  /** 默认单个子页；多子页时可指定 split-1 … */
  byChild: Record<string, Array<Omit<MaskingRegion, 'childPageId' | 'label'>>>
}

const DEMO_MASKING_ASSIGNMENTS: DemoMaskingAssignment[] = [
  {
    pageId: 'pre-page-5',
    byChild: {
      'child-1': DEMO_MASKING_REGION_PRESETS
    }
  }
]

export function getMaskingRegionsForPage(pageId: string): MaskingRegion[] {
  const assignment = DEMO_MASKING_ASSIGNMENTS.find((item) => item.pageId === pageId)
  if (!assignment) return []

  const regions: MaskingRegion[] = []
  for (const [childRef, presets] of Object.entries(assignment.byChild)) {
    const childPageId = resolveDemoChildPageId(pageId, childRef)
    for (const preset of presets) {
      regions.push({ ...preset, childPageId, label: '' })
    }
  }
  return regions
}

export function supportsImageSplitView(
  page: PreprocessPage | null | undefined,
  files: PreprocessLogicalFile[]
): boolean {
  if (!page) return false
  const file = files.find((item) => item.id === page.logicalFileId)
  if (!file) return false
  return file.docType === IMAGE_SPLIT_DOC_TYPE
}

/** 按账票类型过滤 mock / 运行时复核标签 */
export function filterReviewTypesForDocType(
  docType: string,
  types: PreprocessReviewType[]
): PreprocessReviewType[] {
  return types.filter((type) => {
    if (type === 'segmentation') return docType === IMAGE_SPLIT_DOC_TYPE
    if (type === 'imageIntegrity') {
      return (IMAGE_FRAUD_DOC_TYPES as readonly string[]).includes(docType)
    }
    return true
  })
}

function filterReviewTypesForPage(
  page: PreprocessPage,
  files: PreprocessLogicalFile[],
  types: PreprocessReviewType[]
): PreprocessReviewType[] {
  const file = files.find((item) => item.id === page.logicalFileId)
  if (!file) return []
  return filterReviewTypesForDocType(file.docType, types)
}

export type PreprocessImageEditViewMode = 'split' | 'masking' | 'fraud'

/** 复核标签 → 画像编辑操作视图 */
export const PREPROCESS_REVIEW_TYPE_EDIT_VIEW: Record<
  PreprocessReviewType,
  PreprocessImageEditViewMode
> = {
  classification: 'split',
  segmentation: 'split',
  sorting: 'split',
  imageIntegrity: 'fraud',
  sensitiveInfo: 'masking'
}

export function resolveImageEditViewMode(
  page: PreprocessPage | null | undefined
): PreprocessImageEditViewMode {
  const types = page?.lowConfidenceTypes ?? []
  for (const type of PREPROCESS_REVIEW_TYPE_ORDER) {
    if (types.includes(type)) {
      return PREPROCESS_REVIEW_TYPE_EDIT_VIEW[type]
    }
  }
  return 'split'
}

export function canDeleteLogicalFile(file: PreprocessLogicalFile): boolean {
  return !file.isMainDoc
}

export function countMainDocFiles(files: PreprocessLogicalFile[]): number {
  return files.filter((file) => file.isMainDoc).length
}

/** 删除该逻辑页后是否会移除本案唯一的主账票文件行 */
export function wouldRemoveLastMainDocFile(
  pages: PreprocessPage[],
  files: PreprocessLogicalFile[],
  pageId: string
): boolean {
  const page = pages.find((item) => item.id === pageId)
  if (!page) return false

  const file = files.find((item) => item.id === page.logicalFileId)
  if (!file?.isMainDoc || countMainDocFiles(files) !== 1) return false

  const pagesInFile = pages.filter((item) => item.logicalFileId === file.id)
  return pagesInFile.length === 1
}

export interface PreprocessAutoSplitBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PreprocessPage {
  id: string
  order: number
  label: string
  logicalFileId: string
  tone: string
  /** 缩略图示例图（PNG/JPG） */
  previewImageUrl?: string
  /** 放大预览用 PDF */
  previewUrl?: string
  lowConfidenceTypes?: PreprocessReviewType[]
  /** 画像分割编辑视图底图标签（原図，校正后原页） */
  sourceImageLabel?: string
  /** 原页底图展示用色调（与逻辑页缩略图区分） */
  sourceImageTone?: string
  /** 当前逻辑页在原图上对应的 AI 自动分割框（每张逻辑页仅一个） */
  autoSplitBox?: PreprocessAutoSplitBox
  /** 低置信度页经经办确认复核后为 true，可反选 */
  reviewConfirmed?: boolean
  /** 人工校正并保存的旋转角度（0/90/180/270） */
  rotation?: number
  /** 多子页场景下各子页独立旋转角度（key 为 split-1 等子页 id） */
  childRotations?: Record<string, number>
}

export interface PreprocessLogicalFile {
  id: string
  docType: string
  displayName: string
  pageIds: string[]
  order: number
  isMainDoc?: boolean
}

export interface PreprocessConfirmationTask {
  taskId: string
  caseId: string
  caseOrigin: string
  sourceFolderName: string
  sourceFileName: string
  totalSourcePages: number
  pages: PreprocessPage[]
  logicalFiles: PreprocessLogicalFile[]
}

const THUMB_TONES = ['#e8eef4', '#eef0e8', '#f0e8ee', '#e8f0ec', '#f2ece8', '#ece8f2']

export const PREPROCESS_PAGE_PREVIEW_URL = MOCK_SAMPLE_MEDIA_URL
export const PREPROCESS_PAGE_PREVIEW_IMAGE = MOCK_SAMPLE_MEDIA_URL

export function preprocessPagePreviewImage(page: Pick<PreprocessPage, 'previewImageUrl'>): string {
  return page.previewImageUrl ?? PREPROCESS_PAGE_PREVIEW_IMAGE
}

/** 百分比裁切框（与 SplitBox / autoSplitBox 坐标系一致） */
export type PreprocessCropBox = Pick<PreprocessAutoSplitBox, 'x' | 'y' | 'width' | 'height'>

/** 子页/逻辑页缩略图：overflow 容器内按百分比框裁切 `<img>` */
export function preprocessPreviewCropImgStyle(box: PreprocessCropBox): Record<string, string> {
  return {
    display: 'block',
    width: `${(100 / box.width) * 100}%`,
    height: `${(100 / box.height) * 100}%`,
    maxWidth: 'none',
    marginLeft: `${-(box.x / box.width) * 100}%`,
    marginTop: `${-(box.y / box.height) * 100}%`
  }
}

/** 診療明細書分割复核演示：一张原图 2×2 子页（坐标对齐样张内容区） */
export const DEMO_IMAGE_SPLIT_BOXES: Array<PreprocessAutoSplitBox & { id: string }> = [
  { id: 'split-1', x: 6, y: 4, width: 42, height: 46 },
  { id: 'split-2', x: 50, y: 4, width: 42, height: 46 },
  { id: 'split-3', x: 6, y: 50, width: 42, height: 44 },
  { id: 'split-4', x: 50, y: 50, width: 42, height: 44 }
]

export function getDemoImageSplitBoxes(): Array<PreprocessAutoSplitBox & { id: string }> {
  return DEMO_IMAGE_SPLIT_BOXES.map((box) => ({ ...box }))
}

/** pre-page-9 专用：2×2 四分割 + 不正四类子页演示 */
const PRE_PAGE_9_SPLIT_DEMO = 'pre-page-9'

function sortSplitSiblingPages(pages: PreprocessPage[]): PreprocessPage[] {
  return [...pages].sort((left, right) => {
    const boxLeft = AUTO_SPLIT_DEMO[left.id]?.box
    const boxRight = AUTO_SPLIT_DEMO[right.id]?.box
    if (!boxLeft || !boxRight) return left.order - right.order
    if (boxLeft.y !== boxRight.y) return boxLeft.y - boxRight.y
    return boxLeft.x - boxRight.x
  })
}

/** 按逻辑页加载分割侧栏/画布用的子页框（同源子页聚合；pre-page-9 为 2×2 演示） */
export function getImageSplitBoxesForPage(
  pageId: string,
  allPages: PreprocessPage[] = []
): Array<PreprocessAutoSplitBox & { id: string }> {
  if (pageId === PRE_PAGE_9_SPLIT_DEMO) {
    return getDemoImageSplitBoxes()
  }

  const current = AUTO_SPLIT_DEMO[pageId]
  if (!current) return []

  const siblings = sortSplitSiblingPages(
    allPages.filter((page) => AUTO_SPLIT_DEMO[page.id]?.sourceId === current.sourceId)
  )
  const pagesForBoxes = siblings.length ? siblings : [allPages.find((page) => page.id === pageId)!].filter(Boolean)

  return pagesForBoxes.map((page, index) => ({
    id: `split-${index + 1}`,
    ...AUTO_SPLIT_DEMO[page.id]!.box
  }))
}

export function preprocessPagePreviewSrc(page: Pick<PreprocessPage, 'previewUrl'>): string {
  const url = page.previewUrl ?? PREPROCESS_PAGE_PREVIEW_URL
  return mockDocumentPreviewSrc(url)
}

function buildPages(assignments: Array<{ fileId: string; count: number }>): PreprocessPage[] {
  const pages: PreprocessPage[] = []
  let order = 1
  let toneIndex = 0
  for (const group of assignments) {
    for (let i = 0; i < group.count; i += 1) {
      pages.push({
        id: `pre-page-${order}`,
        order,
        label: `Page ${order}`,
        logicalFileId: group.fileId,
        tone: THUMB_TONES[toneIndex % THUMB_TONES.length],
        previewImageUrl: PREPROCESS_PAGE_PREVIEW_IMAGE,
        previewUrl: PREPROCESS_PAGE_PREVIEW_URL
      })
      order += 1
      toneIndex += 1
    }
  }
  return pages
}

function applyReviewFlags(
  pages: PreprocessPage[],
  files: PreprocessLogicalFile[],
  flags: Record<string, PreprocessReviewType[]>
): void {
  for (const page of pages) {
    const types = flags[page.id]
    if (!types?.length) continue
    const filtered = filterReviewTypesForPage(page, files, types)
    if (filtered.length) {
      page.lowConfidenceTypes = filtered
    }
  }
}

/** 演示用原页（一张物理页经自动分割产出多张逻辑页） */
const SOURCE_PAGE_DEMO: Record<string, { label: string; tone: string }> = {
  'src-meisai-1': { label: '原図 PDF 5ページ', tone: '#d4e4f2' },
  'src-meisai-2': { label: '原図 PDF 7ページ', tone: '#e8ddd4' }
}

/**
 * 每张逻辑页已是自动分割产物；打开分割编辑时仅展示该页在原图上对应的一个 AI 框。
 * pre-page-6/7 同源（上下分割），pre-page-9/10 同源（左右分割）。
 */
const AUTO_SPLIT_DEMO: Record<
  string,
  { sourceId: string; box: PreprocessAutoSplitBox }
> = {
  'pre-page-6': {
    sourceId: 'src-meisai-1',
    box: { x: 8, y: 5, width: 84, height: 44 }
  },
  'pre-page-7': {
    sourceId: 'src-meisai-1',
    box: { x: 8, y: 52, width: 84, height: 42 }
  },
  'pre-page-9': {
    sourceId: 'src-meisai-2',
    box: { x: 5, y: 8, width: 44, height: 84 }
  },
  'pre-page-10': {
    sourceId: 'src-meisai-2',
    box: { x: 51, y: 8, width: 44, height: 84 }
  }
}

function applyAutoSplitDemo(pages: PreprocessPage[]): void {
  for (const page of pages) {
    const demo = AUTO_SPLIT_DEMO[page.id]
    if (demo) {
      const source = SOURCE_PAGE_DEMO[demo.sourceId]
      if (source) {
        page.sourceImageLabel = source.label
        page.sourceImageTone = source.tone
      }
      page.autoSplitBox = { ...demo.box }
      continue
    }

    page.sourceImageLabel = page.sourceImageLabel ?? `原図 · ${page.label}`
    page.sourceImageTone = page.sourceImageTone ?? page.tone
  }
}

export function hasReviewTypes(page: PreprocessPage): boolean {
  return (page.lowConfidenceTypes?.length ?? 0) > 0
}

export function reviewTypesRequiringConfirmation(page: PreprocessPage): PreprocessReviewType[] {
  const types = page.lowConfidenceTypes ?? []
  return PREPROCESS_REVIEW_CONFIRMATION_TYPES.filter((type) => types.includes(type))
}

/** 是否需展示「確認待ち」并由经办确认（敏感情報命中时不需确认） */
export function requiresReviewConfirmation(page: PreprocessPage): boolean {
  return reviewTypesRequiringConfirmation(page).length > 0
}

export function isLowConfidencePage(page: PreprocessPage): boolean {
  return hasReviewTypes(page)
}

export function usesRedReviewHighlight(page: PreprocessPage): boolean {
  if (!needsReviewPage(page)) return false
  const types = page.lowConfidenceTypes ?? []
  return types.some((type) => PREPROCESS_REVIEW_RED_HIGHLIGHT_TYPES.includes(type))
}

export function needsReviewPage(page: PreprocessPage): boolean {
  return requiresReviewConfirmation(page) && !page.reviewConfirmed
}

export function countPendingReviewPages(pages: PreprocessPage[], fileId: string): number {
  return pages.filter((page) => page.logicalFileId === fileId && needsReviewPage(page)).length
}

export function countAllPendingReviewPages(pages: PreprocessPage[]): number {
  return pages.filter((page) => needsReviewPage(page)).length
}

/** @deprecated 使用 countPendingReviewPages */
export function countLowConfidencePages(pages: PreprocessPage[], fileId: string): number {
  return countPendingReviewPages(pages, fileId)
}

export function sortLogicalFiles(files: PreprocessLogicalFile[]): PreprocessLogicalFile[] {
  return [...files].sort((a, b) => {
    if (a.isMainDoc && !b.isMainDoc) return -1
    if (!a.isMainDoc && b.isMainDoc) return 1
    return a.order - b.order
  })
}

export function recomputeLogicalFileDisplayNames(files: PreprocessLogicalFile[]): void {
  const sorted = sortLogicalFiles(files)
  const countByType: Record<string, number> = {}
  for (const file of sorted) {
    const next = (countByType[file.docType] ?? 0) + 1
    countByType[file.docType] = next
    file.displayName = next === 1 ? file.docType : `${file.docType}${next}`
  }
}

export function syncLogicalFilePageIds(files: PreprocessLogicalFile[], pages: PreprocessPage[]): void {
  for (const file of files) {
    file.pageIds = pages
      .filter((page) => page.logicalFileId === file.id)
      .sort((a, b) => a.order - b.order)
      .map((page) => page.id)
  }
}

export function applyPageImageSplit(
  pages: PreprocessPage[],
  sourcePageId: string,
  segmentCount: number
): PreprocessPage[] {
  if (segmentCount < 1) return pages

  const source = pages.find((page) => page.id === sourcePageId)
  if (!source) return pages

  const newPages: PreprocessPage[] = Array.from({ length: segmentCount }, (_, index) => ({
    id: `pre-page-split-${Date.now()}-${index}`,
    order: 0,
    label: `${source.label} / ${index + 1}`,
    logicalFileId: source.logicalFileId,
    tone: THUMB_TONES[(source.order + index) % THUMB_TONES.length],
    previewImageUrl: source.previewImageUrl ?? PREPROCESS_PAGE_PREVIEW_IMAGE,
    previewUrl: source.previewUrl ?? PREPROCESS_PAGE_PREVIEW_URL
  }))

  const without = pages.filter((page) => page.id !== sourcePageId)
  const sorted = [...without].sort((a, b) => a.order - b.order)
  const before = sorted.filter((page) => page.order < source.order)
  const after = sorted.filter((page) => page.order >= source.order)
  const merged = [...before, ...newPages, ...after]

  return merged.map((page, index) => ({ ...page, order: index + 1 }))
}

export function canCompletePreprocess(pages: PreprocessPage[], files: PreprocessLogicalFile[]): boolean {
  if (!pages.length) return false
  if (pages.some(isUnclassifiedPage)) return false
  if (!pages.every((page) => files.some((file) => file.id === page.logicalFileId))) return false
  return countAllPendingReviewPages(pages) === 0
}

const DEMO_TASKS: Record<string, PreprocessConfirmationTask> = {
  'TASK-PRE-001': {
    taskId: 'TASK-PRE-001',
    caseId: 'CLAIM-20251024000004',
    caseOrigin: 'REQ-2025-0018912',
    sourceFolderName: '渡辺拓也_入院請求',
    sourceFileName: '渡辺拓也_入院請求.pdf',
    totalSourcePages: 15,
    logicalFiles: [
      { id: 'lf-claim', docType: '保険金請求書', displayName: '保険金請求書', pageIds: [], order: 1, isMainDoc: true },
      { id: 'lf-diag', docType: '診断書', displayName: '診断書', pageIds: [], order: 2 },
      { id: 'lf-diag-2', docType: '診断書', displayName: '診断書2', pageIds: [], order: 3 },
      { id: 'lf-detail-1', docType: '診療明細書', displayName: '診療明細書1', pageIds: [], order: 4 },
      { id: 'lf-detail-2', docType: '診療明細書', displayName: '診療明細書2', pageIds: [], order: 5 },
      { id: 'lf-receipt', docType: '領収書', displayName: '領収書', pageIds: [], order: 6 }
    ],
    pages: buildPages([
      { fileId: 'lf-claim', count: 2 },
      { fileId: 'lf-diag', count: 1 },
      { fileId: 'lf-diag-2', count: 1 },
      { fileId: 'lf-detail-1', count: 4 },
      { fileId: 'lf-detail-2', count: 3 },
      { fileId: 'lf-receipt', count: 2 }
    ])
  },
  'TASK-PRE-002': {
    taskId: 'TASK-PRE-002',
    caseId: 'CLAIM-20251022000001',
    caseOrigin: 'REQ-2025-0018865',
    sourceFolderName: '小林直樹_入院請求',
    sourceFileName: '小林直樹_入院請求.pdf',
    totalSourcePages: 8,
    logicalFiles: [
      { id: 'lf-diag-2', docType: '診断書', displayName: '診断書', pageIds: [], order: 1 },
      { id: 'lf-detail-2a', docType: '診療明細書', displayName: '診療明細書1', pageIds: [], order: 2 }
    ],
    pages: buildPages([
      { fileId: 'lf-diag-2', count: 3 },
      { fileId: 'lf-detail-2a', count: 5 }
    ])
  }
}

const REVIEW_FLAGS_BY_TASK: Record<string, Record<string, PreprocessReviewType[]>> = {
  'TASK-PRE-001': {
    // 保険金請求書：分类复核 1 件
    'pre-page-2': ['classification'],
    // 診断書：不正 1 件
    'pre-page-3': ['imageIntegrity'],
    // 診療明細書1：脱敏 + 分割（原図 demo）
    'pre-page-5': ['sensitiveInfo'],
    'pre-page-6': ['segmentation'],
    'pre-page-7': ['segmentation'],
    // 診療明細書2：分割 + 不正
    'pre-page-9': ['segmentation', 'imageIntegrity'],
    'pre-page-10': ['segmentation'],
    'pre-page-11': ['imageIntegrity']
  },
  'TASK-PRE-002': {
    // 診断書：不正 + 分类各 1 件
    'pre-page-1': ['imageIntegrity'],
    'pre-page-2': ['classification'],
    // 診療明細書：分割 1 件
    'pre-page-5': ['segmentation']
  }
}

for (const [taskId, task] of Object.entries(DEMO_TASKS)) {
  applyReviewFlags(task.pages, task.logicalFiles, REVIEW_FLAGS_BY_TASK[taskId] ?? {})
  applyAutoSplitDemo(task.pages)
  syncLogicalFilePageIds(task.logicalFiles, task.pages)
}

export function getPreprocessConfirmationTask(taskId: string): PreprocessConfirmationTask | null {
  const task = DEMO_TASKS[taskId]
  if (!task) return null
  return {
    ...task,
    pages: task.pages.map((page) => ({
      ...page,
      lowConfidenceTypes: page.lowConfidenceTypes ? [...page.lowConfidenceTypes] : undefined,
      sourceImageLabel: page.sourceImageLabel,
      sourceImageTone: page.sourceImageTone,
      autoSplitBox: page.autoSplitBox ? { ...page.autoSplitBox } : undefined,
      reviewConfirmed: page.reviewConfirmed ?? false,
      rotation: page.rotation,
      childRotations: page.childRotations ? { ...page.childRotations } : undefined
    })),
    logicalFiles: task.logicalFiles.map((file) => ({
      ...file,
      pageIds: [...file.pageIds],
      isMainDoc: file.isMainDoc ?? false
    }))
  }
}

export function preprocessDocTypeOptions(): string[] {
  const demoTypes = ['診療明細書', '診断書', '領収書']
  return [...new Set([...PREPROCESS_DOC_TYPES, ...demoTypes])]
}

export function createLogicalFile(docType: string, files: PreprocessLogicalFile[]): PreprocessLogicalFile {
  const file: PreprocessLogicalFile = {
    id: `lf-${Date.now()}`,
    docType,
    displayName: docType,
    pageIds: [],
    order: files.length + 1
  }
  files.push(file)
  recomputeLogicalFileDisplayNames(files)
  return file
}
