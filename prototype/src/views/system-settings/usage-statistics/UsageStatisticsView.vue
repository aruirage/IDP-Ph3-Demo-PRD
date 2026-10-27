<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  CircleCheck,
  Connection,
  Cpu,
  Document,
  Download,
  FolderOpened,
  Lock,
  Picture,
  RefreshRight,
  Search
} from '@element-plus/icons-vue'
import { BILLING_NODES, BILLING_NODE_OPTIONS, billingNodeLabel, type BillingNodeKey } from '@/constants/billingNodes'
import { searchPlaceholder } from '@/constants/placeholders'
import {
  aggregateBillingPageCountByNode,
  billingRecords,
  downloadBillingRecordsCsv,
  downloadExecutionRecordsCsv,
  filterBillingRecords,
  filterExecutionRecords,
  nodeExecutionRecords,
  type UsageSearchFilters
} from '@/mocks/usageStatistics'
import {
  downloadModelCallRecordsCsv,
  filterModelCallRecords,
  modelCallRecords,
  modelUsageTypeOptions,
  type ModelCallSearchFilters
} from '@/mocks/modelCallRecords'
import type { ModelUsageKey } from '@/mocks/modelSettings'
import BillingRecordsPanel from './components/BillingRecordsPanel.vue'
import ExecutionRecordsPanel from './components/ExecutionRecordsPanel.vue'
import ModelCallRecordsPanel from './components/ModelCallRecordsPanel.vue'

type UsageTab = 'billing' | 'execution' | 'modelCall'

const BILLING_NODE_ICONS: Record<BillingNodeKey, object> = {
  CASE_AGGREGATION: FolderOpened,
  AI_PREPROCESS: Cpu,
  OCR_EXTRACTION: Document,
  DATA_MAPPING: Connection,
  AI_VERIFICATION: CircleCheck,
  IMAGE_FRAUD_DETECTION: Picture,
  SENSITIVE_INFO_DETECTION: Lock
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const activeTab = ref<UsageTab>('billing')

const filters = reactive<UsageSearchFilters & { usageTypes: ModelUsageKey[] }>({
  caseId: '',
  fileName: '',
  completedFrom: '',
  completedTo: '',
  billingNodes: [],
  usageTypes: []
})

const appliedFilters = reactive<UsageSearchFilters & { usageTypes: ModelUsageKey[] }>({
  caseId: '',
  fileName: '',
  completedFrom: '',
  completedTo: '',
  billingNodes: [],
  usageTypes: []
})

const appliedModelCallFilters = computed<ModelCallSearchFilters>(() => ({
  caseId: appliedFilters.caseId,
  completedFrom: appliedFilters.completedFrom,
  completedTo: appliedFilters.completedTo,
  usageTypes: appliedFilters.usageTypes
}))

function getCurrentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const format = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return { from: format(firstDay), to: format(lastDay) }
}

function applyDefaultMonthFilters() {
  const { from, to } = getCurrentMonthRange()
  filters.caseId = ''
  filters.fileName = ''
  filters.completedFrom = from
  filters.completedTo = to
  filters.billingNodes = []
  filters.usageTypes = []
  appliedFilters.caseId = ''
  appliedFilters.fileName = ''
  appliedFilters.completedFrom = from
  appliedFilters.completedTo = to
  appliedFilters.billingNodes = []
  appliedFilters.usageTypes = []
}

applyDefaultMonthFilters()

const filteredBillingRecords = computed(() =>
  filterBillingRecords(billingRecords.value, appliedFilters)
)

const filteredExecutionRecords = computed(() =>
  filterExecutionRecords(nodeExecutionRecords.value, appliedFilters)
)

const filteredModelCallRecords = computed(() =>
  filterModelCallRecords(modelCallRecords.value, appliedModelCallFilters.value)
)

const chartItems = computed(() => {
  const totals = aggregateBillingPageCountByNode(filteredBillingRecords.value)

  return BILLING_NODES.map((node) => {
    const value = totals.get(node.key) ?? 0
    return {
      key: node.key,
      label: billingNodeLabel(node.key),
      value,
      icon: BILLING_NODE_ICONS[node.key]
    }
  })
})

const chartTotal = computed(() =>
  chartItems.value.reduce((sum, item) => sum + item.value, 0)
)

function handleSearch() {
  appliedFilters.caseId = filters.caseId
  appliedFilters.fileName = filters.fileName
  appliedFilters.completedFrom = filters.completedFrom
  appliedFilters.completedTo = filters.completedTo
  appliedFilters.billingNodes = [...filters.billingNodes]
  appliedFilters.usageTypes = [...filters.usageTypes]
}

function handleReset() {
  applyDefaultMonthFilters()
}

function handleExportModelCalls() {
  const records = filteredModelCallRecords.value
  if (records.length === 0) {
    ElMessage.warning(t('usageStatistics.export.empty'))
    return
  }
  downloadModelCallRecordsCsv(records)
  ElMessage.success(t('usageStatistics.export.success', { count: records.length }))
}

function handleExport(tab: UsageTab = activeTab.value) {
  if (tab === 'billing') {
    const records = filteredBillingRecords.value
    if (records.length === 0) {
      ElMessage.warning(t('usageStatistics.export.empty'))
      return
    }
    downloadBillingRecordsCsv(records)
    ElMessage.success(t('usageStatistics.export.success', { count: records.length }))
    return
  }

  if (tab === 'modelCall') {
    handleExportModelCalls()
    return
  }

  const records = filteredExecutionRecords.value
  if (records.length === 0) {
    ElMessage.warning(t('usageStatistics.export.empty'))
    return
  }
  downloadExecutionRecordsCsv(records)
  ElMessage.success(t('usageStatistics.export.success', { count: records.length }))
}

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } })
})

onMounted(() => {
  const tab = route.query.tab
  if (tab === 'billing' || tab === 'execution' || tab === 'modelCall') {
    activeTab.value = tab
  }
})
</script>

<template>
  <div class="v-content-wrap v-usage-statistics">
    <header class="v-usage-statistics__header">
      <h1 class="v-usage-statistics__title">{{ t('usageStatistics.title') }}</h1>
    </header>

    <el-tabs v-model="activeTab" class="v-usage-statistics__tabs-nav">
      <el-tab-pane :label="t('usageStatistics.tab.billing')" name="billing" />
      <el-tab-pane :label="t('usageStatistics.tab.execution')" name="execution" />
      <el-tab-pane :label="t('usageStatistics.tab.modelCall')" name="modelCall" />
    </el-tabs>

    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--5">
            <el-input
              v-model="filters.caseId"
              :placeholder="searchPlaceholder(t('usageStatistics.field.caseId'))"
              clearable
            />
            <el-input
              v-if="activeTab !== 'modelCall'"
              v-model="filters.fileName"
              :placeholder="searchPlaceholder(t('usageStatistics.field.fileName'))"
              clearable
            />
            <el-select
              v-if="activeTab !== 'modelCall'"
              v-model="filters.billingNodes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="2"
              :placeholder="t('usageStatistics.filter.billingNodes')"
              clearable
              class="v-usage-statistics__billing-node-select"
            >
              <el-option
                v-for="option in BILLING_NODE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-select
              v-else
              v-model="filters.usageTypes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="2"
              :placeholder="t('usageStatistics.filter.usageTypes')"
              clearable
              class="v-usage-statistics__billing-node-select"
            >
              <el-option
                v-for="option in modelUsageTypeOptions()"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-date-picker
              v-model="filters.completedFrom"
              type="date"
              value-format="YYYY-MM-DD"
              :placeholder="t('usageStatistics.filter.completedFrom')"
              clearable
            />
            <el-date-picker
              v-model="filters.completedTo"
              type="date"
              value-format="YYYY-MM-DD"
              :placeholder="t('usageStatistics.filter.completedTo')"
              clearable
            />
          </div>
          <div class="v-list-search__actions">
            <el-button type="primary" :icon="Search" native-type="submit" />
            <el-button :icon="RefreshRight" @click="handleReset" />
          </div>
        </div>
      </el-form>
    </section>

    <section class="v-usage-statistics__summary">
      <div class="v-usage-statistics__summary-head">
        <h2 class="v-usage-statistics__summary-title">{{ t('usageStatistics.chart.title') }}</h2>
        <span class="v-usage-statistics__summary-total">
          合計 {{ chartTotal.toLocaleString() }} {{ t('usageStatistics.chart.unit') }}
        </span>
      </div>

      <div v-if="chartTotal > 0" class="v-usage-statistics__cards">
        <article
          v-for="item in chartItems"
          :key="item.key"
          class="v-usage-stat-card"
        >
          <div class="v-usage-stat-card__figure" aria-hidden="true">
            <span class="v-usage-stat-card__blob" />
            <el-icon class="v-usage-stat-card__icon" :size="24">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="v-usage-stat-card__label">{{ item.label }}</div>
          <div class="v-usage-stat-card__value-row">
            <span class="v-usage-stat-card__value">{{ item.value.toLocaleString() }}</span>
            <span class="v-usage-stat-card__unit">{{ t('usageStatistics.chart.unit') }}</span>
          </div>
        </article>
      </div>
      <p v-else class="v-usage-statistics__summary-empty">
        {{ t('usageStatistics.chart.empty') }}
      </p>
    </section>

    <section v-show="activeTab === 'billing'" class="v-usage-statistics__panel">
      <div class="v-usage-statistics__list-toolbar">
        <el-button type="primary" :icon="Download" @click="handleExport('billing')">
          {{ t('usageStatistics.export.button') }}
        </el-button>
      </div>
      <BillingRecordsPanel :records="filteredBillingRecords" />
    </section>

    <section v-show="activeTab === 'execution'" class="v-usage-statistics__panel">
      <div class="v-usage-statistics__list-toolbar">
        <el-button type="primary" :icon="Download" @click="handleExport('execution')">
          {{ t('usageStatistics.export.button') }}
        </el-button>
      </div>
      <ExecutionRecordsPanel :records="filteredExecutionRecords" />
    </section>

    <section v-show="activeTab === 'modelCall'" class="v-usage-statistics__panel">
      <div class="v-usage-statistics__list-toolbar">
        <el-button type="primary" :icon="Download" @click="handleExport('modelCall')">
          {{ t('usageStatistics.export.button') }}
        </el-button>
      </div>
      <ModelCallRecordsPanel :records="filteredModelCallRecords" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-usage-statistics {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  :deep(.v-list-search) {
    --v-list-search-field-width: 168px;
  }

  :deep(.v-list-search__body) {
    flex-wrap: nowrap;
  }

  :deep(.v-list-search__grid) {
    flex-wrap: nowrap;
    flex: 1 1 auto;
    min-width: 0;
  }

  &__header {
    margin-bottom: 0;
  }

  &__tabs-nav {
    margin-bottom: 0;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__content) {
      display: none;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
    }
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__billing-node-select {
    width: 100%;
  }

  &__summary-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--app-section-gap);
    margin-bottom: 20px;
  }

  &__summary-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.04em;
  }

  &__summary-total {
    font-size: 13px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  &__summary-empty {
    margin: 0;
    padding: var(--app-panel-padding);
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 16px;

    @media (max-width: 1400px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media (max-width: 1024px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__list-toolbar {
    display: flex;
    justify-content: flex-end;
  }
}

.v-usage-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
  min-height: 156px;
  padding: 28px 14px 24px;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 4px;

  &__figure {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin-bottom: 18px;
  }

  &__blob {
    position: absolute;
    width: 52px;
    height: 52px;
    border-radius: 58% 42% 48% 52% / 48% 55% 45% 52%;
    background: #f4f6f8;
  }

  &__icon {
    position: relative;
    z-index: 1;
    color: #6b9bd1;
  }

  &__label {
    margin-bottom: 14px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    line-height: 1.6;
    letter-spacing: 0.06em;
    word-break: break-word;
  }

  &__value-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__value {
    font-size: 28px;
    font-weight: 600;
    line-height: 1;
    color: var(--el-color-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  &__unit {
    font-size: 13px;
    font-weight: 400;
    color: #9ca3af;
    letter-spacing: 0.08em;
  }
}
</style>
