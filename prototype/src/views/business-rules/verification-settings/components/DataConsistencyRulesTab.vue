<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  dataMappingRules,
  type DataMappingRule
} from '@/mocks/dataMapping'
import VerificationRuleListHead from './VerificationRuleListHead.vue'

const keyword = ref('')

const rows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return dataMappingRules.value.filter((rule) => {
    if (rule.sources.length < 2) return false
    if (!kw) return true
    return (
      rule.standardField.toLowerCase().includes(kw) ||
      rule.displayLabel.toLowerCase().includes(kw) ||
      rule.sources.some(
        (source) =>
          source.docType.toLowerCase().includes(kw) ||
          source.fieldLabel.toLowerCase().includes(kw)
      )
    )
  })
})

function nowString() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const allEnabled = computed(
  () => rows.value.length > 0 && rows.value.every((row) => row.consistencyCheckEnabled)
)

const someEnabled = computed(
  () => rows.value.some((row) => row.consistencyCheckEnabled) && !allEnabled.value
)

function toggleConsistencyCheck(row: DataMappingRule, enabled: boolean) {
  row.consistencyCheckEnabled = enabled
  row.updatedAt = nowString()
}

function setAllConsistencyCheck(enabled: boolean) {
  const stamp = nowString()
  for (const row of rows.value) {
    row.consistencyCheckEnabled = enabled
    row.updatedAt = stamp
  }
}

function onHeaderCheckChange(checked: boolean | string | number) {
  setAllConsistencyCheck(Boolean(checked))
}
</script>

<template>
  <div class="v-consistency-rules">
    <VerificationRuleListHead
      v-model:keyword="keyword"
      :search-subject="$t('businessRules.dataMapping.placeholder.searchSubjects')"
      :show-scene-filter="false"
    />

    <el-table :data="rows" stripe class="v-consistency-rules__table">
      <el-table-column :label="$t('businessRules.dataMapping.column.no')" width="64" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column :label="$t('businessRules.dataMapping.field.standardField')" min-width="160">
        <template #default="{ row }">
          <code class="v-consistency-rules__code">{{ row.standardField }}</code>
        </template>
      </el-table-column>
      <el-table-column
        prop="displayLabel"
        :label="$t('businessRules.dataMapping.field.displayLabel')"
        min-width="120"
      />
      <el-table-column :label="$t('businessRules.dataMapping.field.ocrField')" min-width="280">
        <template #default="{ row }">
          <div class="v-consistency-rules__source-list">
            <span
              v-for="source in row.sources"
              :key="`${row.id}-${source.docType}-${source.fieldId}`"
              class="v-consistency-rules__source-tag"
            >
              {{ source.docType }} › {{ source.fieldLabel }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column width="168" align="center">
        <template #header>
          <div class="v-consistency-rules__check-header">
            <el-checkbox
              :model-value="allEnabled"
              :indeterminate="someEnabled"
              :disabled="rows.length === 0"
              :aria-label="$t('businessRules.verification.consistency.selectAllAria')"
              @change="onHeaderCheckChange"
            />
            <span>{{ $t('businessRules.dataMapping.field.consistencyCheck') }}</span>
          </div>
        </template>
        <template #default="{ row }">
          <el-switch
            :model-value="row.consistencyCheckEnabled"
            size="small"
            @update:model-value="toggleConsistencyCheck(row, $event)"
          />
        </template>
      </el-table-column>
    </el-table>

    <p v-if="rows.length === 0" class="v-consistency-rules__empty">
      {{ $t('businessRules.verification.consistency.empty') }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.v-consistency-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 12px;

  &__table {
    width: 100%;
  }

  &__code {
    font-family: var(--el-font-family);
    font-size: 13px;
    color: var(--text-primary);
  }

  &__source-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__source-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f2f4f7;
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__check-header {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
  }

  &__empty {
    margin: 0;
    padding: 24px 0;
    text-align: center;
    font-size: var(--app-font-size-base);
    color: var(--text-tertiary);
  }
}
</style>
