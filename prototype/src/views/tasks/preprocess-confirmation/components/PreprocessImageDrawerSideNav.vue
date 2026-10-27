<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  canGoPrev?: boolean
  canGoNext?: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
}>()

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="v-pre-drawer-side-nav v-pre-drawer-side-nav--prev"
    :disabled="!canGoPrev"
    :aria-label="t('imageViewer.prevPage')"
    @click="emit('prev')"
  >
    <el-icon :size="20"><ArrowLeft /></el-icon>
  </button>
  <button
    type="button"
    class="v-pre-drawer-side-nav v-pre-drawer-side-nav--next"
    :disabled="!canGoNext"
    :aria-label="t('imageViewer.nextPage')"
    @click="emit('next')"
  >
    <el-icon :size="20"><ArrowRight /></el-icon>
  </button>
</template>

<style scoped lang="scss">
.v-pre-drawer-side-nav {
  position: absolute;
  top: 50%;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(208, 213, 221, 0.95);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-secondary);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.1);
  cursor: pointer;
  transform: translateY(-50%);
  transition: border-color var(--transition-time-02), color var(--transition-time-02),
    background var(--transition-time-02);

  &:hover:not(:disabled) {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
    background: #fff;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &--prev {
    left: 16px;
  }

  &--next {
    right: 16px;
  }
}
</style>
