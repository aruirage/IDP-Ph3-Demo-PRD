<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import PreprocessFileSidebar from './components/PreprocessFileSidebar.vue'
import PreprocessThumbnailPanel from './components/PreprocessThumbnailPanel.vue'
import PreprocessImageSplitDialog from './components/PreprocessImageSplitDialog.vue'
import PreprocessEnlargeDialog from './components/PreprocessEnlargeDialog.vue'
import {
  applyPageImageSplit,
  canCompletePreprocess,
  canDeleteLogicalFile,
  countAllPendingReviewPages,
  countMainDocFiles,
  createLogicalFile,
  getPreprocessConfirmationTask,
  requiresReviewConfirmation,
  preprocessDocTypeOptions,
  recomputeLogicalFileDisplayNames,
  sortLogicalFiles,
  syncLogicalFilePageIds,
  UNCLASSIFIED_LOGICAL_FILE_ID,
  wouldRemoveLastMainDocFile,
  type PreprocessLogicalFile,
  type PreprocessPage
} from '@/mocks/preprocessConfirmationTask'
import { PLACEHOLDER } from '@/constants/placeholders'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { confirmTaskAbort, confirmTaskSupplement } from '@/utils/taskFooterActions'
import { useTaskViewMode } from '@/composables/useTaskViewMode'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { isViewOnly } = useTaskViewMode()

const taskId = computed(() => String(route.params.id ?? ''))
const initialTask = computed(() => getPreprocessConfirmationTask(taskId.value))

const pages = ref<PreprocessPage[]>([])
const logicalFiles = ref<PreprocessLogicalFile[]>([])
const selectedFileId = ref<string | null>(null)
const showAllPages = ref(true)
const enlargeVisible = ref(false)
const enlargedPage = ref<PreprocessPage | null>(null)
const splitDialogVisible = ref(false)
const splitSourcePage = ref<PreprocessPage | null>(null)
const addDialogVisible = ref(false)
const newDocType = ref('')

const docTypeOptions = computed(() => preprocessDocTypeOptions())
const canComplete = computed(() => canCompletePreprocess(pages.value, logicalFiles.value))

watch(
  initialTask,
  (task) => {
    if (!task) {
      pages.value = []
      logicalFiles.value = []
      selectedFileId.value = null
      showAllPages.value = true
      return
    }
    pages.value = task.pages.map((page) => ({ ...page }))
    logicalFiles.value = task.logicalFiles.map((file) => ({
      ...file,
      pageIds: [...file.pageIds]
    }))
    selectedFileId.value = null
    showAllPages.value = true
  },
  { immediate: true }
)

function goBack() {
  router.push('/tasks')
}

function selectFile(fileId: string | null) {
  selectedFileId.value = fileId
  showAllPages.value = false
}

function showAll() {
  selectedFileId.value = null
  showAllPages.value = true
}

function reorderVisiblePages(orderedIds: string[]) {
  const idSet = new Set(orderedIds)
  const others = pages.value
    .filter((page) => !idSet.has(page.id))
    .sort((a, b) => a.order - b.order)
  const reordered = [
    ...orderedIds.map((id, index) => {
      const page = pages.value.find((item) => item.id === id)
      if (!page) return null
      return { ...page, order: index + 1 }
    }).filter(Boolean) as PreprocessPage[],
    ...others.map((page, index) => ({ ...page, order: orderedIds.length + index + 1 }))
  ]
  pages.value = reordered
  syncLogicalFilePageIds(logicalFiles.value, pages.value)
}

function reorderFiles(sourceFileId: string, targetFileId: string) {
  const sorted = sortLogicalFiles(logicalFiles.value)
  const fromIndex = sorted.findIndex((file) => file.id === sourceFileId)
  const toIndex = sorted.findIndex((file) => file.id === targetFileId)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

  const source = sorted[fromIndex]
  const target = sorted[toIndex]
  if (source.isMainDoc || target.isMainDoc) return

  const [moved] = sorted.splice(fromIndex, 1)
  const insertAt = sorted.findIndex((file) => file.id === targetFileId)
  sorted.splice(insertAt, 0, moved)

  sorted.forEach((file, index) => {
    file.order = index + 1
  })
  logicalFiles.value = sorted
  recomputeLogicalFileDisplayNames(logicalFiles.value)
}

function changeClassification(pageId: string, logicalFileId: string) {
  const page = pages.value.find((item) => item.id === pageId)
  if (!page) return
  page.logicalFileId = logicalFileId
  syncLogicalFilePageIds(logicalFiles.value, pages.value)
}

async function deleteLogicalFile(fileId: string) {
  const file = logicalFiles.value.find((item) => item.id === fileId)
  if (!file || !canDeleteLogicalFile(file)) return

  try {
    await ElMessageBox.confirm(
      t('tasks.preprocess.deleteFileConfirm', { name: file.displayName }),
      t('tasks.preprocess.deleteFile'),
      {
        type: 'warning',
        ...MESSAGE_BOX_CONFIRM_DEFAULTS
      }
    )
  } catch {
    return
  }

  pages.value = pages.value.map((page) =>
    page.logicalFileId === fileId
      ? { ...page, logicalFileId: UNCLASSIFIED_LOGICAL_FILE_ID }
      : page
  )

  logicalFiles.value = logicalFiles.value.filter((item) => item.id !== fileId)
  recomputeLogicalFileDisplayNames(logicalFiles.value)
  syncLogicalFilePageIds(logicalFiles.value, pages.value)

  if (selectedFileId.value === fileId) {
    showAll()
  }
}

async function deletePage(pageId: string) {
  if (wouldRemoveLastMainDocFile(pages.value, logicalFiles.value, pageId)) {
    ElMessage.warning(t('tasks.preprocess.blockDeleteLastMainDoc'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('tasks.preprocess.deleteConfirm'),
      t('tasks.preprocess.delete'),
      {
        type: 'warning',
        ...MESSAGE_BOX_CONFIRM_DEFAULTS
      }
    )
  } catch {
    return
  }

  const targetFileId = pages.value.find((page) => page.id === pageId)?.logicalFileId
  pages.value = pages.value
    .filter((page) => page.id !== pageId)
    .map((page, index) => ({ ...page, order: index + 1 }))

  if (targetFileId) {
    const file = logicalFiles.value.find((item) => item.id === targetFileId)
    if (file && !pages.value.some((page) => page.logicalFileId === targetFileId)) {
      if (file.isMainDoc && countMainDocFiles(logicalFiles.value) <= 1) {
        syncLogicalFilePageIds(logicalFiles.value, pages.value)
        return
      }
      logicalFiles.value = logicalFiles.value.filter((item) => item.id !== targetFileId)
      recomputeLogicalFileDisplayNames(logicalFiles.value)
      if (selectedFileId.value === targetFileId) {
        showAll()
      }
    }
  }
  syncLogicalFilePageIds(logicalFiles.value, pages.value)
}

function openEnlarge(page: PreprocessPage) {
  enlargedPage.value = page
  enlargeVisible.value = true
}

function handleEnlargePageChange(pageId: string) {
  const page = pages.value.find((item) => item.id === pageId)
  if (page) enlargedPage.value = page
}

function handleSaveRotation(payload: { pageId: string; childPageId?: string; rotation: number }) {
  const page = pages.value.find((item) => item.id === payload.pageId)
  if (!page) return
  if (payload.childPageId) {
    page.childRotations = {
      ...(page.childRotations ?? {}),
      [payload.childPageId]: payload.rotation
    }
  } else {
    page.rotation = payload.rotation
  }
  if (enlargedPage.value?.id === payload.pageId) {
    enlargedPage.value = page
  }
}

function openImageSplit(page: PreprocessPage) {
  splitSourcePage.value = page
  splitDialogVisible.value = true
}

function handleSplitPageChange(pageId: string) {
  const page = pages.value.find((item) => item.id === pageId)
  if (page) splitSourcePage.value = page
}

function togglePageReview(pageId: string) {
  const page = pages.value.find((item) => item.id === pageId)
  if (!page || !requiresReviewConfirmation(page)) return
  page.reviewConfirmed = !page.reviewConfirmed
}

function handleImageSplit(segmentCount: number) {
  if (!splitSourcePage.value || segmentCount < 1) return
  pages.value = applyPageImageSplit(pages.value, splitSourcePage.value.id, segmentCount)
  syncLogicalFilePageIds(logicalFiles.value, pages.value)
  splitSourcePage.value = null
  ElMessage.success(t('tasks.preprocess.imageSplitExecuteSuccess'))
}

function openAddClassification() {
  newDocType.value = docTypeOptions.value[0] ?? ''
  addDialogVisible.value = true
}

function confirmAddClassification() {
  if (!newDocType.value) {
    ElMessage.warning(t('tasks.preprocess.docTypeRequired'))
    return
  }
  const file = createLogicalFile(newDocType.value, logicalFiles.value)
  addDialogVisible.value = false
  selectFile(file.id)
  ElMessage.success(t('tasks.preprocess.addClassificationSuccess'))
}

async function handleSave() {
  ElMessage.success(t('tasks.common.saveSuccess'))
}

async function handleSupplement() {
  try {
    await confirmTaskSupplement(t)
    ElMessage.warning(t('tasks.common.supplementSuccess'))
    router.push('/tasks')
  } catch {
    // cancelled
  }
}

async function handleAbortCase() {
  if (!initialTask.value) return
  try {
    await confirmTaskAbort(t, initialTask.value.caseId)
    ElMessage.success(t('tasks.common.abortSuccess'))
    router.push('/tasks')
  } catch {
    // cancelled
  }
}

async function handleComplete() {
  if (!pages.value.length) return

  if (!pages.value.every((page) => logicalFiles.value.some((file) => file.id === page.logicalFileId))) {
    ElMessage.warning(t('tasks.preprocess.blockUnclassified'))
    return
  }

  const pendingReviewCount = countAllPendingReviewPages(pages.value)
  if (pendingReviewCount > 0) {
    ElMessage.warning(t('tasks.preprocess.blockPendingReview', { count: pendingReviewCount }))
    return
  }

  await ElMessageBox.confirm(
    t('tasks.preprocess.completeConfirm'),
    t('tasks.preprocess.complete'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'info'
    }
  )
  ElMessage.success(t('tasks.preprocess.completeSuccess'))
  router.push('/tasks')
}
</script>

<template>
  <div class="v-pre-task v-content-wrap">
    <template v-if="initialTask">
      <section class="v-pre-task__summary">
        <button type="button" class="v-pre-task__back" @click="goBack">
          <el-icon :size="16"><ArrowLeft /></el-icon>
          {{ $t('menu.tasks') }}
        </button>
        <h1 class="v-pre-task__title">{{ $t('tasks.preprocess.title') }}</h1>
        <div class="v-pre-task__summary-items">
          <span class="v-pre-task__summary-inline">
            <span class="v-pre-task__summary-label">{{ $t('tasks.common.businessKey') }}</span>
            {{ initialTask.caseOrigin ?? '—' }}
          </span>
        </div>
      </section>

      <div class="v-pre-task__workspace">
        <PreprocessThumbnailPanel
          class="v-pre-task__thumbs"
          :pages="pages"
          :logical-files="logicalFiles"
          :filter-file-id="showAllPages ? null : selectedFileId"
          :readonly="isViewOnly"
          @reorder="reorderVisiblePages"
          @delete-page="deletePage"
          @change-classification="changeClassification"
          @enlarge="openEnlarge"
          @split-image="openImageSplit"
          @toggle-review="togglePageReview"
        />

        <PreprocessFileSidebar
          class="v-pre-task__sidebar"
          :files="logicalFiles"
          :pages="pages"
          :selected-file-id="selectedFileId"
          :show-all="showAllPages"
          :readonly="isViewOnly"
          @select-file="selectFile"
          @show-all="showAll"
          @add-classification="openAddClassification"
          @reorder-files="reorderFiles"
          @delete-file="deleteLogicalFile"
        />
      </div>

      <footer class="v-pre-task__footer">
        <div class="v-pre-task__footer-actions">
          <el-button size="large" @click="goBack">{{ $t('tasks.common.close') }}</el-button>
          <template v-if="!isViewOnly">
            <el-button size="large" type="danger" plain @click="handleAbortCase">
              {{ $t('tasks.common.abortCase') }}
            </el-button>
            <el-button size="large" type="warning" @click="handleSupplement">
              {{ $t('tasks.verification.supplement') }}
            </el-button>
            <el-button size="large" type="primary" @click="handleSave">
              {{ $t('tasks.common.save') }}
            </el-button>
            <el-button size="large" type="primary" :disabled="!canComplete" @click="handleComplete">
              {{ $t('tasks.preprocess.complete') }}
            </el-button>
          </template>
        </div>
      </footer>
    </template>

    <el-empty v-else :description="$t('tasks.common.taskNotFound')" :image-size="100">
      <el-button type="primary" @click="goBack">{{ $t('tasks.common.backToList') }}</el-button>
    </el-empty>

    <PreprocessImageSplitDialog
      v-model:visible="splitDialogVisible"
      :page="splitSourcePage"
      :all-pages="pages"
      :logical-files="logicalFiles"
      :readonly="isViewOnly"
      @update:page-id="handleSplitPageChange"
      @split="handleImageSplit"
      @save-rotation="handleSaveRotation"
      @change-classification="changeClassification"
    />

    <PreprocessEnlargeDialog
      v-model:visible="enlargeVisible"
      :page="enlargedPage"
      :all-pages="pages"
      :logical-files="logicalFiles"
      :readonly="isViewOnly"
      @update:page-id="handleEnlargePageChange"
    />

    <el-dialog
      v-model="addDialogVisible"
      :title="$t('tasks.preprocess.addClassification')"
      width="480px"
      destroy-on-close
    >
      <el-form label-position="top" @submit.prevent>
        <AppFormItem :label="$t('tasks.preprocess.docType')" required>
          <el-select v-model="newDocType" class="v-pre-task__full-width" :placeholder="PLACEHOLDER.SELECT">
            <el-option
              v-for="docType in docTypeOptions"
              :key="docType"
              :label="docType"
              :value="docType"
            />
          </el-select>
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAddClassification">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-pre-task {
  --pre-page-padding: 12px;
  --pre-row-gap: 8px;

  display: flex;
  flex-direction: column;
  gap: var(--pre-row-gap);
  height: calc(100vh - var(--top-header-total-height));
  min-height: unset;
  max-height: calc(100vh - var(--top-header-total-height));
  overflow: hidden;
  box-sizing: border-box;
  padding: var(--pre-page-padding) !important;

  &.v-content-wrap {
    min-height: unset;
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

  &__workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: var(--app-page-gap);
  }

  &__thumbs {
    min-width: 0;
  }

  &__sidebar {
    min-width: 0;
  }

  &__footer {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
  }

  &__footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    :deep(.el-button) {
      min-width: 96px;
      font-size: var(--app-font-size-base);
    }
  }

  &__full-width {
    width: 100%;
  }
}
</style>
