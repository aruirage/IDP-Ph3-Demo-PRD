<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '@/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { getDocTypesForRuleScope } from '@/constants/caseScenarios'
import RuleParameterInsertPanel from './RuleParameterInsertPanel.vue'
import AtomicRuleScopeEditor from './AtomicRuleScopeEditor.vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { DATA_RULE_DESCRIPTION_PLACEHOLDER } from '@/constants/dataVerificationPlaceholders'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  isRuleScopeConfigured,
  parseParameterRefsFromDescription,
  refsToValidationInput,
  validateRuleBillReferences,
  type RuleParameterRef
} from '@/utils/validateRuleBillReferences'
import {
  isRuleDescriptionWithinLimit,
  isRuleNameWithinLimit,
  RULE_DESCRIPTION_MAX_LENGTH,
  RULE_NAME_MAX_LENGTH
} from '@/constants/ruleTextLimits'
import { buildOptimizedDataRuleFormula } from '@/utils/verificationFormula'
import {
  formatRuleScopeLabel,
  ruleAppliesToScene,
  type NaturalLanguageAtomicRule,
  type RuleScope
} from '@/mocks/verificationRuleConfig'
import VerificationRuleListHead from './VerificationRuleListHead.vue'

const { t, locale } = useI18n()

const rules = defineModel<NaturalLanguageAtomicRule[]>('rules', { required: true })

const props = defineProps<{
  kind: 'text' | 'data'
}>()

const sceneId = defineModel<string>('sceneId', { default: '' })

const kindLabel = computed(() =>
  props.kind === 'text'
    ? t('businessRules.verification.kind.text')
    : t('businessRules.verification.kind.data')
)

const ruleDescriptionPlaceholder = computed(() => {
  if (props.kind !== 'data') {
    return t('businessRules.verification.placeholder.ruleDescriptionExample')
  }
  return (
    DATA_RULE_DESCRIPTION_PLACEHOLDER[locale.value as AppLocale] ??
    DATA_RULE_DESCRIPTION_PLACEHOLDER.ja
  )
})

function resolveFormDocTypes(scope: RuleScope, sceneIds: string[]): string[] {
  return getDocTypesForRuleScope(scope, sceneIds)
}

const editorRef = ref<HTMLElement | null>(null)
const editingRuleId = ref<string | null>(null)
const isEditing = computed(() => editingRuleId.value !== null)

const addScopeConfigured = computed(() => isRuleScopeConfigured(draft.scope, draft.sceneIds))
const addFormDocTypes = computed(() => resolveFormDocTypes(draft.scope, draft.sceneIds))

const listKeyword = ref('')

const sceneFilteredRules = computed(() =>
  rules.value.filter((rule) => ruleAppliesToScene(rule, sceneId.value))
)

const visibleRules = computed(() => {
  const kw = listKeyword.value.trim().toLowerCase()
  if (!kw) return sceneFilteredRules.value
  return sceneFilteredRules.value.filter((rule) => {
    const scopeLabel = formatRuleScopeLabel(rule).toLowerCase()
    return (
      rule.name.toLowerCase().includes(kw) ||
      rule.description.toLowerCase().includes(kw) ||
      scopeLabel.includes(kw)
    )
  })
})

const draft = reactive({
  name: '',
  description: '',
  scope: 'all_scenes' as RuleScope,
  sceneIds: [] as string[]
})

const draftParameterRefs = ref<RuleParameterRef[]>([])

function clearDraftFieldSelections() {
  draft.description = ''
  draftParameterRefs.value = []
}

function resetDraft() {
  editingRuleId.value = null
  draft.name = ''
  clearDraftFieldSelections()
  draft.scope = 'all_scenes'
  draft.sceneIds = []
}

function showBillReferenceError(
  error: ReturnType<typeof validateRuleBillReferences>
) {
  if (!error) return
  ElMessage.warning(t(error.messageKey, error.params))
}

function validateParameterRefs(scope: RuleScope, sceneIds: string[], refs: RuleParameterRef[]) {
  const { docTypes, standardFields } = refsToValidationInput(refs)
  return validateRuleBillReferences({
    scope,
    sceneIds,
    docTypes,
    standardFields
  })
}

async function loadRuleForEdit(rule: NaturalLanguageAtomicRule) {
  editingRuleId.value = rule.id
  draft.name = rule.name
  draft.description = rule.description
  draft.scope = rule.scope
  draft.sceneIds = [...rule.sceneIds]
  draftParameterRefs.value = parseParameterRefsFromDescription(rule.description)
  await nextTick()
  editorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

function buildOptimizedRuleText(raw: string): string {
  const compact = raw.replace(/\s+/g, ' ').replace(/。+/g, '。').trim()
  return [
    '1. 検証対象',
    `   - ${compact}`,
    '2. 判定基準',
    '   - 上記条件を満たさない場合は要確認とする。',
    '3. 例外',
    '   - 参照フィールドが本案に存在しない場合は該当規則をスキップする。'
  ].join('\n')
}

function handleOptimizeRule() {
  const raw = draft.description.trim()
  if (!raw) {
    ElMessage.warning(t('businessRules.verification.message.ruleDescriptionRequired'))
    return
  }
  if (props.kind === 'data') {
    draft.description = buildOptimizedDataRuleFormula(raw).slice(0, RULE_DESCRIPTION_MAX_LENGTH)
    draftParameterRefs.value = parseParameterRefsFromDescription(draft.description)
    ElMessage.success(t('businessRules.verification.message.ruleOptimized'))
    return
  }
  draft.description = buildOptimizedRuleText(raw).slice(0, RULE_DESCRIPTION_MAX_LENGTH)
  ElMessage.success(t('businessRules.verification.message.ruleOptimized'))
}

function validateRuleInput(name: string, text: string) {
  if (!name.trim()) {
    ElMessage.warning(t('businessRules.verification.message.ruleNameRequired'))
    return false
  }
  if (!isRuleNameWithinLimit(name.trim())) {
    ElMessage.warning(t('businessRules.verification.message.ruleNameMaxLength', { max: RULE_NAME_MAX_LENGTH }))
    return false
  }
  if (!text.trim()) {
    ElMessage.warning(t('businessRules.verification.message.ruleDescriptionRequired'))
    return false
  }
  if (!isRuleDescriptionWithinLimit(text)) {
    ElMessage.warning(t('businessRules.verification.message.ruleDescriptionMaxLength', { max: RULE_DESCRIPTION_MAX_LENGTH }))
    return false
  }
  return true
}

function handleSubmit() {
  const name = draft.name.trim()
  const text = draft.description.trim()
  if (!validateRuleInput(name, text)) return

  const validationError = validateParameterRefs(
    draft.scope,
    draft.sceneIds,
    draftParameterRefs.value
  )
  if (validationError) {
    showBillReferenceError(validationError)
    return
  }

  if (isEditing.value) {
    rules.value = rules.value.map((rule) =>
      rule.id === editingRuleId.value
        ? {
            ...rule,
            name,
            description: text,
            scope: draft.scope,
            sceneIds: draft.scope === 'selected_scenes' ? [...draft.sceneIds] : []
          }
        : rule
    )
    ElMessage.success(t('businessRules.verification.message.updated'))
    resetDraft()
    return
  }

  const payload: NaturalLanguageAtomicRule = {
    id: `atom-${props.kind}-${Date.now()}`,
    kind: props.kind,
    name,
    description: text,
    enabled: true,
    scope: draft.scope,
    sceneIds: draft.scope === 'selected_scenes' ? [...draft.sceneIds] : []
  }

  rules.value = [...rules.value, payload]
  ElMessage.success(t('businessRules.verification.message.added'))
  resetDraft()
}

function toggleEnabled(rule: NaturalLanguageAtomicRule, enabled: boolean) {
  rules.value = rules.value.map((r) => (r.id === rule.id ? { ...r, enabled } : r))
}
</script>

<template>
  <div class="v-ver-cfg-nl">
    <section ref="editorRef" class="v-ver-cfg-nl__editor">
      <div class="v-ver-cfg-nl__editor-head">
        <h3 class="v-ver-cfg-nl__editor-title">{{ $t('businessRules.verification.section.ruleAdd') }}</h3>
        <span class="v-ver-cfg-nl__count">{{ $t('businessRules.verification.count.rules', { count: visibleRules.length }) }}</span>
      </div>

      <RuleParameterInsertPanel
        v-model:parameter-refs="draftParameterRefs"
        :available-doc-types="addFormDocTypes"
        :description="draft.description"
        :description-placeholder="ruleDescriptionPlaceholder"
        :controls-disabled="!addScopeConfigured"
        @update:description="draft.description = $event"
      >
        <template #left-header>
          <el-form
            label-position="top"
            class="v-ver-cfg-nl__scope-form v-ver-cfg-nl__scope-form--compact"
            @submit.prevent
          >
            <AppFormItem :label="$t('businessRules.verification.scope.label')" class="v-ver-cfg-nl__scope-item" required>
              <AtomicRuleScopeEditor
                v-model:scope="draft.scope"
                v-model:scene-ids="draft.sceneIds"
                embedded
                @scope-change="clearDraftFieldSelections"
              />
            </AppFormItem>
          </el-form>
        </template>
        <template #right-header>
          <el-form
            label-position="top"
            class="v-ver-cfg-nl__scope-form v-ver-cfg-nl__scope-form--compact"
            @submit.prevent
          >
            <AppFormItem :label="$t('businessRules.verification.field.ruleName')" class="v-ver-cfg-nl__scope-item" required>
              <el-input
                v-model="draft.name"
                :maxlength="RULE_NAME_MAX_LENGTH"
                show-word-limit
                :placeholder="PLACEHOLDER.INPUT"
              />
            </AppFormItem>
          </el-form>
        </template>
        <template #right-footer>
          <div class="v-ver-cfg-nl__generator-actions">
            <el-button @click="resetDraft">{{ $t('businessRules.verification.action.clear') }}</el-button>
            <el-button type="primary" :icon="MagicStick" @click="handleOptimizeRule">
              {{ $t('businessRules.verification.action.optimizeRule') }}
            </el-button>
            <el-button type="primary" :disabled="!addScopeConfigured" @click="handleSubmit">
              {{
                isEditing
                  ? $t('businessRules.verification.action.saveUpdate')
                  : $t('businessRules.verification.action.add')
              }}
            </el-button>
          </div>
        </template>
      </RuleParameterInsertPanel>
    </section>

    <section class="v-ver-cfg-nl__list">
      <VerificationRuleListHead
        v-model:scene-id="sceneId"
        v-model:keyword="listKeyword"
        :title="$t('businessRules.verification.section.ruleList')"
        :search-subject="$t('businessRules.verification.placeholder.searchRuleList')"
      />

      <el-table v-if="visibleRules.length" :data="visibleRules" border class="v-ver-cfg-nl__table">
        <el-table-column :label="$t('businessRules.verification.column.no')" width="64" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.field.ruleName')" min-width="160" show-overflow-tooltip prop="name" />
        <el-table-column :label="$t('businessRules.verification.field.ruleType')" width="120" prop="kind">
          <template #default>
            {{ kindLabel }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('businessRules.verification.field.ruleDescription')" min-width="280" show-overflow-tooltip prop="description" />
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
.v-ver-cfg-nl {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__table {
    width: 100%;
  }

  &__editor {
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
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

  &__generator-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: var(--rule-actions-gap, 8px);
    flex-shrink: 0;
  }

  &__scope-form {
    margin-bottom: var(--rule-field-item-gap, 8px);

    &--compact {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }

      :deep(.el-form-item__label) {
        margin-bottom: 4px;
        padding-bottom: 0;
        line-height: 1.3;
        font-size: 14px;
      }
    }
  }

  &__scope-item {
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      line-height: normal;
    }
  }
}
</style>
