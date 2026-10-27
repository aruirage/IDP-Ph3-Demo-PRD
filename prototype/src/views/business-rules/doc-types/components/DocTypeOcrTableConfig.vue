<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowUp, Delete, Plus } from '@element-plus/icons-vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  OCR_TABLE_COLUMN_MAX_COUNT,
  OCR_TABLE_MAX_COUNT,
  createEmptyOcrTable,
  createOcrTableColumnId,
  type DocTypeOcrTable
} from '@/mocks/docTypeSettings'

const { t } = useI18n()

const tables = defineModel<DocTypeOcrTable[]>({ required: true })

function addTable() {
  if (tables.value.length >= OCR_TABLE_MAX_COUNT) {
    ElMessage.warning(t('businessRules.docType.message.tableMax', { max: OCR_TABLE_MAX_COUNT }))
    return
  }
  tables.value = [...tables.value, createEmptyOcrTable(tables.value.length + 1)]
}

function removeTable(tableId: string) {
  tables.value = tables.value.filter((table) => table.id !== tableId)
}

function toggleCollapse(table: DocTypeOcrTable) {
  table.collapsed = !table.collapsed
}

function addColumn(table: DocTypeOcrTable) {
  if (table.columns.length >= OCR_TABLE_COLUMN_MAX_COUNT) {
    ElMessage.warning(t('businessRules.docType.message.columnMax', { max: OCR_TABLE_COLUMN_MAX_COUNT }))
    return
  }
  table.columns.push({
    id: createOcrTableColumnId(),
    columnKey: '',
    prompt: '',
    correctSample: '',
    required: false
  })
}

function removeColumn(table: DocTypeOcrTable, columnId: string) {
  table.columns = table.columns.filter((column) => column.id !== columnId)
}

function columnCountLabel(table: DocTypeOcrTable) {
  return `${table.columns.length}/${OCR_TABLE_COLUMN_MAX_COUNT}`
}
</script>

<template>
  <div class="v-doc-type-ocr-tables">
    <div class="v-doc-type-ocr-tables__scroll">
      <div class="v-doc-type-ocr-tables__list">
      <section
        v-for="table in tables"
        :key="table.id"
        class="v-doc-type-ocr-tables__card"
      >
        <header class="v-doc-type-ocr-tables__card-head">
          <h3 class="v-doc-type-ocr-tables__card-title">{{ table.name }}</h3>
          <div class="v-doc-type-ocr-tables__card-actions">
            <button
              type="button"
              class="v-doc-type-ocr-tables__icon-btn"
              :title="$t('businessRules.docType.column.deleteTable')"
              @click="removeTable(table.id)"
            >
              <el-icon :size="16"><Delete /></el-icon>
            </button>
            <button
              type="button"
              class="v-doc-type-ocr-tables__icon-btn"
              :class="{ 'is-collapsed': table.collapsed }"
              :title="$t('businessRules.docType.column.collapse')"
              @click="toggleCollapse(table)"
            >
              <el-icon :size="16"><ArrowUp /></el-icon>
            </button>
          </div>
        </header>

        <div v-show="!table.collapsed" class="v-doc-type-ocr-tables__card-body">
          <AppFormItem :label="$t('businessRules.docType.column.tableCondition')" class="v-doc-type-ocr-tables__condition">
            <el-input
              v-model="table.extractionCondition"
              :placeholder="$t('businessRules.docType.ocr.tableConditionPlaceholder')"
            />
          </AppFormItem>

          <el-table :data="table.columns" border class="v-doc-type-ocr-tables__grid v-doc-type-table">
            <el-table-column
              type="index"
              :label="$t('common.index')"
              width="80"
              align="center"
              header-class-name="v-list-table__index-col"
              class-name="v-list-table__index-col"
            />
            <el-table-column min-width="120">
              <template #header>
                <span>{{ $t('businessRules.docType.column.columnKey') }}</span>
                <RequiredTag />
              </template>
              <template #default="{ row }">
                <el-input v-model="row.columnKey" :placeholder="PLACEHOLDER.INPUT" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.columnPrompt')" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.prompt" :placeholder="PLACEHOLDER.INPUT" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.correctSample')" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.correctSample" :placeholder="PLACEHOLDER.INPUT" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.required')" width="72" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.action')" width="64" align="center" fixed="right" class-name="v-list-table__actions-col">
              <template #default="{ row }">
                <el-button link type="danger" @click="removeColumn(table, row.id)">{{ $t('businessRules.docType.action.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-button
            class="v-doc-type-ocr-tables__add-col"
            :icon="Plus"
            :disabled="table.columns.length >= OCR_TABLE_COLUMN_MAX_COUNT"
            @click="addColumn(table)"
          >
            {{ $t('businessRules.docType.ocr.addColumnWithCount', { count: columnCountLabel(table) }) }}
          </el-button>
        </div>
      </section>
      </div>
    </div>

    <div class="v-doc-type-sticky-add-bar">
      <el-button
        :icon="Plus"
        :disabled="tables.length >= OCR_TABLE_MAX_COUNT"
        @click="addTable"
      >
        {{ $t('businessRules.docType.ocr.addTableWithCount', { count: tables.length, max: OCR_TABLE_MAX_COUNT }) }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-ocr-tables {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  &__scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
    padding-bottom: 4px;
  }

  &__card {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  &__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-color);
    background: #fafafa;
  }

  &__card-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: transform var(--transition-time-02);

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &.is-collapsed {
      transform: rotate(180deg);
    }
  }

  &__card-body {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
    padding: 14px;
  }

  &__condition {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-secondary);
    }
  }

  &__grid {
    width: 100%;
  }

  &__add-col {
    align-self: flex-start;
  }
}
</style>
