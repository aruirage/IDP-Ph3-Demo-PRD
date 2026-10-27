<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onUnmounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Delete, Loading } from '@element-plus/icons-vue'
import ImageViewerFloatingToolbar from '@/components/ImageViewerFloatingToolbar.vue'
import { usePreprocessDrawerNavigation } from '@/composables/usePreprocessDrawerNavigation'
import type { PreprocessLogicalFile, PreprocessPage } from '@/mocks/preprocessConfirmationTask'
import {
  fraudFindingBox,
  getDefaultChildPageId,
  getImageFraudFindingsForPage,
  getMaskingRegionsForPage,
  isFullPageFraudFinding,
  isUnclassifiedPage,
  IMAGE_FRAUD_SUB_TYPE_ORDER,
  getImageSplitBoxesForPage,
  preprocessPagePreviewImage,
  preprocessPreviewCropImgStyle,
  PREPROCESS_REVIEW_CONFIRMATION_TYPES,
  PREPROCESS_REVIEW_TYPE_ORDER,
  resolveImageEditViewMode,
  supportsImageSplitView,
  type ImageFraudFinding,
  type ImageFraudSubType,
  type MaskingRegion,
  type PreprocessReviewType
} from '@/mocks/preprocessConfirmationTask'
import PreprocessImageDrawerSideNav from './PreprocessImageDrawerSideNav.vue'

interface SplitBox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

type BoxCollection = 'split' | 'masking'

interface SidebarChildPage {
  id: string
  box: SplitBox
  index: number
  isFullPage: boolean
}

const FULL_PAGE_BOX: SplitBox = { id: '__full__', x: 0, y: 0, width: 100, height: 100 }

interface ChildPageMeta {
  docType: string
  confirmed: boolean
  rotation?: number
  savedRotation?: number
}

const EDIT_VIEW_MODES = ['split', 'masking', 'fraud'] as const
type EditViewMode = (typeof EDIT_VIEW_MODES)[number]

const EDIT_VIEW_LABEL_KEY: Record<EditViewMode, string> = {
  split: 'tasks.preprocess.editViewSplit',
  masking: 'tasks.preprocess.editViewMasking',
  fraud: 'tasks.preprocess.editViewFraud'
}

const REVIEW_TYPE_LABEL_KEY: Record<PreprocessReviewType, string> = {
  classification: 'tasks.preprocess.lowConfidenceTagClassification',
  segmentation: 'tasks.preprocess.lowConfidenceTagSegmentation',
  sorting: 'tasks.preprocess.lowConfidenceTagSorting',
  imageIntegrity: 'tasks.preprocess.reviewTagImageIntegrity',
  sensitiveInfo: 'tasks.preprocess.reviewTagSensitiveInfo'
}

const FRAUD_SUB_TYPE_LABEL_KEY: Record<ImageFraudSubType, string> = {
  ps: 'tasks.preprocess.fraudSubTypePs',
  aiGenerated: 'tasks.preprocess.fraudSubTypeAiGenerated',
  templateMismatch: 'tasks.preprocess.fraudSubTypeTemplate',
  handwritingMismatch: 'tasks.preprocess.fraudSubTypeHandwriting'
}

const FRAUD_SUB_TYPE_SHORT_KEY: Record<ImageFraudSubType, string> = {
  ps: 'tasks.preprocess.fraudSubTypeShortPs',
  aiGenerated: 'tasks.preprocess.fraudSubTypeShortAi',
  templateMismatch: 'tasks.preprocess.fraudSubTypeShortTemplate',
  handwritingMismatch: 'tasks.preprocess.fraudSubTypeShortHandwriting'
}

type BoxHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

const BOX_HANDLES: BoxHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const MASKING_CORNER_HANDLES: BoxHandle[] = ['nw', 'ne', 'se', 'sw']
const MASKING_EDGE_HANDLES: BoxHandle[] = ['n', 'e', 's', 'w']

const MIN_BOX_SIZE = 8
const MIN_MASKING_HEIGHT = 0
const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 10
const WHEEL_ZOOM_STEP = 5

const props = defineProps<{
  visible: boolean
  page: PreprocessPage | null
  allPages: PreprocessPage[]
  logicalFiles: PreprocessLogicalFile[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:pageId': [pageId: string]
  split: [segmentCount: number]
  saveRotation: [payload: { pageId: string; childPageId?: string; rotation: number }]
  changeClassification: [pageId: string, logicalFileId: string]
}>()

const { t } = useI18n()

const { canGoPrev, canGoNext, currentFileName, getAdjacentPageId } = usePreprocessDrawerNavigation(
  toRef(props, 'page'),
  toRef(props, 'allPages'),
  toRef(props, 'logicalFiles')
)

const stageRef = ref<HTMLElement | null>(null)
const stageWrapRef = ref<HTMLElement | null>(null)
const stageSize = ref({ width: 0, height: 0 })
const splitBoxes = ref<SplitBox[]>([])
const zoom = ref(100)
const rotation = ref(0)
const savedRotation = ref(0)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const spacePressed = ref(false)
const modifierDrawKeyPressed = ref(false)
const activeBoxId = ref<string | null>(null)
const activeChildPageId = ref<string | null>(null)
const drawingPreview = ref<SplitBox | null>(null)
const editViewMode = ref<EditViewMode>('split')
const childPageMeta = ref<Record<string, ChildPageMeta>>({})

const allMaskingRegions = ref<MaskingRegion[]>([])
const activeMaskingRegionId = ref<string | null>(null)

const allFraudRegions = ref<ImageFraudFinding[]>([])

const activeFraudSidebarEntryId = ref<string | null>(null)
const fraudRedetecting = ref(false)

const FRAUD_REDETECT_MOCK_MS = 1500
let fraudRedetectTimer: ReturnType<typeof setTimeout> | null = null

const FRAUD_HANDWRITING_GROUP_ID = '__fraud-handwriting-group__'

type FraudSidebarEntry = {
  id: string
  subType: ImageFraudSubType
  regions: ImageFraudFinding[]
}

let drawStart: { x: number; y: number } | null = null
let interaction: {
  type: 'draw' | BoxHandle
  boxId?: string
  startX: number
  startY: number
  origin: SplitBox
} | null = null

const canExecute = computed(() => splitBoxes.value.length >= 1)

const pagePreviewImage = computed(() =>
  props.page ? preprocessPagePreviewImage(props.page) : ''
)

const toolbarShowRotate = computed(() => editViewMode.value !== 'split')
const toolbarShowSaveRotation = computed(
  () => editViewMode.value !== 'split' && !props.readonly
)

const editHint = computed(() => {
  if (editViewMode.value === 'masking') return t('tasks.preprocess.maskingHint')
  if (editViewMode.value === 'fraud') return t('tasks.preprocess.fraudHint')
  return t('tasks.preprocess.imageSplitHint')
})

const isSplitView = computed(() => editViewMode.value === 'split')
const isMaskingView = computed(() => editViewMode.value === 'masking')
const isFraudView = computed(() => editViewMode.value === 'fraud')

const useChildCropStage = computed(
  () => hasMultipleChildPages.value && (isMaskingView.value || isFraudView.value)
)

/** 脱敏 / 不正 Tab 下，旋转与旋转保存仅作用于当前子页（非父图整页） */
const usesPerChildRotation = computed(
  () => hasMultipleChildPages.value && !isSplitView.value
)

const activeChildCropBox = computed((): SplitBox | null => {
  if (!useChildCropStage.value) return null
  const child = sidebarChildPages.value.find((item) => item.id === activeChildPageId.value)
  if (!child || child.isFullPage) return null
  return child.box
})

const stageAspectRatio = computed(() => {
  const crop = activeChildCropBox.value
  if (crop) return crop.width / crop.height
  return STAGE_ASPECT
})

const showImageSplitView = computed(() =>
  supportsImageSplitView(props.page, props.logicalFiles)
)

const sidebarChildPages = computed((): SidebarChildPage[] => {
  if (splitBoxes.value.length > 0) {
    return splitBoxes.value.map((box, index) => ({
      id: box.id,
      box,
      index: index + 1,
      isFullPage: false
    }))
  }
  if (!props.page) return []
  return [
    {
      id: getDefaultChildPageId(props.page.id),
      box: FULL_PAGE_BOX,
      index: 1,
      isFullPage: true
    }
  ]
})

const hasMultipleChildPages = computed(() => sidebarChildPages.value.length > 1)
const sidebarChildCount = computed(() => sidebarChildPages.value.length)

const hasSplitBoxes = computed(() => splitBoxes.value.length > 0)

const visibleMaskingRegions = computed(() =>
  allMaskingRegions.value.filter((region) => region.childPageId === activeChildPageId.value)
)

const visibleFraudRegions = computed(() =>
  allFraudRegions.value.filter((region) => region.childPageId === activeChildPageId.value)
)

const sortedFraudRegions = computed(() => {
  const order = IMAGE_FRAUD_SUB_TYPE_ORDER
  return [...visibleFraudRegions.value].sort((left, right) => {
    const typeOrder = order.indexOf(left.subType) - order.indexOf(right.subType)
    if (typeOrder !== 0) return typeOrder
    if (isFullPageFraudFinding(left) && !isFullPageFraudFinding(right)) return -1
    if (!isFullPageFraudFinding(left) && isFullPageFraudFinding(right)) return 1
    if (left.subType === 'handwritingMismatch' && right.subType === 'handwritingMismatch') {
      return (left.handwritingVariant ?? 0) - (right.handwritingVariant ?? 0)
    }
    return 0
  })
})

function fraudSidebarEntryId(subType: ImageFraudSubType): string {
  return subType === 'handwritingMismatch' ? FRAUD_HANDWRITING_GROUP_ID : `fraud-subtype-${subType}`
}

/** 不正侧栏固定 4 个子类标签，无命中时也占位展示 */
function buildFraudSidebarEntries(regions: ImageFraudFinding[]): FraudSidebarEntry[] {
  return IMAGE_FRAUD_SUB_TYPE_ORDER.map((subType) => ({
    id: fraudSidebarEntryId(subType),
    subType,
    regions: regions.filter((region) => region.subType === subType)
  }))
}

const fraudSidebarEntries = computed(() => buildFraudSidebarEntries(sortedFraudRegions.value))

const activeFraudSidebarEntry = computed(
  () => fraudSidebarEntries.value.find((entry) => entry.id === activeFraudSidebarEntryId.value) ?? null
)

/** 不正 Tab 画布仅展示当前选中的侧栏项；笔迹不一致项同时展示多种笔迹色框 */
const canvasFraudRegions = computed(() => {
  if (fraudRedetecting.value) return []
  return activeFraudSidebarEntry.value?.regions ?? []
})

function fraudSubTypeLabel(subType: ImageFraudSubType): string {
  return t(FRAUD_SUB_TYPE_LABEL_KEY[subType])
}

function fraudSubTypeShortLabel(subType: ImageFraudSubType): string {
  return t(FRAUD_SUB_TYPE_SHORT_KEY[subType])
}

function fraudFindingBadgeLabel(finding: ImageFraudFinding): string {
  if (isFullPageFraudFinding(finding) && finding.subType === 'aiGenerated') {
    return t('tasks.preprocess.fraudSubTypeShortAiFull')
  }
  if (finding.subType === 'handwritingMismatch' && finding.handwritingVariant) {
    return t('tasks.preprocess.fraudHandwritingVariantShort', {
      variant: finding.handwritingVariant === 1 ? 'A' : 'B'
    })
  }
  return fraudSubTypeShortLabel(finding.subType)
}

function fraudRegionListLabel(region: ImageFraudFinding): string {
  if (isFullPageFraudFinding(region)) {
    if (region.subType === 'aiGenerated') {
      return t('tasks.preprocess.fraudSubTypeAiGeneratedFullPage')
    }
    return `${fraudSubTypeLabel(region.subType)}（${t('tasks.preprocess.fraudScopeFullPage')}）`
  }

  const sameTypeRegional = visibleFraudRegions.value.filter(
    (item) => item.subType === region.subType && !isFullPageFraudFinding(item)
  )
  if (sameTypeRegional.length <= 1) return fraudSubTypeLabel(region.subType)

  const index = sameTypeRegional.findIndex((item) => item.id === region.id) + 1
  return `${fraudSubTypeLabel(region.subType)} ${index}`
}

function fraudSidebarEntryLabel(entry: FraudSidebarEntry): string {
  if (entry.subType === 'handwritingMismatch' || entry.regions.length !== 1) {
    return fraudSubTypeLabel(entry.subType)
  }
  return fraudRegionListLabel(entry.regions[0])
}

function fraudSidebarEntryClasses(entry: FraudSidebarEntry): Record<string, boolean> {
  return {
    [`is-sub-${entry.subType}`]: true
  }
}

function fraudRegionItemClasses(region: ImageFraudFinding): Record<string, boolean> {
  return {
    [`is-sub-${region.subType}`]: true,
    [`is-hw-variant-${region.handwritingVariant}`]:
      region.subType === 'handwritingMismatch' && Boolean(region.handwritingVariant)
  }
}

function classificationSelectValue(page: PreprocessPage): string {
  return isUnclassifiedPage(page) ? '' : page.logicalFileId
}

function classificationPlaceholder(): string {
  if (!props.page) return ''
  return isUnclassifiedPage(props.page)
    ? t('tasks.common.unclassified')
    : t('tasks.preprocess.classificationSelect')
}

function onPageClassificationChange(logicalFileId: string) {
  if (!props.page || props.readonly || !logicalFileId || logicalFileId === props.page.logicalFileId) {
    return
  }
  emit('changeClassification', props.page.id, logicalFileId)
}

function childBelongingFileValue(): string {
  return props.page ? classificationSelectValue(props.page) : ''
}

function onChildBelongingFileChange(logicalFileId: string) {
  onPageClassificationChange(logicalFileId)
}

function childHitReviewTags(childId: string): PreprocessReviewType[] {
  if (!props.page) return []
  const types = props.page.lowConfidenceTypes ?? []
  const ordered = PREPROCESS_REVIEW_TYPE_ORDER.filter((type) => types.includes(type))
  if (!ordered.length) return []

  if (!hasSplitBoxes.value) return ordered

  return ordered.filter((type) => {
    if (type === 'imageIntegrity') {
      return allFraudRegions.value.some((region) => region.childPageId === childId)
    }
    if (type === 'sensitiveInfo') {
      return allMaskingRegions.value.some((region) => region.childPageId === childId)
    }
    return true
  })
}

function childConfirmationReviewTags(childId: string): PreprocessReviewType[] {
  return childHitReviewTags(childId).filter((type) =>
    PREPROCESS_REVIEW_CONFIRMATION_TYPES.includes(type)
  )
}

function showChildConfirmButton(childId: string): boolean {
  return childConfirmationReviewTags(childId).length > 0
}

const STAGE_PADDING = 24
const STAGE_ASPECT = 3 / 4

const stageFitStyle = computed(() => {
  const { width, height } = stageSize.value
  if (!width || !height) return {}
  return {
    width: `${width}px`,
    height: `${height}px`
  }
})

const stageTransform = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value / 100})`
}))

const stageRotateTransform = computed(() => {
  if (isSplitView.value) return undefined
  return rotation.value ? { transform: `rotate(${rotation.value}deg)` } : undefined
})

const panSession = ref({
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0
})

let stageResizeObserver: ResizeObserver | null = null

function fitStageToWrap() {
  const wrap = stageWrapRef.value
  if (!wrap) return

  const rect = wrap.getBoundingClientRect()
  const availW = Math.max(0, rect.width - STAGE_PADDING)
  const availH = Math.max(0, rect.height - STAGE_PADDING)
  if (!availW || !availH) return

  let height = availH
  let width = height * stageAspectRatio.value
  if (width > availW) {
    width = availW
    height = width / stageAspectRatio.value
  }

  stageSize.value = {
    width: Math.floor(width),
    height: Math.floor(height)
  }
}

function bindStageResizeObserver() {
  stageResizeObserver?.disconnect()
  const wrap = stageWrapRef.value
  if (!wrap) return

  stageResizeObserver = new ResizeObserver(() => {
    fitStageToWrap()
  })
  stageResizeObserver.observe(wrap)
  fitStageToWrap()
}

function unbindStageResizeObserver() {
  stageResizeObserver?.disconnect()
  stageResizeObserver = null
  stageSize.value = { width: 0, height: 0 }
}

watch(
  () => [props.visible, props.page?.id] as const,
  async ([open, pageId], previous) => {
    const prevPageId = previous?.[1]
    if (open) {
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      if (props.page) {
        const isPageChange = pageId !== prevPageId
        loadSplitBoxesFromPage(props.page, {
          preserveUiState: !isPageChange && prevPageId !== undefined
        })
        if (isPageChange) {
          applyDefaultEditViewMode(props.page)
        }
      }
      await nextTick()
      bindStageResizeObserver()
    } else {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      endPan()
      unbindStageResizeObserver()
      resetState()
    }
  }
)

function syncChildPageMeta() {
  const defaultDocType = currentFileName.value || props.logicalFiles[0]?.displayName || '保険金請求書'
  const presetDocTypes = ['保険金請求書', '保険金請求書', '診断書 1', '診断書 2']
  const next: Record<string, ChildPageMeta> = {}
  splitBoxes.value.forEach((box, index) => {
    const existing = childPageMeta.value[box.id]
    const persistedRotation = props.page?.childRotations?.[box.id]
    next[box.id] = existing ?? {
      docType: presetDocTypes[index] ?? defaultDocType,
      confirmed: false,
      rotation: persistedRotation ?? 0,
      savedRotation: persistedRotation ?? 0
    }
  })
  if (splitBoxes.value.length === 0 && props.page) {
    const defaultChildId = getDefaultChildPageId(props.page.id)
    const existing = childPageMeta.value[defaultChildId]
    next[defaultChildId] = existing ?? {
      docType: defaultDocType,
      confirmed: props.page.reviewConfirmed ?? false,
      rotation: props.page.rotation ?? 0,
      savedRotation: props.page.rotation ?? 0
    }
  }
  childPageMeta.value = next
}

/** 多子页场景：各子页独立旋转；单页仍用逻辑页 rotation */
function usesChildRotationScope(): boolean {
  return hasMultipleChildPages.value
}

function getChildRotation(childId: string): number {
  if (!props.page) return 0
  if (usesChildRotationScope()) {
    return (
      childPageMeta.value[childId]?.savedRotation ??
      childPageMeta.value[childId]?.rotation ??
      props.page.childRotations?.[childId] ??
      0
    )
  }
  return props.page.rotation ?? 0
}

function persistActiveChildRotation() {
  const childId = activeChildPageId.value
  if (!childId || !usesChildRotationScope()) return
  const meta = childPageMeta.value[childId]
  if (!meta) return
  childPageMeta.value = {
    ...childPageMeta.value,
    [childId]: {
      ...meta,
      rotation: rotation.value,
      savedRotation: savedRotation.value
    }
  }
}

function loadActiveChildRotation() {
  const childId = activeChildPageId.value
  if (!childId) return
  const base = getChildRotation(childId)
  rotation.value = base
  savedRotation.value = base
}

watch(splitBoxes, syncChildPageMeta, { deep: true })

function applyDefaultEditViewMode(page: PreprocessPage) {
  editViewMode.value = resolveImageEditViewMode(page)
}

function loadSplitBoxesFromPage(
  page: PreprocessPage,
  options: { preserveUiState?: boolean } = {}
) {
  const preserveUiState = options.preserveUiState ?? false
  const prevEditViewMode = editViewMode.value
  const prevActiveChildId = activeChildPageId.value
  const prevActiveBoxId = activeBoxId.value
  const prevZoom = zoom.value
  const prevPanX = panX.value
  const prevPanY = panY.value

  const canSplit = supportsImageSplitView(page, props.logicalFiles)
  if (canSplit && page.autoSplitBox) {
    splitBoxes.value = getImageSplitBoxesForPage(page.id, props.allPages)
  } else {
    splitBoxes.value = []
  }

  if (!preserveUiState) {
    zoom.value = 100
    panX.value = 0
    panY.value = 0
    isPanning.value = false
    spacePressed.value = false
    activeBoxId.value = splitBoxes.value[0]?.id ?? null
    activeChildPageId.value =
      splitBoxes.value[0]?.id ?? getDefaultChildPageId(page.id)
  } else {
    const childIds = new Set(
      splitBoxes.value.length > 0
        ? splitBoxes.value.map((box) => box.id)
        : [getDefaultChildPageId(page.id)]
    )
    if (prevActiveChildId && childIds.has(prevActiveChildId)) {
      activeChildPageId.value = prevActiveChildId
      activeBoxId.value =
        prevActiveBoxId && childIds.has(prevActiveBoxId) ? prevActiveBoxId : prevActiveChildId
    }
    editViewMode.value = prevEditViewMode
    zoom.value = prevZoom
    panX.value = prevPanX
    panY.value = prevPanY
  }

  drawingPreview.value = null
  drawStart = null
  interaction = null
  syncChildPageMeta()
  if (splitBoxes.value.length > 1) {
    loadActiveChildRotation()
  } else if (!preserveUiState) {
    const baseRotation = page.rotation ?? 0
    rotation.value = baseRotation
    savedRotation.value = baseRotation
  }
  loadFraudFindingsFromPage(page)
  loadMaskingRegionsFromPage(page)
  syncActiveRegionsForChild()
}

function loadMaskingRegionsFromPage(page: PreprocessPage) {
  allMaskingRegions.value = applyMaskingRegionLabels(getMaskingRegionsForPage(page.id))
}

function maskingRegionLabel(n: number): string {
  return t('tasks.preprocess.maskingRegionLabel', { n })
}

function applyMaskingRegionLabels(regions: MaskingRegion[]): MaskingRegion[] {
  const countByChild: Record<string, number> = {}
  return regions.map((region) => {
    const next = (countByChild[region.childPageId] ?? 0) + 1
    countByChild[region.childPageId] = next
    return { ...region, label: maskingRegionLabel(next) }
  })
}

function renumberMaskingRegionLabels(childPageId: string) {
  let index = 0
  allMaskingRegions.value = allMaskingRegions.value.map((region) => {
    if (region.childPageId !== childPageId) return region
    index += 1
    return { ...region, label: maskingRegionLabel(index) }
  })
}

function loadFraudFindingsFromPage(page: PreprocessPage) {
  allFraudRegions.value = getImageFraudFindingsForPage(page.id)
}

function syncActiveRegionsForChild() {
  activeMaskingRegionId.value = visibleMaskingRegions.value[0]?.id ?? null

  const entries = fraudSidebarEntries.value
  const activeStillVisible = entries.some((entry) => entry.id === activeFraudSidebarEntryId.value)
  if (!activeStillVisible) {
    activeFraudSidebarEntryId.value =
      entries.find((entry) => entry.regions.length > 0)?.id ?? entries[0]?.id ?? null
  }
}

watch(
  () => props.page?.rotation,
  (nextRotation) => {
    if (!props.visible || !props.page || usesChildRotationScope()) return
    const base = nextRotation ?? 0
    rotation.value = base
    savedRotation.value = base
  }
)

watch([activeChildPageId, editViewMode], async () => {
  if (!props.visible) return
  if (fraudRedetecting.value) {
    clearFraudRedetectTimer()
    fraudRedetecting.value = false
  }
  if (usesChildRotationScope()) {
    loadActiveChildRotation()
  }
  if (editViewMode.value === 'fraud') {
    syncActiveRegionsForChild()
  }
  fitZoom()
  await nextTick()
  fitStageToWrap()
})

onBeforeUnmount(() => {
  clearFraudRedetectTimer()
  unbindStageResizeObserver()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  endPan()
})

function resetState() {
  clearFraudRedetectTimer()
  fraudRedetecting.value = false
  splitBoxes.value = []
  childPageMeta.value = {}
  editViewMode.value = 'masking'
  zoom.value = 100
  rotation.value = 0
  savedRotation.value = 0
  panX.value = 0
  panY.value = 0
  isPanning.value = false
  spacePressed.value = false
  modifierDrawKeyPressed.value = false
  activeBoxId.value = null
  drawingPreview.value = null
  drawStart = null
  interaction = null
  allFraudRegions.value = []
  activeFraudSidebarEntryId.value = null
  allMaskingRegions.value = []
  activeMaskingRegionId.value = null
  activeChildPageId.value = null
}

function close() {
  emit('update:visible', false)
}

function clampPercent(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeBox(box: SplitBox): SplitBox {
  let { x, y, width, height } = box
  width = clampPercent(width, MIN_BOX_SIZE, 100)
  height = clampPercent(height, MIN_BOX_SIZE, 100)
  x = clampPercent(x, 0, 100 - width)
  y = clampPercent(y, 0, 100 - height)
  return { ...box, x, y, width, height }
}

function normalizeMaskingBox(box: SplitBox): SplitBox {
  let { x, y, width, height } = box
  width = clampPercent(width, MIN_BOX_SIZE, 100)
  height = clampPercent(height, MIN_MASKING_HEIGHT, 100)
  x = clampPercent(x, 0, 100 - width)
  y = clampPercent(y, 0, 100 - height)
  return { ...box, x, y, width, height }
}

function normalizeBoxForCollection(box: SplitBox, collection: BoxCollection): SplitBox {
  return collection === 'masking' ? normalizeMaskingBox(box) : normalizeBox(box)
}

function meetsDrawnBoxThreshold(box: SplitBox, collection: BoxCollection): boolean {
  if (box.width < MIN_BOX_SIZE) return false
  if (collection === 'masking') return box.height > MIN_MASKING_HEIGHT
  return box.height >= MIN_BOX_SIZE
}

function parentToChildBox(
  crop: SplitBox,
  box: Pick<SplitBox, 'x' | 'y' | 'width' | 'height'> & { id?: string }
): SplitBox {
  return normalizeMaskingBox({
    id: box.id ?? '',
    x: ((box.x - crop.x) / crop.width) * 100,
    y: ((box.y - crop.y) / crop.height) * 100,
    width: (box.width / crop.width) * 100,
    height: (box.height / crop.height) * 100
  })
}

function childToParentBox(crop: SplitBox, box: SplitBox): SplitBox {
  return normalizeMaskingBox({
    ...box,
    x: crop.x + (box.x / 100) * crop.width,
    y: crop.y + (box.y / 100) * crop.height,
    width: (box.width / 100) * crop.width,
    height: (box.height / 100) * crop.height
  })
}

function regionStageStyle(box: Pick<SplitBox, 'x' | 'y' | 'width' | 'height'>) {
  const crop = activeChildCropBox.value
  if (!crop) return boxStyle(box)
  return boxStyle(parentToChildBox(crop, box))
}

function childCropStageImgStyle(crop: SplitBox) {
  return preprocessPreviewCropImgStyle(crop)
}

function fraudRegionStageStyle(region: ImageFraudFinding) {
  if (isFullPageFraudFinding(region)) {
    return boxStyle(FULL_PAGE_BOX)
  }
  return regionStageStyle(fraudFindingBox(region))
}

function pointerToPercent(event: MouseEvent): { x: number; y: number } {
  const stage = stageRef.value
  if (!stage) return { x: 0, y: 0 }
  const rect = stage.getBoundingClientRect()
  return {
    x: clampPercent(((event.clientX - rect.left) / rect.width) * 100),
    y: clampPercent(((event.clientY - rect.top) / rect.height) * 100)
  }
}

function boxStyle(box: Pick<SplitBox, 'x' | 'y' | 'width' | 'height'>) {
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`
  }
}

function isOnInteractiveTarget(event: MouseEvent): boolean {
  const target = event.target as HTMLElement
  return Boolean(
    target.closest('.v-pre-split-dialog__box') ||
      target.closest('.v-pre-split-dialog__handle') ||
      target.closest('.v-pre-split-dialog__box-edge')
  )
}

function isModifierDrawKeyActive(event?: MouseEvent | KeyboardEvent): boolean {
  if (event) {
    return event.ctrlKey || event.metaKey
  }
  return modifierDrawKeyPressed.value
}

function syncModifierDrawKeyFromKeyboard(event: KeyboardEvent) {
  modifierDrawKeyPressed.value = event.ctrlKey || event.metaKey
}

function onKeyDown(event: KeyboardEvent) {
  if (!props.visible) return

  syncModifierDrawKeyFromKeyboard(event)

  const target = event.target as HTMLElement
  const isTyping =
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (event.code === 'Space' && !isTyping) {
    spacePressed.value = true
    event.preventDefault()
    return
  }

  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  if (isTyping) return

  if (editViewMode.value === 'masking' && activeMaskingRegionId.value) {
    event.preventDefault()
    removeMaskingRegion(activeMaskingRegionId.value)
    return
  }

  const splitBoxId = getActiveSplitBoxId()
  if (splitBoxId) {
    event.preventDefault()
    removeBox(splitBoxId)
  }
}

function onKeyUp(event: KeyboardEvent) {
  syncModifierDrawKeyFromKeyboard(event)
  if (event.code === 'Space') {
    spacePressed.value = false
  }
}

function getActiveSplitBoxId(): string | null {
  if (editViewMode.value !== 'split' || props.readonly) return null
  if (activeBoxId.value && splitBoxes.value.some((box) => box.id === activeBoxId.value)) {
    return activeBoxId.value
  }
  if (
    activeChildPageId.value &&
    splitBoxes.value.some((box) => box.id === activeChildPageId.value)
  ) {
    return activeChildPageId.value
  }
  return null
}

function shouldPanInsteadOfDraw(): boolean {
  return (
    spacePressed.value ||
    zoom.value !== 100 ||
    panX.value !== 0 ||
    panY.value !== 0
  )
}

function endPan() {
  isPanning.value = false
  window.removeEventListener('mousemove', movePan)
  window.removeEventListener('mouseup', endPan)
}

function startPan(event: MouseEvent) {
  if (event.button !== 0) return

  isPanning.value = true
  panSession.value = {
    startX: event.clientX,
    startY: event.clientY,
    originX: panX.value,
    originY: panY.value
  }
  window.addEventListener('mousemove', movePan)
  window.addEventListener('mouseup', endPan)
}

function movePan(event: MouseEvent) {
  if (!isPanning.value) return

  panX.value = panSession.value.originX + (event.clientX - panSession.value.startX)
  panY.value = panSession.value.originY + (event.clientY - panSession.value.startY)
}

function setZoom(nextZoom: number) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
}

function handleWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
  setZoom(zoom.value + delta)
}

function onStageMouseDown(event: MouseEvent) {
  if (event.button !== 0 || isOnInteractiveTarget(event)) return

  modifierDrawKeyPressed.value = event.ctrlKey || event.metaKey

  const canDrawSplit =
    editViewMode.value === 'split' && !props.readonly && !shouldPanInsteadOfDraw()
  const canDrawMasking =
    editViewMode.value === 'masking' &&
    !props.readonly &&
    isModifierDrawKeyActive(event) &&
    !spacePressed.value

  if (canDrawSplit) {
    beginDrawBox('split', event)
    return
  }

  if (canDrawMasking) {
    event.preventDefault()
    event.stopPropagation()
    beginDrawBox('masking', event)
    return
  }

  if (shouldPanInsteadOfDraw() || editViewMode.value === 'fraud') {
    startPan(event)
  }
}

function beginDrawBox(collection: BoxCollection, event: MouseEvent) {
  const point = pointerToPercent(event)
  drawStart = point
  if (collection === 'split') {
    activeBoxId.value = null
  } else {
    activeMaskingRegionId.value = null
  }
  interaction = {
    type: 'draw',
    startX: point.x,
    startY: point.y,
    origin: { id: '', x: point.x, y: point.y, width: 0, height: 0 }
  }
  drawingPreview.value = { id: 'preview', x: point.x, y: point.y, width: 0, height: 0 }

  const onMove = (moveEvent: MouseEvent) => {
    if (!drawStart || interaction?.type !== 'draw') return
    const current = pointerToPercent(moveEvent)
    const x = Math.min(drawStart.x, current.x)
    const y = Math.min(drawStart.y, current.y)
    const width = Math.abs(current.x - drawStart.x)
    const height = Math.abs(current.y - drawStart.y)
    drawingPreview.value = normalizeBoxForCollection(
      {
        id: 'preview',
        x,
        y,
        width,
        height
      },
      collection
    )
  }

  const onUp = () => {
    if (drawingPreview.value && meetsDrawnBoxThreshold(drawingPreview.value, collection)) {
      let box = normalizeBoxForCollection(
        {
          ...drawingPreview.value,
          id: `${collection}-box-${Date.now()}`
        },
        collection
      )
      if (collection === 'split') {
        splitBoxes.value = [...splitBoxes.value, box]
        activeBoxId.value = box.id
      } else {
        const crop = activeChildCropBox.value
        if (crop) {
          box = childToParentBox(crop, box)
        }
        const label = nextMaskingRegionLabel()
        const childPageId = activeChildPageId.value ?? getDefaultChildPageId(props.page!.id)
        allMaskingRegions.value = [
          ...allMaskingRegions.value,
          { ...box, label, childPageId }
        ]
        activeMaskingRegionId.value = box.id
      }
    }
    drawingPreview.value = null
    drawStart = null
    interaction = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function nextMaskingRegionLabel(): string {
  const count = visibleMaskingRegions.value.length
  return maskingRegionLabel(count + 1)
}

function selectMaskingRegion(regionId: string) {
  activeMaskingRegionId.value = regionId
}

function removeMaskingRegion(regionId: string) {
  const removed = allMaskingRegions.value.find((region) => region.id === regionId)
  allMaskingRegions.value = allMaskingRegions.value.filter((region) => region.id !== regionId)
  if (removed) {
    renumberMaskingRegionLabels(removed.childPageId)
  }
  if (activeMaskingRegionId.value === regionId) {
    activeMaskingRegionId.value = visibleMaskingRegions.value[0]?.id ?? null
  }
}

function maskingRegionBox(region: MaskingRegion): SplitBox {
  return {
    id: region.id,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height
  }
}

function startBoxInteraction(
  collection: BoxCollection,
  box: SplitBox,
  type: BoxHandle,
  event: MouseEvent
) {
  event.preventDefault()
  event.stopPropagation()
  if (collection === 'split') {
    activeBoxId.value = box.id
    activeChildPageId.value = box.id
  } else {
    activeMaskingRegionId.value = box.id
  }
  const point = pointerToPercent(event)
  const crop = collection === 'masking' ? activeChildCropBox.value : null
  const interactionOrigin = crop ? parentToChildBox(crop, box) : { ...box }
  interaction = {
    type,
    boxId: box.id,
    startX: point.x,
    startY: point.y,
    origin: interactionOrigin
  }

  const onMove = (moveEvent: MouseEvent) => {
    if (!interaction || interaction.boxId !== box.id) return
    const current = pointerToPercent(moveEvent)
    const dx = current.x - interaction.startX
    const dy = current.y - interaction.startY
    const origin = interaction.origin
    let next = { ...origin }

    switch (interaction.type) {
      case 'move':
        next.x = origin.x + dx
        next.y = origin.y + dy
        break
      case 'nw':
        next.x = origin.x + dx
        next.y = origin.y + dy
        next.width = origin.width - dx
        next.height = origin.height - dy
        break
      case 'n':
        next.y = origin.y + dy
        next.height = origin.height - dy
        break
      case 'ne':
        next.y = origin.y + dy
        next.width = origin.width + dx
        next.height = origin.height - dy
        break
      case 'e':
        next.width = origin.width + dx
        break
      case 'se':
        next.width = origin.width + dx
        next.height = origin.height + dy
        break
      case 's':
        next.height = origin.height + dy
        break
      case 'sw':
        next.x = origin.x + dx
        next.width = origin.width - dx
        next.height = origin.height + dy
        break
      case 'w':
        next.x = origin.x + dx
        next.width = origin.width - dx
        break
      default:
        break
    }

    if (next.width < MIN_BOX_SIZE) {
      if (interaction.type === 'nw' || interaction.type === 'w' || interaction.type === 'sw') {
        next.x = origin.x + origin.width - MIN_BOX_SIZE
      }
      next.width = MIN_BOX_SIZE
    }
    const minHeight = collection === 'masking' ? MIN_MASKING_HEIGHT : MIN_BOX_SIZE
    if (minHeight > 0 && next.height < minHeight) {
      if (interaction.type === 'nw' || interaction.type === 'n' || interaction.type === 'ne') {
        next.y = origin.y + origin.height - minHeight
      }
      next.height = minHeight
    }

    let normalized = normalizeBoxForCollection(next, collection)
    if (collection === 'masking' && crop) {
      normalized = childToParentBox(crop, normalized)
    }
    if (collection === 'split') {
      splitBoxes.value = splitBoxes.value.map((item) =>
        item.id === box.id ? normalized : item
      )
    } else {
      allMaskingRegions.value = allMaskingRegions.value.map((item) =>
        item.id === box.id ? { ...normalized, label: item.label, childPageId: item.childPageId } : item
      )
    }
  }

  const onUp = () => {
    interaction = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function removeBox(boxId: string) {
  if (props.readonly) return
  if (!splitBoxes.value.some((box) => box.id === boxId)) return

  splitBoxes.value = splitBoxes.value.filter((box) => box.id !== boxId)
  allFraudRegions.value = allFraudRegions.value.filter((region) => region.childPageId !== boxId)
  allMaskingRegions.value = allMaskingRegions.value.filter((region) => region.childPageId !== boxId)

  const nextBox = splitBoxes.value[0] ?? null
  if (activeBoxId.value === boxId) {
    activeBoxId.value = nextBox?.id ?? null
  }
  if (activeChildPageId.value === boxId) {
    activeChildPageId.value =
      nextBox?.id ?? (props.page ? getDefaultChildPageId(props.page.id) : null)
  }
  syncChildPageMeta()
  syncActiveRegionsForChild()
}

function executeSplit() {
  if (!canExecute.value) return
  emit('split', splitBoxes.value.length)
}

function handleSave() {
  if (showImageSplitView.value && editViewMode.value === 'split' && canExecute.value) {
    executeSplit()
  }
  ElMessage.success(t('tasks.preprocess.editSaveSuccess'))
  close()
}

function toggleChildConfirmed(boxId: string) {
  const meta = childPageMeta.value[boxId]
  if (!meta) return
  meta.confirmed = !meta.confirmed
}

function selectFraudSidebarEntry(entryId: string) {
  activeFraudSidebarEntryId.value = entryId
}

function clearFraudRedetectTimer() {
  if (!fraudRedetectTimer) return
  clearTimeout(fraudRedetectTimer)
  fraudRedetectTimer = null
}

function handleFraudRedetect() {
  if (props.readonly || fraudRedetecting.value || !props.page) return

  fraudRedetecting.value = true
  clearFraudRedetectTimer()

  fraudRedetectTimer = setTimeout(() => {
    fraudRedetectTimer = null
    if (!props.page) {
      fraudRedetecting.value = false
      return
    }
    loadFraudFindingsFromPage(props.page)
    syncActiveRegionsForChild()
    fraudRedetecting.value = false
    ElMessage.success(t('tasks.preprocess.fraudRedetectComplete'))
  }, FRAUD_REDETECT_MOCK_MS)
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP)
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP)
}

function fitZoom() {
  zoom.value = 100
  panX.value = 0
  panY.value = 0
}

function rotateLeft() {
  rotation.value = (rotation.value - 90 + 360) % 360
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
}

function handleSaveRotation() {
  if (!props.page) return

  savedRotation.value = rotation.value

  if (usesPerChildRotation.value && activeChildPageId.value) {
    persistActiveChildRotation()
    emit('saveRotation', {
      pageId: props.page.id,
      childPageId: activeChildPageId.value,
      rotation: rotation.value
    })
  } else {
    emit('saveRotation', {
      pageId: props.page.id,
      rotation: rotation.value
    })
  }
  ElMessage.success(t('tasks.preprocess.saveRotationSuccess'))
}

function previewCropImgStyle(box: SplitBox) {
  return preprocessPreviewCropImgStyle(box)
}

function selectChildPage(childId: string) {
  if (usesChildRotationScope() && activeChildPageId.value && activeChildPageId.value !== childId) {
    persistActiveChildRotation()
  }
  activeChildPageId.value = childId
  if (splitBoxes.value.some((box) => box.id === childId)) {
    activeBoxId.value = childId
  }
  if (usesChildRotationScope()) {
    loadActiveChildRotation()
  }
  syncActiveRegionsForChild()
}

function navigatePage(direction: 'prev' | 'next') {
  const pageId = getAdjacentPageId(direction)
  if (!pageId) return
  emit('update:pageId', pageId)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    direction="rtl"
    size="80%"
    class="v-pre-image-drawer v-pre-split-drawer"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:visible', $event)"
  >
    <template #header>
      <div class="v-pre-image-drawer__header v-pre-split-drawer__header">
        <div class="v-pre-split-drawer__header-start">
          <span class="v-pre-image-drawer__header-title">
            {{ $t('tasks.preprocess.imageEditTitle') }}
          </span>
        </div>
        <span
          v-if="currentFileName"
          class="v-pre-image-drawer__header-file"
          :title="currentFileName"
        >
          {{ currentFileName }}
        </span>
        <span class="v-pre-image-drawer__header-spacer" aria-hidden="true" />
      </div>
    </template>

    <div class="v-pre-split-drawer__shell v-pre-split-dialog">
      <p class="v-pre-split-dialog__hint">{{ editHint }}</p>

      <div v-if="page" class="v-pre-split-dialog__workspace">
        <div class="v-pre-split-dialog__layout">
          <div class="v-pre-split-dialog__editor">
            <div ref="stageWrapRef" class="v-pre-split-dialog__stage-wrap">
              <PreprocessImageDrawerSideNav
                :can-go-prev="canGoPrev"
                :can-go-next="canGoNext"
                @prev="navigatePage('prev')"
                @next="navigatePage('next')"
              />

              <ImageViewerFloatingToolbar
                variant="floating"
                :show-navigation="false"
                :show-crop="false"
                :show-zoom-percent="true"
                :show-rotate="toolbarShowRotate"
                :show-save-rotation="toolbarShowSaveRotation"
                :zoom="zoom"
                @fit="fitZoom"
                @zoom-in="zoomIn"
                @zoom-out="zoomOut"
                @rotate-left="rotateLeft"
                @rotate-right="rotateRight"
                @save-rotation="handleSaveRotation"
              />

              <div
                class="v-pre-split-dialog__canvas"
                :class="{
                  'is-panning': isPanning,
                  'is-space-pan': spacePressed,
                  'can-pan': shouldPanInsteadOfDraw() || isFraudView,
                  'is-split-mode': isSplitView && !shouldPanInsteadOfDraw(),
                  'is-mask-mode': isMaskingView && !readonly && modifierDrawKeyPressed
                }"
                @wheel.prevent="handleWheel"
              >
                <div class="v-pre-split-dialog__stage-scaler" :style="stageTransform">
                  <div
                    ref="stageRef"
                    class="v-pre-split-dialog__stage"
                    :class="{ 'is-child-crop': useChildCropStage }"
                    :style="stageFitStyle"
                    @mousedown="onStageMouseDown"
                  >
                    <div
                      class="v-pre-split-dialog__stage-rotate"
                      :style="stageRotateTransform"
                    >
                      <div
                        v-if="useChildCropStage && activeChildCropBox && pagePreviewImage"
                        class="v-pre-split-dialog__stage-crop-wrap"
                      >
                        <img
                          class="v-pre-split-dialog__stage-crop-img"
                          :src="pagePreviewImage"
                          :alt="page?.label"
                          :style="childCropStageImgStyle(activeChildCropBox)"
                          draggable="false"
                        />
                      </div>
                      <img
                        v-else-if="pagePreviewImage"
                        class="v-pre-split-dialog__image-photo"
                        :src="pagePreviewImage"
                        :alt="page.sourceImageLabel ?? page.label"
                        draggable="false"
                      />
                      <div
                        v-else
                        class="v-pre-split-dialog__image"
                        :style="{ background: page.sourceImageTone ?? page.tone }"
                      >
                        <span class="v-pre-split-dialog__source-tag">{{ $t('tasks.preprocess.imageSplitSource') }}</span>
                        <span class="v-pre-split-dialog__image-label">
                          {{ page.sourceImageLabel ?? page.label }}
                        </span>
                      </div>

                      <template v-if="editViewMode === 'masking'">
                        <div
                          v-for="region in visibleMaskingRegions"
                          :key="region.id"
                          class="v-pre-split-dialog__box v-pre-split-dialog__box--masking"
                          :class="{ 'is-active': activeMaskingRegionId === region.id }"
                          :style="regionStageStyle(region)"
                          @mousedown.stop="startBoxInteraction('masking', maskingRegionBox(region), 'move', $event)"
                        >
                          <template v-if="!readonly && activeMaskingRegionId === region.id">
                            <button
                              v-for="edge in MASKING_EDGE_HANDLES"
                              :key="`edge-${region.id}-${edge}`"
                              type="button"
                              class="v-pre-split-dialog__box-edge"
                              :class="`is-${edge}`"
                              :aria-label="edge"
                              @mousedown.stop="
                                startBoxInteraction('masking', maskingRegionBox(region), edge, $event)
                              "
                            />
                            <button
                              v-for="handle in MASKING_CORNER_HANDLES"
                              :key="`corner-${region.id}-${handle}`"
                              type="button"
                              class="v-pre-split-dialog__handle v-pre-split-dialog__handle--masking"
                              :class="`is-${handle}`"
                              :aria-label="handle"
                              @mousedown.stop="
                                startBoxInteraction('masking', maskingRegionBox(region), handle, $event)
                              "
                            />
                          </template>
                        </div>

                        <div
                          v-if="drawingPreview"
                          class="v-pre-split-dialog__box v-pre-split-dialog__box--masking is-drawing"
                          :style="boxStyle(drawingPreview)"
                        />
                      </template>

                      <template v-else-if="editViewMode === 'fraud'">
                        <div
                          v-for="region in canvasFraudRegions"
                          :key="region.id"
                          class="v-pre-split-dialog__overlay v-pre-split-dialog__overlay--fraud"
                          :class="{
                            ...fraudRegionItemClasses(region),
                            'is-full-page': isFullPageFraudFinding(region),
                            'is-active': Boolean(activeFraudSidebarEntry)
                          }"
                          :style="fraudRegionStageStyle(region)"
                        >
                          <span class="v-pre-split-dialog__fraud-badge">
                            {{ fraudFindingBadgeLabel(region) }}
                          </span>
                        </div>
                      </template>
                    </div>

                    <template v-if="isSplitView">
                      <div
                        v-for="(box, index) in splitBoxes"
                        :key="box.id"
                        class="v-pre-split-dialog__box"
                        :class="{ 'is-active': activeBoxId === box.id }"
                        :style="boxStyle(box)"
                        @mousedown.stop="startBoxInteraction('split', box, 'move', $event)"
                      >
                        <span class="v-pre-split-dialog__box-no">{{ index + 1 }}</span>
                        <button
                          v-if="!readonly && activeBoxId === box.id"
                          type="button"
                          class="v-pre-split-dialog__box-delete"
                          :aria-label="$t('tasks.preprocess.imageSplitDeleteBox')"
                          @mousedown.stop
                          @click.stop="removeBox(box.id)"
                        >
                          ×
                        </button>
                        <template v-if="!readonly">
                          <button
                            v-for="handle in BOX_HANDLES"
                            :key="handle"
                            type="button"
                            class="v-pre-split-dialog__handle"
                            :class="`is-${handle}`"
                            :aria-label="handle"
                            @mousedown.stop="startBoxInteraction('split', box, handle, $event)"
                          />
                        </template>
                      </div>

                      <div
                        v-if="drawingPreview"
                        class="v-pre-split-dialog__box is-drawing"
                        :style="boxStyle(drawingPreview)"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside class="v-pre-split-dialog__sidebar">
            <div class="v-pre-split-dialog__view-switch" role="tablist">
              <button
                v-for="mode in EDIT_VIEW_MODES"
                :key="mode"
                type="button"
                class="v-pre-split-dialog__view-tab"
                :class="{ 'is-active': editViewMode === mode }"
                role="tab"
                :aria-selected="editViewMode === mode"
                @click="editViewMode = mode"
              >
                {{ $t(EDIT_VIEW_LABEL_KEY[mode]) }}
              </button>
            </div>

            <div
              class="v-pre-split-dialog__sidebar-stack"
              :class="{ 'has-region-panel': editViewMode !== 'split' }"
            >
              <div
                class="v-pre-split-dialog__child-section"
                :class="{ 'has-region-panel': editViewMode !== 'split' }"
              >
                <div class="v-pre-split-dialog__child-head">
                  <span>{{ $t('tasks.preprocess.childPages') }}</span>
                  <span>{{ $t('tasks.common.countItems', { count: sidebarChildCount }) }}</span>
                </div>

                <div class="v-pre-split-dialog__child-list">
                  <div
                    v-for="child in sidebarChildPages"
                    :key="`child-${child.id}`"
                    class="v-pre-split-dialog__child-card"
                    :class="{
                      'is-full-page': child.isFullPage,
                      'is-active': activeChildPageId === child.id
                    }"
                    @click="selectChildPage(child.id)"
                  >
                    <div
                      class="v-pre-split-dialog__child-thumb"
                      :class="{ 'v-pre-split-dialog__child-thumb--full': child.isFullPage }"
                    >
                      <img
                        v-if="child.isFullPage && pagePreviewImage"
                        class="v-pre-split-dialog__child-thumb-image"
                        :src="pagePreviewImage"
                        :alt="page?.label"
                        draggable="false"
                      />
                      <div
                        v-else-if="pagePreviewImage"
                        class="v-pre-split-dialog__child-thumb-crop"
                      >
                        <img
                          class="v-pre-split-dialog__child-thumb-crop-img"
                          :src="pagePreviewImage"
                          :alt="page?.label"
                          :style="previewCropImgStyle(child.box)"
                          draggable="false"
                        />
                      </div>
                    </div>
                    <div class="v-pre-split-dialog__child-body">
                      <div class="v-pre-split-dialog__child-title">
                        {{ $t('tasks.preprocess.childPageLabel', { n: child.index }) }}
                      </div>
                      <el-select
                        :model-value="childBelongingFileValue()"
                        class="v-pre-split-dialog__child-select"
                        :class="{ 'is-unclassified': page && isUnclassifiedPage(page) }"
                        :disabled="readonly"
                        :placeholder="classificationPlaceholder()"
                        @click.stop
                        @change="onChildBelongingFileChange"
                      >
                        <el-option
                          v-for="file in logicalFiles"
                          :key="file.id"
                          :label="file.displayName"
                          :value="file.id"
                        />
                      </el-select>
                      <div
                        v-if="
                          childHitReviewTags(child.id).length || showChildConfirmButton(child.id)
                        "
                        class="v-pre-split-dialog__child-foot"
                      >
                        <div
                          v-if="childHitReviewTags(child.id).length"
                          class="v-pre-split-dialog__child-review-tags"
                        >
                          <span
                            v-for="type in childHitReviewTags(child.id)"
                            :key="`${child.id}-${type}`"
                            class="v-pre-split-dialog__child-review-tag"
                            :class="`is-${type}`"
                          >
                            {{ $t(REVIEW_TYPE_LABEL_KEY[type]) }}
                          </span>
                        </div>
                        <div
                          v-if="showChildConfirmButton(child.id)"
                          class="v-pre-split-dialog__child-actions"
                        >
                          <button
                            type="button"
                            class="v-pre-split-dialog__child-confirm"
                            :class="{ 'is-confirmed': childPageMeta[child.id]?.confirmed }"
                            :disabled="readonly"
                            @click.stop="toggleChildConfirmed(child.id)"
                          >
                            {{
                              childPageMeta[child.id]?.confirmed
                                ? $t('tasks.preprocess.reviewConfirmed')
                                : $t('tasks.preprocess.confirmPending')
                            }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="editViewMode === 'masking'"
                class="v-pre-split-dialog__region-panel"
              >
                <div class="v-pre-split-dialog__region-head">
                  <span>{{ $t('tasks.preprocess.maskingRegions') }}</span>
                </div>
                <div class="v-pre-split-dialog__region-panel-body">
                  <ul v-if="visibleMaskingRegions.length" class="v-pre-split-dialog__region-list">
                    <li
                      v-for="region in visibleMaskingRegions"
                      :key="region.id"
                      class="v-pre-split-dialog__masking-region-row"
                    >
                      <button
                        type="button"
                        class="v-pre-split-dialog__region-item"
                        :class="{ 'is-active': activeMaskingRegionId === region.id }"
                        @click="selectMaskingRegion(region.id)"
                      >
                        {{ region.label }}
                      </button>
                      <button
                        v-if="!readonly"
                        type="button"
                        class="v-pre-split-dialog__region-delete"
                        :aria-label="$t('tasks.preprocess.maskingRegionDelete')"
                        @click.stop="removeMaskingRegion(region.id)"
                      >
                        <el-icon :size="16"><Delete /></el-icon>
                      </button>
                    </li>
                  </ul>
                  <div v-else class="v-pre-split-dialog__region-empty">
                    <el-empty :description="$t('tasks.preprocess.maskingRegionEmpty')" :image-size="48" />
                  </div>
                </div>
              </div>

              <div
                v-else-if="editViewMode === 'fraud'"
                class="v-pre-split-dialog__region-panel"
              >
                <div class="v-pre-split-dialog__region-head">
                  <span>{{ $t('tasks.preprocess.fraudRegions') }}</span>
                  <button
                    type="button"
                    class="v-pre-split-dialog__region-action"
                    :class="{ 'is-loading': fraudRedetecting }"
                    :disabled="readonly || fraudRedetecting"
                    @click="handleFraudRedetect"
                  >
                    {{
                      fraudRedetecting
                        ? $t('tasks.preprocess.fraudRedetecting')
                        : $t('tasks.preprocess.fraudRedetect')
                    }}
                  </button>
                </div>
                <div class="v-pre-split-dialog__region-panel-body">
                  <div
                    v-if="fraudRedetecting"
                    class="v-pre-split-dialog__region-detecting"
                    role="status"
                    aria-live="polite"
                  >
                    <el-icon class="v-pre-split-dialog__region-detecting-icon" :size="20">
                      <Loading />
                    </el-icon>
                    <span>{{ $t('tasks.preprocess.fraudRedetectingHint') }}</span>
                  </div>
                  <ul v-else class="v-pre-split-dialog__region-list">
                    <li v-for="entry in fraudSidebarEntries" :key="entry.id">
                      <button
                        type="button"
                        class="v-pre-split-dialog__region-item v-pre-split-dialog__fraud-item"
                        :class="[
                          fraudSidebarEntryClasses(entry),
                          {
                            'is-active': activeFraudSidebarEntryId === entry.id,
                            'is-empty': !entry.regions.length
                          }
                        ]"
                        @click="selectFraudSidebarEntry(entry.id)"
                      >
                        <span class="v-pre-split-dialog__fraud-item-dot" aria-hidden="true" />
                        <span class="v-pre-split-dialog__fraud-item-label">
                          {{ fraudSidebarEntryLabel(entry) }}
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">
        {{ $t('tasks.save') }}
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.v-pre-split-dialog {
  --pre-child-card-height: 144px;
  --pre-child-list-gap: 10px;
  --pre-child-visible-count: 4;
  --pre-child-head-height: 36px;
  --pre-child-section-gap: 8px;
  --pre-sidebar-child-list-height: calc(
    var(--pre-child-visible-count) * var(--pre-child-card-height) +
      (var(--pre-child-visible-count) - 1) * var(--pre-child-list-gap)
  );
  --pre-sidebar-child-section-height: calc(
    var(--pre-child-head-height) + var(--pre-child-section-gap) +
      var(--pre-sidebar-child-list-height)
  );
  --pre-region-item-height: 40px;
  --pre-region-item-gap: 6px;
  --pre-region-list-rows: 4;
  --pre-region-list-height: calc(
    var(--pre-region-list-rows) * var(--pre-region-item-height) +
      (var(--pre-region-list-rows) - 1) * var(--pre-region-item-gap)
  );
  --pre-region-head-height: 28px;
  --pre-region-panel-padding-block: 20px;
  --pre-region-panel-gap: 8px;
  --pre-sidebar-region-height: calc(
    var(--pre-region-panel-padding-block) + var(--pre-region-head-height) +
      var(--pre-region-panel-gap) + var(--pre-region-list-height)
  );

  &__hint {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__workspace {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
  }

  &__layout {
    height: 100%;
    min-height: 0;
    max-height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    grid-template-rows: minmax(0, 1fr);
    gap: 12px;
    overflow: hidden;
  }

  &__editor {
    min-width: 0;
    min-height: 0;
    height: 100%;
  }

  &__stage-wrap {
    position: relative;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #f3f4f6;
  }

  &__canvas {
    position: absolute;
    inset: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: none;
    cursor: default;

    &.is-split-mode,
    &.is-mask-mode {
      cursor: crosshair;
    }

    &.can-pan,
    &.is-space-pan {
      cursor: grab;
    }

    &.is-panning {
      cursor: grabbing;
    }
  }

  &__stage-scaler {
    transform-origin: center center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__stage {
    position: relative;
    flex-shrink: 0;
    user-select: none;
    touch-action: none;
    overflow: hidden;
    border-radius: 8px;
  }

  &__stage-rotate {
    position: absolute;
    inset: 0;
    transform-origin: center center;
  }

  &__stage-crop-wrap {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
  }

  &__stage-crop-img {
    display: block;
    background: #fff;
  }

  &__image-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    pointer-events: none;
    user-select: none;
  }

  &__sidebar {
    min-width: 0;
    min-height: 0;
    max-height: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #f9fafb;
    overflow: hidden;
  }

  &__sidebar-stack {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.has-region-panel {
      flex: 1 1 0;
      min-height: 0;
    }

    &.has-region-panel &__child-section {
      flex: 1 1 0;
      min-height: 0;
      max-height: var(--pre-sidebar-child-section-height);
      overflow: hidden;
    }

    &.has-region-panel &__region-panel {
      flex: 0 0 var(--pre-sidebar-region-height);
      height: var(--pre-sidebar-region-height);
      min-height: var(--pre-sidebar-region-height);
      max-height: var(--pre-sidebar-region-height);
      overflow: hidden;
    }
  }

  &__view-switch {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 8px;
    border-radius: 12px;
    background: #eef0f3;
    flex-shrink: 0;
  }

  &__view-tab {
    min-width: 0;
    min-height: 36px;
    padding: 8px 6px;
    border: none;
    border-radius: 8px;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: inherit;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &.is-active {
      background: var(--el-color-primary);
      color: #fff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }
  }

  &__child-section {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--pre-child-section-gap);
    overflow: hidden;

    &.has-region-panel {
      flex: 1 1 0;
      min-height: 0;
      max-height: var(--pre-sidebar-child-section-height);
      overflow: hidden;
    }
  }

  &__child-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;

    span:last-child {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
    }
  }

  &__child-list {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--pre-child-list-gap);
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding-right: 2px;

    .has-region-panel & {
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto;
    }
  }

  &__child-card {
    display: flex;
    gap: 10px;
    padding: 10px;
    box-sizing: border-box;
    min-height: var(--pre-child-card-height);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    cursor: pointer;

    .has-region-panel & {
      flex-shrink: 0;
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      box-shadow: inset 0 0 0 1px rgba(23, 92, 211, 0.12);
    }
  }

  &__child-thumb {
    flex-shrink: 0;
    width: 76px;
    height: 108px;
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: #eef0f3;

    &--full {
      width: 88px;
      height: 118px;
    }
  }

  &__child-thumb-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    background: #fff;
  }

  &__child-thumb-crop {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;
  }

  &__child-thumb-crop-img {
    background: #fff;
  }

  &__child-card.is-full-page {
    cursor: default;
  }

  &__child-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__child-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-primary);
  }

    &__child-select {
    width: 100%;

    &.is-unclassified {
      :deep(.el-select__placeholder) {
        color: var(--el-color-warning);
        font-weight: 500;
      }
    }

    :deep(.el-select__wrapper) {
      min-height: 32px;
      padding: 2px 10px;
      font-size: 13px;
    }

    :deep(.el-select__selected-item) {
      font-size: 13px;
    }
  }

  &__child-review-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 0 0 auto;
    min-width: 0;
  }

  &__child-review-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.3;
    color: #c2410c;
    background: #fff7ed;
    border: 1px solid rgba(234, 88, 12, 0.42);
    box-shadow: 0 1px 2px rgba(234, 88, 12, 0.08);
    white-space: nowrap;
  }

  &__child-foot {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    margin-top: auto;
    min-width: 0;
  }

  &__child-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    width: 100%;
  }

  &__child-confirm {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex-shrink: 0;
    min-width: 72px;
    height: 28px;
    padding: 0 12px;
    border: none;
    border-radius: 4px;
    background: var(--el-color-primary);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 1px 2px rgba(23, 92, 211, 0.22);

    &.is-confirmed {
      min-width: 88px;
      padding: 0 10px;
      border-radius: 6px;
      background: #67c23a;
      box-shadow: none;

      &::before {
        content: '';
        display: block;
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        background-color: currentColor;
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23000' d='M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z'/%3E%3C/svg%3E");
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23000' d='M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z'/%3E%3C/svg%3E");
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
      }
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }
  }

  &__region-panel {
    display: flex;
    flex-direction: column;
    gap: var(--pre-region-panel-gap);
    box-sizing: border-box;
    flex-shrink: 0;
    height: var(--pre-sidebar-region-height);
    min-height: var(--pre-sidebar-region-height);
    max-height: var(--pre-sidebar-region-height);
    padding: 12px 0 8px;
    border-top: 1px solid var(--border-color);
    overflow: hidden;
    background: #fff;
    border-radius: 0 0 10px 10px;
  }

  &__region-panel-body {
    flex: 0 0 var(--pre-region-list-height);
    height: var(--pre-region-list-height);
    min-height: 0;
    max-height: var(--pre-region-list-height);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__region-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: var(--pre-region-head-height);
    min-height: var(--pre-region-head-height);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  &__region-action {
    padding: 0;
    border: none;
    background: transparent;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-color-primary);
    cursor: pointer;

    &.is-loading {
      cursor: wait;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  &__region-detecting {
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 12px;
    border: 1px dashed rgba(23, 92, 211, 0.24);
    border-radius: 8px;
    background: rgba(239, 246, 255, 0.72);
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-secondary);
    text-align: center;
    overflow: hidden;
  }

  &__region-detecting-icon {
    color: var(--el-color-primary);
    animation: v-pre-split-dialog-spin 1s linear infinite;
  }

  @keyframes v-pre-split-dialog-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  &__region-empty {
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    :deep(.el-empty) {
      padding: 0;
    }

    :deep(.el-empty__image) {
      width: 40px;
    }

    :deep(.el-empty__description) {
      font-size: 13px;
      margin-top: 8px;
    }
  }

  &__sidebar-empty {
    margin: 0;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-secondary);
    text-align: center;
  }

  &__region-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--pre-region-item-gap);
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding-right: 2px;
  }

  &__region-item {
    display: block;
    width: 100%;
    box-sizing: border-box;
    height: var(--pre-region-item-height);
    min-height: var(--pre-region-item-height);
    max-height: var(--pre-region-item-height);
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    box-sizing: border-box;

    &.is-active:not(.v-pre-split-dialog__fraud-item) {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &--static {
      cursor: default;
    }
  }

  &__overlay-label {
    position: absolute;
    top: 4px;
    left: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    background: rgba(15, 23, 42, 0.72);
  }

  @mixin fraud-sidebar-sub-type-theme {
    &.is-sub-ps {
      --fraud-sidebar-accent: #a85858;
    }

    &.is-sub-aiGenerated {
      --fraud-sidebar-accent: #7a6d8f;
    }

    &.is-sub-templateMismatch {
      --fraud-sidebar-accent: #927048;
    }

    &.is-sub-handwritingMismatch {
      --fraud-sidebar-accent: #587f96;
    }

    &.is-hw-variant-1 {
      --fraud-sidebar-accent: #2f7ea8;
    }

    &.is-hw-variant-2 {
      --fraud-sidebar-accent: #b45309;
    }
  }

  &__overlay {
    position: absolute;
    box-sizing: border-box;
    pointer-events: none;
    z-index: 2;

    &--masking {
      border: none;
      background: #000;
    }

    &--fraud {
      --fraud-highlight: #d64545;
      --fraud-fill: rgba(214, 69, 69, 0.14);

      &.is-hw-variant-1 {
        --fraud-highlight: #2f7ea8;
        --fraud-fill: rgba(47, 126, 168, 0.16);
      }

      &.is-hw-variant-2 {
        --fraud-highlight: #b45309;
        --fraud-fill: rgba(180, 83, 9, 0.16);
      }

      border: 2px dashed var(--fraud-highlight);
      background: var(--fraud-fill);

      &.is-active {
        border-style: solid;
        background: var(--fraud-fill);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--fraud-highlight) 22%, transparent);
      }

      &.is-full-page {
        border-width: 3px;

        .v-pre-split-dialog__fraud-badge {
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
        }
      }
    }
  }

  &__fraud-badge {
    position: absolute;
    top: -10px;
    left: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 20px;
    padding: 0 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    background: var(--fraud-highlight, #d64545);
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
  }

  &__fraud-item {
    display: flex;
    align-items: center;
    gap: 8px;

    @include fraud-sidebar-sub-type-theme;

    &.is-active {
      border-color: color-mix(in srgb, var(--fraud-sidebar-accent) 45%, var(--border-color));
      background: color-mix(in srgb, var(--fraud-sidebar-accent) 10%, #fff);
      color: var(--text-primary);
    }

    &.is-empty {
      opacity: 0.5;

      &.is-active {
        opacity: 0.72;
      }

      .v-pre-split-dialog__fraud-item-dot {
        background: #cbd5e1;
        box-shadow: none;
      }
    }
  }

  &__fraud-item-dot {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--fraud-sidebar-accent, #64748b);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--fraud-sidebar-accent, #64748b) 22%, #fff);
  }

  &__fraud-item-label {
    min-width: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.35;
  }

  &__preview {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #f9fafb;
  }

  &__preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;

    span:last-child {
      font-weight: 500;
      color: var(--text-secondary);
    }
  }

  &__preview-list {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__preview-item {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px;
    border: 2px solid transparent;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    font-family: inherit;
    box-sizing: border-box;

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__preview-crop {
    width: 100%;
    height: 160px;
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: #fff;
  }

  &__preview-image {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__preview-label {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__preview-empty {
    margin: 0;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    font-size: 13px;
    color: var(--text-secondary);
    text-align: center;
  }

  &__preview-actions {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px 12px;
  }

  &__image {
    position: absolute;
    inset: 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    pointer-events: none;
  }

  &__source-tag {
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--el-color-primary-light-7);
  }

  &__image-label {
    font-size: 20px;
    color: var(--text-secondary);
  }

  &__box {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--el-color-primary);
    background: rgba(64, 158, 255, 0.1);
    cursor: move;
    z-index: 2;

    &.is-active {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.35);
      background: rgba(64, 158, 255, 0.14);
    }

    &.is-drawing {
      border-style: dashed;
      pointer-events: none;
      background: rgba(64, 158, 255, 0.08);
    }

    &--masking {
      border: 1px solid #000;
      background: #000;
      cursor: move;
      overflow: visible;

      &.is-active {
        border-color: #000;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.92);
        background: #000;
      }

      &.is-drawing {
        border: 1px dashed rgba(255, 255, 255, 0.85);
        background: #000;
      }

      .v-pre-split-dialog__handle--masking {
        border-color: #fff;
        background: #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
        z-index: 5;
      }
    }
  }

  &__box-edge {
    position: absolute;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    pointer-events: auto;
    z-index: 4;

    .v-pre-split-dialog__box--masking & {
      &.is-n,
      &.is-s {
        left: 0;
        right: 0;
        height: 12px;
      }

      &.is-n {
        top: 0;
        cursor: ns-resize;
      }

      &.is-s {
        bottom: 0;
        cursor: ns-resize;
      }

      &.is-e,
      &.is-w {
        top: 0;
        bottom: 0;
        width: 12px;
      }

      &.is-e {
        right: 0;
        cursor: ew-resize;
      }

      &.is-w {
        left: 0;
        cursor: ew-resize;
      }
    }
  }

  &__handle--masking {
    &.is-nw {
      top: 0;
      left: 0;
      transform: none;
      cursor: nwse-resize;
    }

    &.is-ne {
      top: 0;
      right: 0;
      transform: none;
      cursor: nesw-resize;
    }

    &.is-se {
      bottom: 0;
      right: 0;
      transform: none;
      cursor: nwse-resize;
    }

    &.is-sw {
      bottom: 0;
      left: 0;
      transform: none;
      cursor: nesw-resize;
    }
  }

  &__masking-region-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .v-pre-split-dialog__region-item {
      flex: 1;
      min-width: 0;
      width: auto;
    }
  }

  &__region-delete {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--el-color-danger-light-5);
    border-radius: 8px;
    background: #fff;
    color: var(--el-color-danger);
    cursor: pointer;
    font-family: inherit;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      border-color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger-dark-2);
    }
  }

  &__box-no {
    position: absolute;
    top: 6px;
    left: 6px;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border: 1px solid var(--el-color-primary);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    line-height: 20px;
    text-align: center;
    color: var(--el-color-primary);
    background: rgba(255, 255, 255, 0.96);
    pointer-events: none;
    box-sizing: border-box;
  }

  &__box-delete {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 6;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--el-color-danger-light-5);
    border-radius: 999px;
    background: var(--el-color-danger);
    color: #fff;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    pointer-events: auto;

    &:hover {
      background: var(--el-color-danger-dark-2);
      border-color: var(--el-color-danger-dark-2);
    }
  }

  &__handle {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: 0;
    padding: 0;
    border: 2px solid var(--el-color-primary);
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    z-index: 3;

    &.is-nw {
      top: -6px;
      left: -6px;
      cursor: nwse-resize;
    }

    &.is-n {
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      cursor: ns-resize;
    }

    &.is-ne {
      top: -6px;
      right: -6px;
      cursor: nesw-resize;
    }

    &.is-e {
      top: 50%;
      right: -6px;
      transform: translateY(-50%);
      cursor: ew-resize;
    }

    &.is-se {
      bottom: -6px;
      right: -6px;
      cursor: nwse-resize;
    }

    &.is-s {
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      cursor: ns-resize;
    }

    &.is-sw {
      bottom: -6px;
      left: -6px;
      cursor: nesw-resize;
    }

    &.is-w {
      top: 50%;
      left: -6px;
      transform: translateY(-50%);
      cursor: ew-resize;
    }
  }
}
</style>

<style lang="scss">
.v-pre-split-drawer.el-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;

  .el-drawer__body {
    flex: 1 1 0;
    min-height: 0;
    height: 0;
    overflow: hidden;
    padding: 4px 16px 12px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .el-drawer__footer {
    flex-shrink: 0;
    padding-top: 8px;
  }

  .el-drawer__header {
    align-items: flex-start;
    padding-bottom: 10px;
  }
}

.v-pre-split-drawer__shell {
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.v-pre-image-drawer.el-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 12px 16px 6px;
    align-items: center;
  }

  .el-drawer__title {
    font-size: 16px;
    line-height: 1.3;
  }

  .el-drawer__footer {
    padding-top: 8px;
    flex-shrink: 0;
  }
}

.v-pre-split-drawer__header {
  row-gap: 8px;
}

.v-pre-split-drawer__header-start {
  justify-self: start;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
}

.v-pre-image-drawer__header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 12px;
  padding-right: 8px;
}

.v-pre-image-drawer__header-title {
  justify-self: start;
  min-width: 0;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.v-pre-image-drawer__header-file {
  justify-self: center;
  min-width: 0;
  max-width: min(72vw, 520px);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.v-pre-image-drawer__header-spacer {
  justify-self: end;
}

.v-pre-image-drawer__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.v-pre-image-drawer__body--enlarge-only {
  height: 100%;
}

.v-pre-image-dialog__enlarge-label {
  font-size: 20px;
  color: var(--text-secondary);
}
</style>
