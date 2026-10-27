<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCloseFilled, InfoFilled, Loading, RefreshRight, Search } from '@element-plus/icons-vue'
import { mockCaseList } from '@/mocks/cases'
import {
  canRetrySourceConsolidation,
  getRelatedCaseIdsBySourceFile,
  getVisiblePendingFiles,
  pendingConsolidationFiles,
  copyPendingFileIntoCases,
  retryPendingSourceConsolidation,
  touchPendingFileUpdatedAt,
  type PendingConsolidationFile
} from '@/mocks/pendingConsolidation'
import { businessScenarioLabel } from '@/constants/businessScenarios'
import type { BusinessScenarioValue } from '@/constants/businessScenarios'
import { businessScenarioOptions } from '@/constants/businessScenarios'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { PLACEHOLDER } from '@/constants/placeholders'

import { pendingLinkStatusLabel, pendingLinkStatusClass } from '@/constants/pendingLinkStatus'
import type { PendingLinkStatus } from '@/constants/pendingLinkStatus'
import {
  pendingLinkReasonColumnLabel,
  pendingLinkReasonFilterOptions,
  pendingLinkReasonLabel,
  type PendingLinkCandidateCase,
  type PendingLinkReason
} from '@/constants/pendingLinkReason'
import { caseListDisplayStatusLabel, pendingLinkStatusColumnLabel } from '@/constants/caseStatus'
import { canLinkOrReassignToCase } from '@/utils/caseFileOperations'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'
import { getDocTypeAssociationKeys } from '@/constants/docTypeAssociationKeys'
import DocumentPreviewMedia from '@/components/DocumentPreviewMedia.vue'
import { isPdfDocumentUrl, mockDocumentPreviewSrc } from '@/constants/mockSampleMedia'

const { t } = useI18n()
const router = useRouter()

interface AssignAssociationRow {
  id: string
  key: string
  value: string
}

const docTypeOptions = PREPROCESS_DOC_TYPES.map((type) => ({ value: type, label: type }))

const pendingLinkReasonFilterOptionsList = computed(() => pendingLinkReasonFilterOptions())
const businessScenarioFilterOptions = computed(() => businessScenarioOptions())

const page = ref(1)
const pageSize = ref(10)

const filters = reactive({
  businessKey: '',
  fileName: '',
  businessScene: '' as '' | BusinessScenarioValue,
  pendingReason: '' as '' | PendingLinkReason
})

const selectedRows = ref<PendingConsolidationFile[]>([])
const assignDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const assignTargetCaseId = ref('')
const assignTargetCaseIds = ref<string[]>([])
const assignDocType = ref('')
const assignAssociationRows = ref<AssignAssociationRow[]>([])
const assigningFile = ref<PendingConsolidationFile | null>(null)
const previewFile = ref<PendingConsolidationFile | null>(null)
const bulkManualLinkDialogVisible = ref(false)
const bulkManualLinkTargetCaseId = ref('')
const retryDialogVisible = ref(false)
const retrySourceFile = ref<PendingConsolidationFile | null>(null)
const retryAiCaseLinkEnabled = ref(false)

function formatPendingDocType(file: PendingConsolidationFile): string | null {
  return file.fileType
}

function resolveAssignDocType(fileType: string | null): string {
  if (!fileType) return ''
  if (fileType.includes(' / ')) {
    return fileType.split(' / ')[0]?.trim() ?? ''
  }
  return fileType
}

function createAssignRow(key: string, value = ''): AssignAssociationRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, key, value }
}

function buildAssignAssociationRows(
  file: PendingConsolidationFile,
  docType: string
): AssignAssociationRow[] {
  const configuredKeys = getDocTypeAssociationKeys(docType)
  const valueMap = new Map(file.associationFields.map((field) => [field.key, field.value]))
  if (!valueMap.size && file.relatedKeyValue) {
    valueMap.set('請求番号', file.relatedKeyValue)
  }
  return configuredKeys.map((key) => createAssignRow(key, valueMap.get(key) ?? ''))
}

function syncAssociationRowsForDocType(docType: string) {
  const valueMap = new Map(assignAssociationRows.value.map((row) => [row.key, row.value]))
  assignAssociationRows.value = getDocTypeAssociationKeys(docType).map((key) =>
    createAssignRow(key, valueMap.get(key) ?? '')
  )
}

function applyAssignFormToFile(file: PendingConsolidationFile) {
  file.fileType = assignDocType.value || null
  file.associationFields = assignAssociationRows.value.map((row) => ({
    key: row.key,
    value: row.value.trim()
  }))
  file.relatedKeyValue =
    file.associationFields.find((field) => field.key === '請求番号')?.value ??
    file.associationFields[0]?.value ??
    null
  file.pendingReason = null
  if (file.linkStatus === 'FAILED') {
    file.linkStatus = null
  }
  touchPendingFileUpdatedAt(file)
}

const hasSelection = computed(() => selectedRows.value.length > 0)

const queueFiles = computed(() => getVisiblePendingFiles())

function relatedCaseIdsFor(file: PendingConsolidationFile): string[] {
  return getRelatedCaseIdsBySourceFile(file.sourceFileId)
}

function openCaseDetail(caseId: string) {
  router.push({ path: `/cases/${caseId}`, query: { from: 'pending' } })
}

const retryConsolidationHint = computed(() =>
  retryAiCaseLinkEnabled.value ? t('upload.aiCaseLinkHintOn') : t('upload.aiCaseLinkHintOff')
)

function openRetryConsolidation(file: PendingConsolidationFile) {
  if (!canRetrySourceConsolidation(file)) return
  retrySourceFile.value = file
  retryAiCaseLinkEnabled.value = false
  retryDialogVisible.value = true
}

function closeRetryConsolidation() {
  retryDialogVisible.value = false
  retrySourceFile.value = null
}

function confirmRetryConsolidation() {
  const file = retrySourceFile.value
  if (!file) return
  const { started } = retryPendingSourceConsolidation(
    file.sourceFileId,
    retryAiCaseLinkEnabled.value,
    (result) => {
      if (result.processed > 0) {
        ElMessage.success(
          t('case.message.retrySourceConsolidationSuccess', {
            count: result.processed,
            created: result.casesCreated,
            linked: result.casesLinked
          })
        )
      } else {
        ElMessage.warning(t('case.message.retrySourceConsolidationPartial'))
      }
    }
  )
  if (!started) {
    ElMessage.warning(t('case.message.retrySourceConsolidationNoEligible'))
    return
  }
  ElMessage.success(t('case.message.retrySourceConsolidationStarted'))
  closeRetryConsolidation()
}

/** 要確認队列中不存在「无状态且无失败理由」；默认视为关联中 */
function resolvePendingLinkStatus(file: PendingConsolidationFile): PendingLinkStatus {
  if (file.linkStatus) return file.linkStatus
  if (!file.pendingReason) return 'LINKING'
  return null
}

const filteredFiles = computed(() => {
  return queueFiles.value.filter((item) => {
    if (filters.businessKey) {
      const key = filters.businessKey.toLowerCase()
      const related = item.relatedKeyValue?.toLowerCase() ?? ''
      if (!related.includes(key)) return false
    }
    if (filters.fileName) {
      const keyword = filters.fileName.toLowerCase()
      const inLogicalName = item.fileName.toLowerCase().includes(keyword)
      const inSourceName = item.sourceFileName.toLowerCase().includes(keyword)
      if (!inLogicalName && !inSourceName) return false
    }
    if (filters.pendingReason && item.pendingReason !== filters.pendingReason) {
      return false
    }
    if (filters.businessScene && item.businessScene !== filters.businessScene) {
      return false
    }
    return true
  })
})

const pagedFiles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredFiles.value.slice(start, start + pageSize.value)
})

const emptyText = computed(() => t('case.message.noReviewFiles'))

function resetListState() {
  selectedRows.value = []
}

function handleSelectionChange(rows: PendingConsolidationFile[]) {
  selectedRows.value = rows
}

const assignUsesCandidates = computed(() => {
  const file = assigningFile.value
  if (file?.pendingReason !== 'CANDIDATE_CONFLICT') return false
  return file.candidateCases.length > 0
})

const assignCandidateOptions = computed(() =>
  (assigningFile.value?.candidateCases ?? []).filter(
    (c) => c.listStatus !== 'COMPLETED' && c.listStatus !== 'EXPORTED'
  )
)

const canConfirmAssign = computed(() => {
  if (!assigningFile.value) return false
  if (assignUsesCandidates.value) return assignTargetCaseIds.value.length > 0
  if (!assignTargetCaseId.value.trim()) return false
  if (!assignDocType.value.trim()) return false
  return true
})

watch(assignDocType, (next, prev) => {
  if (!assignDialogVisible.value || assignUsesCandidates.value) return
  if (!next) {
    assignAssociationRows.value = []
    return
  }
  if (next === prev) return
  syncAssociationRowsForDocType(next)
})

function toggleCandidateCase(caseId: string) {
  const selected = new Set(assignTargetCaseIds.value)
  if (selected.has(caseId)) {
    selected.delete(caseId)
  } else {
    selected.add(caseId)
  }
  assignTargetCaseIds.value = [...selected]
}

function candidateRowClassName({ row }: { row: PendingLinkCandidateCase }) {
  return assignTargetCaseIds.value.includes(row.caseId) ? 'is-candidate-selected' : ''
}

function handleSearch() {
  page.value = 1
  resetListState()
}

function handleReset() {
  filters.businessKey = ''
  filters.fileName = ''
  filters.businessScene = ''
  filters.pendingReason = ''
  page.value = 1
  resetListState()
}

/** 手动/批量手动关联：与一期案件变更目标案一致，排除处理完成、已导出 */
const caseOptions = computed(() =>
  mockCaseList.filter(canLinkOrReassignToCase).map((item) => ({
    value: item.caseId,
    label: item.casePrimaryKey ? `${item.caseId}（${item.casePrimaryKey}）` : item.caseId
  }))
)

function removeFiles(ids: string[]) {
  pendingConsolidationFiles.value = pendingConsolidationFiles.value.filter(
    (item) => !ids.includes(item.id)
  )
  selectedRows.value = selectedRows.value.filter((row) => !ids.includes(row.id))
}

function openManualAssign(file: PendingConsolidationFile) {
  assigningFile.value = file
  const hasConflict = file.pendingReason === 'CANDIDATE_CONFLICT'
  assignTargetCaseId.value = ''
  assignTargetCaseIds.value =
    hasConflict && file.candidateCases.length === 1 ? [file.candidateCases[0].caseId] : []
  assignDocType.value = resolveAssignDocType(file.fileType)
  assignAssociationRows.value = assignDocType.value
    ? buildAssignAssociationRows(file, assignDocType.value)
    : file.associationFields.map((field) => createAssignRow(field.key, field.value))
  assignDialogVisible.value = true
}

function openPreview(file: PendingConsolidationFile) {
  previewFile.value = file
  previewDialogVisible.value = true
}

function pendingThumbFrameSrc(url: string) {
  return mockDocumentPreviewSrc(url, { view: 'Fit' })
}

function closePreview() {
  previewDialogVisible.value = false
  previewFile.value = null
}

function closeManualAssign() {
  assignDialogVisible.value = false
  assigningFile.value = null
  assignTargetCaseId.value = ''
  assignTargetCaseIds.value = []
  assignDocType.value = ''
  assignAssociationRows.value = []
}

function openBulkManualLink() {
  if (!hasSelection.value) {
    ElMessage.warning(t('case.message.bulkManualLinkSelectRequired'))
    return
  }
  bulkManualLinkTargetCaseId.value = ''
  bulkManualLinkDialogVisible.value = true
}

function closeBulkManualLink() {
  bulkManualLinkDialogVisible.value = false
  bulkManualLinkTargetCaseId.value = ''
}

function confirmBulkManualLink() {
  const caseId = bulkManualLinkTargetCaseId.value.trim()
  if (!caseId) {
    ElMessage.warning(t('case.message.selectLinkTarget'))
    return
  }
  const targets = selectedRows.value.filter((file) => file.linkStatus !== 'LINKING')
  if (!targets.length) {
    ElMessage.warning(t('case.message.bulkManualLinkNoEligible'))
    return
  }
  let linked = 0
  for (const file of targets) {
    if (copyPendingFileIntoCases(file, [caseId]) > 0) {
      linked += 1
    }
  }
  removeFiles(targets.map((file) => file.id))
  closeBulkManualLink()
  if (linked > 0) {
    ElMessage.success(t('case.message.bulkManualLinkSuccess', { count: linked, caseId }))
  } else {
    ElMessage.warning(t('case.message.manualLinkDone'))
  }
}

async function handleBulkDelete() {
  if (!hasSelection.value) return
  const count = selectedRows.value.length
  await ElMessageBox.confirm(
    t('case.message.bulkDeleteConfirm', { count }),
    t('case.action.bulkDelete'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )
  removeFiles(selectedRows.value.map((row) => row.id))
  ElMessage.success(t('case.message.bulkDeleteSuccess', { count }))
}

async function handleDeleteFile(file: PendingConsolidationFile) {
  await ElMessageBox.confirm(
    t('case.message.deleteFileConfirm', { fileName: file.fileName }),
    t('case.action.delete'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )
  removeFiles([file.id])
  ElMessage.success(t('upload.deleteSuccess'))
}

watch(
  () => filteredFiles.value.length,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize.value))
    if (page.value > maxPage) {
      page.value = maxPage
    }
  }
)

async function confirmManualAssign() {
  if (!assigningFile.value) return

  if (assignUsesCandidates.value) {
    if (!assignTargetCaseIds.value.length) {
      ElMessage.warning(t('case.message.selectLinkTarget'))
      return
    }

    const file = assigningFile.value
    const linked = copyPendingFileIntoCases(file, assignTargetCaseIds.value)
    removeFiles([file.id])

    if (linked === 1) {
      ElMessage.success(
        t('case.message.manualLinkSuccess', {
          fileName: file.fileName,
          caseId: assignTargetCaseIds.value[0]
        })
      )
    } else if (linked > 1) {
      ElMessage.success(
        t('case.message.manualLinkCopySuccess', {
          fileName: file.fileName,
          count: linked
        })
      )
    } else {
      ElMessage.success(t('case.message.manualLinkDone'))
    }

    closeManualAssign()
    return
  }

  if (!assignTargetCaseId.value.trim()) {
    ElMessage.warning(t('case.message.selectLinkTarget'))
    return
  }
  if (!assignDocType.value.trim()) {
    ElMessage.warning(t('case.message.selectDocType'))
    return
  }

  const file = assigningFile.value
  const caseId = assignTargetCaseId.value
  applyAssignFormToFile(file)
  const linked = copyPendingFileIntoCases(file, [caseId])
  removeFiles([file.id])

  if (linked > 0) {
    ElMessage.success(
      t('case.message.manualLinkSuccess', {
        fileName: file.fileName,
        caseId
      })
    )
  } else {
    ElMessage.success(t('case.message.manualLinkDone'))
  }
  closeManualAssign()
}
</script>

<template>
  <div class="v-pending-consolidation">
    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--4">
            <el-input
              v-model="filters.businessKey"
              clearable
              :placeholder="$t('fields.businessKey')"
            />
            <el-input
              v-model="filters.fileName"
              clearable
              :placeholder="$t('fields.fileName')"
            />
            <el-select
              v-model="filters.businessScene"
              clearable
              :placeholder="$t('fields.businessScene')"
            >
              <el-option
                v-for="opt in businessScenarioFilterOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-select
              v-model="filters.pendingReason"
              clearable
              :placeholder="pendingLinkReasonColumnLabel()"
            >
              <el-option
                v-for="opt in pendingLinkReasonFilterOptionsList"
                :key="opt.value || 'all'"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
          <div class="v-list-search__actions">
            <el-button type="primary" :icon="Search" native-type="submit" />
            <el-button :icon="RefreshRight" @click="handleReset" />
          </div>
        </div>
      </el-form>
    </section>

    <el-card shadow="never" class="v-pending-consolidation__table-card">
      <div class="v-pending-consolidation__table-top">
        <el-button type="primary" @click="openBulkManualLink">
          {{ $t('case.action.bulkManualLink') }}
        </el-button>
        <el-button
          plain
          class="v-pending-consolidation__bulk-delete-btn"
          :disabled="!hasSelection"
          @click="handleBulkDelete"
        >
          {{ $t('case.action.bulkDelete') }}
        </el-button>
      </div>
      <el-table
        :data="pagedFiles"
        row-key="id"
        style="width: 100%"
        :empty-text="emptyText"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column :label="$t('fields.fileName')" min-width="220">
          <template #default="{ row }">
            <div class="v-pending-consolidation__file-cell">
              <button
                type="button"
                class="v-pending-consolidation__thumb"
                :title="$t('case.action.preview')"
                @click="openPreview(row)"
              >
                <img
                  v-if="!isPdfDocumentUrl(row.previewUrl)"
                  class="v-pending-consolidation__thumb-image"
                  :src="row.previewUrl"
                  alt=""
                />
                <iframe
                  v-else
                  class="v-pending-consolidation__thumb-frame"
                  :src="pendingThumbFrameSrc(row.previewUrl)"
                  tabindex="-1"
                  aria-hidden="true"
                />
              </button>
              <el-button type="primary" link @click="openPreview(row)">
                {{ row.fileName }}
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('fields.relatedCaseId')"
          min-width="200"
          align="left"
          header-align="left"
          class-name="v-pending-consolidation__related-case-col"
          label-class-name="v-pending-consolidation__related-case-col"
        >
          <template #default="{ row }">
            <div
              v-if="relatedCaseIdsFor(row).length"
              class="v-pending-consolidation__related-cases"
            >
              <el-button
                v-for="caseId in relatedCaseIdsFor(row)"
                :key="caseId"
                type="primary"
                link
                @click="openCaseDetail(caseId)"
              >
                {{ caseId }}
              </el-button>
            </div>
            <span v-else class="v-pending-consolidation__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('fields.businessScene')" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ businessScenarioLabel(row.businessScene) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('fields.docType')" min-width="132" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="formatPendingDocType(row)">{{ formatPendingDocType(row) }}</span>
            <span v-else class="v-pending-consolidation__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="uploadedAt" :label="$t('fields.uploadedAt')" min-width="140" />
        <el-table-column prop="updatedAt" :label="$t('fields.updatedAt')" min-width="140" />
        <el-table-column :label="pendingLinkStatusColumnLabel()" min-width="140">
          <template #default="{ row }">
            <span
              class="v-pending-consolidation__link-status"
              :class="pendingLinkStatusClass(resolvePendingLinkStatus(row))"
            >
              <el-icon
                v-if="resolvePendingLinkStatus(row) === 'LINKING'"
                class="is-loading"
                :size="14"
              >
                <Loading />
              </el-icon>
              <el-icon
                v-else-if="resolvePendingLinkStatus(row) === 'FAILED'"
                class="v-pending-consolidation__link-status-fail-icon"
                :size="14"
              >
                <CircleCloseFilled />
              </el-icon>
              {{
                resolvePendingLinkStatus(row)
                  ? pendingLinkStatusLabel(resolvePendingLinkStatus(row))
                  : $t('common.empty')
              }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          :label="pendingLinkReasonColumnLabel()"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.pendingReason" class="v-pending-consolidation__reasons">
              {{ pendingLinkReasonLabel(row.pendingReason) }}
            </span>
            <span v-else class="v-pending-consolidation__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.action')" min-width="200" fixed="right">
          <template #default="{ row }">
            <div class="v-pending-consolidation__file-actions">
              <el-button
                v-if="canRetrySourceConsolidation(row)"
                type="primary"
                link
                @click="openRetryConsolidation(row)"
              >
                {{ $t('case.action.reprocess') }}
              </el-button>
              <el-button
                v-if="!canRetrySourceConsolidation(row)"
                type="primary"
                link
                @click="openManualAssign(row)"
              >
                {{ $t('case.action.manualLink') }}
              </el-button>
              <el-button type="primary" link @click="handleDeleteFile(row)">
                {{ $t('case.action.delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="v-pending-consolidation__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredFiles.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>

    <el-dialog
      v-model="retryDialogVisible"
      :title="$t('case.message.retrySourceConsolidationTitle')"
      width="520px"
      destroy-on-close
      class="v-pending-consolidation__retry-dialog"
      @closed="closeRetryConsolidation"
    >
      <template v-if="retrySourceFile">
        <dl class="v-pending-consolidation__assign-summary">
          <div class="v-pending-consolidation__assign-row">
            <dt>{{ $t('fields.sourceFile') }}</dt>
            <dd>{{ retrySourceFile.sourceFileName }}</dd>
          </div>
          <div class="v-pending-consolidation__assign-row">
            <dt>{{ $t('fields.businessScene') }}</dt>
            <dd>{{ businessScenarioLabel(retrySourceFile.businessScene) }}</dd>
          </div>
        </dl>
        <div class="v-pending-consolidation__retry-switch">
          <span class="v-pending-consolidation__retry-switch-label">
            {{ $t('upload.aiCaseLinkSwitch') }}
          </span>
          <el-switch v-model="retryAiCaseLinkEnabled" />
          <el-tooltip :content="retryConsolidationHint" placement="top">
            <el-icon class="v-pending-consolidation__retry-switch-icon" :size="16">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
      </template>
      <template #footer>
        <el-button @click="closeRetryConsolidation">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmRetryConsolidation">
          {{ $t('upload.runPhase1') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="bulkManualLinkDialogVisible"
      :title="$t('case.message.bulkManualLinkTitle')"
      width="520px"
      destroy-on-close
      class="v-pending-consolidation__bulk-manual-dialog"
      @closed="closeBulkManualLink"
    >
      <dl class="v-pending-consolidation__assign-summary">
        <div class="v-pending-consolidation__assign-row">
          <dt>{{ $t('fields.fileCount') }}</dt>
          <dd>{{ $t('case.message.bulkManualLinkSelected', { count: selectedRows.length }) }}</dd>
        </div>
      </dl>
      <el-form
        label-position="top"
        label-width="auto"
        class="v-pending-consolidation__bulk-manual-form"
      >
        <AppFormItem :label="$t('fields.linkTargetCase')" required>
          <el-select
            v-model="bulkManualLinkTargetCaseId"
            filterable
            :placeholder="PLACEHOLDER.SELECT_SEARCH"
            style="width: 100%"
          >
            <el-option
              v-for="opt in caseOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="closeBulkManualLink">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!bulkManualLinkTargetCaseId" @click="confirmBulkManualLink">
          {{ $t('common.ok') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="assignDialogVisible"
      :title="$t('case.message.manualLinkTitle')"
      width="800px"
      destroy-on-close
      @closed="closeManualAssign"
    >
      <dl class="v-pending-consolidation__assign-summary">
        <div class="v-pending-consolidation__assign-row">
          <dt>{{ $t('fields.fileName') }}</dt>
          <dd>{{ assigningFile?.fileName ?? $t('common.empty') }}</dd>
        </div>
      </dl>

      <el-form
        label-position="top"
        label-width="auto"
        class="v-pending-consolidation__assign-form"
      >
        <AppFormItem :label="$t('fields.docType')" :required="!assignUsesCandidates">
          <el-select
            v-if="!assignUsesCandidates"
            v-model="assignDocType"
            filterable
            allow-create
            default-first-option
            clearable
            :placeholder="PLACEHOLDER.SELECT_OR_INPUT"
            style="width: 100%"
          >
            <el-option
              v-for="opt in docTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <span
            v-else
            class="v-pending-consolidation__readonly-value"
          >
            {{ assignDocType || $t('common.empty') }}
          </span>
        </AppFormItem>

        <AppFormItem
          v-if="assignDocType || assignAssociationRows.length"
          :label="$t('case.message.associationKeyModule')"
        >
          <div class="v-pending-consolidation__association-keys">
            <div
              v-for="row in assignAssociationRows"
              :key="row.id"
              class="v-pending-consolidation__association-key-row"
            >
              <div class="v-pending-consolidation__association-key-field">
                <span class="v-pending-consolidation__association-key-label">
                  {{ $t('fields.fieldName') }}
                </span>
                <span class="v-pending-consolidation__association-key-name">{{ row.key }}</span>
              </div>
              <div class="v-pending-consolidation__association-key-field v-pending-consolidation__association-key-field--value">
                <span class="v-pending-consolidation__association-key-label">
                  {{ $t('fields.fieldValue') }}
                </span>
                <el-input
                  v-if="!assignUsesCandidates"
                  v-model="row.value"
                  clearable
                  :placeholder="PLACEHOLDER.INPUT"
                />
                <span
                  v-else
                  class="v-pending-consolidation__readonly-value"
                >
                  {{ row.value || $t('common.empty') }}
                </span>
              </div>
            </div>
          </div>
        </AppFormItem>

        <AppFormItem v-if="assignUsesCandidates" :label="$t('fields.linkCandidate')" required>
          <el-checkbox-group
            v-model="assignTargetCaseIds"
            class="v-pending-consolidation__candidate-checkbox-group"
          >
            <el-table
              :data="assignCandidateOptions"
              row-key="caseId"
              :row-class-name="candidateRowClassName"
              class="v-pending-consolidation__candidate-table"
              @row-click="(row: PendingLinkCandidateCase) => toggleCandidateCase(row.caseId)"
            >
              <el-table-column width="52" align="center">
                <template #default="{ row }">
                  <el-checkbox :value="row.caseId" @click.stop />
                </template>
              </el-table-column>
              <el-table-column prop="caseId" :label="$t('fields.caseId')" min-width="148" />
              <el-table-column prop="casePrimaryKey" :label="$t('fields.businessKey')" min-width="160" />
              <el-table-column :label="$t('fields.status')" min-width="120">
                <template #default="{ row }">
                  {{ caseListDisplayStatusLabel(row.listStatus) }}
                </template>
              </el-table-column>
            </el-table>
          </el-checkbox-group>
        </AppFormItem>

        <AppFormItem v-else :label="$t('fields.linkTargetCase')" required>
          <el-select
            v-model="assignTargetCaseId"
            filterable
            clearable
            :placeholder="PLACEHOLDER.SELECT_SEARCH"
            style="width: 100%"
          >
            <el-option
              v-for="opt in caseOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="closeManualAssign">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!canConfirmAssign" @click="confirmManualAssign">
          {{ $t('common.ok') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFile?.fileName ?? $t('fields.filePreview')"
      width="min(920px, 92vw)"
      class="v-pending-consolidation__preview-dialog"
      destroy-on-close
      @closed="closePreview"
    >
      <div class="v-pending-consolidation__preview-body">
        <DocumentPreviewMedia
          v-if="previewFile"
          :key="previewFile.id"
          fill
          :media-url="previewFile.previewUrl"
          :title="previewFile.fileName"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-pending-consolidation {
  &__search {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--app-panel-padding) var(--app-panel-padding) var(--app-section-gap);
    margin-bottom: var(--app-section-gap);
  }

  &__search-body {
    display: flex;
    align-items: flex-end;
    gap: var(--app-page-gap);
    flex-wrap: nowrap;

    @media (max-width: 768px) {
      flex-wrap: wrap;
    }
  }

  &__search-grid {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;

    &--3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &--4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__search-form {
    :deep(.el-form-item) {
      margin-bottom: var(--app-section-gap);
    }

    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }

    :deep(.el-input) {
      width: 100%;
    }
  }

  &__search-actions {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    white-space: nowrap;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: flex-end;
      padding-bottom: 0;
    }
  }

  &__retry-switch {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--app-content-bg-color);
  }

  &__retry-switch-label {
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
  }

  &__retry-switch-icon {
    color: var(--text-secondary);
    cursor: help;
  }

  &__bulk-manual-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding-bottom: 8px;
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
      line-height: 1.4;
    }

    :deep(.app-form-item__label-row) {
      justify-content: flex-start;
      flex-wrap: nowrap;
    }

    :deep(.el-form-item__content) {
      font-size: var(--app-font-size-base);
    }
  }

  &__table-top {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border-color);
    background: #f9fafb;
    flex-wrap: wrap;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }

    :deep(.v-pending-consolidation__bulk-delete-btn.el-button.is-plain) {
      background-color: #fff;
      border-color: var(--el-color-danger);
      color: var(--el-color-danger);
      font-size: var(--app-font-size-base);
      transition: none;

      &:hover:not(.is-disabled),
      &:focus:not(.is-disabled) {
        background-color: var(--el-color-danger-light-9);
        border-color: var(--el-color-danger);
        color: var(--el-color-danger);
      }

      &.is-disabled,
      &:disabled {
        background-color: #fff;
        border-color: var(--el-color-danger-light-5);
        color: var(--el-color-danger-light-5);
        cursor: not-allowed;

        &:hover,
        &:focus {
          background-color: #fff;
          border-color: var(--el-color-danger-light-5);
          color: var(--el-color-danger-light-5);
        }
      }
    }
  }

  &__auto-delete-hint {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    line-height: 1.4;
  }

  &__table-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;

    :deep(.el-card__body) {
      padding: 0;
    }

    :deep(.el-table) {
      font-size: var(--app-font-size-base);
      --el-table-header-bg-color: #f9fafb;
    }

    :deep(.el-table .el-table__cell) {
      padding: 12px 10px;
    }

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
    }

    :deep(td.v-pending-consolidation__related-case-col.el-table__cell .cell),
    :deep(th.v-pending-consolidation__related-case-col.el-table__cell .cell) {
      text-align: left;
      justify-content: flex-start;
    }
  }

  &__file-cell {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
  }

  &__thumb {
    flex-shrink: 0;
    display: block;
    width: 40px;
    height: 52px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: #f9fafb;
    overflow: hidden;
    cursor: pointer;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }
  }

  &__thumb-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    pointer-events: none;
  }

  &__thumb-frame {
    width: 210px;
    height: 297px;
    border: 0;
    pointer-events: none;
    transform: scale(0.19);
    transform-origin: top left;
  }

  &__file-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 6px;

    :deep(.el-button.is-link) {
      padding: 0 2px;
    }
  }

  &__assign-summary {
    margin: 0 0 16px;
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #f9fafb;
  }

  &__assign-row {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr);
    gap: 8px;
    align-items: baseline;
    font-size: var(--app-font-size-base);
    line-height: 1.6;

    & + & {
      margin-top: 6px;
    }

    dt {
      margin: 0;
      color: var(--text-secondary);
      font-weight: 400;
      text-align: left;
    }

    dd {
      margin: 0;
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-all;
    }
  }

  &__assign-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item--label-top .el-form-item__label) {
      float: none;
      margin-left: 0;
    }

    :deep(.el-form-item__label) {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100% !important;
      padding-bottom: 8px;
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
      line-height: 1.4;
      text-align: left;
    }

    :deep(.app-form-item__label-row) {
      justify-content: flex-start;
      flex-wrap: nowrap;
    }

    :deep(.el-form-item__content) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }
  }

  &__association-keys {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  &__association-key-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 12px;
    align-items: end;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fafbfc;
  }

  &__association-key-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    &--value {
      :deep(.el-input) {
        width: 100%;
      }
    }
  }

  &__association-key-label {
    font-size: 12px;
    line-height: 1.4;
    color: var(--text-secondary);
  }

  &__association-key-name {
    min-height: 32px;
    display: flex;
    align-items: center;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-all;
  }

  &__readonly-value {
    min-height: 32px;
    display: flex;
    align-items: center;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-all;
  }

  &__muted {
    color: var(--text-secondary);
  }

  &__reasons {
    color: var(--text-primary);
    font-size: var(--app-font-size-base);
    font-weight: 500;
    line-height: 1.5;
  }

  &__candidate-checkbox-group {
    display: block;
    width: 100%;
  }

  &__candidate-table {
    width: 100%;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;

    :deep(.el-table__row) {
      cursor: pointer;
    }

    :deep(.el-table__row.is-candidate-selected > td.el-table__cell) {
      background-color: #f0f7ff;
    }

    :deep(.el-checkbox) {
      height: auto;
      margin-right: 0;
    }

    :deep(.el-checkbox__label) {
      display: none;
    }
  }

  &__link-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    white-space: nowrap;
    color: var(--text-primary);

    &.is-negative {
      color: var(--el-color-danger);
      font-weight: 400;

      .v-pending-consolidation__link-status-fail-icon {
        color: var(--el-color-danger);
      }
    }

    &.is-linking {
      color: var(--text-secondary);
      font-weight: 400;

      .el-icon.is-loading {
        color: var(--text-secondary);
        animation: rotating 1.2s linear infinite;
      }
    }
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  &__related-cases {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    text-align: left;

    :deep(.el-button.is-link) {
      padding: 0;
      height: auto;
      line-height: 1.5;
      justify-content: flex-start;
      margin-left: 0;
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding: 12px 14px;
    border-top: 1px solid var(--border-color);
  }

  &__preview-body {
    height: min(72vh, 820px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  &__preview-dialog {
    :deep(.el-dialog__body) {
      padding-top: 8px;
    }
  }
}
</style>
