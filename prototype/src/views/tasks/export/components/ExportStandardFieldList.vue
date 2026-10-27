<script setup lang="ts">
import type { CaseStandardFieldExport } from '@/mocks/exportFieldEnrichment'

defineProps<{
  fields: CaseStandardFieldExport[]
}>()
</script>

<template>
  <div class="v-export-standard-list">
    <table class="v-export-standard-list__table">
      <thead>
        <tr>
          <th class="v-export-standard-list__col-order">No.</th>
          <th class="v-export-standard-list__col-label">{{ $t('tasks.export.standardFields') }}</th>
          <th class="v-export-standard-list__col-value">{{ $t('tasks.export.standardValue') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(field, index) in fields" :key="field.standardField" class="v-export-standard-list__row">
          <td class="v-export-standard-list__col-order">{{ index + 1 }}</td>
          <td class="v-export-standard-list__col-label" :title="field.displayLabel">
            {{ field.displayLabel }}
          </td>
          <td class="v-export-standard-list__col-value" :title="field.value">
            {{ field.value }}
          </td>
        </tr>
        <tr v-if="fields.length === 0">
          <td colspan="3" class="v-export-standard-list__empty">{{ $t('tasks.common.noData') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.v-export-standard-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;

  &__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
    background: #f9fafb;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-secondary);
    text-align: left;
    white-space: nowrap;
  }

  &__col-order {
    width: 56px;
    text-align: center;
  }

  &__col-label {
    width: 42%;
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

  &__empty {
    padding: 32px 12px !important;
    text-align: center;
    color: var(--text-secondary);
  }
}
</style>
