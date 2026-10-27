<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Document, Folder, FolderOpened } from '@element-plus/icons-vue'
import type { FileExportFormat } from '@/constants/exportFormats'
import { EXPORT_OCR_FOLDER_NAME } from '@/constants/exportPaths'
import {
  EXPORT_STANDARD_FIELDS_DOC_ID,
  EXPORT_STANDARD_FILE_BASENAME
} from '@/mocks/exportFieldEnrichment'
import type { ExportDocumentItem } from '@/mocks/exportTask'

export interface ExportTreeNode {
  id: string
  label: string
  nodeType: 'root' | 'folder' | 'file' | 'standard-file'
  docType?: string
  docId?: string
  children?: ExportTreeNode[]
}

const props = defineProps<{
  rootLabel: string
  documents: ExportDocumentItem[]
  activeDocId: string | null
  exportFormat: FileExportFormat
}>()

const emit = defineEmits<{
  select: [docId: string]
}>()

const { t } = useI18n()

const treeRef = ref<{
  setCurrentKey: (key?: string) => void
}>()

const formatExt = computed(() => {
  if (props.exportFormat === 'JSON') return 'json'
  if (props.exportFormat === 'EXCEL') return 'xlsx'
  return 'csv'
})

const treeData = computed<ExportTreeNode[]>(() => {
  const folderMap = new Map<string, ExportDocumentItem[]>()
  for (const doc of props.documents) {
    const list = folderMap.get(doc.docType) ?? []
    list.push(doc)
    folderMap.set(doc.docType, list)
  }

  const extractionFolders = Array.from(folderMap.entries()).map(([docType, files]) => ({
    id: `folder-${docType}`,
    label: docType,
    nodeType: 'folder' as const,
    docType,
    children: files.map((doc) => ({
      id: doc.id,
      label: doc.fileName.replace(/\.[^.]+$/, ''),
      nodeType: 'file' as const,
      docId: doc.id,
      docType: doc.docType
    }))
  }))

  return [
    {
      id: 'root',
      label: props.rootLabel,
      nodeType: 'root',
      children: [
        {
          id: 'folder-standard',
          label: t('tasks.export.standardFields'),
          nodeType: 'folder',
          children: [
            {
              id: EXPORT_STANDARD_FIELDS_DOC_ID,
              label: EXPORT_STANDARD_FILE_BASENAME,
              nodeType: 'standard-file',
              docId: EXPORT_STANDARD_FIELDS_DOC_ID
            }
          ]
        },
        {
          id: 'folder-extraction',
          label: EXPORT_OCR_FOLDER_NAME,
          nodeType: 'folder',
          children: extractionFolders
        }
      ]
    }
  ]
})

const defaultExpandedKeys = computed(() => {
  const keys = ['root', 'folder-standard', 'folder-extraction']
  for (const doc of props.documents) {
    keys.push(`folder-${doc.docType}`)
  }
  return [...new Set(keys)]
})

function onNodeClick(data: ExportTreeNode) {
  if ((data.nodeType === 'file' || data.nodeType === 'standard-file') && data.docId) {
    emit('select', data.docId)
  }
}

watch(
  () => props.activeDocId,
  (docId) => {
    if (docId) treeRef.value?.setCurrentKey(docId)
  },
  { immediate: true }
)
</script>

<template>
  <div class="v-export-doc-tree">
    <div class="v-export-doc-tree__head">
      <h2 class="v-export-doc-tree__title">{{ $t('tasks.export.exportTarget') }}</h2>
    </div>

    <el-tree
      ref="treeRef"
      class="v-export-doc-tree__tree"
      :data="treeData"
      node-key="id"
      highlight-current
      :default-expanded-keys="defaultExpandedKeys"
      :expand-on-click-node="false"
      @node-click="onNodeClick"
    >
      <template #default="{ node, data }">
        <div
          class="v-export-doc-tree__node"
          :class="{
            'is-root': data.nodeType === 'root',
            'is-folder': data.nodeType === 'folder',
            'is-file': data.nodeType === 'file' || data.nodeType === 'standard-file',
            'is-standard-file': data.nodeType === 'standard-file'
          }"
        >
          <span class="v-export-doc-tree__node-main">
            <el-icon class="v-export-doc-tree__icon" :size="16">
              <FolderOpened v-if="data.nodeType === 'root' && node.expanded" />
              <Folder v-else-if="data.nodeType === 'root' || data.nodeType === 'folder'" />
              <Document v-else />
            </el-icon>
            <span class="v-export-doc-tree__label" :title="data.label">{{ data.label }}</span>
            <span
              v-if="data.nodeType === 'file' || data.nodeType === 'standard-file'"
              class="v-export-doc-tree__ext"
              :class="{ 'is-standard': data.nodeType === 'standard-file' }"
            >
              .{{ formatExt }}
            </span>
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<style scoped lang="scss">
.v-export-doc-tree {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
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
    justify-content: space-between;
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

  &__node.is-standard-file &__label {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  &__ext {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
    padding: 0 4px;
    line-height: 18px;

    &.is-standard {
      color: #0f766e;
      background: #ecfdf5;
    }
  }
}
</style>
