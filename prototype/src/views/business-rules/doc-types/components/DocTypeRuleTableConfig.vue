<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp } from '@element-plus/icons-vue'
import {
  DEFAULT_PROCESS_CONFIDENCE,
  type DocTypeDefinition,
  type DocTypeOcrTable,
  type DocTypeTableColumnRule
} from '@/mocks/docTypeSettings'
import DocTypeProcessRuleFields from './DocTypeProcessRuleFields.vue'

const docType = defineModel<DocTypeDefinition>({ required: true })

const tables = computed(() => docType.value.ocrRead.tables)

function findTableColumnRule(tableId: string, columnId: string): DocTypeTableColumnRule | undefined {
  return docType.value.processRules.tableColumns.find(
    (rule) => rule.tableId === tableId && rule.columnId === columnId
  )
}

interface ColumnRuleRow {
  columnId: string
  columnKey: string
  rule: DocTypeTableColumnRule
}

function getColumnRows(table: DocTypeOcrTable): ColumnRuleRow[] {
  return table.columns.map((column) => ({
    columnId: column.id,
    columnKey: column.columnKey,
    rule: findTableColumnRule(table.id, column.id)!
  }))
}

function toggleCollapse(table: DocTypeOcrTable) {
  table.collapsed = !table.collapsed
}

function normalizeConfidence(rule: DocTypeTableColumnRule) {
  if (Number.isNaN(rule.confidence)) {
    rule.confidence = DEFAULT_PROCESS_CONFIDENCE
    return
  }
  rule.confidence = Math.min(100, Math.max(0, Number(rule.confidence.toFixed(2))))
}
</script>

<template>
  <div class="v-doc-type-rule-tables">
    <div v-if="!tables.length" class="v-doc-type-rule-tables__empty">
      {{ $t('businessRules.docType.rule.emptyTableColumns') }}
    </div>
    <div v-else class="v-doc-type-rule-tables__scroll">
      <div class="v-doc-type-rule-tables__list">
        <section
          v-for="table in tables"
          :key="table.id"
          class="v-doc-type-rule-tables__card"
        >
          <header class="v-doc-type-rule-tables__card-head">
            <h3 class="v-doc-type-rule-tables__card-title">{{ table.name }}</h3>
            <button
              type="button"
              class="v-doc-type-rule-tables__icon-btn"
              :class="{ 'is-collapsed': table.collapsed }"
              :title="$t('businessRules.docType.column.collapse')"
              @click="toggleCollapse(table)"
            >
              <el-icon :size="16"><ArrowUp /></el-icon>
            </button>
          </header>

          <div v-show="!table.collapsed" class="v-doc-type-rule-tables__card-body">
            <el-table :data="getColumnRows(table)" border class="v-doc-type-rule-tables__grid v-doc-type-table">
              <el-table-column
                type="index"
                :label="$t('common.index')"
                width="80"
                align="center"
                header-class-name="v-list-table__index-col"
                class-name="v-list-table__index-col"
              />
              <el-table-column :label="$t('businessRules.docType.column.columnKey')" min-width="120" prop="columnKey" />
              <el-table-column :label="$t('businessRules.docType.column.processRule')" width="332">
                <template #default="{ row }">
                  <DocTypeProcessRuleFields v-model="row.rule" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('businessRules.docType.column.confidence')" width="160" align="center">
                <template #default="{ row }">
                  <div class="v-doc-type-rule-tables__confidence">
                    <el-input-number
                      v-model="row.rule.confidence"
                      :min="0"
                      :max="100"
                      :precision="2"
                      :step="0.01"
                      controls-position="right"
                      @change="normalizeConfidence(row.rule)"
                    />
                    <span class="v-doc-type-rule-tables__confidence-unit">%</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-rule-tables {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  &__scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
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
    padding: 14px;
  }

  &__grid {
    width: 100%;
    min-width: 1180px;
  }

  &__confidence {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    justify-content: center;
    width: 100%;

    :deep(.el-input-number) {
      width: 108px;
    }
  }

  &__confidence-unit {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }
}
</style>
