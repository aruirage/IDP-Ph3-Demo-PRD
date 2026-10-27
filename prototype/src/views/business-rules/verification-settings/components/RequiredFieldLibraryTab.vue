<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { dataMappingRules, formatMappingSources, type DataMappingRule } from '@/mocks/dataMapping'
import { getDocTypesForRuleScope } from '@/constants/caseScenarios'
import {
  belongDocTypeDisplayLabel,
  formatRuleScopeLabel,
  ruleAppliesToScene,
  STANDARD_FIELD_BELONG_DOC_TYPE,
  type RequiredFieldAtomicRule,
  type RuleScope
} from '@/mocks/verificationRuleConfig'
import AtomicRuleScopeEditor from './AtomicRuleScopeEditor.vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import { formatDocFieldToken, formatStandardFieldToken } from '@/utils/verificationFormula'
import {
  isRuleScopeConfigured,
  validateRuleBillReferences
} from '@/utils/validateRuleBillReferences'
import VerificationRuleListHead from './VerificationRuleListHead.vue'
import VerificationStandardFieldToggle from './VerificationStandardFieldToggle.vue'

const STANDARD_FIELD_DOC_TYPE = STANDARD_FIELD_BELONG_DOC_TYPE

interface CandidateRow {
  standardField: string
  displayLabel: string
  docFieldLabel: string | null
  mappingSummary: string
  searchLabel: string
  added: boolean
}

interface ParsedPendingField {
  standardField: string
  displayLabel: string
  belongDocType: string
}

const rules = defineModel<RequiredFieldAtomicRule[]>('rules', { required: true })

const { t } = useI18n()

const sceneId = defineModel<string>('sceneId', { default: '' })

const page = ref(1)
const pageSize = ref(10)
const listKeyword = ref('')
const useStandardField = ref(false)
const selectedDocType = ref('')
const pickerFieldIds = ref<string[]>([])
const selectedFieldsText = ref('')
const fieldFilterKeyword = ref('')

const batchScope = ref<RuleScope>('all_scenes')
const batchSceneIds = ref<string[]>([])

const mappingDocTypes = computed(() => {
  const types = new Set<string>()
  for (const rule of dataMappingRules.value) {
    for (const source of rule.sources) {
      types.add(source.docType)
    }
  }
  return [...types].sort((a, b) => a.localeCompare(b, 'ja'))
})

const docTypeSelectOptions = computed(() => {
  const scopedDocTypes = new Set(
    getDocTypesForRuleScope(batchScope.value, batchSceneIds.value)
  )
  return mappingDocTypes.value.filter((docType) => scopedDocTypes.has(docType))
})

const leftFieldCount = computed(() => {
  const docTypeCount = useStandardField.value ? 0 : 1
  return 1 + 1 + docTypeCount + 1
})

function clearBatchFieldSelections() {
  pickerFieldIds.value = []
  selectedFieldsText.value = ''
  fieldFilterKeyword.value = ''
  if (useStandardField.value) {
    selectedDocType.value = STANDARD_FIELD_DOC_TYPE
  } else {
    selectedDocType.value = docTypeSelectOptions.value[0] ?? STANDARD_FIELD_DOC_TYPE
  }
}

const isStandardFieldPick = computed(() => useStandardField.value)

const existingRuleKeys = computed(
  () => new Set(rules.value.map((rule) => `${rule.standardField}::${rule.belongDocType}`))
)

function isRuleAdded(standardField: string, belongDocType: string) {
  return existingRuleKeys.value.has(`${standardField}::${belongDocType}`)
}

function buildCandidateRow(rule: DataMappingRule, docType: string, isStandard: boolean): CandidateRow {
  const docSource = isStandard
    ? null
    : rule.sources.find((source) => source.docType === docType) ?? null

  const mappingSummary = formatMappingSources(rule.sources)
  const searchParts = [rule.displayLabel, rule.standardField, mappingSummary]
  if (docSource?.fieldLabel) searchParts.push(docSource.fieldLabel)

  return {
    standardField: rule.standardField,
    displayLabel: rule.displayLabel,
    docFieldLabel: docSource?.fieldLabel ?? null,
    mappingSummary,
    searchLabel: searchParts.join(' '),
    added: isRuleAdded(rule.standardField, docType)
  }
}

const fieldOptions = computed<CandidateRow[]>(() => {
  const rows = dataMappingRules.value
    .filter((rule) => {
      if (!isStandardFieldPick.value) {
        return rule.sources.some((source) => source.docType === selectedDocType.value)
      }
      return true
    })
    .map((rule) => buildCandidateRow(rule, selectedDocType.value, isStandardFieldPick.value))

  return rows.sort((a, b) => {
    if (a.added !== b.added) return a.added ? 1 : -1
    return a.displayLabel.localeCompare(b.displayLabel, 'ja')
  })
})

const visibleFieldOptions = computed(() => {
  const keyword = fieldFilterKeyword.value.trim().toLowerCase()
  if (!keyword) return fieldOptions.value

  return fieldOptions.value.filter((row) => {
    const status = row.added
      ? t('businessRules.verification.options.fieldAdded')
      : t('businessRules.verification.options.fieldPending')
    return (
      row.displayLabel.toLowerCase().includes(keyword) ||
      row.standardField.toLowerCase().includes(keyword) ||
      row.searchLabel.toLowerCase().includes(keyword) ||
      status.includes(keyword)
    )
  })
})

function handleFieldFilter(query: string) {
  fieldFilterKeyword.value = query
}

function formatFieldTokenForRow(row: CandidateRow, docType: string, isStandard: boolean) {
  if (isStandard) {
    return formatStandardFieldToken(row.displayLabel)
  }
  const label = row.docFieldLabel ?? row.displayLabel
  return formatDocFieldToken(docType, label)
}

function belongDocTypeFromTokenPrefix(prefix: string) {
  return prefix === '標準' ? STANDARD_FIELD_DOC_TYPE : prefix
}

function standardFieldFromTokenInner(inner: string): string | null {
  const dot = inner.indexOf('.')
  if (dot < 0) return null

  const prefix = inner.slice(0, dot)
  const label = inner.slice(dot + 1)

  if (prefix === '標準') {
    return dataMappingRules.value.find((rule) => rule.displayLabel === label)?.standardField ?? null
  }

  for (const rule of dataMappingRules.value) {
    if (rule.sources.some((source) => source.docType === prefix && source.fieldLabel === label)) {
      return rule.standardField
    }
  }

  return dataMappingRules.value.find((rule) => rule.displayLabel === label)?.standardField ?? null
}

function parsePendingFieldsFromText(text: string): ParsedPendingField[] {
  const results: ParsedPendingField[] = []
  const seen = new Set<string>()

  for (const match of text.matchAll(/\{\{([^{}]+)\}\}/g)) {
    const inner = match[1].trim()
    const dot = inner.indexOf('.')
    if (dot < 0) continue

    const prefix = inner.slice(0, dot)
    const standardField = standardFieldFromTokenInner(inner)
    if (!standardField) continue

    const belongDocType = belongDocTypeFromTokenPrefix(prefix)
    const key = `${standardField}::${belongDocType}`
    if (seen.has(key) || isRuleAdded(standardField, belongDocType)) continue

    const rule = dataMappingRules.value.find((item) => item.standardField === standardField)
    if (!rule) continue

    seen.add(key)
    results.push({
      standardField,
      displayLabel: rule.displayLabel,
      belongDocType
    })
  }

  return results
}

function appendTokenToText(text: string, token: string) {
  const trimmed = text.trim()
  if (!trimmed) return token
  if (trimmed.includes(token)) return trimmed
  return `${trimmed.replace(/,\s*$/, '')}, ${token}`
}

function syncDropdownFromText() {
  // 挿入ボタン方式のため、テキスト編集時はドロップダウン選択をクリア
  pickerFieldIds.value = []
}

function handleSelectedFieldsTextInput() {
  syncDropdownFromText()
}

function handleInsertFields() {
  if (!pickerFieldIds.value.length) return

  const docType = selectedDocType.value
  const isStandard = isStandardFieldPick.value

  for (const id of pickerFieldIds.value) {
    const rule = dataMappingRules.value.find((item) => item.standardField === id)
    if (!rule) continue

    const row = buildCandidateRow(rule, docType, isStandard)
    if (row.added) continue

    const token = formatFieldTokenForRow(row, docType, isStandard)
    selectedFieldsText.value = appendTokenToText(selectedFieldsText.value, token)
  }

  pickerFieldIds.value = []
}

watch(useStandardField, (enabled) => {
  if (enabled) {
    selectedDocType.value = STANDARD_FIELD_DOC_TYPE
  } else {
    selectedDocType.value = docTypeSelectOptions.value[0] ?? STANDARD_FIELD_DOC_TYPE
  }
  pickerFieldIds.value = []
  fieldFilterKeyword.value = ''
})

watch(
  docTypeSelectOptions,
  (options) => {
    if (!useStandardField.value && !options.includes(selectedDocType.value)) {
      selectedDocType.value = options[0] ?? STANDARD_FIELD_DOC_TYPE
    }
  },
  { immediate: true }
)

const batchScopeConfigured = computed(() =>
  isRuleScopeConfigured(batchScope.value, batchSceneIds.value)
)

function showBillReferenceError(
  error: ReturnType<typeof validateRuleBillReferences>
) {
  if (!error) return
  ElMessage.warning(t(error.messageKey, error.params))
}

function validateRequiredFieldReferences(
  scope: RuleScope,
  sceneIds: string[],
  fields: ParsedPendingField[]
) {
  const docTypes: string[] = []
  const standardFields: { standardField: string; displayLabel: string }[] = []

  for (const field of fields) {
    if (field.belongDocType === STANDARD_FIELD_DOC_TYPE) {
      standardFields.push({
        standardField: field.standardField,
        displayLabel: field.displayLabel
      })
    } else {
      docTypes.push(field.belongDocType)
    }
  }

  return validateRuleBillReferences({
    scope,
    sceneIds,
    docTypes,
    standardFields
  })
}

const pendingFields = computed(() => parsePendingFieldsFromText(selectedFieldsText.value))

const pendingCount = computed(() => pendingFields.value.length)

const filteredRules = computed(() => {
  const keyword = listKeyword.value.trim().toLowerCase()
  let list = rules.value.filter((rule) => ruleAppliesToScene(rule, sceneId.value))

  if (!keyword) return list

  return list.filter((rule) => {
    const scopeLabel = formatRuleScopeLabel(rule).toLowerCase()
    return (
      rule.displayLabel.toLowerCase().includes(keyword) ||
      rule.standardField.toLowerCase().includes(keyword) ||
      rule.belongDocType.toLowerCase().includes(keyword) ||
      scopeLabel.includes(keyword)
    )
  })
})

const pagedRules = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRules.value.slice(start, start + pageSize.value)
})

function resetListFilter() {
  page.value = 1
}

function resetBatch() {
  pickerFieldIds.value = []
  selectedFieldsText.value = ''
  fieldFilterKeyword.value = ''
  useStandardField.value = false
  batchScope.value = 'all_scenes'
  batchSceneIds.value = []
  selectedDocType.value = docTypeSelectOptions.value[0] ?? STANDARD_FIELD_DOC_TYPE
}

function handleDocTypeChange() {
  fieldFilterKeyword.value = ''
  pickerFieldIds.value = []
}

watch([() => filteredRules.value.length, pageSize, listKeyword], () => {
  const maxPage = Math.max(1, Math.ceil(filteredRules.value.length / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

function handleBatchAdd() {
  if (!pendingFields.value.length) {
    ElMessage.warning(t('businessRules.verification.message.selectFieldsToAdd'))
    return
  }

  const validationError = validateRequiredFieldReferences(
    batchScope.value,
    batchSceneIds.value,
    pendingFields.value
  )
  if (validationError) {
    showBillReferenceError(validationError)
    return
  }

  const newRules: RequiredFieldAtomicRule[] = pendingFields.value.map((row, index) => ({
    id: `atom-fld-${Date.now()}-${index}`,
    standardField: row.standardField,
    displayLabel: row.displayLabel,
    belongDocType: row.belongDocType,
    enabled: true,
    scope: batchScope.value,
    sceneIds: batchScope.value === 'selected_scenes' ? [...batchSceneIds.value] : []
  }))

  rules.value = [...rules.value, ...newRules]
  ElMessage.success(t('businessRules.verification.message.batchAdded', { count: newRules.length }))
  pickerFieldIds.value = []
  selectedFieldsText.value = ''
}

function handleDelete(id: string) {
  rules.value = rules.value.filter((rule) => rule.id !== id)
  ElMessage.success(t('businessRules.verification.message.deleted'))
}
</script>

<template>
  <div class="v-req-field-lib">
    <section class="v-req-field-lib__batch">
      <div class="v-req-field-lib__batch-head">
        <h3 class="v-req-field-lib__batch-title">{{ $t('businessRules.verification.section.batchAdd') }}</h3>
        <span v-if="pendingCount" class="v-req-field-lib__batch-count">{{ $t('businessRules.verification.count.selected', { count: pendingCount }) }}</span>
      </div>

      <div
        class="v-req-field-lib__generator"
        :style="{ '--rule-left-field-count': leftFieldCount }"
      >
        <div class="v-req-field-lib__generator-left">
          <VerificationStandardFieldToggle v-model="useStandardField" />

          <el-form
            label-position="top"
            class="v-req-field-lib__form v-req-field-lib__form--compact v-req-field-lib__scope-form"
            @submit.prevent
          >
            <AppFormItem :label="$t('businessRules.verification.scope.label')" class="v-req-field-lib__scope-item" required>
              <AtomicRuleScopeEditor
                v-model:scope="batchScope"
                v-model:scene-ids="batchSceneIds"
                embedded
                @scope-change="clearBatchFieldSelections"
              />
            </AppFormItem>
          </el-form>

          <el-form
            label-position="top"
            class="v-req-field-lib__form v-req-field-lib__form--compact"
            @submit.prevent
          >
            <AppFormItem
              v-if="!useStandardField"
              :label="$t('businessRules.verification.field.docType')"
              required
            >
              <el-select
                v-model="selectedDocType"
                class="v-req-field-lib__full-width"
                :disabled="!batchScopeConfigured"
                @change="handleDocTypeChange"
              >
                <el-option
                  v-for="docType in docTypeSelectOptions"
                  :key="docType"
                  :label="docType"
                  :value="docType"
                />
              </el-select>
            </AppFormItem>

            <AppFormItem :label="$t('businessRules.verification.field.field')" required>
              <div class="v-req-field-lib__field-row">
                <el-select
                  v-model="pickerFieldIds"
                  multiple
                  filterable
                  :filter-method="handleFieldFilter"
                  collapse-tags
                  collapse-tags-tooltip
                  :max-collapse-tags="1"
                  :disabled="!batchScopeConfigured || (!useStandardField && !selectedDocType)"
                  :placeholder="PLACEHOLDER.SELECT_MULTIPLE"
                  class="v-req-field-lib__field-select"
                >
                  <el-option
                    v-for="row in visibleFieldOptions"
                    :key="row.standardField"
                    :label="row.displayLabel"
                    :value="row.standardField"
                    :disabled="row.added"
                  >
                    <div class="v-req-field-lib__option">
                      <div class="v-req-field-lib__option-main">
                        <span class="v-req-field-lib__name">{{ row.displayLabel }}</span>
                        <span
                          class="v-req-field-lib__status"
                          :class="row.added ? 'is-added' : 'is-pending'"
                        >
                          {{ row.added ? $t('businessRules.verification.options.fieldAdded') : $t('businessRules.verification.options.fieldPending') }}
                        </span>
                      </div>
                    </div>
                  </el-option>
                </el-select>
                <el-button
                  :disabled="!batchScopeConfigured || !pickerFieldIds.length"
                  @click="handleInsertFields"
                >
                  {{ $t('businessRules.verification.action.insert') }}
                </el-button>
              </div>
            </AppFormItem>
          </el-form>
        </div>

        <div class="v-req-field-lib__generator-right">
          <el-form
            label-position="top"
            class="v-req-field-lib__form v-req-field-lib__form--compact"
            @submit.prevent
          >
            <AppFormItem :label="$t('businessRules.verification.field.selectedFields')" class="v-req-field-lib__preview-item">
              <textarea
                v-model="selectedFieldsText"
                class="v-req-field-lib__selected-editor"
                :placeholder="PLACEHOLDER.SELECT_MULTIPLE"
                @input="handleSelectedFieldsTextInput"
              />
            </AppFormItem>
          </el-form>
          <div class="v-req-field-lib__generator-actions">
            <el-button @click="resetBatch">{{ $t('businessRules.verification.action.clear') }}</el-button>
            <el-button type="primary" :disabled="!batchScopeConfigured" @click="handleBatchAdd">
              {{ pendingCount ? $t('businessRules.verification.action.batchAddWithCount', { count: pendingCount }) : $t('businessRules.verification.action.batchAdd') }}
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="rules.length" class="v-req-field-lib__list">
      <VerificationRuleListHead
        v-model:scene-id="sceneId"
        v-model:keyword="listKeyword"
        :title="$t('businessRules.verification.section.ruleList')"
        :search-subject="$t('businessRules.verification.placeholder.searchFieldRule')"
        @reset="resetListFilter"
      />

      <el-table :data="pagedRules" border class="v-req-field-lib__table">
        <el-table-column :label="$t('businessRules.verification.column.no')" width="64" align="center">
          <template #default="{ $index }">
            {{ (page - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.fieldName')" min-width="180">
          <template #default="{ row }">
            <div class="v-req-field-lib__field-cell">
              <span class="v-req-field-lib__name">{{ row.displayLabel }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.belongDocType')" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ belongDocTypeDisplayLabel(row.belongDocType) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.applyScene')" min-width="160">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ formatRuleScopeLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.action')" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row.id)">{{ $t('businessRules.verification.action.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!filteredRules.length"
        :description="$t('businessRules.verification.message.emptyRules')"
        :image-size="72"
        class="v-req-field-lib__list-empty"
      />

      <div v-if="filteredRules.length" class="v-req-field-lib__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredRules.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-req-field-lib {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__batch {
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__batch-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
  }

  &__batch-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__batch-count {
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__generator {
    --rule-field-label-height: 18px;
    --rule-field-label-gap: 4px;
    --rule-field-control-height: 32px;
    --rule-field-item-gap: 8px;
    --rule-left-field-count: 3;
    --rule-actions-gap: 8px;
    --rule-actions-height: 32px;
    --rule-actions-offset: calc(var(--rule-actions-gap) + var(--rule-actions-height));
    --rule-preview-height: calc(
      var(--rule-left-field-count) *
        (
          var(--rule-field-label-height) + var(--rule-field-label-gap) +
            var(--rule-field-control-height) + var(--rule-field-item-gap)
        ) - var(--rule-field-item-gap) - var(--rule-field-label-height) -
        var(--rule-field-label-gap) - var(--rule-actions-offset)
    );

    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: var(--app-page-gap);
    align-items: start;
  }

  &__generator-left,
  &__generator-right {
    min-width: 0;
    width: 100%;
  }

  &__generator-left > :not(.v-req-field-lib__form) {
    margin-bottom: var(--rule-field-item-gap, 8px);
  }

  &__field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  &__generator-right {
    display: flex;
    flex-direction: column;

    .v-req-field-lib__form {
      width: 100%;
    }
  }

  &__full-width {
    width: 100%;
  }

  &__field-select {
    flex: 1;
    min-width: 0;

    :deep(.el-select__wrapper) {
      min-height: 32px;
      height: 32px;
      box-sizing: border-box;
    }

    :deep(.el-select__selection) {
      flex-wrap: nowrap;
      overflow: hidden;
    }

    :deep(.el-select__selected-item) {
      flex-shrink: 1;
      min-width: 0;
      max-width: calc(100% - 56px);
    }

    :deep(.el-tag) {
      max-width: 100%;
    }

    :deep(.el-tag__content) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.el-select__input-wrapper) {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-select__input) {
      height: 24px;
    }
  }

  &__form {
    &--compact {
      :deep(.el-form-item) {
        margin-bottom: var(--rule-field-item-gap, 8px);
      }

      :deep(.el-form-item__label) {
        margin-bottom: var(--rule-field-label-gap, 4px);
        padding-bottom: 0;
        line-height: 1.3;
        font-size: 14px;
      }
    }
  }

  &__scope-form {
    margin-bottom: var(--rule-field-item-gap, 8px);
  }

  &__scope-item {
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      line-height: normal;
    }
  }

  &__preview-item {
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      width: 100%;
    }
  }

  &__selected-editor {
    display: block;
    width: 100%;
    height: var(--rule-preview-height);
    min-height: var(--rule-preview-height);
    max-height: 320px;
    padding: 8px 12px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    background: #fff;
    font-family: var(--app-font-family);
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
    resize: vertical;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--el-color-primary);
    }

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }

  &__generator-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: var(--rule-actions-gap, 8px);
    flex-shrink: 0;
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 2px 0;
  }

  &__option-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__status {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;

    &.is-pending {
      color: var(--el-color-success);
    }

    &.is-added {
      color: var(--text-secondary);
    }
  }

  &__table {
    width: 100%;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__list-empty {
    padding: var(--app-section-gap) 0;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--app-section-gap);
  }

  &__field-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__code {
    font-size: 12px;
    color: var(--el-color-primary);
    font-family: ui-monospace, monospace;
  }
}
</style>
