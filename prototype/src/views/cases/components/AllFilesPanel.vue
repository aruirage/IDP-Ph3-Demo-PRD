<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Loading, RefreshRight, Search } from '@element-plus/icons-vue'
import { CASE_FILE_PREVIEW_URL, formatCaseFileSize } from '@/mocks/caseFiles'
import DocumentPreviewMedia from '@/components/DocumentPreviewMedia.vue'
import {
  allFileStatusClass,
  allFileStatusFilterOptions,
  allFileStatusLabel,
  useAllFilesList,
  type AllFileListItem,
  type AllFileStatusKey
} from '@/mocks/allFiles'
import { fileProcessStatusColumnLabel } from '@/constants/caseStatus'
import { getConfiguredDocTypeNames } from '@/mocks/docTypeSettings'
import { t } from '@/i18n/translate'

const allFiles = useAllFilesList()

const allFileStatusFilterOptionsList = computed(() => allFileStatusFilterOptions())
const docTypeFilterOptions = computed(() => getConfiguredDocTypeNames())

const page = ref(1)
const pageSize = ref(20)
const previewDialogVisible = ref(false)
const previewFile = ref<AllFileListItem | null>(null)

const filters = reactive({
  fileName: '',
  relatedCaseId: '',
  fileTypes: [] as string[],
  status: '' as '' | AllFileStatusKey
})

const filteredFiles = computed(() => {
  return allFiles.value.filter((item) => {
    if (
      filters.fileName &&
      !item.fileName.toLowerCase().includes(filters.fileName.toLowerCase())
    ) {
      return false
    }
    if (
      filters.relatedCaseId &&
      !(item.relatedCaseId ?? '')
        .toLowerCase()
        .includes(filters.relatedCaseId.toLowerCase())
    ) {
      return false
    }
    if (filters.fileTypes.length) {
      const fileType = item.fileType ?? ''
      if (!filters.fileTypes.includes(fileType)) return false
    }
    if (filters.status && item.statusKey !== filters.status) return false
    return true
  })
})

const pagedFiles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredFiles.value.slice(start, start + pageSize.value)
})

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.fileName = ''
  filters.relatedCaseId = ''
  filters.fileTypes = []
  filters.status = ''
  page.value = 1
}

function statusLabel(statusKey: AllFileStatusKey | null) {
  const label = allFileStatusLabel(statusKey)
  return label || t('common.empty')
}

function openPreview(file: AllFileListItem) {
  previewFile.value = file
  previewDialogVisible.value = true
}

function closePreview() {
  previewDialogVisible.value = false
  previewFile.value = null
}
</script>

<template>
  <div class="v-all-files">
    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--4">
            <el-input
              v-model="filters.fileName"
              clearable
              :placeholder="$t('fields.fileName')"
            />
            <el-input
              v-model="filters.relatedCaseId"
              clearable
              :placeholder="$t('fields.relatedCase')"
            />
            <el-select
              v-model="filters.fileTypes"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              :placeholder="$t('fields.docType')"
            >
              <el-option
                v-for="name in docTypeFilterOptions"
                :key="name"
                :label="name"
                :value="name"
              />
            </el-select>
            <el-select
              v-model="filters.status"
              clearable
              :placeholder="fileProcessStatusColumnLabel()"
            >
              <el-option
                v-for="opt in allFileStatusFilterOptionsList.filter((o) => o.value)"
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

    <el-card shadow="never" class="v-all-files__table-card">
      <el-table
        :data="pagedFiles"
        row-key="id"
        style="width: 100%"
        :empty-text="$t('common.noData')"
      >
        <el-table-column :label="$t('fields.fileName')" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button type="primary" link @click="openPreview(row)">
              {{ row.fileName }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="$t('fields.relatedCase')" min-width="148" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.relatedCaseId">{{ row.relatedCaseId }}</span>
            <span v-else class="v-all-files__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('fields.docType')" min-width="132" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.fileType">{{ row.fileType }}</span>
            <span v-else class="v-all-files__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('fields.fileSize')" min-width="112" align="right">
          <template #default="{ row }">{{ formatCaseFileSize(row.size) }}</template>
        </el-table-column>
        <el-table-column
          prop="uploadedAt"
          :label="$t('fields.uploadedAt')"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('fields.updatedAt')"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column :label="$t('fields.pageCount')" min-width="96" align="center">
          <template #default="{ row }">
            <span v-if="row.pageCount != null">{{ row.pageCount }}</span>
            <span v-else class="v-all-files__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="fileProcessStatusColumnLabel()" min-width="140">
          <template #default="{ row }">
            <span class="v-all-files__status" :class="allFileStatusClass(row.statusKey)">
              <el-icon
                v-if="row.statusKey === 'LINKING'"
                class="is-loading"
                :size="14"
              >
                <Loading />
              </el-icon>
              {{ statusLabel(row.statusKey) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.action')" min-width="88" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openPreview(row)">
              {{ $t('case.action.preview') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFile?.fileName ?? $t('fields.filePreview')"
      width="min(920px, 92vw)"
      class="v-all-files__preview-dialog"
      destroy-on-close
      @closed="closePreview"
    >
      <div class="v-all-files__preview-body">
        <DocumentPreviewMedia
          v-if="previewFile"
          :key="previewFile.id"
          fill
          :media-url="CASE_FILE_PREVIEW_URL"
          :title="previewFile.fileName"
        />
      </div>
    </el-dialog>

    <div class="v-all-files__pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="filteredFiles.length"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-all-files {
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0 16px;

    @media (max-width: 1200px) {
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

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
    }
  }

  &__muted {
    color: var(--text-secondary);
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    color: var(--text-primary);

    &.is-negative {
      color: var(--el-color-danger);
    }

    .el-icon.is-loading {
      color: var(--text-primary);
      animation: v-all-files-rotating 1.2s linear infinite;
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
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

@keyframes v-all-files-rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
