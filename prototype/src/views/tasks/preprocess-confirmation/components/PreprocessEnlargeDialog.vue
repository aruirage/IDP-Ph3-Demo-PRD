<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
import ImageViewerFloatingToolbar from '@/components/ImageViewerFloatingToolbar.vue'
import { usePreprocessDrawerNavigation } from '@/composables/usePreprocessDrawerNavigation'
import type { PreprocessLogicalFile, PreprocessPage } from '@/mocks/preprocessConfirmationTask'
import { preprocessPagePreviewImage } from '@/mocks/preprocessConfirmationTask'
import PreprocessImageDrawerSideNav from './PreprocessImageDrawerSideNav.vue'

const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 10
const WHEEL_ZOOM_STEP = 5
const IMAGE_ASPECT = 3 / 4
const CANVAS_PADDING = 48

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
}>()

const { canGoPrev, canGoNext, currentFileName, getAdjacentPageId } = usePreprocessDrawerNavigation(
  toRef(props, 'page'),
  toRef(props, 'allPages'),
  toRef(props, 'logicalFiles')
)

const canvasRef = ref<HTMLElement | null>(null)
const imageSize = ref({ width: 0, height: 0 })
const zoom = ref(100)
const rotation = ref(0)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)

const panSession = ref({
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0
})

const stageTransform = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value / 100}) rotate(${rotation.value}deg)`
}))

const pagePreviewImage = computed(() =>
  props.page ? preprocessPagePreviewImage(props.page) : ''
)

const imageFitStyle = computed(() => {
  const { width, height } = imageSize.value
  if (!width || !height) return {}
  return {
    width: `${width}px`,
    height: `${height}px`
  }
})

let canvasResizeObserver: ResizeObserver | null = null

function fitImageToCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const availW = Math.max(0, rect.width - CANVAS_PADDING)
  const availH = Math.max(0, rect.height - CANVAS_PADDING)
  if (!availW || !availH) return

  let height = availH
  let width = height * IMAGE_ASPECT
  if (width > availW) {
    width = availW
    height = width / IMAGE_ASPECT
  }

  imageSize.value = {
    width: Math.floor(width),
    height: Math.floor(height)
  }
}

function bindCanvasResizeObserver() {
  canvasResizeObserver?.disconnect()
  const canvas = canvasRef.value
  if (!canvas) return

  canvasResizeObserver = new ResizeObserver(() => {
    fitImageToCanvas()
  })
  canvasResizeObserver.observe(canvas)
  fitImageToCanvas()
}

function unbindCanvasResizeObserver() {
  canvasResizeObserver?.disconnect()
  canvasResizeObserver = null
  imageSize.value = { width: 0, height: 0 }
}

function resetViewerState() {
  const baseRotation = props.page?.rotation ?? 0
  zoom.value = 100
  rotation.value = baseRotation
  panX.value = 0
  panY.value = 0
  isPanning.value = false
}

watch(
  () => [props.visible, props.page?.id, props.page?.rotation] as const,
  async ([visible]) => {
    if (visible) {
      resetViewerState()
      await nextTick()
      bindCanvasResizeObserver()
      return
    }

    unbindCanvasResizeObserver()
  },
  { immediate: true }
)

function close() {
  emit('update:visible', false)
}

function fitZoom() {
  zoom.value = 100
  panX.value = 0
  panY.value = 0
}

function setZoom(nextZoom: number) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP)
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP)
}

function handleWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
  setZoom(zoom.value + delta)
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

onBeforeUnmount(() => {
  endPan()
  unbindCanvasResizeObserver()
})

function rotateLeft() {
  rotation.value = (rotation.value - 90 + 360) % 360
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
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
    class="v-pre-image-drawer v-pre-enlarge-drawer"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:visible', $event)"
    @closed="close"
  >
    <template #header>
      <div class="v-pre-image-drawer__header">
        <span class="v-pre-image-drawer__header-title">{{ $t('tasks.preprocess.enlarge') }}</span>
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

    <div class="v-pre-enlarge-drawer__shell">
      <div v-if="page" class="v-pre-enlarge-drawer__viewer">
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
          :show-zoom-percent="false"
          :show-save-rotation="false"
          :zoom="zoom"
          @fit="fitZoom"
          @rotate-left="rotateLeft"
          @rotate-right="rotateRight"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
        />

        <div
          ref="canvasRef"
          class="v-pre-enlarge-drawer__canvas"
          :class="{ 'is-panning': isPanning }"
          @wheel.prevent="handleWheel"
          @mousedown="startPan"
        >
          <div class="v-pre-enlarge-drawer__stage" :style="stageTransform">
            <div class="v-pre-enlarge-drawer__image" :style="imageFitStyle">
              <img
                v-if="pagePreviewImage"
                :key="pagePreviewImage"
                class="v-pre-enlarge-drawer__photo"
                :src="pagePreviewImage"
                :alt="page.label"
                draggable="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.v-pre-enlarge-drawer {
  &__shell {
    flex: 1 1 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__viewer {
    position: relative;
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #f3f4f6;
    overflow: hidden;
  }

  &__canvas {
    flex: 1 1 0;
    min-height: calc(100vh - 180px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: grab;
    touch-action: none;

    &.is-panning {
      cursor: grabbing;
    }
  }

  &__stage {
    position: relative;
    transform-origin: center center;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__image {
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid rgba(16, 24, 40, 0.08);
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
    background: #fff;
  }

  &__photo {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    background: #fff;
    user-select: none;
    -webkit-user-drag: none;
  }
}
</style>

<style lang="scss">
.v-pre-enlarge-drawer.el-drawer {
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
}

.v-pre-image-drawer.el-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 12px 16px 6px;
    align-items: center;
  }
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
  font-size: 13px;
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
</style>
