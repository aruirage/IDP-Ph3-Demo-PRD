<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, RefreshRight, Search } from '@element-plus/icons-vue'
import { apiCallRecords, downloadApiCallRecordsCsv } from '@/mocks/apiCallRecords'
import {
  API_CALL_DOC_TYPE_OPTIONS,
  API_CALL_TYPE_OPTIONS,
  apiCallStatusTagType,
  apiCallTypeLabel,
  type ApiCallType
} from '@/constants/apiCallTypes'
const page = ref(1)
const pageSize = ref(10)

const filters = reactive({
  apiType: '' as ApiCallType | '',
  docType: '',
  requestedFrom: '',
  requestedTo: ''
})

const filteredRecords = computed(() => {
  return apiCallRecords.value.filter((item) => {
    if (filters.apiType && item.apiType !== filters.apiType) return false
    if (filters.docType) {
      if (filters.docType === '未分類') {
        if (item.docType !== '未分類') return false
      } else if (item.docType !== filters.docType) {
        return false
      }
    }
    if (filters.requestedFrom && item.requestedAt < filters.requestedFrom) return false
    if (filters.requestedTo && item.requestedAt > `${filters.requestedTo} 23:59:59`) return false
    return true
  })
})

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.apiType = ''
  filters.docType = ''
  filters.requestedFrom = ''
  filters.requestedTo = ''
  page.value = 1
}

function handleExport() {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning('エクスポートするデータがありません')
    return
  }
  downloadApiCallRecordsCsv(filteredRecords.value)
  ElMessage.success(`${filteredRecords.value.length} 件の履歴を CSV にエクスポートしました`)
}
</script>

<template>
  <div class="v-api-call-panel">
    <div class="v-api-call-panel__toolbar">
      <el-button type="primary" :icon="Download" @click="handleExport">
        履歴をエクスポート
      </el-button>
    </div>

    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--4">
            <el-select v-model="filters.apiType" clearable placeholder="API種別">
              <el-option
                v-for="opt in API_CALL_TYPE_OPTIONS.filter((o) => o.value)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-select v-model="filters.docType" clearable placeholder="帳票タイプ">
              <el-option
                v-for="opt in API_CALL_DOC_TYPE_OPTIONS.filter((o) => o.value)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-date-picker
              v-model="filters.requestedFrom"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="リクエスト日時（開始）"
              clearable
            />
            <el-date-picker
              v-model="filters.requestedTo"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="リクエスト日時（終了）"
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

    <section class="v-api-call-panel__table-section">
      <el-card shadow="never" class="v-api-call-panel__table-card">
        <el-table :data="pagedRecords" style="width: 100%" empty-text="データなし">
          <el-table-column prop="requestId" label="リクエスト番号" min-width="156" show-overflow-tooltip />
          <el-table-column label="API種別" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ apiCallTypeLabel(row.apiType) }}
            </template>
          </el-table-column>
          <el-table-column prop="caseId" label="案件番号" min-width="148" show-overflow-tooltip />
          <el-table-column prop="requestedAt" label="リクエスト日時" min-width="156" show-overflow-tooltip />
          <el-table-column label="レスポンス日時" min-width="156" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.respondedAt">{{ row.respondedAt }}</span>
              <span v-else class="v-api-call-panel__muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="ステータス" width="96" align="center">
            <template #default="{ row }">
              <el-tag :type="apiCallStatusTagType(row.status)" effect="plain">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="帳票タイプ" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.docType">{{ row.docType }}</span>
              <span v-else class="v-api-call-panel__muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="帳票枚数" width="96" align="center">
            <template #default="{ row }">
              <span v-if="row.docCount != null">{{ row.docCount }}</span>
              <span v-else class="v-api-call-panel__muted">—</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="v-api-call-panel__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredRecords.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-api-call-panel {
  &__toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--app-section-gap);
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
    :deep(.el-select),
    :deep(.el-date-editor) {
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

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
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
