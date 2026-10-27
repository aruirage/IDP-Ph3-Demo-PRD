<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DocumentPreviewMedia from '@/components/DocumentPreviewMedia.vue'
import ImageViewerFloatingToolbar from '@/components/ImageViewerFloatingToolbar.vue'
import { isPdfDocumentUrl } from '@/constants/mockSampleMedia'

const props = withDefaults(
  defineProps<{
    imageUrl: string
    hideToolbar?: boolean
  }>(),
  {
    hideToolbar: false
  }
)

const canvasWrapRef = ref<HTMLElement | null>(null)
const zoom = ref(100)
const rotation = ref(0)
/** 幅 / 高（縦向き帳票のデフォルト） */
const PAGE_ASPECT = 210 / 297
const contentAspect = ref(PAGE_ASPECT)
const pageWidth = ref(0)

const isPdf = computed(() => isPdfDocumentUrl(props.imageUrl))
const isLandscape = computed(() => rotation.value === 90 || rotation.value === 270)

const pageHeight = computed(() => {
  if (!pageWidth.value) return 0
  const aspect = isLandscape.value ? 1 / contentAspect.value : contentAspect.value
  return pageWidth.value / aspect
})

const canvasStyle = computed(() => {
  if (!pageWidth.value || !pageHeight.value) return undefined
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
    transform: `scale(${zoom.value / 100}) rotate(${rotation.value}deg)`
  }
})

function measureLayout() {
  const wrap = canvasWrapRef.value
  if (!wrap) return

  const padding = 12
  const availW = Math.max(wrap.clientWidth - padding * 2, 1)
  const availH = Math.max(wrap.clientHeight - padding * 2, 1)
  const aspect = isLandscape.value ? 1 / contentAspect.value : contentAspect.value

  let width = availW
  let height = width / aspect
  if (height > availH) {
    height = availH
    width = height * aspect
  }
  pageWidth.value = Math.floor(width)
}

function applyFitZoom() {
  zoom.value = 100
  nextTick(() => measureLayout())
}

function zoomOut() {
  zoom.value = Math.max(50, zoom.value - 10)
}

function zoomIn() {
  zoom.value = Math.min(200, zoom.value + 10)
}

function rotateLeft() {
  rotation.value = (rotation.value - 90 + 360) % 360
  nextTick(() => measureLayout())
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
  nextTick(() => measureLayout())
}

function onMediaLoad() {
  nextTick(() => {
    const wrap = canvasWrapRef.value
    if (!isPdf.value && wrap) {
      const img = wrap.querySelector<HTMLImageElement>('.v-doc-preview-media__image')
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        contentAspect.value = img.naturalWidth / img.naturalHeight
      }
    } else if (isPdf.value) {
      contentAspect.value = PAGE_ASPECT
    }
    measureLayout()
  })
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => measureLayout())
  if (canvasWrapRef.value) {
    resizeObserver = new ResizeObserver(() => measureLayout())
    resizeObserver.observe(canvasWrapRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.imageUrl,
  () => {
    contentAspect.value = PAGE_ASPECT
    rotation.value = 0
    zoom.value = 100
    nextTick(() => measureLayout())
  }
)

defineExpose({
  applyFitZoom,
  zoomIn,
  zoomOut,
  rotateLeft,
  rotateRight,
  zoom
})
</script>

<template>
  <div class="v-doc-type-preview" :class="{ 'v-doc-type-preview--embedded': hideToolbar }">
    <ImageViewerFloatingToolbar
      v-if="!hideToolbar"
      variant="dock"
      :show-navigation="false"
      :show-fit="true"
      :show-crop="false"
      :zoom="zoom"
      @fit="applyFitZoom"
      @rotate-left="rotateLeft"
      @rotate-right="rotateRight"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
    />

    <div ref="canvasWrapRef" class="v-doc-type-preview__canvas-wrap">
      <div
        class="v-doc-type-preview__canvas"
        :style="canvasStyle"
      >
        <DocumentPreviewMedia
          :key="imageUrl"
          :media-url="imageUrl"
          :title="$t('businessRules.docType.preview.sampleTitle')"
          @load="onMediaLoad"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-doc-type-preview {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;

  &--embedded {
    border: none;
    border-radius: 0;
    background: transparent;
  }

  &__canvas-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    padding: 12px;
    background: #eceff3;
  }

  &__canvas {
    position: relative;
    flex-shrink: 0;
    transform-origin: center center;
    will-change: transform;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    border-radius: 4px;
    overflow: hidden;
    background: #fff;

    :deep(.v-doc-preview-media) {
      width: 100%;
      height: 100%;
      min-height: 0;
      padding: 0;
      background: #fff;
    }

    :deep(.v-doc-preview-media__image),
    :deep(.v-doc-preview-media__pdf) {
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      border-radius: 0;
      box-shadow: none;
      object-fit: contain;
    }
  }
}
</style>
