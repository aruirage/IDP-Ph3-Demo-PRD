<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, RefreshRight, Search } from '@element-plus/icons-vue'
import {
  downloadExportHistoryCsv,
  exportHistoryRecords
} from '@/mocks/exportHistory'
import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_STATUS_OPTIONS,
  exportStatusTagType,
  type ExportFormat,
  type ExportResultStatus
} from '@/constants/exportFormats'
const page = ref(1)
const pageSize = ref(10)

const filters = reactive({
  caseOrigin: '',
  format: '' as ExportFormat | '',
  status: '' as ExportResultStatus | '',
  exportedFrom: '',
  exportedTo: ''
})

const filteredRecords = computed(() => {
  return exportHistoryRecords.value.filter((item) => {
    if (
      filters.caseOrigin &&
      !(item.caseOrigin ?? '').toLowerCase().includes(filters.caseOrigin.toLowerCase())
    ) {
      return false
    }
    if (filters.format && item.format !== filters.format) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.exportedFrom && item.exportedAt < filters.exportedFrom) return false
    if (filters.exportedTo && item.exportedAt > `${filters.exportedTo} 23:59`) return false
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
  filters.caseOrigin = ''
  filters.format = ''
  filters.status = ''
  filters.exportedFrom = ''
  filters.exportedTo = ''
  page.value = 1
}

function handleExport() {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning('エクスポートするデータがありません')
    return
  }
  downloadExportHistoryCsv(filteredRecords.value)
  ElMessage.success(`${filteredRecords.value.length} 件の履歴を CSV にエクスポートしました`)
}
</script>

<template>
  <div class="v-export-history-panel">
    <div class="v-export-history-panel__toolbar">
      <el-button type="primary" :icon="Download" @click="handleExport">
        履歴をエクスポート
      </el-button>
    </div>

    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--5">
            <el-input v-model="filters.caseOrigin" clearable placeholder="業務キー" />
            <el-select v-model="filters.format" clearable placeholder="形式">
              <el-option
                v-for="opt in EXPORT_FORMAT_OPTIONS.filter((o) => o.value)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-select v-model="filters.status" clearable placeholder="結果">
              <el-option
                v-for="opt in EXPORT_STATUS_OPTIONS.filter((o) => o.value)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-date-picker
              v-model="filters.exportedFrom"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="エクスポート日（開始）"
              clearable
            />
            <el-date-picker
              v-model="filters.exportedTo"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="エクスポート日（終了）"
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

    <section class="v-export-history-panel__table-section">
      <el-card shadow="never" class="v-export-history-panel__table-card">
        <el-table :data="pagedRecords" style="width: 100%" empty-text="データなし">
          <el-table-column prop="exportId" label="エクスポートID" min-width="148" show-overflow-tooltip />
          <el-table-column prop="exportedAt" label="エクスポート日時" min-width="148" show-overflow-tooltip />
          <el-table-column label="業務キー" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.caseOrigin">{{ row.caseOrigin }}</span>
              <span v-else class="v-export-history-panel__muted">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="format" label="形式" width="88" align="center" />
          <el-table-column label="ファイル" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.fileName">{{ row.fileName }}</span>
              <span v-else-if="row.apiNote" class="v-export-history-panel__api-note">{{ row.apiNote }}</span>
              <span v-else class="v-export-history-panel__muted">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="サイズ" width="88" align="center">
            <template #default="{ row }">
              <span v-if="row.fileSize">{{ row.fileSize }}</span>
              <span v-else class="v-export-history-panel__muted">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="実行者" min-width="108" show-overflow-tooltip />
          <el-table-column label="結果" width="96" align="center">
            <template #default="{ row }">
              <el-tag :type="exportStatusTagType(row.status)" effect="plain">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="v-export-history-panel__pagination">
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
.v-export-history-panel {
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

  &__api-note {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }
}
</style>
