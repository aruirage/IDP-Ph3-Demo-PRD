<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { billingNodeLabel } from '@/constants/billingNodes'
import type { NodeExecutionRecord } from '@/mocks/usageStatistics'

const props = defineProps<{
  records: NodeExecutionRecord[]
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

function statusLabel(status: NodeExecutionRecord['status']) {
  return status === 'success'
    ? t('usageStatistics.status.success')
    : t('usageStatistics.status.failure')
}

function billableLabel(isBillable: boolean) {
  return isBillable ? t('usageStatistics.billable.yes') : t('usageStatistics.billable.no')
}
</script>

<template>
  <div class="v-usage-execution-panel">
    <section class="v-usage-execution-panel__table-section">
      <el-card shadow="never" class="v-usage-execution-panel__table-card">
        <el-table :data="pagedRecords" style="width: 100%" empty-text="データなし">
          <el-table-column type="index" :index="rowIndex" label="#" width="56" />
          <el-table-column
            prop="caseId"
            :label="t('usageStatistics.field.caseId')"
            min-width="148"
            show-overflow-tooltip
          />
          <el-table-column
            prop="businessScene"
            :label="t('usageStatistics.field.businessScene')"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column
            prop="fileName"
            :label="t('usageStatistics.field.fileName')"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            prop="pageCountSnapshot"
            :label="t('usageStatistics.field.pageCount')"
            width="100"
            align="right"
          />
          <el-table-column
            :label="t('usageStatistics.field.billingNode')"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ billingNodeLabel(row.billingNode) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('usageStatistics.field.status')"
            width="96"
            align="center"
          >
            <template #default="{ row }">
              {{ statusLabel(row.status) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('usageStatistics.field.isBillable')"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ billableLabel(row.isBillable) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="startedAt"
            :label="t('usageStatistics.field.startedAt')"
            min-width="168"
          />
          <el-table-column
            prop="completedAt"
            :label="t('usageStatistics.field.completedAt')"
            min-width="168"
          />
        </el-table>

        <div class="v-usage-execution-panel__pagination">
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
.v-usage-execution-panel {
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
