<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { dataMappingRules, formatMappingSources } from '@/mocks/dataMapping'
import { getFieldTemplatesForDocType } from '@/constants/exportFieldTemplates'
import { STANDARD_FIELD_BELONG_DOC_TYPE } from '@/mocks/verificationRuleConfig'
import { PLACEHOLDER } from '@/constants/placeholders'
import { RULE_DESCRIPTION_MAX_LENGTH } from '@/constants/ruleTextLimits'
import {
  insertTokenAtCursor,
  formatDocFieldToken,
  formatStandardFieldToken
} from '@/utils/verificationFormula'
import type { RuleParameterRef } from '@/utils/validateRuleBillReferences'
import VerificationStandardFieldToggle from './VerificationStandardFieldToggle.vue'

interface PickRow {
  id: string
  label: string
  code: string
  searchLabel: string
  mappingSummary?: string
}

const props = defineProps<{
  availableDocTypes: string[]
  description: string
  descriptionPlaceholder?: string
  controlsDisabled?: boolean
}>()

const parameterRefs = defineModel<RuleParameterRef[]>('parameterRefs', { default: () => [] })

const emit = defineEmits<{
  'update:description': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const useStandardField = ref(false)
const selectedDocType = ref('')
const pickerFieldIds = ref<string[]>([])

const isStandardFieldType = computed(() => useStandardField.value)

const docTypeOptions = computed(() => props.availableDocTypes)

const leftFieldCount = computed(() => {
  const docTypeCount = useStandardField.value ? 0 : 1
  return 1 + 1 + docTypeCount + 1
})

const fieldOptions = computed<PickRow[]>(() => {
  if (isStandardFieldType.value) {
    return dataMappingRules.value
      .map((rule) => ({
        id: rule.standardField,
        label: rule.displayLabel,
        code: rule.standardField,
        mappingSummary: formatMappingSources(rule.sources),
        searchLabel: `${rule.displayLabel} ${rule.standardField} ${formatMappingSources(rule.sources)}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
  }

  const mappingFields = dataMappingRules.value
    .flatMap((rule) => rule.sources)
    .filter((s) => s.docType === selectedDocType.value)
    .map((s) => ({
      id: s.fieldId,
      label: s.fieldLabel,
      code: s.fieldId,
      searchLabel: `${s.fieldLabel} ${s.fieldId}`
    }))

  const templateFields = getFieldTemplatesForDocType(selectedDocType.value).map((f) => ({
    id: f.id,
    label: f.label,
    code: f.id,
    searchLabel: `${f.label} ${f.id}`
  }))

  const merged = new Map<string, PickRow>()
  for (const field of [...mappingFields, ...templateFields]) {
    merged.set(field.id, field)
  }

  return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label, 'ja'))
})

function resolveDefaultDocType(docTypes: string[]) {
  return docTypes[0] ?? ''
}

function clearPickerFields() {
  pickerFieldIds.value = []
}

function handleDocTypeChange() {
  clearPickerFields()
}

watch(useStandardField, (enabled) => {
  if (enabled) {
    selectedDocType.value = STANDARD_FIELD_BELONG_DOC_TYPE
  } else {
    selectedDocType.value = resolveDefaultDocType(props.availableDocTypes)
  }
  clearPickerFields()
})

watch(
  () => props.availableDocTypes,
  (docTypes) => {
    if (useStandardField.value) return
    if (!docTypes.includes(selectedDocType.value)) {
      selectedDocType.value = resolveDefaultDocType(docTypes)
      clearPickerFields()
    }
  }
)

function appendParameterRef(row: PickRow) {
  const nextRef: RuleParameterRef = isStandardFieldType.value
    ? {
        docType: STANDARD_FIELD_BELONG_DOC_TYPE,
        isStandard: true,
        standardField: row.id,
        displayLabel: row.label
      }
    : {
        docType: selectedDocType.value,
        isStandard: false,
        fieldLabel: row.label
      }

  const refKey = nextRef.isStandard
    ? `std:${nextRef.standardField}`
    : `doc:${nextRef.docType}:${nextRef.fieldLabel}`

  if (
    !parameterRefs.value.some((ref) => {
      const key = ref.isStandard
        ? `std:${ref.standardField}`
        : `doc:${ref.docType}:${ref.fieldLabel}`
      return key === refKey
    })
  ) {
    parameterRefs.value = [...parameterRefs.value, nextRef]
  }
}

function handleInsertFields() {
  if (!pickerFieldIds.value.length || props.controlsDisabled) return

  let nextDescription = props.description
  const useCursor = pickerFieldIds.value.length === 1

  for (const fieldId of pickerFieldIds.value) {
    const row = fieldOptions.value.find((item) => item.id === fieldId)
    if (!row) continue

    const token = isStandardFieldType.value
      ? formatStandardFieldToken(row.label)
      : formatDocFieldToken(selectedDocType.value, row.label)

    nextDescription = insertTokenAtCursor(
      nextDescription,
      token,
      useCursor ? textareaRef.value : null
    )
    appendParameterRef(row)
  }

  emit('update:description', nextDescription)
  clearPickerFields()
}

function clearDescription() {
  emit('update:description', '')
  parameterRefs.value = []
  clearPickerFields()
}

defineExpose({ clearDescription })

selectedDocType.value = resolveDefaultDocType(props.availableDocTypes)
</script>

<template>
  <div class="v-rule-param-insert">
    <div
      class="v-rule-param-insert__generator"
      :style="{ '--rule-left-field-count': leftFieldCount }"
    >
      <div class="v-rule-param-insert__generator-left">
        <VerificationStandardFieldToggle v-model="useStandardField" />

        <slot name="left-header" />

        <el-form
          label-position="top"
          class="v-rule-param-insert__form v-rule-param-insert__form--compact"
          @submit.prevent
        >
          <AppFormItem
            v-if="!useStandardField"
            :label="$t('businessRules.verification.field.docType')"
          >
            <el-select
              v-model="selectedDocType"
              class="v-rule-param-insert__full-width"
              :disabled="controlsDisabled"
              @change="handleDocTypeChange"
            >
              <el-option
                v-for="docType in docTypeOptions"
                :key="docType"
                :label="docType"
                :value="docType"
              />
            </el-select>
          </AppFormItem>

          <AppFormItem :label="$t('businessRules.verification.field.field')">
            <div class="v-rule-param-insert__field-row">
              <el-select
                v-model="pickerFieldIds"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                :disabled="controlsDisabled || (!useStandardField && !selectedDocType)"
                :placeholder="PLACEHOLDER.SELECT_MULTIPLE"
                class="v-rule-param-insert__field-select"
              >
                <el-option
                  v-for="row in fieldOptions"
                  :key="row.id"
                  :label="isStandardFieldType ? row.label : row.searchLabel"
                  :value="row.id"
                >
                  <div class="v-rule-param-insert__option">
                    <span class="v-rule-param-insert__name">{{ row.label }}</span>
                    <code v-if="!isStandardFieldType" class="v-rule-param-insert__code">{{ row.code }}</code>
                  </div>
                </el-option>
              </el-select>
              <el-button
                :disabled="controlsDisabled || !pickerFieldIds.length"
                @click="handleInsertFields"
              >
                {{ $t('businessRules.verification.action.insert') }}
              </el-button>
            </div>
          </AppFormItem>
        </el-form>

        <slot name="left-footer" />
      </div>

      <div class="v-rule-param-insert__generator-right">
        <div v-if="$slots['right-header']" class="v-rule-param-insert__right-header">
          <slot name="right-header" />
        </div>

        <el-form
          label-position="top"
          class="v-rule-param-insert__form v-rule-param-insert__form--compact"
          @submit.prevent
        >
          <AppFormItem :label="$t('businessRules.verification.field.ruleDescription')" class="v-rule-param-insert__rule-item" required>
            <textarea
              ref="textareaRef"
              class="v-rule-param-insert__rule-native"
              :value="description"
              :maxlength="RULE_DESCRIPTION_MAX_LENGTH"
              :placeholder="descriptionPlaceholder ?? $t('businessRules.verification.placeholder.ruleDescriptionExample')"
              @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
            />
          </AppFormItem>
        </el-form>
        <slot name="right-footer" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-rule-param-insert {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);

  &__generator {
    --rule-field-label-height: 18px;
    --rule-field-label-gap: 4px;
    --rule-field-control-height: 32px;
    --rule-field-item-gap: 8px;
    --rule-left-field-count: 3;
    --rule-right-name-offset: 0px;
    --rule-actions-gap: 8px;
    --rule-actions-height: 32px;
    --rule-actions-offset: calc(var(--rule-actions-gap) + var(--rule-actions-height));
    --rule-textarea-height: calc(
      var(--rule-left-field-count) *
        (
          var(--rule-field-label-height) + var(--rule-field-label-gap) +
            var(--rule-field-control-height) + var(--rule-field-item-gap)
        ) - var(--rule-field-item-gap) - var(--rule-field-label-height) -
        var(--rule-field-label-gap) - var(--rule-actions-offset) -
        var(--rule-right-name-offset, 0px)
    );

    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: var(--app-page-gap);
    align-items: start;

    &:has(.v-rule-param-insert__right-header) {
      --rule-right-name-offset: calc(
        var(--rule-field-label-height) + var(--rule-field-label-gap) +
          var(--rule-field-control-height) + var(--rule-field-item-gap)
      );
    }
  }

  &__generator-left,
  &__generator-right {
    min-width: 0;
  }

  &__generator-left > :not(.v-rule-param-insert__form) {
    margin-bottom: var(--rule-field-item-gap, 8px);
  }

  &__generator-right {
    display: flex;
    flex-direction: column;
  }

  &__right-header {
    margin-bottom: var(--rule-field-item-gap, 8px);

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      margin-bottom: var(--rule-field-label-gap);
      padding-bottom: 0;
      line-height: 1.3;
      font-size: 14px;
    }
  }

  &__full-width {
    width: 100%;
  }

  &__field-row {
    display: flex;
    align-items: center;
    gap: 8px;
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
  }

  &__form {
    &--compact {
      :deep(.el-form-item) {
        margin-bottom: var(--rule-field-item-gap);
      }

      :deep(.el-form-item__label) {
        margin-bottom: var(--rule-field-label-gap);
        padding-bottom: 0;
        line-height: 1.3;
        font-size: 14px;
      }
    }
  }

  &__rule-item {
    margin-bottom: 0;
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
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 2px 0;
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
