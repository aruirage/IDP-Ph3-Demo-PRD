<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import {
  DEFAULT_PROCESS_CONFIDENCE,
  inferProcessRuleForLabel,
  syncProcessRules,
  type DocTypeDefinition,
  type DocTypeTableColumnRule,
  type DocTypeTextFieldRule
} from '@/mocks/docTypeSettings'
import DocTypeSamplePreview from './DocTypeSamplePreview.vue'
import DocTypeRuleTableConfig from './DocTypeRuleTableConfig.vue'
import DocTypeProcessRuleFields from './DocTypeProcessRuleFields.vue'

const { t } = useI18n()

const docType = defineModel<DocTypeDefinition>({ required: true })

const activeTab = ref<'text' | 'table'>('text')

watch(
  () => [docType.value.ocrRead.textFields, docType.value.ocrRead.tables],
  () => {
    docType.value.processRules = syncProcessRules(
      docType.value.ocrRead,
      docType.value.processRules
    )
  },
  { deep: true, immediate: true }
)

const textRuleRows = computed(() =>
  docType.value.ocrRead.textFields.map((field) => {
    const rule = docType.value.processRules.textFields.find((item) => item.fieldId === field.id)
    return { field, rule: rule! }
  })
)

function findTextRule(fieldId: string): DocTypeTextFieldRule | undefined {
  return docType.value.processRules.textFields.find((rule) => rule.fieldId === fieldId)
}

function findTableColumnRule(tableId: string, columnId: string): DocTypeTableColumnRule | undefined {
  return docType.value.processRules.tableColumns.find(
    (rule) => rule.tableId === tableId && rule.columnId === columnId
  )
}

function applyAiMatchingToText() {
  const fields = docType.value.ocrRead.textFields.filter((field) => field.itemName.trim())
  if (!fields.length) {
    ElMessage.warning(t('businessRules.docType.message.noItemNameRows'))
    return
  }
  fields.forEach((field) => {
    const rule = findTextRule(field.id)
    if (rule) {
      rule.ruleType = inferProcessRuleForLabel(field.itemName)
      if (!rule.confidence) {
        rule.confidence = DEFAULT_PROCESS_CONFIDENCE
      }
    }
  })
  ElMessage.success(t('businessRules.docType.message.aiMatchingDone'))
}

function applyAiMatchingToTable() {
  const tables = docType.value.ocrRead.tables
  let matched = 0
  tables.forEach((table) => {
    table.columns.forEach((column) => {
      if (!column.columnKey.trim()) return
      const rule = findTableColumnRule(table.id, column.id)
      if (rule) {
        rule.ruleType = inferProcessRuleForLabel(column.columnKey)
        if (!rule.confidence) {
          rule.confidence = DEFAULT_PROCESS_CONFIDENCE
        }
        matched += 1
      }
    })
  })
  if (!matched) {
    ElMessage.warning(t('businessRules.docType.message.noColumnKeyRows'))
    return
  }
  ElMessage.success(t('businessRules.docType.message.aiMatchingDone'))
}

function aiMatching() {
  if (activeTab.value === 'text') {
    applyAiMatchingToText()
    return
  }
  applyAiMatchingToTable()
}

function normalizeConfidence(rule: { confidence: number }) {
  if (Number.isNaN(rule.confidence)) {
    rule.confidence = DEFAULT_PROCESS_CONFIDENCE
    return
  }
  rule.confidence = Math.min(100, Math.max(0, Number(rule.confidence.toFixed(2))))
}
</script>

<template>
  <div class="v-doc-type-rule v-doc-type-workspace v-doc-type-workspace--2-3">
    <DocTypeSamplePreview :image-url="docType.sampleImageUrl" />

    <div class="v-doc-type-rule__panel">
      <div class="v-doc-type-rule__head">
        <el-tabs v-model="activeTab" class="v-doc-type-rule__tabs">
          <el-tab-pane :label="$t('businessRules.docType.tab.textRead')" name="text" />
          <el-tab-pane :label="$t('businessRules.docType.tab.tableRead')" name="table" />
        </el-tabs>

        <div class="v-doc-type-rule__head-actions">
          <el-button type="primary" :icon="MagicStick" @click="aiMatching">
            {{ $t('businessRules.docType.rule.aiMatching') }}
          </el-button>
        </div>
      </div>

      <div class="v-doc-type-rule__body">
        <template v-if="activeTab === 'text'">
          <div v-if="!textRuleRows.length" class="v-doc-type-rule__empty">
            {{ $t('businessRules.docType.rule.emptyTextFields') }}
          </div>
          <div v-else class="v-doc-type-rule__content-scroll">
            <el-table :data="textRuleRows" border class="v-doc-type-rule__table v-doc-type-table">
              <el-table-column
                type="index"
                :label="$t('common.index')"
                width="80"
                align="center"
                header-class-name="v-list-table__index-col"
                class-name="v-list-table__index-col"
              />
              <el-table-column :label="$t('businessRules.docType.column.itemName')" width="200" show-overflow-tooltip prop="field.itemName" />
              <el-table-column :label="$t('businessRules.docType.column.processRule')" width="332">
                <template #default="{ row }">
                  <DocTypeProcessRuleFields v-model="row.rule" :multiple-qr-enabled="docType.ocrRead.multipleQrEnabled" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('businessRules.docType.column.confidence')" width="160" align="center">
                <template #default="{ row }">
                  <div class="v-doc-type-rule__confidence">
                    <el-input-number
                      v-model="row.rule.confidence"
                      :min="0"
                      :max="100"
                      :precision="2"
                      :step="0.01"
                      controls-position="right"
                      @change="normalizeConfidence(row.rule)"
                    />
                    <span class="v-doc-type-rule__confidence-unit">%</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <DocTypeRuleTableConfig
          v-else
          v-model="docType"
          class="v-doc-type-rule__table-config"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-rule {
  &__panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    flex-shrink: 0;
  }

  &__tabs {
    flex: 1;
    min-width: 0;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__item) {
      font-size: var(--app-font-size-base);
      height: 40px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--border-color);
    }
  }

  &__head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  &__content-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &__table {
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

  &__table-config {
    flex: 1;
    min-height: 0;
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
