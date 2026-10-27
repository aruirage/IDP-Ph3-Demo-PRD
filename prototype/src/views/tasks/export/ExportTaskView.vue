<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import type { FileExportFormat } from '@/constants/exportFormats'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import {
  exportBatchZip,
  exportPreprocessZip,
  getExportTask,
  getSelectedFields,
  type ExportTaskDetail
} from '@/mocks/exportTask'
import {
  EXPORT_STANDARD_FIELDS_DOC_ID,
  getCaseStandardFields,
} from '@/mocks/exportFieldEnrichment'
import ExportDocumentTree from './components/ExportDocumentTree.vue'
import ExportFieldList from './components/ExportFieldList.vue'
import ExportStandardFieldList from './components/ExportStandardFieldList.vue'
import { useTaskViewMode } from '@/composables/useTaskViewMode'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { isViewOnly } = useTaskViewMode()

const taskId = computed(() => String(route.params.id ?? ''))
const initialTask = computed(() => getExportTask(taskId.value))

const task = ref<ExportTaskDetail | null>(null)
const activeDocId = ref<string | null>(null)
const exportFormat = ref<FileExportFormat>('CSV')

watch(
  initialTask,
  (value) => {
    if (!value) {
      task.value = null
      activeDocId.value = null
      return
    }
    task.value = {
      ...value,
      documents: value.documents.map((doc) => ({
        ...doc,
        fields: doc.fields.map((field) => ({ ...field }))
      }))
    }
    activeDocId.value = value.documents[0]?.id ?? null
  },
  { immediate: true }
)

const isStandardView = computed(() => activeDocId.value === EXPORT_STANDARD_FIELDS_DOC_ID)

const activeDoc = computed(() => {
  if (!task.value || isStandardView.value) return null
  return task.value.documents.find((doc) => doc.id === activeDocId.value) ?? null
})

const standardFields = computed(() =>
  task.value ? getCaseStandardFields(task.value.caseId) : []
)

const sortedItems = computed(() => {
  if (!activeDoc.value) return []
  return [...activeDoc.value.fields].sort((a, b) => a.sortOrder - b.sortOrder)
})

const batchTargets = computed(() =>
  (task.value?.documents ?? []).filter(
    (doc) => doc.includedInBatch && getSelectedFields(doc).length > 0
  )
)

function selectDoc(docId: string) {
  activeDocId.value = docId
}

async function handleBatchExport() {
  if (!task.value) return
  if (!batchTargets.value.length) {
    ElMessage.warning(t('tasks.export.messages.noDocuments'))
    return
  }
  const ok = await exportBatchZip(task.value, task.value.documents, exportFormat.value)
  if (ok) ElMessage.success(t('tasks.export.messages.batchZipSuccess'))
}

async function handlePreprocessZip() {
  if (!task.value) return
  const ok = await exportPreprocessZip(task.value, task.value.documents)
  if (ok) ElMessage.success(t('tasks.export.messages.preprocessZipSuccess'))
}

async function handleComplete() {
  await ElMessageBox.confirm(
    t('tasks.export.messages.completeConfirm'),
    t('tasks.export.actions.complete'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'info' }
  )
  ElMessage.success(t('tasks.export.messages.completeSuccess'))
  router.push('/tasks')
}

function goBack() {
  router.push('/tasks')
}
</script>

<template>
  <div class="v-content-wrap v-export-task">
    <template v-if="task && (activeDoc || isStandardView)">
      <section class="v-export-task__summary">
        <button type="button" class="v-export-task__back" @click="goBack">
          <el-icon :size="16"><ArrowLeft /></el-icon>
          {{ $t('menu.tasks') }}
        </button>
        <h1 class="v-export-task__title">{{ $t('tasks.export.title') }}</h1>
        <div class="v-export-task__summary-items">
          <span class="v-export-task__summary-inline">
            <span class="v-export-task__summary-label">{{ $t('tasks.common.businessKey') }}</span>
            {{ task.caseOrigin ?? '—' }}
          </span>
        </div>
      </section>

      <section class="v-export-task__toolbar">
        <el-form inline class="v-export-task__toolbar-form">
          <AppFormItem :label="$t('tasks.export.outputFormat')">
            <el-radio-group v-model="exportFormat" :disabled="isViewOnly">
              <el-radio-button value="CSV">CSV</el-radio-button>
              <el-radio-button value="JSON">JSON</el-radio-button>
              <el-radio-button value="EXCEL">EXCEL</el-radio-button>
            </el-radio-group>
          </AppFormItem>
        </el-form>
      </section>

      <div class="v-export-task__workspace">
        <aside class="v-export-task__docs">
          <ExportDocumentTree
            :root-label="task.caseOrigin ?? task.caseId"
            :documents="task.documents"
            :active-doc-id="activeDocId"
            :export-format="exportFormat"
            @select="selectDoc"
          />
        </aside>

        <section class="v-export-task__fields">
          <div class="v-export-task__panel-head">
            <div class="v-export-task__fields-title">
              <h2 class="v-export-task__panel-title">
                {{ isStandardView ? $t('tasks.export.standardFields') : activeDoc?.docType }}
              </h2>
            </div>
          </div>

          <ExportStandardFieldList v-if="isStandardView" :fields="standardFields" />
          <ExportFieldList v-else :fields="sortedItems" />
        </section>
      </div>

      <footer class="v-export-task__footer">
        <div class="v-export-task__footer-actions">
          <el-button @click="goBack">{{ $t('tasks.common.close') }}</el-button>
          <template v-if="!isViewOnly">
            <el-button type="primary" plain :icon="Download" @click="handleBatchExport">
              {{ $t('tasks.export.actions.batchZip') }}
            </el-button>
            <el-button type="primary" plain :icon="Download" @click="handlePreprocessZip">
              {{ $t('tasks.export.actions.preprocessZip') }}
            </el-button>
            <el-button type="primary" @click="handleComplete">{{ $t('tasks.export.actions.complete') }}</el-button>
          </template>
        </div>
      </footer>
    </template>

    <el-empty v-else :description="$t('tasks.common.taskNotFound')" :image-size="100">
      <el-button type="primary" @click="goBack">{{ $t('tasks.common.backToList') }}</el-button>
    </el-empty>
  </div>
</template>

<style scoped lang="scss">
.v-export-task {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
  box-sizing: border-box;
  padding-bottom: var(--app-action-bar-height);

  &__summary {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: var(--app-section-gap) 16px;
    flex-wrap: wrap;
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--el-color-primary);
    font-size: var(--app-font-size-base);
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__summary-items {
    display: flex;
    align-items: center;
    gap: var(--app-section-gap);
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
  }

  &__summary-inline {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__summary-label {
    font-weight: 400;
    color: var(--text-secondary);
  }

  &__summary-divider {
    width: 1px;
    height: 14px;
    background: var(--border-color);
    flex-shrink: 0;
  }

  &__toolbar {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px 4px;
  }

  &__toolbar-form {
    :deep(.el-form-item) {
      margin-bottom: 8px;
      margin-right: 20px;
    }

    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
    }
  }

  &__workspace {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--app-page-gap);
    min-height: 480px;
    flex: 1;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
    }
  }

  &__docs,
  &__fields {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--app-panel-padding);
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__fields-title {
    min-width: 0;
  }

  &__panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    margin-bottom: var(--app-section-gap);
  }

  &__panel-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__panel-actions {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    flex-shrink: 0;
  }

  &__footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: var(--left-menu-min-width);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    box-sizing: border-box;
    min-height: var(--app-action-bar-height);
    padding: var(--app-action-bar-padding-y) var(--app-action-bar-padding-x);
    border-top: 1px solid var(--border-color);
    background: #fff;

    @media (max-width: 768px) {
      left: 0;
    }
  }

  &__footer-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
