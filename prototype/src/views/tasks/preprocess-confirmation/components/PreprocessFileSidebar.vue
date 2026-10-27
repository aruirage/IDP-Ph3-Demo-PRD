<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Rank } from '@element-plus/icons-vue'
import type { PreprocessLogicalFile, PreprocessPage } from '@/mocks/preprocessConfirmationTask'
import {
  canDeleteLogicalFile,
  countPendingReviewPages,
  countUnclassifiedPages,
  sortLogicalFiles
} from '@/mocks/preprocessConfirmationTask'

const props = defineProps<{
  files: PreprocessLogicalFile[]
  pages: PreprocessPage[]
  selectedFileId: string | null
  showAll: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  selectFile: [fileId: string | null]
  showAll: []
  addClassification: []
  reorderFiles: [sourceFileId: string, targetFileId: string]
  deleteFile: [fileId: string]
}>()

const sortedFiles = computed(() => sortLogicalFiles(props.files))

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  fileId: ''
})

function canDragFile(file: PreprocessLogicalFile): boolean {
  return !file.isMainDoc
}

function pendingReviewCount(file: PreprocessLogicalFile): number {
  return countPendingReviewPages(props.pages, file.id)
}

const unclassifiedCount = computed(() => countUnclassifiedPages(props.pages))

let dragFileId: string | null = null

function onDragStart(file: PreprocessLogicalFile) {
  if (!canDragFile(file)) return
  dragFileId = file.id
}

function onDrop(targetFile: PreprocessLogicalFile) {
  if (!dragFileId || dragFileId === targetFile.id) return
  const source = sortedFiles.value.find((file) => file.id === dragFileId)
  if (!source || source.isMainDoc || targetFile.isMainDoc) return
  emit('reorderFiles', source.id, targetFile.id)
  dragFileId = null
}

function onDragEnd() {
  dragFileId = null
}

function openContextMenu(event: MouseEvent, file: PreprocessLogicalFile) {
  if (props.readonly || !canDeleteLogicalFile(file)) return
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    fileId: file.id
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

function deleteFromContextMenu() {
  if (!contextMenu.value.fileId) return
  emit('deleteFile', contextMenu.value.fileId)
  closeContextMenu()
}
</script>

<template>
  <aside class="v-pre-sidebar" @click="closeContextMenu">
    <div class="v-pre-sidebar__head">
      <h3 class="v-pre-sidebar__title">{{ $t('tasks.preprocess.sidebarTitle') }}</h3>
    </div>

    <el-button
      v-if="!readonly"
      type="primary"
      class="v-pre-sidebar__add"
      :icon="Plus"
      @click="emit('addClassification')"
    >
      {{ $t('tasks.preprocess.addClassification') }}
    </el-button>

    <div class="v-pre-sidebar__list">
      <button
        type="button"
        class="v-pre-sidebar__row"
        :class="{ 'is-active': showAll && !selectedFileId }"
        @click="emit('showAll')"
      >
        <span class="v-pre-sidebar__drag-spacer" aria-hidden="true" />
        <span class="v-pre-sidebar__name">{{ $t('tasks.preprocess.allPages') }}</span>
        <span class="v-pre-sidebar__trail">
          <span
            v-if="unclassifiedCount > 0"
            class="v-pre-sidebar__unclassified-badge"
            :title="$t('tasks.common.unclassifiedCount', { count: unclassifiedCount })"
          >
            {{ unclassifiedCount }}
          </span>
        </span>
      </button>

      <div
        v-for="file in sortedFiles"
        :key="file.id"
        class="v-pre-sidebar__row-wrap"
        :class="{ 'is-drag-source': dragFileId === file.id }"
        :draggable="canDragFile(file)"
        @dragstart="onDragStart(file)"
        @dragend="onDragEnd"
        @dragover.prevent
        @drop="onDrop(file)"
        @contextmenu="openContextMenu($event, file)"
      >
        <button
          type="button"
          class="v-pre-sidebar__row"
          :class="{ 'is-active': selectedFileId === file.id }"
          @click="emit('selectFile', file.id)"
        >
          <el-icon v-if="canDragFile(file)" class="v-pre-sidebar__drag" :size="16"><Rank /></el-icon>
          <span v-else class="v-pre-sidebar__drag-spacer" aria-hidden="true" />
          <span class="v-pre-sidebar__name">
            <span class="v-pre-sidebar__name-text">{{ file.displayName }}</span>
            <span v-if="file.isMainDoc" class="v-pre-sidebar__main-doc">
              {{ $t('tasks.preprocess.mainDoc') }}
            </span>
          </span>
          <span class="v-pre-sidebar__trail">
            <span
              v-if="pendingReviewCount(file) > 0"
              class="v-pre-sidebar__low-badge"
              :aria-label="$t('tasks.preprocess.lowConfidenceCount', { count: pendingReviewCount(file) })"
            >
              {{ pendingReviewCount(file) }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="v-pre-sidebar__menu"
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        @click.stop
      >
        <button type="button" class="v-pre-sidebar__menu-item is-danger" @click="deleteFromContextMenu">
          {{ $t('tasks.preprocess.deleteFile') }}
        </button>
      </div>
    </teleport>
  </aside>
</template>

<style scoped lang="scss">
.v-pre-sidebar {
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
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__add {
    justify-content: center;
    width: 100%;
    min-height: 40px;
    font-size: var(--app-font-size-base);
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__row-wrap {
    display: block;

    &.is-drag-source {
      opacity: 0.55;
    }
  }

  &__trail {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    min-width: 16px;
    margin-left: auto;
  }

  &__low-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
    color: #fff;
    background: var(--el-color-danger);
    text-align: center;
    box-sizing: border-box;
    box-shadow: 0 0 0 1px #fff;
    pointer-events: none;
  }

  &__unclassified-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
    color: #fff;
    background: var(--el-color-warning);
    text-align: center;
    box-sizing: border-box;
    box-shadow: 0 0 0 1px #fff;
    pointer-events: none;
  }

  &__menu {
    position: fixed;
    z-index: 3000;
    min-width: 160px;
    padding: 6px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  }

  &__menu-item {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    font-family: inherit;

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &.is-danger {
      color: var(--el-color-danger);

      &:hover {
        background: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #f9fafb;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: border-color var(--transition-time-02), background var(--transition-time-02);

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__drag {
    flex-shrink: 0;
    color: var(--text-secondary);
    cursor: grab;
  }

  &__drag-spacer {
    flex-shrink: 0;
    width: 14px;
  }

  &__name {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
  }

  &__name-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__main-doc {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-color-primary);
  }
}
</style>
