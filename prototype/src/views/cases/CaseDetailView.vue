<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { findCaseById } from '@/mocks/cases'
import {
  caseListDisplayStatusClass,
  caseListDisplayStatusLabel,
  caseStatusColumnLabel,
  fileProcessStatusColumnLabel,
  type CaseListDisplayStatus
} from '@/constants/caseStatus'
import {
  buildCaseFileRecords,
  buildCaseWorkflow,
  workflowNodeRecordStatusClass
} from '@/utils/buildCaseWorkflow'
import { workflowRecordStatusLabel } from '@/i18n/workflowLabels'
import CaseWorkflowFlowchart from '@/views/cases/components/CaseWorkflowFlowchart.vue'
import CaseDetailFilesPanel from '@/views/cases/components/CaseDetailFilesPanel.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const caseId = computed(() => String(route.params.caseId ?? ''))
const activeTab = ref<'overview' | 'files'>('files')

const caseItem = computed(() => findCaseById(caseId.value))

const workflow = computed(() => {
  void locale.value
  return caseItem.value ? buildCaseWorkflow(caseItem.value) : null
})

const fileRecords = computed(() => {
  void locale.value
  return caseItem.value ? buildCaseFileRecords(caseItem.value) : []
})

function listStatusLabel(status: CaseListDisplayStatus) {
  return caseListDisplayStatusLabel(status)
}

function formatDateTime(value: string | null) {
  return value ?? t('common.empty')
}

const fromPendingList = computed(() => route.query.from === 'pending')

const backLabel = computed(() =>
  fromPendingList.value ? t('case.detail.backToPendingList') : t('page.cases.title')
)

function goBack() {
  if (fromPendingList.value) {
    router.push({ path: '/cases', query: { tab: 'pending' } })
    return
  }
  router.push({ path: '/cases', query: { tab: 'consolidated', caseId: caseId.value } })
}
</script>

<template>
  <div class="v-content-wrap v-case-detail">
    <button type="button" class="v-case-detail__back" @click="goBack">
      <el-icon :size="16"><ArrowLeft /></el-icon>
      {{ backLabel }}
    </button>

    <template v-if="caseItem && workflow">
      <section class="v-case-detail__summary">
        <dl class="v-case-detail__meta">
          <div class="v-case-detail__meta-item">
            <dt>{{ $t('fields.caseId') }}</dt>
            <dd class="v-case-detail__case-id">{{ caseItem.caseId }}</dd>
          </div>
          <div class="v-case-detail__meta-item">
            <dt>{{ $t('fields.businessScene') }}</dt>
            <dd>{{ caseItem.caseType }}</dd>
          </div>
          <div class="v-case-detail__meta-item">
            <dt>{{ $t('fields.businessKey') }}</dt>
            <dd>{{ caseItem.casePrimaryKey || $t('common.empty') }}</dd>
          </div>
          <div class="v-case-detail__meta-item">
            <dt>{{ caseStatusColumnLabel() }}</dt>
            <dd>
              <span
                class="v-case-detail__status"
                :class="caseListDisplayStatusClass(caseItem.listStatus)"
              >
                {{ listStatusLabel(caseItem.listStatus) }}
              </span>
            </dd>
          </div>
          <div class="v-case-detail__meta-item">
            <dt>{{ $t('fields.fileCount') }}</dt>
            <dd>{{ caseItem.fileCount }}</dd>
          </div>
        </dl>
      </section>

      <el-tabs
        v-model="activeTab"
        tab-position="top"
        class="v-case-detail__tabs"
        :class="{ 'is-files-active': activeTab === 'files' }"
      >
        <el-tab-pane :label="$t('case.detail.tabAllFiles')" name="files">
          <CaseDetailFilesPanel :case-item="caseItem" />
        </el-tab-pane>

        <el-tab-pane :label="$t('case.detail.tabOverview')" name="overview">
          <section class="v-case-detail__flow">
        <h2 class="v-case-detail__section-title">{{ $t('case.panel.workflow') }}</h2>
        <CaseWorkflowFlowchart :flowchart="workflow.flowchart" />
        <p v-if="workflow.fileProgress" class="v-case-detail__file-progress">
          {{
            $t('case.detail.fileProgress', {
              completed: workflow.fileProgress.completed,
              total: workflow.fileProgress.total
            })
          }}
        </p>

        <el-card shadow="never" class="v-case-detail__table-card">
          <template #header>
            <span class="v-case-detail__table-title">{{ $t('case.detail.traversedNodes') }}</span>
          </template>
          <el-table :data="workflow.traversedNodeRecords" size="small" style="width: 100%">
            <el-table-column prop="label" :label="$t('case.workflow.table.node')" min-width="140" />
            <el-table-column :label="$t('fields.status')" min-width="100">
              <template #default="{ row }">
                <span
                  class="v-case-detail__record-status"
                  :class="workflowNodeRecordStatusClass(row.recordStatus)"
                >
                  {{ workflowRecordStatusLabel(row.recordStatus) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('fields.startedAt')" min-width="140">
              <template #default="{ row }">{{ formatDateTime(row.enteredAt) }}</template>
            </el-table-column>
            <el-table-column :label="$t('fields.completedAt')" min-width="140">
              <template #default="{ row }">{{ formatDateTime(row.completedAt) }}</template>
            </el-table-column>
            <el-table-column :label="$t('fields.assignee')" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.operator ?? $t('common.empty') }}</template>
            </el-table-column>
            <el-table-column :label="$t('fields.remark')" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark ?? $t('common.empty') }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </section>

      <section class="v-case-detail__files">
        <h2 class="v-case-detail__section-title">{{ $t('case.panel.fileDetails') }}</h2>
        <el-card shadow="never" class="v-case-detail__table-card">
          <el-table
            :data="fileRecords"
            size="small"
            style="width: 100%"
            :empty-text="$t('common.noData')"
          >
            <el-table-column
              prop="fileName"
              :label="$t('fields.fileName')"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column
              prop="fileType"
              :label="$t('fields.docType')"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column :label="fileProcessStatusColumnLabel()" min-width="140">
              <template #default="{ row }">
                <span class="v-case-detail__file-status" :class="row.statusClass">
                  {{ row.statusLabel }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('fields.startedAt')" min-width="140" prop="enteredAt" />
            <el-table-column :label="$t('fields.updatedAt')" min-width="140" prop="updatedAt" />
            <el-table-column
              prop="operator"
              :label="$t('fields.assignee')"
              min-width="140"
              show-overflow-tooltip
            />
          </el-table>
        </el-card>
      </section>
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-empty v-else :description="$t('case.message.notFound')" />
  </div>
</template>

<style scoped lang="scss">
.v-case-detail {
  max-width: 100%;
  overflow-x: hidden;

  &:has(.v-case-detail__tabs.is-files-active) {
    min-height: unset;
    height: calc(100vh - var(--top-header-total-height));
    max-height: calc(100vh - var(--top-header-total-height));
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  &:has(.v-case-detail__tabs.is-files-active) &__back,
  &:has(.v-case-detail__tabs.is-files-active) &__summary {
    flex-shrink: 0;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px;
    padding: 0;
    border: 0;
    background: transparent;
    font-size: var(--app-font-size-base);
    color: var(--el-color-primary);
    cursor: pointer;
  }

  &__summary,
  &__flow,
  &__files {
    margin-bottom: var(--app-page-gap);
  }

  &__tabs {
    margin-bottom: var(--app-page-gap);

    :deep(.el-tabs__header) {
      margin-bottom: var(--app-page-gap);
    }

    &.is-files-active {
      flex: 1;
      min-height: 0;
      margin-bottom: 0;
      display: flex;
      flex-direction: column;

      // Element Plus tabs DOM: content before header; restore top placement under flex.
      :deep(.el-tabs__header) {
        order: -1;
        flex-shrink: 0;
        margin-bottom: 12px;
      }

      :deep(.el-tabs__content) {
        order: 0;
        flex: 1;
        min-height: 0;
      }

      :deep(.el-tab-pane) {
        height: 100%;
      }
    }
  }

  &__meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--app-page-gap) var(--app-content-padding);
    margin: 0;
    padding: var(--app-panel-padding);
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
  }

  &__meta-item {
    margin: 0;
    min-width: 0;

    dt {
      margin: 0 0 4px;
      font-size: var(--app-font-size-base);
      color: var(--text-secondary);
    }

    dd {
      margin: 0;
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
      word-break: break-word;
    }
  }

  &__case-id {
    font-weight: 600;
  }

  &__status {
    font-weight: 600;

    &.is-muted {
      color: var(--text-secondary);
    }

    &.is-attention {
      color: #b54708;
    }

    &.is-positive {
      color: #027a48;
    }

    &.is-negative {
      color: var(--el-color-danger);
    }
  }

  &__record-status {
    font-weight: 600;

    &.is-muted {
      color: var(--text-secondary);
    }

    &.is-attention {
      color: #b54708;
    }

    &.is-positive {
      color: #027a48;
    }

    &.is-negative {
      color: var(--el-color-danger);
    }
  }

  &__file-status {
    font-weight: 600;
    color: var(--text-primary);

    &.is-negative {
      color: var(--el-color-danger);
    }
  }

  &__section-title {
    margin: 0 0 12px;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__file-progress {
    margin: 12px 0 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__table-card {
    margin-top: 16px;
    max-width: 100%;
    overflow-x: hidden;
    border: 1px solid var(--border-color);
    border-radius: 12px;

    :deep(.el-card__header) {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color);
      font-size: var(--app-font-size-base);
      font-weight: 600;
      color: var(--text-primary);
    }

    :deep(.el-card__body) {
      padding: 0;
    }

    :deep(.el-table) {
      --el-table-header-bg-color: #f9fafb;
      font-size: var(--app-font-size-base);
    }

    :deep(.el-table .el-table__cell) {
      padding: 8px 12px;
    }
  }
}
</style>
