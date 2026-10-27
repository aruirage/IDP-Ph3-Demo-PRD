<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SealSignatureAtomicRule } from '@/mocks/verificationRuleConfig'
import { getOcrTextFieldNamesForDocType } from '@/mocks/docTypeSettings'
import { PLACEHOLDER } from '@/constants/placeholders'

export type SealRuleFormValue = Pick<
  SealSignatureAtomicRule,
  'targetDocType' | 'detectionTarget' | 'matchConsistency' | 'compareStandardField'
>

const props = defineProps<{
  modelValue: SealRuleFormValue
  availableDocTypes: string[]
  scopeConfigured?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SealRuleFormValue]
}>()

const { t } = useI18n()

const detectionOptions = computed(() => [
  { value: 'seal' as const, label: t('businessRules.verification.options.detectionSeal') },
  { value: 'signature' as const, label: t('businessRules.verification.options.detectionSignature') },
  { value: 'both' as const, label: t('businessRules.verification.options.detectionBoth') }
])

const compareFieldOptions = computed(() => {
  if (!props.modelValue.targetDocType) return []
  return getOcrTextFieldNamesForDocType(props.modelValue.targetDocType).map((itemName) => ({
    value: itemName,
    label: itemName
  }))
})

const docTypeDisabled = computed(() => !props.scopeConfigured)
const compareDisabled = computed(
  () => !props.scopeConfigured || !props.modelValue.targetDocType
)

function patchForm(patch: Partial<SealRuleFormValue>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function onCompareChange(value: string | null | undefined) {
  const field = value ?? null
  patchForm({
    compareStandardField: field,
    matchConsistency: Boolean(field)
  })
}

watch(
  () => props.modelValue.targetDocType,
  (docType) => {
    if (!docType) {
      if (props.modelValue.compareStandardField) {
        patchForm({ compareStandardField: null, matchConsistency: false })
      }
      return
    }
    const options = getOcrTextFieldNamesForDocType(docType)
    if (
      props.modelValue.compareStandardField &&
      !options.includes(props.modelValue.compareStandardField)
    ) {
      patchForm({ compareStandardField: null, matchConsistency: false })
    }
  }
)
</script>

<template>
  <div class="v-seal-rule-form">
    <div class="v-seal-rule-form__primary">
      <AppFormItem
        :label="$t('businessRules.verification.field.targetDoc')"
        label-position="top"
        class="v-seal-rule-form__item v-seal-rule-form__item--doc"
        required
      >
        <el-select
          :model-value="modelValue.targetDocType || undefined"
          :placeholder="PLACEHOLDER.SELECT"
          class="v-seal-rule-form__control"
          :disabled="docTypeDisabled"
          @update:model-value="patchForm({ targetDocType: ($event as string) ?? '' })"
        >
          <el-option
            v-for="docType in availableDocTypes"
            :key="docType"
            :label="docType"
            :value="docType"
          />
        </el-select>
      </AppFormItem>

      <AppFormItem
        :label="$t('businessRules.verification.field.detectionTarget')"
        label-position="top"
        class="v-seal-rule-form__item v-seal-rule-form__item--detect"
        required
      >
        <el-radio-group
          :model-value="modelValue.detectionTarget"
          class="v-seal-rule-form__detect-group"
          :disabled="docTypeDisabled"
          @update:model-value="
            patchForm({ detectionTarget: $event as SealRuleFormValue['detectionTarget'] })
          "
        >
          <el-radio-button v-for="opt in detectionOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </AppFormItem>
    </div>

    <AppFormItem
      :label="$t('businessRules.verification.field.compareTarget')"
      label-position="top"
      class="v-seal-rule-form__item v-seal-rule-form__item--compare"
    >
      <el-select
        :model-value="modelValue.compareStandardField"
        clearable
        :placeholder="PLACEHOLDER.SELECT"
        class="v-seal-rule-form__control"
        :disabled="compareDisabled"
        @update:model-value="onCompareChange($event as string | null | undefined)"
      >
        <el-option
          v-for="option in compareFieldOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </AppFormItem>
  </div>
</template>

<style scoped lang="scss">
.v-seal-rule-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px var(--app-page-gap);
  align-items: start;

  &__primary {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    min-width: 0;
  }

  &__item {
    margin-bottom: 0;
    min-width: 0;

    :deep(.el-form-item__label) {
      justify-content: flex-start;
      height: auto;
      line-height: 1.3;
      padding: 0 0 4px;
      font-size: 14px;
    }

    :deep(.el-form-item__content) {
      line-height: normal;
    }

    &--doc {
      flex: 1 1 0;
      min-width: 0;
    }

    &--detect {
      flex: 0 0 auto;
    }

    &--compare {
      min-width: 0;
    }
  }

  &__control {
    width: 100%;
  }

  &__detect-group {
    flex-wrap: nowrap;
  }
}
</style>
