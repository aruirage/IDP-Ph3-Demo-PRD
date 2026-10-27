<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  FullScreen,
  RefreshLeft,
  RefreshRight,
  Scissor,
  ZoomIn,
  ZoomOut
} from '@element-plus/icons-vue'

const { t } = useI18n()

withDefaults(
  defineProps<{
    variant?: 'floating' | 'dock' | 'bar'
    showNavigation?: boolean
    showFit?: boolean
    showCrop?: boolean
    showZoom?: boolean
    showZoomPercent?: boolean
    showRotate?: boolean
    showSaveRotation?: boolean
    zoom?: number
    cropActive?: boolean
    canGoPrev?: boolean
    canGoNext?: boolean
  }>(),
  {
    variant: 'floating',
    showNavigation: true,
    showFit: true,
    showCrop: false,
    showZoom: true,
    showZoomPercent: true,
    showRotate: true,
    showSaveRotation: false,
    zoom: 100,
    cropActive: false
  }
)

const emit = defineEmits<{
  prev: []
  next: []
  fit: []
  crop: []
  rotateLeft: []
  rotateRight: []
  zoomIn: []
  zoomOut: []
  saveRotation: []
}>()
</script>

<template>
  <div
    class="v-image-viewer-toolbar"
    :class="`v-image-viewer-toolbar--${variant}`"
    role="toolbar"
    :aria-label="t('imageViewer.toolbar')"
  >
    <div v-if="showNavigation" class="v-image-viewer-toolbar__nav">
      <button
        type="button"
        class="v-image-viewer-toolbar__text-btn"
        :disabled="!canGoPrev"
        @click="emit('prev')"
      >
        {{ t('imageViewer.prev') }}
      </button>
      <button
        type="button"
        class="v-image-viewer-toolbar__text-btn"
        :disabled="!canGoNext"
        @click="emit('next')"
      >
        {{ t('imageViewer.next') }}
      </button>
    </div>

    <span
      v-if="showNavigation && (showCrop || showFit || showZoom)"
      class="v-image-viewer-toolbar__divider"
      aria-hidden="true"
    />

    <div class="v-image-viewer-toolbar__actions">
      <button
        v-if="showCrop"
        type="button"
        class="v-image-viewer-toolbar__icon-btn"
        :class="{ 'is-active': cropActive }"
        :title="t('imageViewer.crop')"
        @click="emit('crop')"
      >
        <el-icon :size="18"><Scissor /></el-icon>
      </button>

      <span
        v-if="showCrop && (showFit || showZoom)"
        class="v-image-viewer-toolbar__divider"
        aria-hidden="true"
      />

      <button
        v-if="showFit"
        type="button"
        class="v-image-viewer-toolbar__icon-btn"
        :title="t('imageViewer.fit')"
        @click="emit('fit')"
      >
        <el-icon :size="18"><FullScreen /></el-icon>
      </button>

      <button
        v-if="showRotate"
        type="button"
        class="v-image-viewer-toolbar__icon-btn"
        :title="t('imageViewer.rotateLeft')"
        @click="emit('rotateLeft')"
      >
        <el-icon :size="18"><RefreshLeft /></el-icon>
      </button>
      <button
        v-if="showRotate"
        type="button"
        class="v-image-viewer-toolbar__icon-btn"
        :title="t('imageViewer.rotateRight')"
        @click="emit('rotateRight')"
      >
        <el-icon :size="18"><RefreshRight /></el-icon>
      </button>

      <template v-if="showZoom">
        <button
          type="button"
          class="v-image-viewer-toolbar__icon-btn"
          :title="t('imageViewer.zoomIn')"
          @click="emit('zoomIn')"
        >
          <el-icon :size="18"><ZoomIn /></el-icon>
        </button>
        <button
          type="button"
          class="v-image-viewer-toolbar__icon-btn"
          :title="t('imageViewer.zoomOut')"
          @click="emit('zoomOut')"
        >
          <el-icon :size="18"><ZoomOut /></el-icon>
        </button>
        <span v-if="showZoomPercent" class="v-image-viewer-toolbar__zoom">{{ zoom }}%</span>
      </template>

      <template v-if="showSaveRotation">
        <span class="v-image-viewer-toolbar__divider" aria-hidden="true" />
        <button
          type="button"
          class="v-image-viewer-toolbar__icon-btn"
          :title="t('imageViewer.saveRotation')"
          :aria-label="t('imageViewer.saveRotation')"
          @click="emit('saveRotation')"
        >
          <el-icon :size="18">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                fill="currentColor"
                d="M704 128H224a96 96 0 0 0-96 96v576a96 96 0 0 0 96 96h576a96 96 0 0 0 96-96V352L704 128zm-64 64v128H384V192h256zm96 544H256V256h128v192h256V256h128v544z"
              />
            </svg>
          </el-icon>
        </button>
      </template>
    </div>

    <div v-if="$slots.trailing" class="v-image-viewer-toolbar__trailing">
      <slot name="trailing" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-image-viewer-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  pointer-events: auto;

  &--floating {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 10;
    padding: 6px 10px;
    border: 1px solid rgba(208, 213, 221, 0.9);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 4px 16px rgba(16, 24, 40, 0.08);
    backdrop-filter: blur(10px);
    transform: translateX(-50%);
  }

  &--dock {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    justify-content: center;
    width: 100%;
    min-height: var(--ocr-card-header-height, 52px);
    padding: 0 16px;
    border-bottom: 1px solid var(--border-color);
    background: #fff;
    box-sizing: border-box;
  }

  &--bar {
    display: flex;
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    justify-content: space-between;
    width: 100%;
    min-height: var(--ocr-card-header-height, 52px);
    padding: 0 16px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    box-sizing: border-box;
  }

  &__trailing {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    min-width: 0;
  }

  &__nav,
  &__actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  &__divider {
    width: 1px;
    height: 20px;
    background: rgba(208, 213, 221, 0.9);
    flex-shrink: 0;
  }

  &__zoom {
    min-width: 44px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    text-align: center;
    user-select: none;
  }

  &__text-btn {
    min-width: 52px;
    padding: 4px 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: var(--app-font-size-base);
    line-height: 1.4;
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color var(--transition-time-02), color var(--transition-time-02),
      background var(--transition-time-02);

    &:not(:disabled) {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      background: rgba(255, 255, 255, 0.9);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }

  &__icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color var(--transition-time-02), background var(--transition-time-02),
      color var(--transition-time-02);

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: #fff;
      color: var(--el-color-primary);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
}
</style>
