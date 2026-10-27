<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mockUiText } from '@/i18n/mockUiText'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applyPhase3Once } from '@/mocks/phase3Ocr'
import { ArrowLeft } from '@element-plus/icons-vue'
import OcrDocumentPreview from './components/OcrDocumentPreview.vue'
import OcrFieldPanel from './components/OcrFieldPanel.vue'
import {
  applyMasterMatchSelection,
  canCompleteOcr,
  countPendingReviews,
  getOcrExtractionTask,
  needsFieldReview,
  restoreMasterMatchGroup,
  toggleMasterMatchGroupConfirm,
  type OcrDocumentPage,
  type OcrMasterMatchCandidate
} from '@/mocks/ocrExtractionTask'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { confirmTaskAbort, confirmTaskSupplement } from '@/utils/taskFooterActions'
import { useTaskViewMode } from '@/composables/useTaskViewMode'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { isViewOnly } = useTaskViewMode()

const taskId = computed(() => String(route.params.id ?? ''))
const initialTask = computed(() => getOcrExtractionTask(taskId.value))

const pages = ref<OcrDocumentPage[]>([])
const activePageId = ref<string>('')
const selectedFieldId = ref<string | null>(null)
const showReviewOnly = ref(false)
const fieldPanelRef = ref<InstanceType<typeof OcrFieldPanel> | null>(null)

watch(
  initialTask,
  (task) => {
    if (!task) {
      pages.value = []
      activePageId.value = ''
      selectedFieldId.value = null
      return
    }
    pages.value = task.pages
    pages.value.forEach(page=>applyPhase3Once(page.fields,page.docType))
    activePageId.value = task.pages[0]?.id ?? ''
    selectedFieldId.value = task.pages[0]?.fields[0]?.id ?? null
  },
  { immediate: true }
)

const activePage = computed(
  () => pages.value.find((page) => page.id === activePageId.value) ?? null
)

const activeFields = computed(() => activePage.value?.fields ?? [])
const activeTables = computed(() => activePage.value?.tables ?? [])

const visibleFields = computed(() =>
  showReviewOnly.value
    ? activeFields.value.filter((field) => needsFieldReview(field, activeFields.value))
    : activeFields.value
)

const allFields = computed(() => pages.value.flatMap((page) => page.fields))

const canComplete = computed(() => canCompleteOcr(allFields.value))

watch([showReviewOnly, visibleFields], () => {
  if (!selectedFieldId.value) return
  if (!visibleFields.value.some((field) => field.id === selectedFieldId.value)) {
    selectedFieldId.value = visibleFields.value[0]?.id ?? null
  }
})

function pendingReviewsForPage(page: OcrDocumentPage): number {
  return countPendingReviews(page.fields)
}

function findField(fieldId: string) {
  for (const page of pages.value) {
    const field = page.fields.find((item) => item.id === fieldId)
    if (field) return field
  }
  return null
}

function selectPage(pageId: string) {
  activePageId.value = pageId
  const page = pages.value.find((item) => item.id === pageId)
  selectedFieldId.value = page?.fields[0]?.id ?? null
}

function selectField(fieldId: string) {
  selectedFieldId.value = fieldId
}

function updateFieldValue(fieldId: string, value: string) {
  const field = findField(fieldId)
  if (field) {
    field.value = value
    delete field.masterAutoAdopted
    delete field.masterHierarchyOfficial
    delete field.masterHierarchyLevel
    delete field.masterHierarchyPath
    delete field.masterMatchStrategy
    delete field.masterMatchSimilarity
    field.userConfirmed = false
  }
}

function resolveFieldValue(fieldId: string, value: string) {
  const field = findField(fieldId)
  if (field) {
    field.value = value
    delete field.masterAutoAdopted
    delete field.masterHierarchyOfficial
    delete field.masterHierarchyLevel
    delete field.masterHierarchyPath
    delete field.masterMatchStrategy
    delete field.masterMatchSimilarity
    delete field.modelAlternatives
    field.userConfirmed = false
  }
}

function toggleFieldConfirm(fieldId: string) {
  const field = findField(fieldId)
  if (!field) return
  toggleMasterMatchGroupConfirm(field, activeFields.value)
}

function restoreFieldValue(fieldId: string) {
  const field = findField(fieldId)
  if (!field) return
  restoreMasterMatchGroup(field, activeFields.value)
}

function selectMasterMatch(_fieldId: string, candidate: OcrMasterMatchCandidate) {
  applyMasterMatchSelection(activeFields.value, candidate)
}

function goBack() {
  router.push('/tasks')
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
  if (!canComplete.value) return

  await ElMessageBox.confirm(t('tasks.ocr.messages.completeConfirm'), t('tasks.ocr.complete'), {
    ...MESSAGE_BOX_CONFIRM_DEFAULTS,
    type: 'info'
  })
  ElMessage.success(t('tasks.ocr.messages.completeSuccess'))
  router.push('/tasks')
}

</script>

<template>
  <div class="v-content-wrap v-ocr-task">
    <template v-if="initialTask && activePage">
      <section class="v-ocr-task__summary">
        <button type="button" class="v-ocr-task__back" @click="goBack">
          <el-icon :size="16"><ArrowLeft /></el-icon>
          {{ $t('menu.tasks') }}
        </button>
        <h1 class="v-ocr-task__title">{{ $t('tasks.ocr.title') }}</h1>
        <div class="v-ocr-task__summary-items">
          <span class="v-ocr-task__summary-inline">
            <span class="v-ocr-task__summary-label">{{ $t('tasks.common.businessKey') }}</span>
            {{ initialTask.caseOrigin ?? '—' }}
          </span>
        </div>
      </section>

      <el-tabs
        :model-value="activePageId"
        type="card"
        class="v-ocr-task__file-tabs"
        @tab-change="(name: string | number) => selectPage(String(name))"
      >
        <el-tab-pane
          v-for="page in pages"
          :key="page.id"
          :name="page.id"
        >
          <template #label>
            <span class="v-ocr-task__tab-label">
              <span class="v-ocr-task__tab-doc">{{ mockUiText(page.docType) }}</span>
              <el-badge
                v-if="pendingReviewsForPage(page) > 0"
                :value="pendingReviewsForPage(page)"
                type="danger"
                class="v-ocr-task__tab-badge"
              />
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <div class="v-ocr-task__workspace">
        <OcrDocumentPreview
          class="v-ocr-task__preview"
          :image-url="activePage.imageUrl"
          :page-count="activePage.pageCount ?? 1"
        />

        <OcrFieldPanel
          ref="fieldPanelRef"
          v-model:show-review-only="showReviewOnly"
          class="v-ocr-task__fields"
          :fields="activeFields"
          :tables="activeTables"
          :selected-field-id="selectedFieldId"
          :readonly="isViewOnly"
          @select-field="selectField"
          @update-value="updateFieldValue"
          @resolve-value="resolveFieldValue"
          @toggle-confirm="toggleFieldConfirm"
          @restore-value="restoreFieldValue"
          @select-master-match="selectMasterMatch"
        />
      </div>

      <footer class="v-ocr-task__footer">
        <div class="v-ocr-task__footer-actions">
          <el-button @click="goBack">{{ $t('tasks.common.close') }}</el-button>
          <template v-if="!isViewOnly">
            <el-button type="danger" plain @click="handleAbortCase">
              {{ $t('tasks.common.abortCase') }}
            </el-button>
            <el-button type="warning" @click="handleSupplement">
              {{ $t('tasks.verification.supplement') }}
            </el-button>
            <el-button type="primary" @click="handleSave">
              {{ $t('tasks.common.save') }}
            </el-button>
            <el-button type="primary" :disabled="!canComplete" @click="handleComplete">
              {{ $t('tasks.ocr.complete') }}
            </el-button>
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
.v-ocr-task {
  --ocr-page-padding: 12px;
  --ocr-row-gap: 8px;
  --ocr-card-header-height: 52px;

  display: flex;
  flex-direction: column;
  gap: var(--ocr-row-gap);
  height: calc(100vh - var(--top-header-total-height));
  min-height: unset;
  max-height: calc(100vh - var(--top-header-total-height));
  overflow: hidden;
  box-sizing: border-box;
  padding: var(--ocr-page-padding) !important;

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

  &__summary-divider {
    width: 1px;
    height: 14px;
    background: var(--border-color);
    flex-shrink: 0;
  }

  &__file-tabs {
    flex-shrink: 0;
    width: 100%;

    :deep(.el-tabs__content) {
      display: none;
    }

    :deep(.el-tabs__header) {
      margin-bottom: 0;
      width: 100%;
    }

    :deep(.el-tabs__nav-wrap) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav) {
      border: none;
      gap: 8px;
      float: none;
    }

    :deep(.el-tabs__item) {
      height: auto;
      padding: 8px 14px;
      line-height: 1.35;
      margin-left: 0 !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 8px;
      background: #fff;
      color: var(--text-secondary);
      font-size: var(--app-font-size-base);
      transition: none;

      &:first-child {
        border-left: 1px solid var(--border-color) !important;
      }

      &:hover {
        color: var(--text-secondary);
      }

      &.is-active {
        border-color: var(--el-color-primary) !important;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);

        &:hover {
          color: var(--el-color-primary);
        }

        .v-ocr-task__tab-doc {
          color: var(--el-color-primary);
        }
      }
    }
  }

  &__tab-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 280px;
  }

  &__tab-doc {
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__tab-file {
    font-size: 12px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
  }

  &__tab-badge {
    :deep(.el-badge__content) {
      position: static;
      transform: none;
    }
  }

  &__workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ocr-row-gap);
    align-items: stretch;
    overflow: hidden;

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(320px, 45vh) minmax(0, 1fr);
    }
  }

  &__preview,
  &__fields {
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    --ocr-card-header-height: 52px;
  }

  &__footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--app-section-gap);
    margin: 0 calc(-1 * var(--ocr-page-padding)) calc(-1 * var(--ocr-page-padding));
    padding: 10px var(--ocr-page-padding);
    border-top: 1px solid var(--border-color);
    background: #fff;
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--app-section-gap);
    flex-wrap: wrap;
  }
}
</style>
