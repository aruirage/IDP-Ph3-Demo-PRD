<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Delete, EditPen } from '@element-plus/icons-vue'
import type { PreprocessLogicalFile, PreprocessPage } from '@/mocks/preprocessConfirmationTask'
import {
  isUnclassifiedPage,
  preprocessPagePreviewImage,
  preprocessPreviewCropImgStyle,
  PREPROCESS_REVIEW_TYPE_ORDER,
  requiresReviewConfirmation,
  usesRedReviewHighlight,
  type PreprocessReviewType
} from '@/mocks/preprocessConfirmationTask'

const props = defineProps<{
  pages: PreprocessPage[]
  logicalFiles: PreprocessLogicalFile[]
  filterFileId: string | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  reorder: [orderedIds: string[]]
  deletePage: [pageId: string]
  changeClassification: [pageId: string, logicalFileId: string]
  enlarge: [page: PreprocessPage]
  splitImage: [page: PreprocessPage]
  toggleReview: [pageId: string]
}>()

const { t } = useI18n()

const visiblePages = computed(() => {
  const sorted = [...props.pages].sort((a, b) => a.order - b.order)
  if (!props.filterFileId) return sorted
  return sorted.filter((page) => page.logicalFileId === props.filterFileId)
})

const canReorderPages = computed(() => Boolean(props.filterFileId) && !props.readonly)

let dragIndex: number | null = null

function onDragStart(index: number) {
  if (!canReorderPages.value) return
  dragIndex = index
}

function onDrop(index: number) {
  if (!canReorderPages.value || dragIndex === null || dragIndex === index) return
  const ids = visiblePages.value.map((page) => page.id)
  const [moved] = ids.splice(dragIndex, 1)
  ids.splice(index, 0, moved)
  emit('reorder', ids)
  dragIndex = null
}

function onClassificationChange(page: PreprocessPage, fileId: string) {
  if (props.readonly || !fileId || fileId === page.logicalFileId) return
  emit('changeClassification', page.id, fileId)
}

const REVIEW_TYPE_LABEL_KEY: Record<PreprocessReviewType, string> = {
  classification: 'tasks.preprocess.lowConfidenceTagClassification',
  segmentation: 'tasks.preprocess.lowConfidenceTagSegmentation',
  sorting: 'tasks.preprocess.lowConfidenceTagSorting',
  imageIntegrity: 'tasks.preprocess.reviewTagImageIntegrity',
  sensitiveInfo: 'tasks.preprocess.reviewTagSensitiveInfo'
}

function classificationSelectValue(page: PreprocessPage): string {
  return isUnclassifiedPage(page) ? '' : page.logicalFileId
}

function classificationPlaceholder(page: PreprocessPage): string {
  return isUnclassifiedPage(page)
    ? t('tasks.common.unclassified')
    : t('tasks.preprocess.classificationSelect')
}

function reviewTypeTags(page: PreprocessPage): PreprocessReviewType[] {
  const types = page.lowConfidenceTypes ?? []
  return PREPROCESS_REVIEW_TYPE_ORDER.filter((type) => types.includes(type))
}

function showReviewTags(page: PreprocessPage): boolean {
  return reviewTypeTags(page).length > 0
}

function previewImage(page: PreprocessPage): string {
  return preprocessPagePreviewImage(page)
}

function previewCropImgStyle(page: PreprocessPage) {
  if (!page.autoSplitBox) return {}
  return preprocessPreviewCropImgStyle(page.autoSplitBox)
}
</script>

<template>
  <div class="v-pre-thumbs">
    <div class="v-pre-thumbs__head">
      <h3 class="v-pre-thumbs__title">{{ $t('tasks.preprocess.thumbnailTitle') }}</h3>
      <span class="v-pre-thumbs__count">
        {{ $t('tasks.common.countItems', { count: visiblePages.length }) }}
      </span>
    </div>

    <div v-if="visiblePages.length" class="v-pre-thumbs__grid">
      <div
        v-for="(page, index) in visiblePages"
        :key="page.id"
        class="v-pre-thumbs__card"
        :class="{ 'is-draggable': canReorderPages }"
        :draggable="canReorderPages"
        @dragstart="onDragStart(index)"
        @dragover.prevent
        @drop="onDrop(index)"
      >
        <div
          class="v-pre-thumbs__preview"
          :class="{ 'is-low-confidence': usesRedReviewHighlight(page) }"
          role="button"
          tabindex="0"
          :aria-label="$t('tasks.preprocess.imageEdit')"
          @click="emit('splitImage', page)"
          @keydown.enter="emit('splitImage', page)"
        >
          <div class="v-pre-thumbs__preview-body">
            <div
              v-if="page.autoSplitBox"
              class="v-pre-thumbs__preview-crop-wrap"
            >
              <img
                class="v-pre-thumbs__preview-crop-img"
                :src="previewImage(page)"
                :alt="page.label"
                :style="previewCropImgStyle(page)"
                loading="lazy"
                draggable="false"
              />
            </div>
            <img
              v-else
              class="v-pre-thumbs__preview-image"
              :src="previewImage(page)"
              :alt="page.label"
              loading="lazy"
              draggable="false"
            />
          </div>
          <div v-if="showReviewTags(page)" class="v-pre-thumbs__review-tags">
            <span
              v-for="type in reviewTypeTags(page)"
              :key="type"
              class="v-pre-thumbs__review-tag"
              :class="`is-${type}`"
            >
              {{ $t(REVIEW_TYPE_LABEL_KEY[type]) }}
            </span>
          </div>
          <div class="v-pre-thumbs__actions">
            <el-button
              v-if="!readonly"
              circle
              size="large"
              :icon="EditPen"
              :aria-label="$t('tasks.preprocess.imageEdit')"
              @click.stop="emit('splitImage', page)"
            />
            <el-button
              v-if="!readonly"
              circle
              size="large"
              :icon="Delete"
              :aria-label="$t('tasks.preprocess.delete')"
              @click.stop="emit('deletePage', page.id)"
            />
          </div>
          <button
            v-if="requiresReviewConfirmation(page)"
            type="button"
            class="v-pre-thumbs__confirm-btn"
            :class="{ 'is-confirmed': page.reviewConfirmed }"
            :disabled="readonly"
            @click.stop="emit('toggleReview', page.id)"
          >
            {{
              page.reviewConfirmed
                ? $t('tasks.preprocess.reviewConfirmed')
                : $t('tasks.preprocess.confirmPending')
            }}
          </button>
        </div>
        <el-select
          class="v-pre-thumbs__classification"
          :class="{ 'is-unclassified': isUnclassifiedPage(page) }"
          :model-value="classificationSelectValue(page)"
          :disabled="readonly"
          :placeholder="classificationPlaceholder(page)"
          :aria-label="$t('tasks.preprocess.classificationSelect')"
          @change="(value: string) => onClassificationChange(page, value)"
        >
          <el-option
            v-for="file in logicalFiles"
            :key="file.id"
            :label="file.displayName"
            :value="file.id"
          />
        </el-select>
      </div>
    </div>
    <el-empty v-else :description="$t('tasks.preprocess.emptyFilter')" :image-size="72" />
  </div>
</template>

<style scoped lang="scss">
.v-pre-thumbs {
  --pre-thumb-gap: 12px;
  --pre-thumb-cols: 5;
  --pre-thumb-rows: 2;

  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  height: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  box-sizing: border-box;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__count {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__grid {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(var(--pre-thumb-cols), minmax(0, 1fr));
    grid-auto-rows: calc(
      (100% - var(--pre-thumb-gap) * (var(--pre-thumb-rows) - 1)) / var(--pre-thumb-rows)
    );
    gap: var(--pre-thumb-gap);
    align-content: start;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    min-height: 0;
    height: 100%;
    cursor: default;

    &.is-draggable {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }
  }

  &__preview {
    position: relative;
    flex: 1;
    min-height: 0;
    border: 1px solid #e4e7ec;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: #eef0f3;

    &.is-low-confidence {
      border-color: #f5a8a8;
    }
  }

  &__preview-body {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 12px 44px;
    background: #eef0f3;
    pointer-events: none;
  }

  &__preview-crop-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;
    border: 1px solid rgba(16, 24, 40, 0.06);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  }

  &__preview-crop-img {
    display: block;
    background: #fff;
  }

  &__preview-image {
    display: block;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: center center;
    background: #fff;
    border: 1px solid rgba(16, 24, 40, 0.06);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  }

  &__review-tags {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: calc(100% - 112px);
    pointer-events: none;
  }

  &__review-tag {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.35;
    color: #c2410c;
    background: #fff7ed;
    border: 1px solid rgba(234, 88, 12, 0.42);
    box-shadow: 0 1px 2px rgba(234, 88, 12, 0.08);
  }

  &__actions {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 3;
    display: flex;
    gap: 8px;

    :deep(.el-button.is-circle) {
      width: 36px;
      height: 36px;
      padding: 0;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    }

    :deep(.el-button.is-circle:hover) {
      color: var(--text-primary);
      border-color: #c9cdd4;
      background: #fff;
    }

    :deep(.el-icon) {
      font-size: 18px;
    }
  }

  &__confirm-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 3;
    min-width: 90px;
    height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: 6px;
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    line-height: 1;
    color: #fff;
    background: var(--el-color-primary);
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(23, 92, 211, 0.22);

    &.is-confirmed {
      min-width: 108px;
      padding: 0 12px;
      background: #67c23a;
      box-shadow: none;

      &::before {
        content: '';
        display: block;
        width: 14px;
        height: 14px;
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

  &__classification {
    flex-shrink: 0;
    width: 100%;

    &.is-unclassified {
      :deep(.el-select__placeholder) {
        color: var(--el-color-warning);
        font-weight: 500;
      }
    }

    :deep(.el-select__wrapper) {
      min-height: 36px;
      padding: 4px 12px;
      font-size: var(--app-font-size-base);
    }

    :deep(.el-select__selected-item) {
      font-size: var(--app-font-size-base);
    }
  }
}
</style>
