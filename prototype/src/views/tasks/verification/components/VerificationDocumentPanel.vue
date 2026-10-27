<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  detectionTargetLabel,
  displayStatusLabel,
  displayStatusTagType,
  needsHumanReview,
  type HumanVerdict,
  type VerificationDocument,
  type VerificationRule
} from '@/mocks/verificationTask'

const props = defineProps<{
  document: VerificationDocument
  rules: VerificationRule[]
  selectedFieldId: string | null
  selectedRuleId: string | null
}>()

const { t } = useI18n()

const emit = defineEmits<{
  selectField: [fieldId: string]
  selectRule: [ruleId: string]
  updateVerdict: [ruleId: string, verdict: HumanVerdict]
  updateComment: [ruleId: string, comment: string]
}>()

const fieldsBySection = computed(() => {
  const map = new Map<string, typeof props.document.fields>()
  for (const field of props.document.fields) {
    const list = map.get(field.section) ?? []
    list.push(field)
    map.set(field.section, list)
  }
  return [...map.entries()]
})

function relatedRules(fieldId: string) {
  return props.rules.filter((r) => r.targetFieldId === fieldId)
}

function docVerifyTitle(rule: VerificationRule): string {
  if (rule.detectionTarget) {
    return t('tasks.verification.summary.docVerifyNamed', {
      label: detectionTargetLabel(rule.detectionTarget)
    })
  }
  return t('tasks.verification.summary.docVerifyShort')
}
</script>

<template>
  <div class="v-ver-doc-panel">
    <div class="v-ver-doc-panel__header">
      <div>
        <h2 class="v-ver-doc-panel__title">{{ document.docType }}</h2>
        <p class="v-ver-doc-panel__file">{{ document.fileName }}</p>
      </div>
      <span class="v-ver-doc-panel__count">{{ $t('tasks.common.countFields', { count: document.fields.length }) }}</span>
    </div>

    <div class="v-ver-doc-panel__body">
      <section
        v-for="[section, fields] in fieldsBySection"
        :key="section"
        class="v-ver-doc-panel__section"
      >
        <h3 class="v-ver-doc-panel__section-title">{{ section }}</h3>

        <article
          v-for="field in fields"
          :key="field.id"
          class="v-ver-doc-panel__field"
          :class="{ 'is-selected': selectedFieldId === field.id }"
          @click="emit('selectField', field.id)"
        >
          <div class="v-ver-doc-panel__field-head">
            <span class="v-ver-doc-panel__field-label">{{ field.label }}</span>
            <span class="v-ver-doc-panel__confidence">{{ field.confidence }}%</span>
          </div>
          <p class="v-ver-doc-panel__field-value">{{ field.value || $t('tasks.common.notExtracted') }}</p>

          <div v-if="relatedRules(field.id).length" class="v-ver-doc-panel__rules">
            <button
              v-for="rule in relatedRules(field.id)"
              :key="rule.id"
              type="button"
              class="v-ver-doc-panel__rule-chip"
              :class="{ 'is-selected': selectedRuleId === rule.id }"
              @click.stop="emit('selectRule', rule.id)"
            >
              <el-tag
                :type="displayStatusTagType(rule.aiVerdict, rule.humanVerdict)"
                size="small"
                effect="plain"
              >
                {{ displayStatusLabel(rule.aiVerdict, rule.humanVerdict) }}
              </el-tag>
              <span>{{ rule.targetFieldLabel ?? rule.ruleDescription.slice(0, 24) }}</span>
            </button>
          </div>
        </article>
      </section>

      <section v-if="rules.some((r) => !r.targetFieldId)" class="v-ver-doc-panel__section">
        <h3 class="v-ver-doc-panel__section-title">{{ $t('tasks.verification.summary.docVerify') }}</h3>
        <article
          v-for="rule in rules.filter((r) => !r.targetFieldId)"
          :key="rule.id"
          class="v-ver-doc-panel__rule-card"
          :class="{ 'is-selected': selectedRuleId === rule.id }"
          @click="emit('selectRule', rule.id)"
        >
          <div class="v-ver-doc-panel__rule-head">
            <span>{{ docVerifyTitle(rule) }}</span>
            <el-tag
              :type="displayStatusTagType(rule.aiVerdict, rule.humanVerdict)"
              size="small"
              effect="plain"
            >
              {{ displayStatusLabel(rule.aiVerdict, rule.humanVerdict) }}
            </el-tag>
          </div>
          <p class="v-ver-doc-panel__rule-desc">{{ rule.aiResult }}</p>
          <div
            v-if="needsHumanReview(rule)"
            class="v-ver-doc-panel__human"
            @click.stop
          >
            <el-radio-group
              :model-value="rule.humanVerdict"
              size="small"
              @update:model-value="(v: HumanVerdict) => emit('updateVerdict', rule.id, v)"
            >
              <el-radio-button value="OK">OK</el-radio-button>
              <el-radio-button value="NG">NG</el-radio-button>
            </el-radio-group>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-doc-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__file {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__count {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 13px;
    color: var(--text-secondary);
    background: #f9fafb;
    border: 1px solid var(--border-color);
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 12px;
  }

  &__section:not(:last-child) {
    margin-bottom: var(--app-section-gap);
  }

  &__section-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  &__field {
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color var(--transition-time-02);

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__field-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__field-label {
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__confidence {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__field-value {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    word-break: break-all;
  }

  &__rules {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  &__rule-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: #f9fafb;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: inherit;

    &.is-selected {
      border-color: var(--el-color-primary);
      background: #fff;
    }
  }

  &__rule-card {
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  &__rule-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    margin-bottom: 4px;
  }

  &__rule-desc {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  &__human {
    margin-top: 8px;
    display: grid;
    gap: 8px;
  }

  &__confirmed {
    display: inline-block;
    margin-top: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-color-success);
  }
}
</style>
