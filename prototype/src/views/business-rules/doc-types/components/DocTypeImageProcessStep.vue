<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InfoFilled } from '@element-plus/icons-vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  imageSortFieldTypeOptions,
  imageSortOrderOptions,
  type DocTypeDefinition
} from '@/mocks/docTypeSettings'
import DocTypeSamplePreview from './DocTypeSamplePreview.vue'

const docType = defineModel<DocTypeDefinition>({ required: true })
const { t } = useI18n()

const imageProcess = computed({
  get: () => docType.value.imageProcess,
  set: (value) => {
    docType.value.imageProcess = value
  }
})

const sortFieldTypeOptionList = computed(() => imageSortFieldTypeOptions())
const sortOrderOptionList = computed(() => imageSortOrderOptions())

const textFieldOptions = computed(() =>
  docType.value.ocrRead.textFields
    .filter((field) => field.itemName.trim())
    .map((field) => ({
      value: field.id,
      label: field.itemName
    }))
)

const combineFieldsDisabled = computed(
  () => !imageProcess.value.imageCombineEnabled || textFieldOptions.value.length === 0
)

const requiredFieldOptions = computed(() => {
  const optionalIds = new Set(imageProcess.value.splitCombineOptionalFieldIds)
  return textFieldOptions.value.filter((option) => !optionalIds.has(option.value))
})

const optionalFieldOptions = computed(() => {
  const requiredIds = new Set(imageProcess.value.splitCombineRequiredFieldIds)
  return textFieldOptions.value.filter((option) => !requiredIds.has(option.value))
})

const splitCombineEmptyPlaceholder = computed(() =>
  textFieldOptions.value.length === 0
    ? t('businessRules.docType.image.splitCombineFieldsEmpty')
    : PLACEHOLDER.SELECT
)

const combineSectionHint = computed(() => t('businessRules.docType.image.combineSectionHint'))

function updateRequiredFieldIds(ids: string[]) {
  imageProcess.value.splitCombineRequiredFieldIds = ids
  imageProcess.value.splitCombineOptionalFieldIds =
    imageProcess.value.splitCombineOptionalFieldIds.filter((id) => !ids.includes(id))
}

function updateOptionalFieldIds(ids: string[]) {
  imageProcess.value.splitCombineOptionalFieldIds = ids
  imageProcess.value.splitCombineRequiredFieldIds =
    imageProcess.value.splitCombineRequiredFieldIds.filter((id) => !ids.includes(id))
}

watch(
  () => docType.value.ocrRead.textFields,
  () => {
    const validIds = new Set(textFieldOptions.value.map((option) => option.value))
    imageProcess.value.splitCombineRequiredFieldIds =
      imageProcess.value.splitCombineRequiredFieldIds.filter((id) => validIds.has(id))
    imageProcess.value.splitCombineOptionalFieldIds =
      imageProcess.value.splitCombineOptionalFieldIds.filter((id) => validIds.has(id))
  },
  { deep: true }
)

const sortFieldOptions = textFieldOptions

const sortFieldDisabled = computed(
  () => !imageProcess.value.imageSortEnabled || sortFieldOptions.value.length === 0
)
</script>

<template>
  <div class="v-doc-type-image v-doc-type-workspace v-doc-type-workspace--2-3">
    <DocTypeSamplePreview :image-url="docType.sampleImageUrl" />

    <div class="v-doc-type-image__panel">
      <div class="v-doc-type-image__scroll">
        <section class="v-doc-type-image__section">
          <h3 class="v-doc-type-image__section-title">{{ $t('businessRules.docType.image.splitSection') }}</h3>
          <el-form label-width="168px" class="v-doc-type-image__form">
            <AppFormItem :label="$t('businessRules.docType.image.splitTarget')">
              <el-switch v-model="imageProcess.imageSplitEnabled" />
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.splitThreshold')">
              <div class="v-doc-type-image__threshold">
                <el-input-number
                  v-model="imageProcess.splitConfidenceThreshold"
                  :min="0"
                  :max="100"
                  :step="1"
                  controls-position="right"
                  :disabled="!imageProcess.imageSplitEnabled"
                />
                <span class="v-doc-type-image__threshold-unit">%</span>
              </div>
            </AppFormItem>
          </el-form>
        </section>

        <section class="v-doc-type-image__section">
          <div class="v-doc-type-image__section-head">
            <h3 class="v-doc-type-image__section-title">{{ $t('businessRules.docType.image.combineSection') }}</h3>
            <el-tooltip
              placement="top"
              effect="dark"
              :show-after="200"
              popper-class="v-doc-type-image__hint-tooltip"
            >
              <template #content>
                <div class="v-doc-type-image__hint-tooltip-text">{{ combineSectionHint }}</div>
              </template>
              <button
                type="button"
                class="v-doc-type-image__info-btn"
                :aria-label="$t('businessRules.docType.image.combineSectionHintAria')"
              >
                <el-icon :size="14"><InfoFilled /></el-icon>
              </button>
            </el-tooltip>
          </div>
          <el-form label-width="168px" class="v-doc-type-image__form">
            <AppFormItem :label="$t('businessRules.docType.image.combineTarget')">
              <el-switch v-model="imageProcess.imageCombineEnabled" />
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.splitCombineRequiredFields')">
              <el-select
                :model-value="imageProcess.splitCombineRequiredFieldIds"
                multiple
                clearable
                filterable
                :disabled="combineFieldsDisabled"
                :placeholder="splitCombineEmptyPlaceholder"
                class="v-doc-type-image__select"
                @update:model-value="updateRequiredFieldIds"
              >
                <el-option
                  v-for="option in requiredFieldOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.splitCombineOptionalFields')">
              <el-select
                :model-value="imageProcess.splitCombineOptionalFieldIds"
                multiple
                clearable
                filterable
                :disabled="combineFieldsDisabled"
                :placeholder="splitCombineEmptyPlaceholder"
                class="v-doc-type-image__select"
                @update:model-value="updateOptionalFieldIds"
              >
                <el-option
                  v-for="option in optionalFieldOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </AppFormItem>
          </el-form>
        </section>

        <section class="v-doc-type-image__section">
          <h3 class="v-doc-type-image__section-title">{{ $t('businessRules.docType.image.sortSection') }}</h3>
          <el-form label-width="168px" class="v-doc-type-image__form">
            <AppFormItem :label="$t('businessRules.docType.image.sortEnable')">
              <el-switch v-model="imageProcess.imageSortEnabled" />
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.sortKey')">
              <el-select
                v-model="imageProcess.sortFieldId"
                clearable
                filterable
                :disabled="sortFieldDisabled"
                :placeholder="PLACEHOLDER.SELECT"
                class="v-doc-type-image__select"
              >
                <el-option
                  v-for="option in sortFieldOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.sortKeyType')">
              <el-radio-group
                v-model="imageProcess.sortFieldType"
                :disabled="!imageProcess.imageSortEnabled"
              >
                <el-radio
                  v-for="option in sortFieldTypeOptionList"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio>
              </el-radio-group>
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.sortDirection')">
              <el-radio-group
                v-model="imageProcess.sortOrder"
                :disabled="!imageProcess.imageSortEnabled"
              >
                <el-radio
                  v-for="option in sortOrderOptionList"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio>
              </el-radio-group>
            </AppFormItem>
            <AppFormItem :label="$t('businessRules.docType.image.sortThreshold')">
              <div class="v-doc-type-image__threshold">
                <el-input-number
                  v-model="imageProcess.sortConfidenceThreshold"
                  :min="0"
                  :max="100"
                  :step="1"
                  controls-position="right"
                  :disabled="!imageProcess.imageSortEnabled"
                />
                <span class="v-doc-type-image__threshold-unit">%</span>
              </div>
            </AppFormItem>
          </el-form>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-image {
  &__panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  &__scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  &__section-head {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__section-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-secondary);
    }
  }

  &__select {
    width: 100%;
    max-width: 320px;
  }

  &__threshold {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    :deep(.el-input-number) {
      width: 120px;
    }
  }

  &__threshold-unit {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__label-row {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__info-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-tertiary);
    cursor: help;

    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>

<style lang="scss">
.v-doc-type-image__hint-tooltip {
  max-width: min(420px, 90vw);

  .v-doc-type-image__hint-tooltip-text {
    max-width: min(420px, 90vw);
    white-space: pre-line;
    word-break: break-word;
    line-height: 1.6;
    font-size: 13px;
  }
}
</style>
