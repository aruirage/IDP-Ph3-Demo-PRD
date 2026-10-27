<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Document, Folder, FolderOpened } from '@element-plus/icons-vue'
import type { CaseFileItem } from '@/mocks/caseFiles'

export interface CaseFileTreeNode {
  id: string
  label: string
  nodeType: 'root' | 'folder' | 'file'
  fileId?: string
  ext?: string
  children?: CaseFileTreeNode[]
}

const props = defineProps<{
  rootLabel: string
  files: CaseFileItem[]
  activeFileId: string | null
}>()

const emit = defineEmits<{
  select: [fileId: string]
}>()

const treeRef = ref<{
  setCurrentKey: (key?: string) => void
}>()

function fileExt(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

function fileBaseName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(0, dot) : fileName
}

const treeData = computed<CaseFileTreeNode[]>(() => {
  const folderMap = new Map<string, CaseFileItem[]>()

  for (const file of props.files) {
    const docType = file.fileType || '—'
    const list = folderMap.get(docType) ?? []
    list.push(file)
    folderMap.set(docType, list)
  }

  const folders = Array.from(folderMap.entries()).map(([docType, items]) => ({
    id: `folder-${docType}`,
    label: docType,
    nodeType: 'folder' as const,
    children: items.map((file) => ({
      id: file.id,
      label: fileBaseName(file.fileName),
      nodeType: 'file' as const,
      fileId: file.id,
      ext: fileExt(file.fileName)
    }))
  }))

  return [
    {
      id: 'root',
      label: props.rootLabel,
      nodeType: 'root',
      children: folders
    }
  ]
})

const defaultExpandedKeys = computed(() => {
  const keys = ['root']
  for (const file of props.files) {
    keys.push(`folder-${file.fileType || '—'}`)
  }
  return [...new Set(keys)]
})

function onNodeClick(data: CaseFileTreeNode) {
  if (data.nodeType === 'file' && data.fileId) {
    emit('select', data.fileId)
  }
}

function syncTreeHighlight(fileId: string | null) {
  if (!fileId) return
  nextTick(() => {
    treeRef.value?.setCurrentKey(fileId)
  })
}

watch(
  () => props.activeFileId,
  (fileId) => syncTreeHighlight(fileId),
  { immediate: true, flush: 'post' }
)

watch(treeData, () => syncTreeHighlight(props.activeFileId), { flush: 'post' })

onMounted(() => {
  syncTreeHighlight(props.activeFileId)
})
</script>

<template>
  <div class="v-case-file-tree">
    <div class="v-case-file-tree__head">
      <h2 class="v-case-file-tree__title">{{ $t('case.detail.filesTreeTitle') }}</h2>
    </div>

    <el-tree
      ref="treeRef"
      class="v-case-file-tree__tree"
      :data="treeData"
      node-key="id"
      highlight-current
      :current-node-key="activeFileId ?? undefined"
      :default-expanded-keys="defaultExpandedKeys"
      :expand-on-click-node="false"
      @node-click="onNodeClick"
    >
      <template #default="{ node, data }">
        <div
          class="v-case-file-tree__node"
          :class="{
            'is-root': data.nodeType === 'root',
            'is-folder': data.nodeType === 'folder',
            'is-file': data.nodeType === 'file'
          }"
        >
          <span class="v-case-file-tree__node-main">
            <el-icon class="v-case-file-tree__icon" :size="16">
              <FolderOpened v-if="data.nodeType === 'root' && node.expanded" />
              <Folder v-else-if="data.nodeType === 'root' || data.nodeType === 'folder'" />
              <Document v-else />
            </el-icon>
            <span class="v-case-file-tree__label" :title="data.label">{{ data.label }}</span>
            <span v-if="data.nodeType === 'file' && data.ext" class="v-case-file-tree__ext">
              .{{ data.ext }}
            </span>
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<style scoped lang="scss">
.v-case-file-tree {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  &__head {
    margin-bottom: var(--app-section-gap);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tree {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: transparent;

    :deep(.el-tree-node__content) {
      height: auto;
      min-height: 34px;
      padding-top: 4px;
      padding-bottom: 4px;
      border-radius: 8px;
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background: var(--el-color-primary-light-9);
    }

    :deep(.el-tree-node__expand-icon) {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }

  &__node {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding-right: 4px;
  }

  &__node-main {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  &__label {
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__node.is-root &__label {
    font-weight: 600;
  }

  &__node.is-folder &__label {
    font-weight: 500;
  }

  &__node.is-file &__label {
    color: var(--text-secondary);
  }

  &__ext {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
    padding: 0 4px;
    line-height: 18px;
  }
}
</style>
