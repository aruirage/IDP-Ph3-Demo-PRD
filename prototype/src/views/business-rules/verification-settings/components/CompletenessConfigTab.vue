<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  completenessSummary,
  type CompletenessDocRule,
  type DocRequirementLevel
} from '@/mocks/verificationRuleConfig'

const { t } = useI18n()

const props = defineProps<{
  enabled: boolean
  docs: CompletenessDocRule[]
}>()

const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:docs': [value: CompletenessDocRule[]]
}>()

const summary = computed(() => completenessSummary(props.docs))

function updateRequirement(docType: string, requirement: DocRequirementLevel) {
  emit(
    'update:docs',
    props.docs.map((d) => (d.docType === docType ? { ...d, requirement } : d))
  )
}

function handleSave() {
  ElMessage.success(t('businessRules.verification.message.saved'))
}
</script>

<template>
  <div class="v-ver-cfg-completeness">
    <section class="v-ver-cfg-completeness__block">
      <div class="v-ver-cfg-completeness__block-head">
        <div>
          <h3 class="v-ver-cfg-completeness__block-title">{{ $t('businessRules.verification.section.requiredDocs') }}</h3>
          <p class="v-ver-cfg-completeness__summary">
            {{ $t('businessRules.verification.count.docs', { count: docs.length }) }}　{{ summary }}
          </p>
        </div>
        <div class="v-ver-cfg-completeness__toggle">
          <span>{{ $t('businessRules.verification.completeness.enabled') }}</span>
          <el-switch :model-value="enabled" @update:model-value="emit('update:enabled', $event)" />
        </div>
      </div>

      <div class="v-ver-cfg-completeness__cards">
        <article
          v-for="doc in docs"
          :key="doc.docType"
          class="v-ver-cfg-completeness__card"
        >
          <span class="v-ver-cfg-completeness__card-label">{{ doc.docType }}</span>
          <el-radio-group
            :model-value="doc.requirement"
            size="small"
            @update:model-value="(v: DocRequirementLevel) => updateRequirement(doc.docType, v)"
          >
            <el-radio-button value="required">{{ $t('businessRules.verification.field.required') }}</el-radio-button>
            <el-radio-button value="optional">{{ $t('businessRules.verification.field.optional') }}</el-radio-button>
            <el-radio-button value="conditional">{{ $t('businessRules.verification.completeness.conditional') }}</el-radio-button>
          </el-radio-group>
        </article>
      </div>

      <div class="v-ver-cfg-completeness__actions">
        <el-button type="primary" @click="handleSave">{{ $t('businessRules.verification.action.save') }}</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-ver-cfg-completeness {
  &__block {
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
  }

  &__block-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    margin-bottom: var(--app-section-gap);
  }

  &__block-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__summary {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
  }

  &__card-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
}
</style>
