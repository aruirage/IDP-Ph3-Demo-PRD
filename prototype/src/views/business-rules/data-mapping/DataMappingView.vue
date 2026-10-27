<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, RefreshRight } from '@element-plus/icons-vue'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'
import { getFieldTemplatesForDocType } from '@/constants/exportFieldTemplates'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import {
  buildCurrentOcrFieldKeySet,
  dataMappingRules,
  formatMappingSources,
  parseSourceKey,
  pruneAllMappingRuleSources,
  pruneMappingRuleSources,
  sourceKey,
  type DataMappingRule,
  type DataMappingSource
} from '@/mocks/dataMapping'
import { PLACEHOLDER } from '@/constants/placeholders'
import { RULE_DESCRIPTION_MAX_LENGTH } from '@/constants/ruleTextLimits'
import { buildStandardMappingRuleText, type MappingRuleTemplateLabels } from '@/utils/mappingRuleTemplate'
import { formatDocFieldToken, insertTokenAtCursor } from '@/utils/verificationFormula'

const { t } = useI18n()

const page = ref(1)
const pageSize = ref(10)
const editDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const ruleTextareaRef = ref<HTMLTextAreaElement | null>(null)
const editRuleTextareaRef = ref<HTMLTextAreaElement | null>(null)
const pickerDocType = ref('')
const pickerFieldKeys = ref<string[]>([])
const isSyncingOcrPicker = ref(false)

const draft = reactive({
  standardField: '',
  displayLabel: '',
  standardizationRule: '',
  selectedSourceKeys: [] as string[]
})

const fieldSelectPlaceholder = computed(() =>
  pickerDocType.value ? PLACEHOLDER.SELECT_MULTIPLE : t('businessRules.dataMapping.placeholder.selectDocTypeFirst')
)

const listFilter = reactive({
  keyword: ''
})

interface OcrFieldOption {
  key: string
  docType: string
  fieldId: string
  fieldLabel: string
}

const ocrFieldOptions = computed<OcrFieldOption[]>(() => {
  const options: OcrFieldOption[] = []
  for (const docType of PREPROCESS_DOC_TYPES) {
    for (const field of getFieldTemplatesForDocType(docType)) {
      options.push({
        key: `${docType}::${field.id}`,
        docType,
        fieldId: field.id,
        fieldLabel: field.label
      })
    }
  }
  return options.sort((a, b) => {
    const doc = a.docType.localeCompare(b.docType, 'ja')
    return doc !== 0 ? doc : a.fieldLabel.localeCompare(b.fieldLabel, 'ja')
  })
})

onMounted(() => {
  pruneAllMappingRuleSources()
})

const ocrDocTypes = computed(() =>
  [...new Set(ocrFieldOptions.value.map((option) => option.docType))].sort((a, b) =>
    a.localeCompare(b, 'ja')
  )
)

const fieldsForPickerDocType = computed(() => {
  if (!pickerDocType.value) return []
  return ocrFieldOptions.value.filter((option) => option.docType === pickerDocType.value)
})

watch(pickerDocType, () => {
  syncPickerFieldKeysFromDraft()
})

watch(pickerFieldKeys, (keys, oldKeys) => {
  if (!pickerDocType.value) return
  const currentDocKeys = new Set(fieldsForPickerDocType.value.map((option) => option.key))
  const others = draft.selectedSourceKeys.filter((key) => !currentDocKeys.has(key))
  draft.selectedSourceKeys = [...others, ...keys]

  if (isSyncingOcrPicker.value) return

  const prev = oldKeys ?? []
  for (const key of keys) {
    if (!prev.includes(key)) {
      insertFieldTokenByKey(key)
    }
  }
})

function runOcrPickerSync(action: () => void) {
  isSyncingOcrPicker.value = true
  action()
  isSyncingOcrPicker.value = false
}

function syncPickerFieldKeysFromDraft() {
  runOcrPickerSync(() => {
    if (!pickerDocType.value) {
      pickerFieldKeys.value = []
      return
    }
    const currentDocKeys = new Set(fieldsForPickerDocType.value.map((option) => option.key))
    pickerFieldKeys.value = draft.selectedSourceKeys.filter((key) => currentDocKeys.has(key))
  })
}

function initOcrPicker() {
  if (!draft.selectedSourceKeys.length) {
    pickerDocType.value = ''
    pickerFieldKeys.value = []
    return
  }
  const firstOption = ocrFieldOptions.value.find(
    (option) => option.key === draft.selectedSourceKeys[0]
  )
  pickerDocType.value = firstOption?.docType ?? ''
  syncPickerFieldKeysFromDraft()
}

const draftSources = computed<DataMappingSource[]>(() =>
  draft.selectedSourceKeys
    .map((key) => {
      const parsed = parseSourceKey(key)
      const option = ocrFieldOptions.value.find((item) => item.key === key)
      if (!parsed || !option) return null
      return {
        docType: option.docType,
        fieldId: option.fieldId,
        fieldLabel: option.fieldLabel
      }
    })
    .filter((item): item is DataMappingSource => item !== null)
)

const filteredRules = computed(() => {
  const kw = listFilter.keyword.trim().toLowerCase()
  if (!kw) return dataMappingRules.value
  return dataMappingRules.value.filter((rule) => {
    return (
      rule.standardField.toLowerCase().includes(kw) ||
      rule.displayLabel.toLowerCase().includes(kw) ||
      formatMappingSources(rule.sources).toLowerCase().includes(kw) ||
      rule.standardizationRule.toLowerCase().includes(kw)
    )
  })
})

const pagedRules = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRules.value.slice(start, start + pageSize.value)
})

watch([() => filteredRules.value.length, pageSize, () => listFilter.keyword], () => {
  page.value = 1
})

function resetDraft() {
  draft.standardField = ''
  draft.displayLabel = ''
  draft.standardizationRule = ''
  draft.selectedSourceKeys = []
  pickerDocType.value = ''
  pickerFieldKeys.value = []
  editingId.value = null
}

function pruneDraftSourceKeys(): void {
  const validKeys = buildCurrentOcrFieldKeySet()
  draft.selectedSourceKeys = draft.selectedSourceKeys.filter((key) => validKeys.has(key))
}

function validateDraft(): boolean {
  pruneDraftSourceKeys()
  if (!draft.standardField.trim()) {
    ElMessage.warning(t('businessRules.dataMapping.message.standardFieldRequired'))
    return false
  }
  if (!/^[a-z][a-z0-9_]*$/.test(draft.standardField.trim())) {
    ElMessage.warning(t('businessRules.dataMapping.message.standardFieldFormat'))
    return false
  }
  if (!draft.displayLabel.trim()) {
    ElMessage.warning(t('businessRules.dataMapping.message.displayLabelRequired'))
    return false
  }
  if (draftSources.value.length === 0) {
    ElMessage.warning(t('businessRules.dataMapping.message.ocrFieldRequired'))
    return false
  }

  const duplicate = dataMappingRules.value.find(
    (rule) =>
      rule.standardField === draft.standardField.trim() && rule.id !== editingId.value
  )
  if (duplicate) {
    ElMessage.warning(t('businessRules.dataMapping.message.duplicateStandardField'))
    return false
  }
  if (draft.standardizationRule.length > RULE_DESCRIPTION_MAX_LENGTH) {
    ElMessage.warning(
      t('businessRules.dataMapping.message.ruleMaxLength', { max: RULE_DESCRIPTION_MAX_LENGTH })
    )
    return false
  }

  return true
}

function nowString() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function saveMapping(closeDialog = false) {
  if (!validateDraft()) return

  const existing = editingId.value
    ? dataMappingRules.value.find((r) => r.id === editingId.value)
    : null

  const payload: DataMappingRule = {
    id: editingId.value ?? `map-${Date.now()}`,
    standardField: draft.standardField.trim(),
    displayLabel: draft.displayLabel.trim(),
    dataType: 'string',
    sources: draftSources.value.map((s) => ({ ...s })),
    standardizationRule: draft.standardizationRule.trim(),
    consistencyCheckEnabled:
      draftSources.value.length >= 2 ? (existing?.consistencyCheckEnabled ?? true) : false,
    updatedAt: nowString()
  }

  if (editingId.value) {
    const index = dataMappingRules.value.findIndex((r) => r.id === editingId.value)
    if (index >= 0) dataMappingRules.value[index] = payload
    ElMessage.success(t('businessRules.dataMapping.message.updated'))
    if (closeDialog) editDialogVisible.value = false
  } else {
    dataMappingRules.value.unshift(payload)
    ElMessage.success(t('businessRules.dataMapping.message.added'))
  }

  resetDraft()
}

function handleAddSave() {
  if (editingId.value) return
  saveMapping()
}

function handleEditSave() {
  saveMapping(true)
}

function handleEdit(rule: DataMappingRule) {
  pruneMappingRuleSources(rule)
  editingId.value = rule.id
  draft.standardField = rule.standardField
  draft.displayLabel = rule.displayLabel
  draft.standardizationRule = rule.standardizationRule
  draft.selectedSourceKeys = rule.sources.map((s) => sourceKey(s))
  if (rule.sources.length === 0) {
    ElMessage.warning(t('businessRules.dataMapping.message.ocrFieldsInvalid'))
  }
  initOcrPicker()
  editDialogVisible.value = true
}

async function handleDelete(rule: DataMappingRule) {
  try {
    await ElMessageBox.confirm(
      t('businessRules.dataMapping.message.deleteConfirm', { name: rule.standardField }),
      t('businessRules.dataMapping.message.deleteTitle'),
      { type: 'warning', ...MESSAGE_BOX_CONFIRM_DEFAULTS }
    )
    dataMappingRules.value = dataMappingRules.value.filter((r) => r.id !== rule.id)
    ElMessage.success(t('businessRules.dataMapping.message.deleted'))
  } catch {
    // cancelled
  }
}

function mappingRuleLabels(): MappingRuleTemplateLabels {
  const prefix = 'businessRules.dataMapping.ruleTemplate'
  return {
    sectionSources: t(`${prefix}.sectionSources`),
    sectionIdentity: t(`${prefix}.sectionIdentity`),
    sectionAssign: t(`${prefix}.sectionAssign`),
    identityMulti: t(`${prefix}.identityMulti`),
    identitySingle: t(`${prefix}.identitySingle`),
    assignSame: t(`${prefix}.assignSame`),
    assignDiff: t(`${prefix}.assignDiff`),
    assignSingle: t(`${prefix}.assignSingle`)
  }
}

function getRuleTextareaEl(): HTMLTextAreaElement | null {
  return editDialogVisible.value ? editRuleTextareaRef.value : ruleTextareaRef.value
}

function insertFieldTokenByKey(key: string) {
  const option = ocrFieldOptions.value.find((item) => item.key === key)
  if (!option) return

  const token = formatDocFieldToken(option.docType, option.fieldLabel)
  if (draft.standardizationRule.includes(token)) return

  draft.standardizationRule = insertTokenAtCursor(
    draft.standardizationRule,
    token,
    getRuleTextareaEl()
  ).slice(0, RULE_DESCRIPTION_MAX_LENGTH)
}

function handleOptimizeRule() {
  if (!draft.displayLabel.trim()) {
    ElMessage.warning(t('businessRules.dataMapping.message.displayLabelRequired'))
    return
  }
  if (!draftSources.value.length) {
    ElMessage.warning(t('businessRules.dataMapping.message.ocrFieldRequired'))
    return
  }

  draft.standardizationRule = buildStandardMappingRuleText(
    draft.displayLabel.trim(),
    draft.standardField.trim() || '—',
    draftSources.value,
    mappingRuleLabels()
  ).slice(0, RULE_DESCRIPTION_MAX_LENGTH)
  ElMessage.success(t('businessRules.dataMapping.message.ruleOptimized'))
}

function handleResetFilter() {
  listFilter.keyword = ''
}

function handleEditDialogClose() {
  editDialogVisible.value = false
  if (editingId.value) resetDraft()
}
</script>

<template>
  <div class="v-content-wrap v-data-mapping">
    <header class="v-data-mapping__header">
      <h1 class="v-data-mapping__title">{{ $t('businessRules.dataMapping.title') }}</h1>
    </header>

    <section class="v-data-mapping__adder">
      <el-card shadow="never" class="v-data-mapping__adder-card">
        <h2 class="v-data-mapping__section-title">{{ $t('businessRules.dataMapping.generateSection') }}</h2>

        <div class="v-data-mapping__generator">
          <div class="v-data-mapping__generator-left">
            <el-form label-position="top" class="v-data-mapping__form v-data-mapping__form--compact">
              <AppFormItem :label="$t('businessRules.dataMapping.field.docType')">
                <el-select
                  v-model="pickerDocType"
                  filterable
                  clearable
                  :placeholder="PLACEHOLDER.SELECT"
                  class="v-data-mapping__full-width"
                >
                  <el-option
                    v-for="docType in ocrDocTypes"
                    :key="docType"
                    :label="docType"
                    :value="docType"
                  />
                </el-select>
              </AppFormItem>

              <AppFormItem :label="$t('businessRules.dataMapping.field.field')" required>
                <el-select
                  v-model="pickerFieldKeys"
                  multiple
                  filterable
                  collapse-tags
                  collapse-tags-tooltip
                  :disabled="!pickerDocType"
                  :placeholder="fieldSelectPlaceholder"
                  class="v-data-mapping__full-width"
                >
                  <el-option
                    v-for="option in fieldsForPickerDocType"
                    :key="option.key"
                    :label="option.fieldLabel"
                    :value="option.key"
                  />
                </el-select>
              </AppFormItem>

              <AppFormItem :label="$t('businessRules.dataMapping.field.standardField')" required>
                <el-input
                  v-model="draft.standardField"
                  :placeholder="$t('businessRules.dataMapping.placeholder.standardFieldExample')"
                />
              </AppFormItem>

              <AppFormItem :label="$t('businessRules.dataMapping.field.displayLabel')" required>
                <el-input
                  v-model="draft.displayLabel"
                  :placeholder="$t('businessRules.dataMapping.placeholder.displayLabelExample')"
                />
              </AppFormItem>
            </el-form>
          </div>

          <div class="v-data-mapping__generator-right">
            <el-form label-position="top" class="v-data-mapping__form v-data-mapping__form--compact">
              <AppFormItem
                :label="$t('businessRules.dataMapping.field.standardizationRule')"
                class="v-data-mapping__rule-item"
              >
                <textarea
                  ref="ruleTextareaRef"
                  v-model="draft.standardizationRule"
                  class="v-data-mapping__rule-native"
                  :maxlength="RULE_DESCRIPTION_MAX_LENGTH"
                  :placeholder="$t('businessRules.dataMapping.placeholder.ruleExample')"
                />
              </AppFormItem>
            </el-form>
            <div class="v-data-mapping__generator-actions">
              <el-button @click="resetDraft">{{ $t('businessRules.dataMapping.action.clear') }}</el-button>
              <el-button type="primary" :icon="MagicStick" @click="handleOptimizeRule">
                {{ $t('businessRules.dataMapping.action.optimizeRule') }}
              </el-button>
              <el-button type="primary" @click="handleAddSave">{{ $t('businessRules.dataMapping.action.add') }}</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </section>

    <section class="v-data-mapping__list">
      <div class="v-data-mapping__list-header">
        <h2 class="v-data-mapping__section-title">{{ $t('businessRules.dataMapping.listSection') }}</h2>
      </div>

      <div class="v-data-mapping__search v-list-search">
        <div class="v-list-search__body">
          <el-input
            v-model="listFilter.keyword"
            :placeholder="$t('businessRules.dataMapping.placeholder.searchSubjects')"
            clearable
            class="v-data-mapping__search-input"
          />
          <div class="v-list-search__actions">
            <el-button :icon="RefreshRight" :disabled="!listFilter.keyword" @click="handleResetFilter" />
          </div>
        </div>
      </div>

      <el-card shadow="never" class="v-data-mapping__table-card">
        <el-table :data="pagedRules" stripe>
          <el-table-column :label="$t('businessRules.dataMapping.column.no')" width="64" align="center">
            <template #default="{ $index }">
              {{ (page - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('businessRules.dataMapping.field.standardField')" min-width="160">
            <template #default="{ row }">
              <code class="v-data-mapping__code">{{ row.standardField }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="displayLabel" :label="$t('businessRules.dataMapping.field.displayLabel')" min-width="120" />
          <el-table-column :label="$t('businessRules.dataMapping.field.ocrField')" min-width="260">
            <template #default="{ row }">
              <el-tag v-if="row.sources.length === 0" type="warning" size="small">
                {{ $t('businessRules.dataMapping.status.needsFix') }}
              </el-tag>
              <div v-else class="v-data-mapping__source-list">
                <span
                  v-for="source in row.sources"
                  :key="`${row.id}-${source.docType}-${source.fieldId}`"
                  class="v-data-mapping__source-tag"
                >
                  {{ source.docType }} › {{ source.fieldLabel }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('businessRules.dataMapping.field.standardizationRule')" min-width="320">
            <template #default="{ row }">
              <el-tooltip
                v-if="row.standardizationRule"
                placement="top-start"
                popper-class="v-data-mapping__rule-tooltip"
              >
                <template #content>
                  <div class="v-data-mapping__rule-tooltip-text">{{ row.standardizationRule }}</div>
                </template>
                <span class="v-data-mapping__rule-preview">{{ row.standardizationRule }}</span>
              </el-tooltip>
              <span v-else class="v-data-mapping__na">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" :label="$t('businessRules.dataMapping.field.updatedAt')" width="168" />
          <el-table-column :label="$t('businessRules.dataMapping.column.action')" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row)">{{ $t('businessRules.dataMapping.action.edit') }}</el-button>
              <el-button type="danger" link @click="handleDelete(row)">{{ $t('businessRules.dataMapping.action.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="v-data-mapping__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filteredRules.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            background
          />
        </div>
      </el-card>
    </section>

    <el-dialog
      v-model="editDialogVisible"
      :title="$t('businessRules.dataMapping.dialog.editTitle')"
      width="920px"
      destroy-on-close
      class="v-data-mapping__edit-dialog"
      @close="handleEditDialogClose"
    >
      <div class="v-data-mapping__generator v-data-mapping__generator--dialog">
        <div class="v-data-mapping__generator-left">
          <el-form label-position="top" class="v-data-mapping__form v-data-mapping__form--compact">
            <AppFormItem :label="$t('businessRules.dataMapping.field.docType')">
              <el-select
                v-model="pickerDocType"
                filterable
                clearable
                :placeholder="PLACEHOLDER.SELECT"
                class="v-data-mapping__full-width"
              >
                <el-option
                  v-for="docType in ocrDocTypes"
                  :key="`edit-doc-${docType}`"
                  :label="docType"
                  :value="docType"
                />
              </el-select>
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.dataMapping.field.field')" required>
              <el-select
                v-model="pickerFieldKeys"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                :disabled="!pickerDocType"
                :placeholder="fieldSelectPlaceholder"
                class="v-data-mapping__full-width"
              >
                <el-option
                  v-for="option in fieldsForPickerDocType"
                  :key="`edit-${option.key}`"
                  :label="option.fieldLabel"
                  :value="option.key"
                />
              </el-select>
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.dataMapping.field.standardField')" required>
              <el-input
                v-model="draft.standardField"
                :placeholder="$t('businessRules.dataMapping.placeholder.standardFieldExample')"
              />
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.dataMapping.field.displayLabel')" required>
              <el-input v-model="draft.displayLabel" />
            </AppFormItem>
          </el-form>
        </div>
        <div class="v-data-mapping__generator-right">
          <el-form label-position="top" class="v-data-mapping__form v-data-mapping__form--compact">
            <AppFormItem :label="$t('businessRules.dataMapping.field.standardizationRule')" class="v-data-mapping__rule-item">
              <textarea
                ref="editRuleTextareaRef"
                v-model="draft.standardizationRule"
                class="v-data-mapping__rule-native"
                :maxlength="RULE_DESCRIPTION_MAX_LENGTH"
                :placeholder="$t('businessRules.dataMapping.placeholder.ruleExample')"
              />
            </AppFormItem>
            <el-button type="primary" :icon="MagicStick" @click="handleOptimizeRule">
              {{ $t('businessRules.dataMapping.action.optimizeRule') }}
            </el-button>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleEditDialogClose">{{ $t('businessRules.dataMapping.action.cancel') }}</el-button>
        <el-button type="primary" @click="handleEditSave">OK</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-data-mapping {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__section-title {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-primary);
  }

  &__table-card {
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  &__adder-card {
    border: 1px solid var(--border-color);
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 14px 16px 16px;
    }
  }

  &__generator-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: var(--rule-actions-gap, 8px);
    flex-shrink: 0;
  }

  &__rule-native {
    display: block;
    width: 100%;
    height: var(--rule-textarea-height);
    min-height: var(--rule-textarea-height);
    max-height: 320px;
    padding: 8px 12px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
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

  &__generator {
    --rule-field-label-height: 18px;
    --rule-field-label-gap: 4px;
    --rule-field-control-height: 32px;
    --rule-field-item-gap: 8px;
    --rule-left-field-count: 4;
    --rule-actions-gap: 8px;
    --rule-actions-height: 32px;
    --rule-actions-offset: calc(var(--rule-actions-gap) + var(--rule-actions-height));
    --rule-textarea-height: calc(
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
    width: 100%;
    max-width: 100%;

    &--dialog {
      --rule-left-field-count: 4;
      --rule-actions-offset: 0px;
      margin-top: 4px;
    }
  }

  &__generator-left,
  &__generator-right {
    min-width: 0;
  }

  &__generator-right {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__full-width {
    width: 100%;
  }

  &__rule-item {
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      width: 100%;
    }
  }

  &__form {
    &--compact {
      :deep(.el-form-item) {
        margin-bottom: 8px;
      }

      :deep(.el-form-item__label) {
        margin-bottom: 4px;
        padding-bottom: 0;
        line-height: 1.3;
        font-size: 14px;
      }
    }
  }

  &__generator-left &__form--compact {
    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }
  }

  &__list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__search {
    margin-bottom: 0;

    .v-list-search__body {
      flex-wrap: nowrap;
    }

    .v-data-mapping__search-input {
      width: var(--v-list-search-field-width);
      max-width: var(--v-list-search-field-width);
      flex-shrink: 0;
    }
  }

  &__code {
    padding: 2px 8px;
    border-radius: 4px;
    background: #f2f4f7;
    font-family: ui-monospace, monospace;
    font-size: 14px;
    color: var(--el-color-primary);
    width: fit-content;
  }

  &__source-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__source-tag {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f9fafb;
    border: 1px solid var(--border-color);
    font-size: 13px;
    line-height: 1.4;
    color: var(--text-primary);
  }

  &__rule-preview {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-primary);
  }

  &__na {
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
    color: var(--text-primary);
  }

  :deep(.el-table) {
    font-size: 14px;
  }
}
</style>

<style lang="scss">
.v-data-mapping__rule-tooltip {
  max-width: min(560px, 90vw);

  .el-popper__arrow {
    display: none;
  }

  .v-data-mapping__rule-tooltip-text {
    max-width: min(560px, 90vw);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
    font-size: 13px;
  }
}
</style>
