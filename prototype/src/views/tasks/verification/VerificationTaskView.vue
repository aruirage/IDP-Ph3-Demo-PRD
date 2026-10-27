<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import OcrDocumentPreview from '../ocr-extraction/components/OcrDocumentPreview.vue'
import VerificationScopeNav from './components/VerificationScopeNav.vue'
import VerificationSummaryPanel, {
  type SummaryReturnContext
} from './components/VerificationSummaryPanel.vue'
import VerificationFieldPanel from './components/VerificationFieldPanel.vue'
import VerificationStandardFieldPanel from './components/VerificationStandardFieldPanel.vue'
import {
  canCompleteVerification,
  countPendingReview,
  findStandardFieldByKey,
  getVerificationTask,
  isHumanConfirmed,
  needsHumanReview,
  STANDARD_FIELDS_SCOPE,
  toggleHumanConfirm,
  type CompletenessRequirement,
  type CompletenessFieldRequirement,
  type VerificationDocument,
  type VerificationRule,
  type VerificationScope,
  type VerificationStandardField
} from '@/mocks/verificationTask'
import {
  getDocumentDisplayName,
  shouldShowDisplayNameSubtitle
} from '@/utils/fieldDisplayName'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { confirmTaskAbort, confirmTaskSupplement } from '@/utils/taskFooterActions'
import { useTaskViewMode } from '@/composables/useTaskViewMode'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { isViewOnly } = useTaskViewMode()

const taskId = computed(() => String(route.params.id ?? ''))
const initialTask = computed(() => getVerificationTask(taskId.value))

const documents = ref<VerificationDocument[]>([])
const completeness = ref<CompletenessRequirement[]>([])
const completenessFields = ref<CompletenessFieldRequirement[]>([])
const standardFields = ref<VerificationStandardField[]>([])
const rules = ref<VerificationRule[]>([])
const activeScope = ref<VerificationScope>('summary')
const selectedRuleId = ref<string | null>(null)
const selectedCompletenessId = ref<string | null>(null)
const selectedCompletenessFieldId = ref<string | null>(null)
const selectedStandardFieldId = ref<string | null>(null)
const selectedFieldId = ref<string | null>(null)

const fieldPanelRef = ref<InstanceType<typeof VerificationFieldPanel> | null>(null)
const standardFieldPanelRef = ref<InstanceType<typeof VerificationStandardFieldPanel> | null>(null)
const summaryPanelRef = ref<InstanceType<typeof VerificationSummaryPanel> | null>(null)
const summaryReturnContext = ref<SummaryReturnContext | null>(null)

watch(
  initialTask,
  (task) => {
    if (!task) {
      documents.value = []
      completeness.value = []
      completenessFields.value = []
      standardFields.value = []
      rules.value = []
      activeScope.value = 'summary'
      selectedRuleId.value = null
      selectedCompletenessId.value = null
      selectedCompletenessFieldId.value = null
      selectedStandardFieldId.value = null
      selectedFieldId.value = null
      summaryReturnContext.value = null
      return
    }
    documents.value = task.documents.map((doc) => ({
      ...doc,
      fields: doc.fields.map((field) => ({ ...field }))
    }))
    completeness.value = task.completeness.map((c) => ({ ...c }))
    completenessFields.value = task.completenessFields.map((c) => ({ ...c }))
    standardFields.value = task.standardFields.map((field) => ({
      ...field,
      sources: field.sources.map((source) => ({ ...source }))
    }))
    rules.value = task.rules.map((r) => ({ ...r }))
    activeScope.value = 'summary'
    const firstPendingRule = task.rules.find((r) => r.aiVerdict === 'REVIEW' && !r.humanVerdict)
    const firstPendingCompleteness = task.completeness.find(
      (c) => c.aiVerdict === 'REVIEW' && !c.humanVerdict
    )
    const firstPendingField = task.completenessFields.find(
      (c) => c.aiVerdict === 'REVIEW' && !c.humanVerdict
    )
    selectedRuleId.value = firstPendingRule?.id ?? null
    selectedCompletenessId.value = firstPendingCompleteness?.id ?? null
    selectedCompletenessFieldId.value = firstPendingField?.id ?? null
    selectedStandardFieldId.value = null
    selectedFieldId.value = null
  },
  { immediate: true }
)

const isSummaryMode = computed(() => activeScope.value === 'summary')
const isStandardFieldsMode = computed(() => activeScope.value === STANDARD_FIELDS_SCOPE)

const activeDocument = computed(() => {
  if (isSummaryMode.value || isStandardFieldsMode.value) return null
  return documents.value.find((doc) => doc.id === activeScope.value) ?? null
})

const pendingCount = computed(() =>
  countPendingReview(completeness.value, completenessFields.value, rules.value)
)
const canComplete = computed(() =>
  canCompleteVerification(completeness.value, completenessFields.value, rules.value)
)

const showReturnToSummary = computed(
  () => summaryReturnContext.value !== null && activeScope.value !== 'summary'
)

function captureSummaryReturnContext(overrides?: Partial<SummaryReturnContext>) {
  if (activeScope.value !== 'summary') return
  const base = summaryPanelRef.value?.captureReturnContext() ?? {
    scrollTop: 0,
    selectedRuleId: selectedRuleId.value,
    selectedCompletenessId: selectedCompletenessId.value,
    selectedCompletenessFieldId: selectedCompletenessFieldId.value,
    expandedCategories: []
  }
  summaryReturnContext.value = { ...base, ...overrides }
}

function resolveSummaryContextOverrides(contextId?: string): Partial<SummaryReturnContext> | undefined {
  if (!contextId) return undefined

  if (rules.value.some((rule) => rule.id === contextId)) {
    return {
      selectedRuleId: contextId,
      selectedCompletenessId: null,
      selectedCompletenessFieldId: null
    }
  }

  if (completeness.value.some((item) => item.id === contextId)) {
    return {
      selectedRuleId: null,
      selectedCompletenessId: contextId,
      selectedCompletenessFieldId: null
    }
  }

  if (completenessFields.value.some((item) => item.id === contextId)) {
    return {
      selectedRuleId: null,
      selectedCompletenessId: null,
      selectedCompletenessFieldId: contextId
    }
  }

  return undefined
}

async function restoreToSummary() {
  const context = summaryReturnContext.value
  activeScope.value = 'summary'
  selectedFieldId.value = null
  selectedStandardFieldId.value = null

  if (!context) return

  selectedRuleId.value = context.selectedRuleId
  selectedCompletenessId.value = context.selectedCompletenessId
  selectedCompletenessFieldId.value = context.selectedCompletenessFieldId

  await nextTick()
  await summaryPanelRef.value?.restoreReturnContext(context)
}

function selectScope(scope: VerificationScope) {
  activeScope.value = scope
  if (scope === 'summary') {
    selectedFieldId.value = null
    selectedStandardFieldId.value = null
    return
  }
  if (scope === STANDARD_FIELDS_SCOPE) {
    selectedFieldId.value = null
    selectedStandardFieldId.value = standardFields.value[0]?.id ?? null
    return
  }
  const doc = documents.value.find((d) => d.id === scope)
  selectedStandardFieldId.value = null
  selectedFieldId.value = doc?.fields[0]?.id ?? null
}

function selectField(fieldId: string) {
  selectedFieldId.value = fieldId
}

async function navigateToStandardField(standardFieldKey: string, contextId?: string) {
  captureSummaryReturnContext(resolveSummaryContextOverrides(contextId))
  activeScope.value = STANDARD_FIELDS_SCOPE
  selectedFieldId.value = null

  const item = findStandardFieldByKey(standardFields.value, standardFieldKey)
  selectedStandardFieldId.value = item?.id ?? null

  if (contextId) {
    const rule = rules.value.find((r) => r.id === contextId)
    if (rule) {
      selectedRuleId.value = rule.id
      selectedCompletenessId.value = null
      selectedCompletenessFieldId.value = null
    }
  }

  await nextTick()
  if (item?.id) {
    await standardFieldPanelRef.value?.scrollToField(item.id)
  }
}

async function navigateToField(
  fileId: string,
  fieldId: string | null,
  contextId?: string
) {
  captureSummaryReturnContext(resolveSummaryContextOverrides(contextId))
  activeScope.value = fileId
  selectedFieldId.value = fieldId

  if (contextId) {
    const rule = rules.value.find((r) => r.id === contextId)
    const completenessItem = completeness.value.find((c) => c.id === contextId)
    const completenessFieldItem = completenessFields.value.find((c) => c.id === contextId)

    if (rule) {
      selectedRuleId.value = rule.id
      selectedCompletenessId.value = null
      selectedCompletenessFieldId.value = null
    } else if (completenessItem) {
      selectedCompletenessId.value = completenessItem.id
      selectedRuleId.value = null
      selectedCompletenessFieldId.value = null
    } else if (completenessFieldItem) {
      selectedCompletenessFieldId.value = completenessFieldItem.id
      selectedRuleId.value = null
      selectedCompletenessId.value = null
    }
  }

  await nextTick()
  if (fieldId) {
    await fieldPanelRef.value?.scrollToField(fieldId)
  }
}

function updateStandardFieldValue(fieldId: string, value: string) {
  const field = standardFields.value.find((item) => item.id === fieldId)
  if (field) field.value = value
}

function restoreStandardFieldValue(fieldId: string) {
  const field = standardFields.value.find((item) => item.id === fieldId)
  if (field) field.value = field.resolvedValue
}

function selectStandardField(fieldId: string) {
  selectedStandardFieldId.value = fieldId
}

function updateFieldValue(fieldId: string, value: string) {
  const doc = activeDocument.value
  if (!doc) return
  const field = doc.fields.find((f) => f.id === fieldId)
  if (field) field.value = value
}

function restoreFieldValue(fieldId: string) {
  const doc = activeDocument.value
  if (!doc) return
  const field = doc.fields.find((f) => f.id === fieldId)
  if (field) field.value = field.ocrOriginalValue ?? field.value
}

function selectRule(ruleId: string) {
  selectedRuleId.value = ruleId
  selectedCompletenessId.value = null
  selectedCompletenessFieldId.value = null
}

function toggleRuleConfirm(ruleId: string) {
  const rule = rules.value.find((r) => r.id === ruleId)
  if (rule) rule.humanVerdict = toggleHumanConfirm(rule.humanVerdict)
}

function toggleCompletenessRowConfirm() {
  const items = completeness.value.filter(
    (item) => item.status === 'missing' && needsHumanReview(item)
  )
  if (!items.length) return
  const allConfirmed = items.every((item) => isHumanConfirmed(item.humanVerdict))
  for (const item of items) {
    item.humanVerdict = allConfirmed ? null : 'OK'
  }
}

function toggleCompletenessFieldsRowConfirm() {
  const items = completenessFields.value.filter(
    (item) => item.status === 'missing' && needsHumanReview(item)
  )
  if (!items.length) return
  const allConfirmed = items.every((item) => isHumanConfirmed(item.humanVerdict))
  for (const item of items) {
    item.humanVerdict = allConfirmed ? null : 'OK'
  }
}

function selectCompleteness(id: string) {
  selectedCompletenessId.value = id
  selectedCompletenessFieldId.value = null
  selectedRuleId.value = null
}

function selectCompletenessField(id: string) {
  selectedCompletenessFieldId.value = id
  selectedCompletenessId.value = null
  selectedRuleId.value = null
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

async function handleVerificationComplete() {
  if (!canComplete.value) return

  await ElMessageBox.confirm(
    t('tasks.verification.messages.completeConfirm'),
    t('tasks.verification.complete'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'info'
    }
  )
  ElMessage.success(t('tasks.verification.messages.completeSuccess'))
  router.push('/tasks')
}
</script>

<template>
  <div class="v-ver-task v-content-wrap">
    <template v-if="initialTask">
      <section class="v-ver-task__summary">
        <button type="button" class="v-ver-task__back" @click="goBack">
          <el-icon :size="16"><ArrowLeft /></el-icon>
          {{ $t('menu.tasks') }}
        </button>
        <h1 class="v-ver-task__title">{{ $t('tasks.verification.title') }}</h1>
        <div class="v-ver-task__summary-items">
          <span class="v-ver-task__summary-inline">
            <span class="v-ver-task__summary-label">{{ $t('tasks.common.businessKey') }}</span>
            {{ initialTask.caseOrigin ?? '—' }}
          </span>
        </div>
        <div class="v-ver-task__stats">
          <span v-if="pendingCount > 0" class="v-ver-task__stat">
            {{ $t('tasks.verification.messages.blockPending', { count: pendingCount }) }}
          </span>
          <span v-else class="v-ver-task__stat is-ok">{{ $t('tasks.common.allConfirmed') }}</span>
        </div>
      </section>

      <div class="v-ver-task__scope-row">
        <button
          v-if="showReturnToSummary"
          type="button"
          class="v-ver-task__back v-ver-task__return-link"
          @click="restoreToSummary"
        >
          <el-icon :size="14"><ArrowLeft /></el-icon>
          {{ $t('tasks.verification.backToSummary') }}
        </button>
        <VerificationScopeNav
          :active-scope="activeScope"
          :documents="documents"
          @select-scope="selectScope"
        />
      </div>

      <div
        class="v-ver-task__workspace"
        :class="{
          'is-summary': isSummaryMode || isStandardFieldsMode,
          'is-document': !isSummaryMode && !isStandardFieldsMode
        }"
      >
        <VerificationSummaryPanel
          v-if="isSummaryMode"
          ref="summaryPanelRef"
          class="v-ver-task__panel v-ver-task__panel--full"
          :readonly="isViewOnly"
          :documents="documents"
          :completeness="completeness"
          :completeness-fields="completenessFields"
          :rules="rules"
          :selected-rule-id="selectedRuleId"
          :selected-completeness-id="selectedCompletenessId"
          :selected-completeness-field-id="selectedCompletenessFieldId"
          @select-rule="selectRule"
          @select-completeness="selectCompleteness"
          @select-completeness-field="selectCompletenessField"
          @navigate-to-field="navigateToField"
          @navigate-to-standard-field="navigateToStandardField"
          @toggle-rule-confirm="toggleRuleConfirm"
          @toggle-completeness-row-confirm="toggleCompletenessRowConfirm"
          @toggle-completeness-fields-row-confirm="toggleCompletenessFieldsRowConfirm"
        />

        <VerificationStandardFieldPanel
          v-else-if="isStandardFieldsMode"
          ref="standardFieldPanelRef"
          class="v-ver-task__panel v-ver-task__panel--full"
          :readonly="isViewOnly"
          :documents="documents"
          :fields="standardFields"
          :selected-field-id="selectedStandardFieldId"
          @select-field="selectStandardField"
          @update-value="updateStandardFieldValue"
          @restore-value="restoreStandardFieldValue"
        />

        <template v-else-if="activeDocument">
          <OcrDocumentPreview
            class="v-ver-task__preview"
            :image-url="activeDocument.imageUrl"
            :page-count="activeDocument.pageCount ?? 1"
          />

          <VerificationFieldPanel
            ref="fieldPanelRef"
            class="v-ver-task__panel"
            :readonly="isViewOnly"
            :doc-type="activeDocument.docType"
            :display-name="
              shouldShowDisplayNameSubtitle(activeDocument)
                ? getDocumentDisplayName(activeDocument)
                : undefined
            "
            :fields="activeDocument.fields"
            :selected-field-id="selectedFieldId"
            @select-field="selectField"
            @update-value="updateFieldValue"
            @restore-value="restoreFieldValue"
          />
        </template>
      </div>

      <footer class="v-ver-task__footer">
        <div class="v-ver-task__footer-actions">
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
            <el-button
              type="primary"
              :disabled="!canComplete"
              @click="handleVerificationComplete"
            >
              {{ $t('tasks.verification.complete') }}
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
.v-ver-task {
  --ver-page-padding: 12px;
  --ver-row-gap: 8px;

  display: flex;
  flex-direction: column;
  gap: var(--ver-row-gap);
  height: calc(100vh - var(--top-header-total-height));
  min-height: unset;
  max-height: calc(100vh - var(--top-header-total-height));
  overflow: hidden;
  box-sizing: border-box;
  padding: var(--ver-page-padding) !important;

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

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-left: auto;
  }

  &__stat {
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    background: #f9fafb;
    white-space: nowrap;

    &.is-pass {
      border-color: #abefc6;
      color: #067647;
      background: #ecfdf3;
    }

    &.is-review {
      border-color: #fedf89;
      color: #b54708;
      background: #fffaeb;
    }

    &.is-danger {
      border-color: #fecdca;
      color: var(--el-color-danger);
      background: #fff5f5;
    }

    &.is-ok {
      border-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__scope-row {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: var(--app-section-gap);
    flex-wrap: wrap;
  }

  &__scope-row :deep(.v-ver-scope-nav) {
    flex: 1;
    min-width: 0;
  }

  &__return-link {
    margin-right: 4px;
  }

  &__workspace {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    &.is-summary {
      display: block;
    }

    &.is-document {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ver-row-gap);
      align-items: stretch;

      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(320px, 45vh) minmax(0, 1fr);
      }
    }
  }

  &__preview,
  &__panel {
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  &__panel--full {
    width: 100%;
  }

  &__footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--app-section-gap);
    margin: 0 calc(-1 * var(--ver-page-padding)) calc(-1 * var(--ver-page-padding));
    padding: 10px var(--ver-page-padding);
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
