<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  formatModelCallCaller,
  formatTokenCount,
  modelUsageTypeLabel,
  type ModelCallRecord
} from '@/mocks/modelCallRecords'

const props = defineProps<{
  records: ModelCallRecord[]
}>()

const { t } = useI18n()
const page = ref(1)
const pageSize = ref(10)

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return props.records.slice(start, start + pageSize.value)
})

function rowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1
}

function displayCaseId(caseId: string | null) {
  return caseId ?? t('usageStatistics.modelCall.noCase')
}
</script>

<template>
  <div class="v-usage-model-call-panel">
    <section class="v-usage-model-call-panel__table-section">
      <el-card shadow="never" class="v-usage-model-call-panel__table-card">
        <el-table :data="pagedRecords" style="width: 100%" empty-text="データなし">
          <el-table-column type="index" :index="rowIndex" label="#" width="56" />
          <el-table-column
            :label="t('usageStatistics.field.caseId')"
            min-width="148"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ displayCaseId(row.caseId) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('usageStatistics.field.usageType')"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ modelUsageTypeLabel(row.usageType) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="invokedModel"
            :label="t('usageStatistics.field.invokedModel')"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            :label="t('usageStatistics.field.inputTokens')"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              {{ formatTokenCount(row.inputTokens) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('usageStatistics.field.outputTokens')"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              {{ formatTokenCount(row.outputTokens) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('usageStatistics.field.caller')"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ formatModelCallCaller(row.caller) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="startedAt"
            :label="t('usageStatistics.field.callStartedAt')"
            min-width="168"
          />
          <el-table-column
            prop="respondedAt"
            :label="t('usageStatistics.field.modelRespondedAt')"
            min-width="168"
          />
        </el-table>

        <div class="v-usage-model-call-panel__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="records.length"
            layout="total, prev, pager, next, sizes"
            :page-sizes="[10, 20, 50]"
            background
          />
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-usage-model-call-panel {
  &__table-section {
    min-width: 0;
  }

  &__table-card {
    border-radius: 12px;
    border: 1px solid var(--border-color);

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding: var(--app-section-gap) var(--app-panel-padding);
    border-top: 1px solid var(--border-color);
  }
}
</style>
