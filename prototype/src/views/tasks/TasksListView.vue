<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { assignTask, mockTaskList, TASK_SYSTEM_HANDLER, type TaskListItem, type TaskListStatus } from '@/mocks/tasks'
import { activeTaskAssignees } from '@/constants/taskAssignees'
import { taskTypeLabel, taskTypeOptions, taskExecutionPath, type TaskType } from '@/constants/taskTypes'
import { PLACEHOLDER } from '@/constants/placeholders'
import { BUSINESS_SCENARIO_OPTIONS } from '@/constants/businessScenarios'
import { isAdminUser } from '@/constants/currentUser'

const { t } = useI18n()

function handlerDisplayName(name: string | null): string {
  if (!name) return ''
  return name === TASK_SYSTEM_HANDLER ? t('tasks.common.system') : name
}

const isAdmin = isAdminUser()
const route = useRoute()
const router = useRouter()

const taskTypeFilterOptions = computed(() => taskTypeOptions())
const assigneeOptions = computed(() => activeTaskAssignees())

const page = ref(1)
const pageSize = ref(10)
const listStatus = ref<TaskListStatus>('pending')
const assignDialogVisible = ref(false)
const assigningTask = ref<TaskListItem | null>(null)
const selectedAssignee = ref('')

const filters = reactive({
  taskType: '',
  caseId: '',
  caseType: '',
  businessKey: ''
})

const filteredTasks = computed(() => {
  return mockTaskList.value.filter((item) => {
    if (item.status !== listStatus.value) return false
    if (filters.taskType && item.taskType !== filters.taskType) return false
    if (
      filters.caseId &&
      !item.caseId.toLowerCase().includes(filters.caseId.toLowerCase())
    ) {
      return false
    }
    if (
      filters.businessKey &&
      !(item.caseOrigin ?? '').toLowerCase().includes(filters.businessKey.toLowerCase())
    ) {
      return false
    }
    if (
      filters.caseType &&
      item.caseType !== filters.caseType
    ) {
      return false
    }
    return true
  })
})

const pagedTasks = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})

function rowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1
}

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.taskType = ''
  filters.caseId = ''
  filters.businessKey = ''
  filters.caseType = ''
  page.value = 1
}

function goToTaskDetail(row: TaskListItem) {
  router.push(taskExecutionPath(row.taskType, row.taskId, { viewOnly: true }))
}

function goToTask(row: TaskListItem) {
  if (row.status === 'completed') {
    goToTaskDetail(row)
    return
  }
  router.push(taskExecutionPath(row.taskType, row.taskId))
}

function handleRowAction(row: TaskListItem) {
  if (row.status === 'completed') {
    goToTaskDetail(row)
    return
  }
  goToTask(row)
}

function openAssignDialog(row: TaskListItem) {
  assigningTask.value = row
  selectedAssignee.value = row.assigneeName ?? ''
  assignDialogVisible.value = true
}

function closeAssignDialog() {
  assignDialogVisible.value = false
  assigningTask.value = null
  selectedAssignee.value = ''
}

function confirmAssign() {
  if (!assigningTask.value || !selectedAssignee.value) return
  const ok = assignTask(assigningTask.value.taskId, selectedAssignee.value)
  if (ok) {
    ElMessage.success(t('task.assignSuccess', { name: selectedAssignee.value }))
    closeAssignDialog()
  }
}

watch(listStatus, () => {
  page.value = 1
})

onMounted(() => {
  const type = route.query.type
  if (typeof type === 'string' && taskTypeOptions().some((opt) => opt.value === type)) {
    filters.taskType = type as TaskType
  }
})
</script>

<template>
  <div class="v-content-wrap v-tasks">
    <h1 class="v-tasks__title">{{ $t('page.tasks.title') }}</h1>

    <el-tabs v-model="listStatus" class="v-tasks__tabs">
      <el-tab-pane :label="$t('task.status.pending')" name="pending" />
      <el-tab-pane :label="$t('task.status.completed')" name="completed" />
    </el-tabs>

    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--4">
            <el-select v-model="filters.taskType" clearable :placeholder="$t('task.fields.taskType')">
              <el-option
                v-for="opt in taskTypeFilterOptions.filter((o) => o.value)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-model="filters.caseId"
              clearable
              :placeholder="$t('task.fields.caseId')"
            />
            <el-select v-model="filters.caseType" clearable :placeholder="$t('task.fields.businessScene')">
              <el-option
                v-for="opt in BUSINESS_SCENARIO_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.label"
              />
            </el-select>
            <el-input
              v-model="filters.businessKey"
              clearable
              :placeholder="$t('task.fields.businessKey')"
            />
          </div>
          <div class="v-list-search__actions">
            <el-button type="primary" :icon="Search" native-type="submit" />
            <el-button :icon="RefreshRight" @click="handleReset" />
          </div>
        </div>
      </el-form>
    </section>

    <section class="v-tasks__table-section">
      <el-card shadow="never" class="v-tasks__table-card">
        <el-table
          :data="pagedTasks"
          style="width: 100%"
          :empty-text="$t('common.noData')"
          row-class-name="v-tasks__table-row"
          @row-click="goToTask"
        >
          <el-table-column :label="$t('common.index')" width="64" align="center" :index="rowIndex" type="index" />
          <el-table-column :label="$t('task.fields.taskType')" min-width="132" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="v-tasks__type-label">{{ taskTypeLabel(row.taskType) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="caseId"
            :label="$t('task.fields.caseId')"
            min-width="148"
            show-overflow-tooltip
          />
          <el-table-column
            prop="caseType"
            :label="$t('task.fields.businessScene')"
            min-width="112"
            show-overflow-tooltip
          />
          <el-table-column :label="$t('task.fields.businessKey')" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.caseOrigin">{{ row.caseOrigin }}</span>
              <span v-else class="v-tasks__muted">{{ $t('common.empty') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" :label="$t('task.fields.createdAt')" min-width="136" show-overflow-tooltip />
          <el-table-column prop="updatedAt" :label="$t('task.fields.updatedAt')" min-width="136" show-overflow-tooltip />
          <el-table-column :label="$t('task.fields.assignee')" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <template v-if="row.status === 'pending'">
                <span v-if="row.assigneeName">{{ row.assigneeName }}</span>
                <span v-else class="v-tasks__muted">{{ $t('common.unassigned') }}</span>
              </template>
              <template v-else>
                <span v-if="row.handlerName">{{ handlerDisplayName(row.handlerName) }}</span>
                <span v-else class="v-tasks__muted">{{ $t('common.empty') }}</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.action')" min-width="148" fixed="right" class-name="v-tasks__actions-col">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="handleRowAction(row)">
                {{ row.status === 'pending' ? $t('task.handle') : $t('task.detail') }}
              </el-button>
              <el-button
                v-if="row.status === 'pending' && isAdmin"
                link
                type="primary"
                @click.stop="openAssignDialog(row)"
              >
                {{ $t('common.assign') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="v-tasks__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredTasks.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </section>

    <el-dialog
      v-model="assignDialogVisible"
      :title="$t('task.assignDialogTitle')"
      width="480px"
      @closed="closeAssignDialog"
    >
      <template v-if="assigningTask">
        <dl class="v-tasks__assign-summary">
          <div class="v-tasks__assign-row">
            <dt>{{ $t('task.fields.taskType') }}</dt>
            <dd>{{ taskTypeLabel(assigningTask.taskType) }}</dd>
          </div>
          <div class="v-tasks__assign-row">
            <dt>{{ $t('task.fields.caseId') }}</dt>
            <dd>{{ assigningTask.caseId }}</dd>
          </div>
          <div class="v-tasks__assign-row">
            <dt>{{ $t('task.fields.businessScene') }}</dt>
            <dd>{{ assigningTask.caseType }}</dd>
          </div>
          <div class="v-tasks__assign-row">
            <dt>{{ $t('task.fields.businessKey') }}</dt>
            <dd>{{ assigningTask.caseOrigin ?? $t('common.empty') }}</dd>
          </div>
        </dl>

        <el-form label-position="top" class="v-tasks__assign-form">
          <AppFormItem :label="$t('task.fields.assignee')" required>
            <el-select
              v-model="selectedAssignee"
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
        <el-button @click="closeAssignDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedAssignee" @click="confirmAssign">
          {{ $t('common.ok') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-tasks {
  &__title {
    margin: 0 0 var(--app-page-gap);
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: var(--app-page-gap);
    }

    :deep(.el-tabs__content) {
      display: none;
    }

    :deep(.el-tabs__item) {
      font-size: var(--app-font-size-base);
      height: 44px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--border-color);
    }
  }

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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;

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
    flex-direction: row;
    flex-wrap: nowrap;
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

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
    }
  }

  &__type-label {
    color: var(--el-color-primary);
    font-weight: 600;
    font-size: var(--app-font-size-base);
  }

  &__table-row {
    cursor: pointer;
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

  :deep(.v-tasks__actions-col .cell) {
    white-space: nowrap;
  }

  &__assign-summary {
    margin: 0 0 16px;
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #f9fafb;
  }

  &__assign-row {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 8px;
    font-size: var(--app-font-size-base);

    & + & {
      margin-top: 8px;
    }

    dt {
      margin: 0;
      color: var(--text-secondary);
      font-weight: 400;
    }

    dd {
      margin: 0;
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-all;
    }
  }

  &__assign-form {
    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }
  }
}
</style>
