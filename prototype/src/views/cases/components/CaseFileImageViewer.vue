<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import ImageViewerFloatingToolbar from '@/components/ImageViewerFloatingToolbar.vue'
import { isPdfDocumentUrl, mockDocumentPreviewSrc } from '@/constants/mockSampleMedia'

const props = withDefaults(
  defineProps<{
    imageUrl: string
    pageCount?: number
    showNavigation?: boolean
    canGoPrev?: boolean
    canGoNext?: boolean
  }>(),
  {
    pageCount: 1,
    showNavigation: true,
    canGoPrev: false,
    canGoNext: false
  }
)

const emit = defineEmits<{
  prev: []
  next: []
}>()

const PAGE_ASPECT = 210 / 297
const PAGE_GAP = 12
const THUMB_SIDEBAR_WIDTH = 120
const VIEW_PADDING = {
  top: 44,
  bottomSingle: 24,
  bottomMulti: 56,
  x: 24
} as const

const zoom = ref(100)
const rotation = ref(0)
const loading = ref(true)
const visiblePage = ref(1)
const canvasWrapRef = ref<HTMLElement | null>(null)
const thumbsRef = ref<HTMLElement | null>(null)
const pageWidth = ref(0)

const isPdfDocument = computed(() => isPdfDocumentUrl(props.imageUrl))
const isMultiPage = computed(() => props.pageCount > 1)
const showPageIndicator = computed(() => props.pageCount > 1)
const isLandscape = computed(() => rotation.value === 90 || rotation.value === 270)

const pageHeight = computed(() =>
  pageWidth.value > 0 ? pageWidth.value / PAGE_ASPECT : 0
)

const pageStyle = () => {
  if (!pageWidth.value || !pageHeight.value) return undefined
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`
  }
}
const singlePageStyle = computed(() => {
  if (isMultiPage.value || !pageWidth.value) return undefined
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
    transform: `scale(${zoom.value / 100}) rotate(${rotation.value}deg)`
  }
})

const multiPageStyle = computed(() => {
  if (!isMultiPage.value || !pageWidth.value) return undefined
  return {
    width: `${pageWidth.value}px`,
    transform: `scale(${zoom.value / 100}) rotate(${rotation.value}deg)`
  }
})

function pdfSrcForPage(page: number) {
  return mockDocumentPreviewSrc(props.imageUrl, { view: 'FitH', page })
}

function pdfThumbSrcForPage(page: number) {
  return mockDocumentPreviewSrc(props.imageUrl, { page })
}

let loadingTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null
let loadedPageCount = 0

function clearLoadingTimer() {
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }
}

function finishLoading() {
  clearLoadingTimer()
  loading.value = false
}

function startLoading() {
  clearLoadingTimer()
  loading.value = true
  loadedPageCount = 0
  loadingTimer = setTimeout(finishLoading, 1200)
}

function measureLayout() {
  const wrap = canvasWrapRef.value
  if (!wrap) return

  const paddingBottom = isMultiPage.value
    ? VIEW_PADDING.bottomMulti
    : VIEW_PADDING.bottomSingle
  const availW = Math.max(wrap.clientWidth - VIEW_PADDING.x * 2, 1)
  const availH = Math.max(
    wrap.clientHeight - VIEW_PADDING.top - paddingBottom,
    1
  )

  let width = availW
  let height = width / PAGE_ASPECT
  if (height > availH) {
    height = availH
    width = height * PAGE_ASPECT
  }
  pageWidth.value = Math.floor(width)
}

function updateVisiblePage() {
  if (!isMultiPage.value || !pageHeight.value) return
  const wrap = canvasWrapRef.value
  if (!wrap) return

  const blockHeight = pageHeight.value + PAGE_GAP
  const index = Math.min(
    props.pageCount - 1,
    Math.max(0, Math.floor((wrap.scrollTop + pageHeight.value * 0.35) / blockHeight))
  )
  visiblePage.value = index + 1
}

function scrollToPage(page: number) {
  const wrap = canvasWrapRef.value
  if (!wrap || !pageHeight.value) return

  const blockHeight = pageHeight.value + PAGE_GAP
  wrap.scrollTo({
    top: (page - 1) * blockHeight,
    behavior: 'smooth'
  })
  visiblePage.value = page
}

function scrollActiveThumbIntoView() {
  const sidebar = thumbsRef.value
  if (!sidebar) return
  const activeThumb = sidebar.querySelector<HTMLElement>('.v-case-file-viewer__thumb.is-active')
  activeThumb?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
}

function onPageLoad() {
  loadedPageCount += 1
  if (loadedPageCount >= props.pageCount) {
    finishLoading()
  }
}

function onScroll() {
  updateVisiblePage()
}

watch(
  () => [props.imageUrl, props.pageCount] as const,
  () => {
    rotation.value = 0
    zoom.value = 100
    visiblePage.value = 1
    startLoading()
    nextTick(() => {
      measureLayout()
      canvasWrapRef.value?.scrollTo({ top: 0 })
      updateVisiblePage()
    })
  },
  { immediate: true }
)

watch(visiblePage, () => {
  nextTick(scrollActiveThumbIntoView)
})

onMounted(() => {
  nextTick(() => measureLayout())

  if (canvasWrapRef.value) {
    resizeObserver = new ResizeObserver(() => {
      measureLayout()
      updateVisiblePage()
    })
    resizeObserver.observe(canvasWrapRef.value)
  }
})

onBeforeUnmount(() => {
  clearLoadingTimer()
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="v-case-file-viewer">
    <ImageViewerFloatingToolbar
      variant="floating"
      :show-navigation="showNavigation"
      :show-fit="true"
      :show-crop="false"
      :show-zoom-percent="false"
      :zoom="zoom"
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      @prev="emit('prev')"
      @next="emit('next')"
      @fit="applyFitZoom"
      @rotate-left="rotateLeft"
      @rotate-right="rotateRight"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
    />

    <div class="v-case-file-viewer__workspace has-thumbs">
      <aside
        ref="thumbsRef"
        class="v-case-file-viewer__thumbs"
        :style="{ width: `${THUMB_SIDEBAR_WIDTH}px` }"
        aria-label="PDF page thumbnails"
      >
        <button
          v-for="page in pageCount"
          :key="`thumb-${imageUrl}-${page}`"
          type="button"
          class="v-case-file-viewer__thumb"
          :class="{ 'is-active': visiblePage === page }"
          :aria-label="`Page ${page}`"
          :aria-current="visiblePage === page ? 'page' : undefined"
          @click="scrollToPage(page)"
        >
          <span class="v-case-file-viewer__thumb-frame-wrap">
            <img
              v-if="!isPdfDocument"
              class="v-case-file-viewer__thumb-image"
              :src="imageUrl"
              alt=""
              tabindex="-1"
              aria-hidden="true"
              draggable="false"
              @load="onPageLoad"
            />
            <iframe
              v-else
              class="v-case-file-viewer__thumb-frame"
              :src="pdfThumbSrcForPage(page)"
              :title="`Page ${page}`"
              tabindex="-1"
              aria-hidden="true"
              scrolling="no"
            />
            <span class="v-case-file-viewer__thumb-label">{{ page }}</span>
          </span>
        </button>
      </aside>

      <div
        ref="canvasWrapRef"
        class="v-case-file-viewer__canvas-wrap"
        :class="{ 'is-multi-page': isMultiPage, 'is-single-page': !isMultiPage }"
        @scroll.passive="onScroll"
      >
      <div v-if="loading" class="v-case-file-viewer__loading">
        <el-icon class="is-loading" :size="28"><Loading /></el-icon>
        <span>loading...</span>
      </div>

      <template v-if="isMultiPage">
        <div
          v-show="pageWidth > 0"
          class="v-case-file-viewer__canvas is-multi-page"
          :class="{ 'is-landscape': isLandscape }"
          :style="multiPageStyle"
        >
          <div
            v-for="page in pageCount"
            :key="`${imageUrl}-page-${page}`"
            class="v-case-file-viewer__page"
            :style="pageStyle()"
          >
            <img
              v-if="!isPdfDocument"
              class="v-case-file-viewer__frame-image"
              :src="imageUrl"
              :alt="$t('fields.filePreview')"
              draggable="false"
              @load="onPageLoad"
            />
            <iframe
              v-else
              class="v-case-file-viewer__frame"
              :src="pdfSrcForPage(page)"
              :title="$t('fields.filePreview')"
              scrolling="no"
              @load="onPageLoad"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-show="pageWidth > 0"
          class="v-case-file-viewer__canvas is-single-page"
          :class="{ 'is-landscape': isLandscape }"
          :style="singlePageStyle"
        >
          <img
            v-if="!isPdfDocument"
            :key="imageUrl"
            class="v-case-file-viewer__frame-image"
            :src="imageUrl"
            :alt="$t('fields.filePreview')"
            draggable="false"
            @load="onPageLoad"
          />
          <iframe
            v-else
            :key="imageUrl"
            class="v-case-file-viewer__frame"
            :src="pdfSrcForPage(1)"
            :title="$t('fields.filePreview')"
            scrolling="no"
            @load="onPageLoad"
          />
        </div>
      </template>

        <div v-if="showPageIndicator" class="v-case-file-viewer__pager" aria-live="polite">
          {{ visiblePage }}
          <span class="v-case-file-viewer__pager-sep">/</span>
          {{ pageCount }}
        </div>
      </div>
    </div>

    <div v-if="$slots.actions" class="v-case-file-viewer__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-case-file-viewer {
  --viewer-aspect: 210 / 297;
  --thumb-width: 96px;
  --thumb-scale: 0.457143;

  position: relative;
  height: 100%;
  min-height: 0;
  min-width: 0;
  border-radius: 12px;
  background: #eceff3;
  overflow: hidden;

  &__workspace {
    position: absolute;
    inset: 0;
    display: flex;
    min-height: 0;
    min-width: 0;
  }

  &__thumbs {
    flex-shrink: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 44px 8px 56px;
    border-right: 1px solid rgba(16, 24, 40, 0.1);
    background: #e4e7ec;
  }

  &__thumb {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: var(--thumb-width);
    margin: 0 0 12px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    box-sizing: border-box;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.1);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &.is-active {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(52, 120, 229, 0.28);

      .v-case-file-viewer__thumb-label {
        background: var(--el-color-primary);
      }
    }

    &:hover:not(.is-active) {
      box-shadow: 0 2px 8px rgba(16, 24, 40, 0.14);

      .v-case-file-viewer__thumb-label {
        background: rgba(16, 24, 40, 0.72);
      }
    }
  }

  &__thumb-frame-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 210 / 297;
    flex-shrink: 0;
    overflow: hidden;
    background: #fff;
  }

  &__thumb-frame {
    width: 210px;
    height: 297px;
    border: 0;
    pointer-events: none;
    transform: scale(var(--thumb-scale));
    transform-origin: top left;
  }

  &__thumb-label {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.02em;
    color: #fff;
    background: rgba(16, 24, 40, 0.58);
    user-select: none;
    pointer-events: none;
    transition: background 0.15s ease;
  }

  &__canvas-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;

    &.is-single-page {
      container-type: size;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 44px 24px 24px;
    }

    &.is-multi-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 44px 24px 56px;
    }
  }

  &__canvas {
    position: relative;
    flex-shrink: 0;
    transform-origin: center top;
    will-change: transform;

    &.is-single-page {
      transform-origin: center center;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
      background: #fff;
    }

    &.is-multi-page {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0 auto;
      transform-origin: center top;
    }
  }

  &__page {
    position: relative;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    background: #fff;
  }

  &__frame {
    display: block;
    width: calc(100% + 24px);
    height: calc(100% + 72px);
    margin: -12px -12px -60px;
    border: 0;
    border-radius: 2px;
    background: #fff;
    overflow: hidden;
    pointer-events: none;
  }

  &__frame-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    background: #fff;
    pointer-events: none;
  }

  &__thumb-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    background: #fff;
    pointer-events: none;
  }

  &__loading {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--el-color-primary);
    font-size: var(--app-font-size-base);
    background: #eceff3;

    .is-loading {
      animation: v-case-file-viewer-spin 1s linear infinite;
    }
  }

  &__pager {
    position: absolute;
    left: 50%;
    bottom: 16px;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(16, 24, 40, 0.78);
    box-shadow: 0 4px 16px rgba(16, 24, 40, 0.2);
    backdrop-filter: blur(8px);
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    color: #fff;
    transform: translateX(-50%);
    user-select: none;
    pointer-events: none;
  }

  &__pager-sep {
    opacity: 0.55;
    font-weight: 500;
  }

  &__actions {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

@keyframes v-case-file-viewer-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
