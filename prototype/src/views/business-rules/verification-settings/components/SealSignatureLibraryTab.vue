<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDocTypesForRuleScope } from '@/constants/caseScenarios'
import AtomicRuleScopeEditor from './AtomicRuleScopeEditor.vue'
import SealRuleFormFields, { type SealRuleFormValue } from './SealRuleFormFields.vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { PLACEHOLDER } from '@/constants/placeholders'
import { isRuleNameWithinLimit, RULE_NAME_MAX_LENGTH } from '@/constants/ruleTextLimits'
import {
  isRuleScopeConfigured,
  validateRuleBillReferences
} from '@/utils/validateRuleBillReferences'
import {
  formatRuleScopeLabel,
  ruleAppliesToScene,
  type RuleScope,
  type SealSignatureAtomicRule
} from '@/mocks/verificationRuleConfig'
import VerificationRuleListHead from './VerificationRuleListHead.vue'

const { t } = useI18n()

const rules = defineModel<SealSignatureAtomicRule[]>('rules', { required: true })

const props = defineProps<{
  availableDocTypes: string[]
}>()

const sceneId = defineModel<string>('sceneId', { default: '' })

function resolveFormDocTypes(scope: RuleScope, sceneIds: string[]): string[] {
  return getDocTypesForRuleScope(scope, sceneIds)
}

const editorRef = ref<HTMLElement | null>(null)
const editingRuleId = ref<string | null>(null)
const isEditing = computed(() => editingRuleId.value !== null)

const addScopeConfigured = computed(() => isRuleScopeConfigured(draft.scope, draft.sceneIds))

const listKeyword = ref('')

const sceneFilteredRules = computed(() =>
  rules.value.filter(
    (rule) =>
      ruleAppliesToScene(rule, sceneId.value) &&
      (!rule.targetDocType || props.availableDocTypes.includes(rule.targetDocType))
  )
)

const visibleRules = computed(() => {
  const kw = listKeyword.value.trim().toLowerCase()
  if (!kw) return sceneFilteredRules.value
  return sceneFilteredRules.value.filter((rule) => {
    const scopeLabel = formatRuleScopeLabel(rule).toLowerCase()
    const detection =
      DETECTION_LABELS.value[rule.detectionTarget as SealSignatureAtomicRule['detectionTarget']] ?? ''
    return (
      rule.name.toLowerCase().includes(kw) ||
      rule.targetDocType.toLowerCase().includes(kw) ||
      detection.toLowerCase().includes(kw) ||
      formatCompareField(rule).toLowerCase().includes(kw) ||
      scopeLabel.includes(kw)
    )
  })
})

const DETECTION_LABELS = computed(() => ({
  seal: t('businessRules.verification.options.detectionSeal'),
  signature: t('businessRules.verification.options.detectionSignature'),
  both: t('businessRules.verification.options.detectionBoth')
}))

function defaultFormValue(): SealRuleFormValue {
  return {
    targetDocType: '',
    detectionTarget: 'signature',
    matchConsistency: false,
    compareStandardField: null
  }
}

const draft = reactive({
  name: '',
  ...defaultFormValue(),
  scope: 'all_scenes' as RuleScope,
  sceneIds: [] as string[]
})

const addFormDocTypes = computed(() => resolveFormDocTypes(draft.scope, draft.sceneIds))

watch(addFormDocTypes, (docTypes) => {
  if (draft.targetDocType && !docTypes.includes(draft.targetDocType)) {
    draft.targetDocType = ''
  }
})

function showBillReferenceError(
  error: ReturnType<typeof validateRuleBillReferences>
) {
  if (!error) return
  ElMessage.warning(t(error.messageKey, error.params))
}

function validateSealReferences(
  scope: RuleScope,
  sceneIds: string[],
  form: SealRuleFormValue
) {
  return validateRuleBillReferences({
    scope,
    sceneIds,
    docTypes: form.targetDocType ? [form.targetDocType] : [],
    standardFields: []
  })
}

function validateForm(name: string, form: SealRuleFormValue): boolean {
  if (!name.trim()) {
    ElMessage.warning(t('businessRules.verification.message.ruleNameRequired'))
    return false
  }
  if (!isRuleNameWithinLimit(name.trim())) {
    ElMessage.warning(t('businessRules.verification.message.ruleNameMaxLength', { max: RULE_NAME_MAX_LENGTH }))
    return false
  }
  if (!form.targetDocType) {
    ElMessage.warning(t('businessRules.verification.message.selectTargetDoc'))
    return false
  }
  return true
}

function formatCompareField(rule: SealSignatureAtomicRule) {
  if (!rule.matchConsistency) {
    return t('businessRules.verification.options.presenceOnly')
  }
  if (!rule.compareStandardField) return t('businessRules.verification.options.notSet')
  return rule.compareStandardField
}

function clearDraftFieldSelections() {
  const { name, scope, sceneIds } = draft
  Object.assign(draft, defaultFormValue(), { name, scope, sceneIds })
}

function resetDraft() {
  editingRuleId.value = null
  Object.assign(draft, defaultFormValue(), { name: '', scope: 'all_scenes', sceneIds: [] })
}

async function loadRuleForEdit(rule: SealSignatureAtomicRule) {
  editingRuleId.value = rule.id
  draft.name = rule.name
  draft.targetDocType = rule.targetDocType
  draft.detectionTarget = rule.detectionTarget
  draft.matchConsistency = rule.matchConsistency
  draft.compareStandardField = rule.compareStandardField
  draft.scope = rule.scope
  draft.sceneIds = [...rule.sceneIds]
  await nextTick()
  editorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleSubmit() {
  if (!validateForm(draft.name, draft)) return

  const validationError = validateSealReferences(draft.scope, draft.sceneIds, draft)
  if (validationError) {
    showBillReferenceError(validationError)
    return
  }

  if (isEditing.value) {
    rules.value = rules.value.map((rule) =>
      rule.id === editingRuleId.value
        ? {
            ...rule,
            name: draft.name.trim(),
            targetDocType: draft.targetDocType,
            detectionTarget: draft.detectionTarget,
            matchConsistency: draft.matchConsistency,
            compareStandardField: draft.matchConsistency ? draft.compareStandardField : null,
            scope: draft.scope,
            sceneIds: draft.scope === 'selected_scenes' ? [...draft.sceneIds] : []
          }
        : rule
    )
    ElMessage.success(t('businessRules.verification.message.updated'))
    resetDraft()
    return
  }

  const payload: SealSignatureAtomicRule = {
    id: `atom-seal-${Date.now()}`,
    name: draft.name.trim(),
    targetDocType: draft.targetDocType,
    detectionTarget: draft.detectionTarget,
    matchConsistency: draft.matchConsistency,
    compareStandardField: draft.matchConsistency ? draft.compareStandardField : null,
    enabled: true,
    scope: draft.scope,
    sceneIds: draft.scope === 'selected_scenes' ? [...draft.sceneIds] : []
  }

  rules.value = [...rules.value, payload]
  ElMessage.success(t('businessRules.verification.message.added'))
  resetDraft()
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('businessRules.verification.message.deleteConfirm'), t('businessRules.verification.message.deleteTitle'), {
      type: 'warning',
      ...MESSAGE_BOX_CONFIRM_DEFAULTS
    })
    rules.value = rules.value.filter((r) => r.id !== id)
    if (editingRuleId.value === id) resetDraft()
    ElMessage.success(t('businessRules.verification.message.deleted'))
  } catch {
    // cancelled
  }
}

function toggleEnabled(rule: SealSignatureAtomicRule, enabled: boolean) {
  rules.value = rules.value.map((r) => (r.id === rule.id ? { ...r, enabled } : r))
}
</script>

<template>
  <div class="v-ver-cfg-seal-lib">
    <section ref="editorRef" class="v-ver-cfg-seal-lib__editor">
      <div class="v-ver-cfg-seal-lib__editor-head">
        <h3 class="v-ver-cfg-seal-lib__editor-title">{{ $t('businessRules.verification.section.ruleAdd') }}</h3>
        <span class="v-ver-cfg-seal-lib__count">{{ $t('businessRules.verification.count.rules', { count: visibleRules.length }) }}</span>
      </div>

      <el-form label-position="top" class="v-ver-cfg-seal-lib__form" @submit.prevent>
        <div class="v-ver-cfg-seal-lib__form-grid">
          <AppFormItem :label="$t('businessRules.verification.scope.label')" class="v-ver-cfg-seal-lib__field v-ver-cfg-seal-lib__field--scope" required>
            <AtomicRuleScopeEditor
              v-model:scope="draft.scope"
              v-model:scene-ids="draft.sceneIds"
              embedded
              @scope-change="clearDraftFieldSelections"
            />
          </AppFormItem>

          <AppFormItem :label="$t('businessRules.verification.field.ruleName')" class="v-ver-cfg-seal-lib__field v-ver-cfg-seal-lib__field--name" required>
            <el-input
              v-model="draft.name"
              :maxlength="RULE_NAME_MAX_LENGTH"
              show-word-limit
              :placeholder="PLACEHOLDER.INPUT"
            />
          </AppFormItem>

          <SealRuleFormFields
            class="v-ver-cfg-seal-lib__field v-ver-cfg-seal-lib__field--params"
            :model-value="draft"
            :available-doc-types="addFormDocTypes"
            :scope-configured="addScopeConfigured"
            @update:model-value="Object.assign(draft, $event)"
          />
        </div>

        <div class="v-ver-cfg-seal-lib__actions">
          <el-button @click="resetDraft">{{ $t('businessRules.verification.action.clear') }}</el-button>
          <el-button type="primary" :disabled="!addScopeConfigured" @click="handleSubmit">
            {{
              isEditing
                ? $t('businessRules.verification.action.saveUpdate')
                : $t('businessRules.verification.action.add')
            }}
          </el-button>
        </div>
      </el-form>
    </section>

    <section class="v-ver-cfg-seal-lib__list">
      <VerificationRuleListHead
        v-model:scene-id="sceneId"
        v-model:keyword="listKeyword"
        :title="$t('businessRules.verification.section.ruleList')"
        :search-subject="$t('businessRules.verification.placeholder.searchSealRule')"
      />

      <el-table v-if="visibleRules.length" :data="visibleRules" border class="v-ver-cfg-seal-lib__table">
        <el-table-column :label="$t('businessRules.verification.column.no')" width="64" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.field.ruleName')" min-width="160" show-overflow-tooltip prop="name" />
        <el-table-column :label="$t('businessRules.verification.field.targetDoc')" min-width="160" show-overflow-tooltip prop="targetDocType" />
        <el-table-column :label="$t('businessRules.verification.field.detectionTarget')" width="96" align="center">
          <template #default="{ row }">
            {{ DETECTION_LABELS[row.detectionTarget as SealSignatureAtomicRule['detectionTarget']] }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.field.compareTarget')" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatCompareField(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.applySceneShort')" min-width="140">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ formatRuleScopeLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.status')" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              size="small"
              @update:model-value="toggleEnabled(row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.column.action')" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="loadRuleForEdit(row)">{{ $t('businessRules.verification.action.edit') }}</el-button>
            <el-button link type="danger" @click="handleDelete(row.id)">{{ $t('businessRules.verification.action.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-else
        :description="$t('businessRules.verification.message.emptyRules')"
        :image-size="72"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-ver-cfg-seal-lib {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__editor {
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

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
  }

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px var(--app-page-gap);
    align-items: start;
  }

  &__field {
    min-width: 0;

    &--scope,
    &--name {
      min-width: 0;
    }

    &--params {
      grid-column: 1 / -1;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
  }

  &__editor-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
  }

  &__editor-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__count {
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__table {
    width: 100%;
  }
}
</style>
