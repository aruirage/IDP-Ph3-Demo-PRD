<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, RefreshRight, Search } from '@element-plus/icons-vue'
import { mockCaseList, assignCaseAssignee, type CaseListItem } from '@/mocks/cases'
import { formatCaseFileSize, type CaseFileItem } from '@/mocks/caseFiles'
import { reassignPendingTasksForCase } from '@/mocks/tasks'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { isAdminUser } from '@/constants/currentUser'
import { activeTaskAssignees } from '@/constants/taskAssignees'
import {
  caseListStatusOptions,
  caseStatusColumnLabel,
  fileProcessStatusColumnLabel,
  type CaseListDisplayStatus
} from '@/constants/caseStatus'
import CaseListStatusBadge from './CaseListStatusBadge.vue'
import CaseSupplementUploadDialog from './CaseSupplementUploadDialog.vue'
import {
  caseFileProcessStatusClass,
  caseFileProcessStatusLabel,
  type CaseFileProcessStatus
} from '@/constants/caseFileStatus'
import {
  canAssignCase,
  canLinkOrReassignToCase,
  canModifyCaseFiles,
  canRerunCase,
  canRetryCase,
  canTerminateCase,
  reassignFileToCase,
  removeFileFromCase,
  retryCaseFromFailedNode,
  rerunCaseWorkflow,
  showSupplementAction,
  terminateCaseProcessing
} from '@/utils/caseFileOperations'
import { PLACEHOLDER } from '@/constants/placeholders'
import DocumentPreviewMedia from '@/components/DocumentPreviewMedia.vue'
import { businessScenarioLabel, businessScenarioOptions } from '@/constants/businessScenarios'
import type { BusinessScenarioValue } from '@/constants/businessScenarios'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const caseListStatusFilterOptions = computed(() => caseListStatusOptions())

const page = ref(1)
const pageSize = ref(10)
const expandedRowKeys = ref<string[]>([])

const previewDialogVisible = ref(false)
const previewFile = ref<CaseFileItem | null>(null)

const reassignDialogVisible = ref(false)
const reassignTargetCaseId = ref('')
const reassigningCase = ref<CaseListItem | null>(null)
const reassigningFile = ref<CaseFileItem | null>(null)

const caseAssignDialogVisible = ref(false)
const caseAssigningItem = ref<CaseListItem | null>(null)
const selectedCaseAssignee = ref('')

const supplementDialogVisible = ref(false)
const supplementCaseItem = ref<CaseListItem | null>(null)

const docTypeAssignOptions = PREPROCESS_DOC_TYPES.map((type) => ({ value: type, label: type }))

const assignDocTypeDialogVisible = ref(false)
const assignDocTypeFile = ref<CaseFileItem | null>(null)
const selectedAssignDocType = ref('')

const isAdmin = isAdminUser()

const filters = reactive({
  caseId: '',
  casePrimaryKey: '',
  listStatus: '' as '' | CaseListDisplayStatus,
  businessScene: '' as '' | BusinessScenarioValue,
  assigneeName: ''
})

const caseOptions = computed(() =>
  mockCaseList.filter(canLinkOrReassignToCase).map((item) => ({
    value: item.caseId,
    label: item.casePrimaryKey ? `${item.caseId}（${item.casePrimaryKey}）` : item.caseId
  }))
)

const assigneeOptions = computed(() => activeTaskAssignees())
const businessScenarioFilterOptions = computed(() => businessScenarioOptions())
const assigneeFilterOptions = computed(() =>
  assigneeOptions.value.map((user) => ({ value: user.name, label: user.name }))
)

const filteredCases = computed(() => {
  return mockCaseList.filter((item) => {
    if (
      filters.caseId &&
      !item.caseId.toLowerCase().includes(filters.caseId.toLowerCase())
    ) {
      return false
    }
    if (
      filters.casePrimaryKey &&
      !item.casePrimaryKey.toLowerCase().includes(filters.casePrimaryKey.toLowerCase())
    ) {
      return false
    }
    if (filters.listStatus && item.listStatus !== filters.listStatus) return false
    if (
      filters.businessScene &&
      item.caseType !== businessScenarioLabel(filters.businessScene)
    ) {
      return false
    }
    if (filters.assigneeName && (item.assigneeName ?? '') !== filters.assigneeName) {
      return false
    }
    return true
  })
})

const pagedCases = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredCases.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.caseId = ''
  filters.casePrimaryKey = ''
  filters.listStatus = ''
  filters.businessScene = ''
  filters.assigneeName = ''
  page.value = 1
}

function fileStatusLabel(status: CaseFileProcessStatus) {
  const label = caseFileProcessStatusLabel(status)
  return label || t('common.empty')
}

function docTypesText(types: string[]) {
  return types.join('、')
}

function expandAll() {
  expandedRowKeys.value = pagedCases.value.map((item) => item.caseId)
}

function collapseAll() {
  expandedRowKeys.value = []
}

const allExpanded = computed(() => {
  const ids = pagedCases.value.map((item) => item.caseId)
  return ids.length > 0 && ids.every((id) => expandedRowKeys.value.includes(id))
})

const expandToggleLabel = computed(() =>
  allExpanded.value ? t('case.action.collapseAll') : t('case.action.expandAll')
)

function toggleExpandAll() {
  if (allExpanded.value) {
    collapseAll()
  } else {
    expandAll()
  }
}

function onExpandChange(_row: CaseListItem, expandedRows: CaseListItem[]) {
  expandedRowKeys.value = expandedRows.map((item) => item.caseId)
}

function openFilePreview(file: CaseFileItem) {
  previewFile.value = file
  previewDialogVisible.value = true
}

function needsDocTypeAssignment(file: CaseFileItem) {
  return !file.fileType?.trim()
}

function openAssignDocType(file: CaseFileItem) {
  if (!needsDocTypeAssignment(file)) return
  assignDocTypeFile.value = file
  selectedAssignDocType.value = ''
  assignDocTypeDialogVisible.value = true
}

function confirmAssignDocType() {
  const file = assignDocTypeFile.value
  const docType = selectedAssignDocType.value.trim()
  if (!file || !needsDocTypeAssignment(file)) {
    assignDocTypeDialogVisible.value = false
    return
  }
  if (!docType) {
    ElMessage.warning(t('case.message.selectDocType'))
    return
  }
  file.fileType = docType
  file.processStatus = 'PREPROCESSING'
  assignDocTypeDialogVisible.value = false
  ElMessage.success(t('case.message.assignDocTypeSuccess'))
}

function closeAssignDocTypeDialog() {
  assignDocTypeFile.value = null
  selectedAssignDocType.value = ''
}

function closeFilePreview() {
  previewDialogVisible.value = false
  previewFile.value = null
}

function openSupplementDialog(caseItem: CaseListItem) {
  supplementCaseItem.value = caseItem
  supplementDialogVisible.value = true
}

function onSupplementUploadSuccess(caseId: string) {
  if (!expandedRowKeys.value.includes(caseId)) {
    expandedRowKeys.value = [...expandedRowKeys.value, caseId]
  }
  supplementCaseItem.value = null
}

function goCaseDetail(caseItem: CaseListItem) {
  router.push(`/cases/${caseItem.caseId}`)
}

async function handleTerminateCase(caseItem: CaseListItem) {
  await ElMessageBox.confirm(
    t('case.message.terminateConfirm', { caseId: caseItem.caseId }),
    t('case.action.terminate'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )
  if (terminateCaseProcessing(caseItem.caseId)) {
    ElMessage.success(t('case.message.terminateSuccess'))
  }
}

async function handleRerunCase(caseItem: CaseListItem) {
  await ElMessageBox.confirm(
    t('case.message.rerunCaseConfirm', { caseId: caseItem.caseId }),
    t('case.action.rerun'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'info' }
  )
  if (rerunCaseWorkflow(caseItem.caseId)) {
    ElMessage.success(t('case.message.rerunSuccess'))
  }
}

async function handleRetryCase(caseItem: CaseListItem) {
  await ElMessageBox.confirm(
    t('case.message.retryCaseConfirm', { caseId: caseItem.caseId }),
    t('case.action.retry'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'info' }
  )
  if (retryCaseFromFailedNode(caseItem.caseId)) {
    ElMessage.success(t('case.message.retrySuccess'))
  }
}

async function handleDeleteFile(caseItem: CaseListItem, file: CaseFileItem) {
  await ElMessageBox.confirm(
    t('case.message.deleteFileWithImpactConfirm', { fileName: file.fileName }),
    t('case.action.delete'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )
  if (removeFileFromCase(caseItem.caseId, file.id)) {
    ElMessage.success(t('upload.deleteSuccess'))
  }
}

function openReassign(caseItem: CaseListItem, file: CaseFileItem) {
  reassigningCase.value = caseItem
  reassigningFile.value = file
  reassignTargetCaseId.value = ''
  reassignDialogVisible.value = true
}

function closeReassign() {
  reassignDialogVisible.value = false
  reassigningCase.value = null
  reassigningFile.value = null
  reassignTargetCaseId.value = ''
}

async function confirmReassign() {
  if (!reassigningCase.value || !reassigningFile.value || !reassignTargetCaseId.value) {
    ElMessage.warning(t('case.message.selectChangeTarget'))
    return
  }

  await ElMessageBox.confirm(
    t('case.message.changeCaseConfirm', {
      fileName: reassigningFile.value.fileName,
      caseId: reassignTargetCaseId.value
    }),
    t('case.action.changeCase'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'info' }
  )

  if (
    reassignFileToCase(
      reassigningCase.value.caseId,
      reassigningFile.value.id,
      reassignTargetCaseId.value
    )
  ) {
    ElMessage.success(t('case.message.changeCaseSuccess'))
    closeReassign()
  }
}

function openCaseAssignDialog(caseItem: CaseListItem) {
  caseAssigningItem.value = caseItem
  selectedCaseAssignee.value = caseItem.assigneeName ?? ''
  caseAssignDialogVisible.value = true
}

function closeCaseAssignDialog() {
  caseAssignDialogVisible.value = false
  caseAssigningItem.value = null
  selectedCaseAssignee.value = ''
}

function confirmCaseAssign() {
  if (!caseAssigningItem.value || !selectedCaseAssignee.value) return
  const caseId = caseAssigningItem.value.caseId
  if (assignCaseAssignee(caseId, selectedCaseAssignee.value)) {
    const taskCount = reassignPendingTasksForCase(caseId, selectedCaseAssignee.value)
    const taskHint =
      taskCount > 0 ? t('case.message.taskTakeover', { count: taskCount }) : ''
    ElMessage.success(
      t('case.message.caseAssignSuccess', {
        name: selectedCaseAssignee.value,
        taskHint
      })
    )
    closeCaseAssignDialog()
  }
}

onMounted(() => {
  const status = route.query.listStatus
  if (
    typeof status === 'string' &&
    caseListStatusFilterOptions.value.some((option) => option.value === status)
  ) {
    filters.listStatus = status as CaseListDisplayStatus
  }
  const caseId = route.query.caseId
  if (typeof caseId === 'string') {
    filters.caseId = caseId
  }
})

watch([page, pageSize], () => {
  collapseAll()
})
</script>

<template>
  <div class="v-consolidated-cases">
    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid">
            <el-input
              v-model="filters.casePrimaryKey"
              clearable
              :placeholder="$t('fields.businessKey')"
            />
            <el-input
              v-model="filters.caseId"
              clearable
              :placeholder="$t('fields.caseId')"
            />
            <el-select
              v-model="filters.listStatus"
              clearable
              :placeholder="caseStatusColumnLabel()"
            >
              <el-option
                v-for="opt in caseListStatusFilterOptions.filter((o) => o.value)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-select
              v-model="filters.businessScene"
              clearable
              filterable
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
              v-model="filters.assigneeName"
              clearable
              filterable
              :placeholder="$t('fields.assignee')"
            >
              <el-option
                v-for="opt in assigneeFilterOptions"
                :key="opt.value"
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

    <section class="v-consolidated-cases__table-section">
      <el-card shadow="never" class="v-consolidated-cases__table-card">
        <el-table
          :data="pagedCases"
          row-key="caseId"
          :expand-row-keys="expandedRowKeys"
          style="width: 100%"
          :empty-text="$t('common.noData')"
          @expand-change="onExpandChange"
        >
          <el-table-column type="expand" width="48" class-name="v-consolidated-cases__expand-col">
            <template #header>
              <div
                class="el-table__expand-icon v-consolidated-cases__expand-all"
                :class="{ 'el-table__expand-icon--expanded': allExpanded }"
                role="button"
                tabindex="0"
                :title="expandToggleLabel"
                :aria-label="expandToggleLabel"
                @click="toggleExpandAll"
                @keydown.enter.prevent="toggleExpandAll"
                @keydown.space.prevent="toggleExpandAll"
              >
                <el-icon><ArrowRight /></el-icon>
              </div>
            </template>
            <template #default="{ row: caseItem }">
              <div class="v-consolidated-cases__expand">
                <el-table
                  :data="caseItem.files"
                  class="v-consolidated-cases__file-table"
                  style="width: 100%"
                  :empty-text="$t('case.message.noFiles')"
                >
                  <el-table-column :label="$t('fields.fileName')" min-width="200" show-overflow-tooltip>
                    <template #default="{ row: file }">
                      <el-button type="primary" link @click="openFilePreview(file)">
                        {{ file.fileName }}
                      </el-button>
                    </template>
                  </el-table-column>
                  <el-table-column
                    :label="$t('fields.docType')"
                    min-width="140"
                    show-overflow-tooltip
                  >
                    <template #default="{ row: file }">
                      <span v-if="file.fileType?.trim()">{{ file.fileType }}</span>
                      <span v-else class="v-consolidated-cases__muted">{{ $t('common.empty') }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('fields.fileSize')" min-width="100" align="right">
                    <template #default="{ row: file }">{{ formatCaseFileSize(file.size) }}</template>
                  </el-table-column>
                  <el-table-column
                    prop="uploadedAt"
                    :label="$t('fields.uploadedAt')"
                    min-width="132"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="updatedAt"
                    :label="$t('fields.updatedAt')"
                    min-width="132"
                    show-overflow-tooltip
                  />
                  <el-table-column :label="$t('fields.pageCount')" min-width="88" align="center">
                    <template #default="{ row: file }">{{ file.pageCount }}</template>
                  </el-table-column>
                  <el-table-column :label="fileProcessStatusColumnLabel()" min-width="132">
                    <template #default="{ row: file }">
                      <span
                        class="v-consolidated-cases__file-status"
                        :class="caseFileProcessStatusClass(file.processStatus)"
                      >
                        {{ fileStatusLabel(file.processStatus) }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('common.action')" min-width="260" fixed="right">
                    <template #default="{ row: file }">
                      <div class="v-consolidated-cases__file-actions">
                        <el-button type="primary" link @click="openFilePreview(file)">
                          {{ $t('case.action.preview') }}
                        </el-button>
                        <el-button
                          v-if="canModifyCaseFiles(caseItem) && needsDocTypeAssignment(file)"
                          type="primary"
                          link
                          @click="openAssignDocType(file)"
                        >
                          {{ $t('case.action.assignDocType') }}
                        </el-button>
                        <el-button
                          v-if="canModifyCaseFiles(caseItem)"
                          type="primary"
                          link
                          @click="openReassign(caseItem, file)"
                        >
                          {{ $t('case.action.changeCase') }}
                        </el-button>
                        <el-button
                          v-if="canModifyCaseFiles(caseItem)"
                          type="danger"
                          link
                          @click="handleDeleteFile(caseItem, file)"
                        >
                          {{ $t('case.action.delete') }}
                        </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="caseId" :label="$t('fields.caseId')" min-width="148" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button type="primary" link @click="router.push(`/cases/${row.caseId}`)">
                {{ row.caseId }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            prop="caseType"
            :label="$t('fields.businessScene')"
            min-width="112"
            show-overflow-tooltip
          />
          <el-table-column
            prop="casePrimaryKey"
            :label="$t('fields.businessKey')"
            min-width="148"
            show-overflow-tooltip
          />
          <el-table-column
            prop="receivedAt"
            :label="$t('fields.createdAt')"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            prop="updatedAt"
            :label="$t('fields.updatedAt')"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            prop="fileCount"
            :label="$t('fields.fileCount')"
            min-width="96"
            align="center"
          />
          <el-table-column :label="$t('fields.uploadedDocTypes')" min-width="200">
            <template #default="{ row }">
              <el-tooltip
                v-if="row.uploadedDocTypes.length"
                placement="top"
                :show-after="200"
                :content="docTypesText(row.uploadedDocTypes)"
              >
                <span class="v-consolidated-cases__cell-ellipsis">
                  {{ docTypesText(row.uploadedDocTypes) }}
                </span>
              </el-tooltip>
              <span v-else class="v-consolidated-cases__muted">{{ $t('common.empty') }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="caseStatusColumnLabel()" min-width="128">
            <template #default="{ row }">
              <CaseListStatusBadge :status="row.listStatus" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('fields.assignee')" min-width="108" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.assigneeName">{{ row.assigneeName }}</span>
              <span v-else class="v-consolidated-cases__muted">{{ $t('common.unassigned') }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.action')" min-width="220" fixed="right">
            <template #default="{ row }">
              <div class="v-consolidated-cases__case-actions">
                <el-button type="primary" link @click="goCaseDetail(row)">
                  {{ $t('case.action.detail') }}
                </el-button>
                <el-button
                  v-if="isAdmin && canAssignCase(row)"
                  type="primary"
                  link
                  @click="openCaseAssignDialog(row)"
                >
                  {{ $t('common.assign') }}
                </el-button>
                <el-button
                  v-if="showSupplementAction(row)"
                  type="primary"
                  link
                  @click="openSupplementDialog(row)"
                >
                  {{ $t('case.action.supplement') }}
                </el-button>
                <el-button
                  v-if="canRetryCase(row)"
                  type="primary"
                  link
                  @click="handleRetryCase(row)"
                >
                  {{ $t('case.action.retry') }}
                </el-button>
                <el-button
                  v-if="canTerminateCase(row)"
                  type="danger"
                  link
                  @click="handleTerminateCase(row)"
                >
                  {{ $t('case.action.terminate') }}
                </el-button>
                <el-button
                  v-if="canRerunCase(row)"
                  type="primary"
                  link
                  @click="handleRerunCase(row)"
                >
                  {{ $t('case.action.rerun') }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog
        v-model="previewDialogVisible"
        :title="previewFile?.fileName ?? $t('fields.filePreview')"
        width="min(920px, 92vw)"
        class="v-consolidated-cases__preview-dialog"
        destroy-on-close
        @closed="closeFilePreview"
      >
        <div class="v-consolidated-cases__preview-body">
          <DocumentPreviewMedia
            v-if="previewFile"
            :key="previewFile.id"
            fill
            :media-url="previewFile.previewUrl"
            :title="previewFile.fileName"
          />
        </div>
      </el-dialog>

      <el-dialog
        v-model="assignDocTypeDialogVisible"
        :title="$t('case.action.assignDocType')"
        width="480px"
        destroy-on-close
        class="v-consolidated-cases__assign-doc-type-dialog"
        @closed="closeAssignDocTypeDialog"
      >
        <dl class="v-consolidated-cases__assign-summary">
          <div class="v-consolidated-cases__assign-row">
            <dt>{{ $t('fields.fileName') }}</dt>
            <dd>{{ assignDocTypeFile?.fileName ?? $t('common.empty') }}</dd>
          </div>
        </dl>
        <el-form
          label-position="top"
          label-width="auto"
          class="v-consolidated-cases__assign-doc-type-form"
        >
          <AppFormItem :label="$t('fields.docType')" required>
            <el-select
              v-model="selectedAssignDocType"
              filterable
              :placeholder="PLACEHOLDER.SELECT"
              style="width: 100%"
            >
              <el-option
                v-for="opt in docTypeAssignOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </AppFormItem>
        </el-form>
        <template #footer>
          <el-button @click="assignDocTypeDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="confirmAssignDocType">{{ $t('common.ok') }}</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="reassignDialogVisible"
        :title="$t('case.action.changeCase')"
        width="520px"
        destroy-on-close
        @closed="closeReassign"
      >
        <el-form label-width="120px" class="v-consolidated-cases__reassign-form">
          <AppFormItem :label="$t('fields.fileName')">
            <span>{{ reassigningFile?.fileName ?? $t('common.empty') }}</span>
          </AppFormItem>
          <AppFormItem :label="$t('fields.currentCase')">
            <span>{{ reassigningCase?.caseId ?? $t('common.empty') }}</span>
          </AppFormItem>
          <AppFormItem :label="$t('fields.changeTargetCase')" required>
            <el-select
              v-model="reassignTargetCaseId"
              filterable
              :placeholder="PLACEHOLDER.SELECT_SEARCH"
              style="width: 100%"
            >
              <el-option
                v-for="opt in caseOptions.filter((o) => o.value !== reassigningCase?.caseId)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </AppFormItem>
        </el-form>
        <template #footer>
          <el-button @click="closeReassign">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :disabled="!reassignTargetCaseId" @click="confirmReassign">
            {{ $t('common.ok') }}
          </el-button>
        </template>
      </el-dialog>

      <CaseSupplementUploadDialog
        v-model="supplementDialogVisible"
        :case-item="supplementCaseItem"
        @success="onSupplementUploadSuccess"
      />

      <el-dialog
        v-model="caseAssignDialogVisible"
        :title="$t('case.message.assigneeDialogTitle')"
        width="480px"
        @closed="closeCaseAssignDialog"
      >
        <template v-if="caseAssigningItem">
          <dl class="v-consolidated-cases__assign-summary">
            <div class="v-consolidated-cases__assign-row">
              <dt>{{ $t('fields.caseId') }}</dt>
              <dd>{{ caseAssigningItem.caseId }}</dd>
            </div>
            <div class="v-consolidated-cases__assign-row">
              <dt>{{ $t('fields.businessKey') }}</dt>
              <dd>{{ caseAssigningItem.casePrimaryKey || $t('common.empty') }}</dd>
            </div>
          </dl>

          <el-form label-position="top" class="v-consolidated-cases__assign-form">
            <AppFormItem :label="$t('fields.assignee')" required>
              <el-select
                v-model="selectedCaseAssignee"
                filterable
                :placeholder="PLACEHOLDER.SELECT"
                style="width: 100%"
              >
                <el-option
                  v-for="user in assigneeOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name"
                />
              </el-select>
            </AppFormItem>
          </el-form>
        </template>

        <template #footer>
          <el-button @click="closeCaseAssignDialog">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :disabled="!selectedCaseAssignee" @click="confirmCaseAssign">
            {{ $t('common.ok') }}
          </el-button>
        </template>
      </el-dialog>

      <div class="v-consolidated-cases__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredCases.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-consolidated-cases {
  &__search {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--app-panel-padding) var(--app-panel-padding) var(--app-section-gap);
    margin-bottom: var(--app-page-gap);
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0 16px;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
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

    :deep(.el-input),
    :deep(.el-select) {
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

    :deep(.el-table__expand-column .cell),
    :deep(.v-consolidated-cases__expand-col .cell) {
      padding: 0;
      text-align: center;
    }

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
    }

    :deep(.el-table__expanded-cell) {
      padding: 0;
      background: #fafbfc;
    }

    :deep(.el-table__expand-icon) {
      color: var(--text-secondary);
    }
  }

  &__expand-all {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: var(--text-primary);
    box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
    outline: none;

    > .el-icon {
      font-size: 13px;
    }

    &.el-table__expand-icon--expanded {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }

  &__expand {
    padding: 10px 14px 14px 0;
    background: #fafbfc;
  }

  &__file-table {
    margin-left: 40px;
    width: calc(100% - 40px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;

    :deep(.el-table__inner-wrapper::before) {
      display: none;
    }

    :deep(.el-table) {
      --el-table-header-bg-color: #f3f4f6;
      font-size: var(--app-font-size-base);
    }

    :deep(.el-table .el-table__cell) {
      padding: 10px 12px;
    }

    :deep(.el-table th.el-table__cell) {
      font-weight: 600;
      color: var(--text-secondary);
    }

    :deep(.el-table tr:hover > td.el-table__cell) {
      background-color: #f9fafb;
    }
  }

  &__file-status {
    display: inline-block;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    color: var(--text-primary);

    &.is-negative {
      color: var(--el-color-danger);
    }
  }

  &__file-actions,
  &__case-actions {
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
    display: flex;
    gap: var(--app-section-gap);
    font-size: var(--app-font-size-base);
    line-height: 1.6;

    & + & {
      margin-top: 6px;
    }

    dt {
      flex-shrink: 0;
      width: 120px;
      margin: 0;
      color: var(--text-secondary);
      font-weight: 400;
    }

    dd {
      margin: 0;
      color: var(--text-primary);
      font-weight: 500;
    }
  }

  &__muted {
    color: var(--text-secondary);
  }

  &__cell-ellipsis {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__assign-form {
    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }
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

  &__reassign-form {
    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }

    :deep(.el-form-item__content) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }
  }

  &__assign-doc-type-form {
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
      color: var(--text-primary);
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  &__muted {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }
}
</style>
