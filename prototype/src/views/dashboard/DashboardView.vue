<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  WarningFilled,
  Download,
  UploadFilled,
  Clock,
  Notebook,
  ArrowRight,
  RefreshRight,
  Search
} from '@element-plus/icons-vue'
import { mockCaseList } from '@/mocks/cases'
import { mockTaskList } from '@/mocks/tasks'
import { aggregateApiCallStatsByType, apiCallRecords } from '@/mocks/apiCallRecords'
const router = useRouter()

const dateForm = reactive({
  dateFrom: '',
  dateTo: ''
})

const appliedRange = reactive({
  dateFrom: '',
  dateTo: ''
})

const today = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

function matchesDateRange(dateTime: string): boolean {
  const date = dateTime.slice(0, 10)
  if (appliedRange.dateFrom && date < appliedRange.dateFrom) return false
  if (appliedRange.dateTo && date > appliedRange.dateTo) return false
  return true
}

const filteredCases = computed(() =>
  mockCaseList.filter((item) => matchesDateRange(item.receivedAt))
)

const filteredTasks = computed(() =>
  mockTaskList.value.filter((item) => matchesDateRange(item.receivedAt))
)

const filteredApiRecords = computed(() =>
  apiCallRecords.value.filter((item) => matchesDateRange(item.requestedAt))
)

const summaryStats = computed(() => [
  {
    key: 'new',
    label: '新規受付',
    value: filteredCases.value.length,
    icon: UploadFilled
  },
  {
    key: 'processing',
    label: '自動処理中',
    value: filteredCases.value.filter((item) =>
      ['UPLOADED', 'PREPROCESSING', 'OCR_EXTRACTING', 'VERIFYING'].includes(item.status)
    ).length,
    icon: Clock
  },
  {
    key: 'review',
    label: '要確認待办',
    value: filteredTasks.value.filter((item) => item.status === 'pending').length,
    icon: WarningFilled
  },
  {
    key: 'supplement',
    label: '補件待ち',
    value: filteredCases.value.filter((item) => item.status === 'PENDING_SUPPLEMENT').length,
    icon: WarningFilled
  },
  {
    key: 'exportable',
    label: 'エクスポート可',
    value: filteredCases.value.filter((item) => item.status === 'READY_EXPORT').length,
    icon: Download
  }
])

const apiStatsByType = computed(() => aggregateApiCallStatsByType(filteredApiRecords.value))

function handleDateSearch() {
  appliedRange.dateFrom = dateForm.dateFrom
  appliedRange.dateTo = dateForm.dateTo
}

function handleDateReset() {
  dateForm.dateFrom = ''
  dateForm.dateTo = ''
  appliedRange.dateFrom = ''
  appliedRange.dateTo = ''
}

function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="v-content-wrap v-dashboard">
    <div class="v-dashboard__header">
      <div>
        <h1 class="v-dashboard__title">ダッシュボード</h1>
        <p class="v-dashboard__subtitle">{{ today }}</p>
      </div>
      <el-button type="primary" :icon="UploadFilled" @click="goTo('/upload')">
        新規アップロード
      </el-button>
    </div>

    <section class="v-list-search">
      <el-form :model="dateForm" class="v-list-search__form" @submit.prevent="handleDateSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--2">
            <el-date-picker
              v-model="dateForm.dateFrom"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="期間（開始）"
              clearable
            />
            <el-date-picker
              v-model="dateForm.dateTo"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="期間（終了）"
              clearable
            />
          </div>
          <div class="v-list-search__actions">
            <el-button type="primary" :icon="Search" native-type="submit" />
            <el-button :icon="RefreshRight" @click="handleDateReset" />
          </div>
        </div>
      </el-form>
    </section>

    <!-- サマリー統計 -->
    <el-row :gutter="16" class="v-dashboard__stats">
      <el-col v-for="item in summaryStats" :key="item.key" :xs="24" :sm="12" :lg="summaryStats.length > 4 ? 8 : 6">
        <div class="v-stat-card">
          <div class="v-stat-card__icon">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
          </div>
          <div class="v-stat-card__body">
            <div class="v-stat-card__value">{{ item.value }}</div>
            <div class="v-stat-card__label">{{ item.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- API呼び出し記録 -->
    <section class="v-dashboard__section">
      <div class="v-dashboard__section-head">
        <h2 class="v-dashboard__section-title">
          <el-icon class="mr-6px"><Notebook /></el-icon>
          API呼び出し記録
        </h2>
        <el-button link type="primary" @click="goTo('/processing-records?tab=api')">
          すべて表示
          <el-icon class="ml-4px"><ArrowRight /></el-icon>
        </el-button>
      </div>

      <div class="v-api-records">
        <div class="v-api-records__type-stats">
          <div
            v-for="stat in apiStatsByType"
            :key="stat.apiType"
            class="v-api-type-stat"
          >
            <span class="v-api-type-stat__label">{{ stat.label }}</span>
            <span class="v-api-type-stat__value">{{ stat.docCountTotal.toLocaleString() }} 枚</span>
            <span class="v-api-type-stat__meta">呼び出し {{ stat.callCount.toLocaleString() }} 回</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-dashboard {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--app-page-gap);
    gap: var(--app-page-gap);
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__subtitle {
    margin: 8px 0 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__filter {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--app-panel-padding) var(--app-panel-padding) var(--app-section-gap);
    margin-bottom: var(--app-page-gap);
  }

  &__filter-body {
    display: flex;
    align-items: flex-end;
    gap: var(--app-page-gap);
    flex-wrap: nowrap;

    @media (max-width: 768px) {
      flex-wrap: wrap;
    }
  }

  &__filter-grid {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__filter-form {
    :deep(.el-form-item) {
      margin-bottom: var(--app-section-gap);
    }

    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
    }

    :deep(.el-date-editor) {
      width: 100%;
    }
  }

  &__filter-actions {
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

  &__stats {
    margin-bottom: var(--app-page-gap);
  }

  &__section {
    margin-bottom: 28px;
  }

  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--app-section-gap);
  }

  &__section-title {
    margin: 0;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    display: flex;
    align-items: center;
    color: var(--text-primary);
  }
}

.v-stat-card {
  display: flex;
  align-items: center;
  gap: var(--app-page-gap);
  padding: var(--app-panel-padding);
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: var(--app-section-gap);

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  &__value {
    font-size: var(--app-font-size-stat);
    font-weight: 700;
    line-height: 1.2;
    color: var(--text-primary);
  }

  &__label {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    margin-top: 4px;
  }
}

.v-api-records {
  &__type-stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--app-section-gap);

    @media (max-width: 1100px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

.v-api-type-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--app-panel-padding);
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 12px;

  &__label {
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__value {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--el-color-primary);
    font-variant-numeric: tabular-nums;
  }

  &__meta {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
}
</style>
