<script setup lang="ts">
import { computed } from 'vue'
import type { ExportItem, ExportScalarItem } from '@/mocks/exportTask'
import { isExportScalarItem, isExportTableItem } from '@/mocks/exportFieldEnrichment'
import { PLACEHOLDER } from '@/constants/placeholders'

const props = defineProps<{
  fields: ExportItem[]
}>()

const scalarFields = computed(() =>
  props.fields.filter((item): item is ExportScalarItem => isExportScalarItem(item))
)

const tableItems = computed(() => props.fields.filter((item) => isExportTableItem(item)))
</script>

<template>
  <div class="v-export-field-list">
    <section v-if="scalarFields.length" class="v-export-field-list__section">
      <h3 class="v-export-field-list__section-title">{{ $t('tasks.common.field') }}</h3>
      <table class="v-export-field-list__scalar-table">
        <thead>
          <tr>
            <th class="v-export-field-list__col-order">No.</th>
            <th class="v-export-field-list__col-label">{{ $t('tasks.export.fieldName') }}</th>
            <th class="v-export-field-list__col-value">{{ $t('tasks.export.ocrValue') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(field, rowIndex) in scalarFields" :key="field.id" class="v-export-field-list__row">
            <td class="v-export-field-list__col-order">{{ rowIndex + 1 }}</td>
            <td class="v-export-field-list__col-label" :title="field.label">
              {{ field.label }}
            </td>
            <td class="v-export-field-list__col-value" :title="field.value">
              {{ field.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="tableItems.length" class="v-export-field-list__section is-table">
      <h3 class="v-export-field-list__section-title">{{ $t('tasks.common.table') }}</h3>
      <div
        v-for="table in tableItems"
        :key="table.id"
        class="v-export-field-list__table-block"
      >
        <div class="v-export-field-list__table-head">
          <span class="v-export-field-list__table-badge">{{ $t('tasks.common.table') }}</span>
          <h4 class="v-export-field-list__table-title">{{ table.label }}</h4>
          <span class="v-export-field-list__table-meta">{{ $t('tasks.common.countRows', { count: table.rows.length }) }}</span>
        </div>
        <div class="v-export-field-list__table-scroll">
          <table class="v-export-field-list__inner-table">
            <thead>
              <tr>
                <th v-for="column in table.columns" :key="column.id" :title="column.label">
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in table.rows" :key="`${table.id}-${rowIndex}`">
                <td
                  v-for="column in table.columns"
                  :key="column.id"
                  :title="row[column.id] ?? ''"
                >
                  {{ row[column.id] ?? PLACEHOLDER.EMPTY }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <div v-if="!scalarFields.length && !tableItems.length" class="v-export-field-list__empty">
      {{ $t('tasks.common.noData') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-export-field-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;

  &__section {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }

    &.is-table {
      padding: 12px;
      background: #fafbfc;
      gap: 12px;
    }
  }

  &__section-title {
    margin: 0;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
    background: #f9fafb;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  &__section.is-table &__section-title {
    margin: -12px -12px 0;
    background: #f3f4f6;
  }

  &__scalar-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    min-width: 520px;

    thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      background: #f9fafb;
      font-size: var(--app-font-size-base);
      font-weight: 600;
      color: var(--text-secondary);
      text-align: left;
      white-space: nowrap;
    }
  }

  &__col-order {
    width: 48px;
    text-align: center;
  }

  &__col-label {
    width: 36%;
  }

  &__col-value {
    width: auto;
  }

  &__row:hover {
    background: #fafbfc;
  }

  tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    vertical-align: middle;
  }

  &__col-order {
    text-align: center;
    color: var(--text-secondary);
  }

  &__col-label,
  &__col-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__col-value {
    color: var(--text-secondary);
  }

  &__dash {
    color: var(--text-secondary);
  }

  &__table-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;

    &:not(:last-child) {
      padding-bottom: 12px;
      border-bottom: 1px dashed var(--border-color);
    }
  }

  &__table-head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__table-badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
  }

  &__table-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__table-meta {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__table-scroll {
    overflow: auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
  }

  &__inner-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
    min-width: 100%;

    thead th {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      background: #f3f4f6;
      font-size: var(--app-font-size-base);
      font-weight: 600;
      color: var(--text-secondary);
      text-align: left;
      white-space: nowrap;
    }

    tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      font-size: var(--app-font-size-base);
      color: var(--text-secondary);
      white-space: nowrap;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: #fafbfc;
    }
  }

  &__empty {
    padding: 32px 12px;
    text-align: center;
    color: var(--text-secondary);
  }
}
</style>
