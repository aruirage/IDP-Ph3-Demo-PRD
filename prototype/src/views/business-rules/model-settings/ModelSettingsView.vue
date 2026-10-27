<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {p3,ocrTemplates} from '@/mocks/phase3'
import OcrTemplateSettings from '@/components/phase3/OcrTemplateSettings.vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, EditPen, Delete } from '@element-plus/icons-vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import {
  modelProviderOptions,
  modelUsageOptions,
  clearUsageAssignment,
  createConnectionId,
  findModelConnection,
  formatModelProvider,
  getDefaultBaseUrl,
  getDefaultThinkingLevel,
  getProviderMeta,
  getThinkingLevelOptions,
  getUsageAssignableModelOptions,
  hasAssignableModels,
  isMultiSelectUsage,
  isUsageAssigned,
  isUsageEmpty,
  maskApiKey,
  modelApiConnections,
  modelUsageAssignments,
  simulateModelConnectionTest,
  supportsThinkingLevel,
  formatThinkingLevel,
  type ModelApiConnection,
  type ModelProvider,
  type ModelUsageKey,
  type ThinkingLevel
} from '@/mocks/modelSettings'
import { PLACEHOLDER } from '@/constants/placeholders'

const { t } = useI18n()

const editDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const testingId = ref<string | null>(null)
const activeTab = ref('api')
const ocrTemplateSettings=ref<InstanceType<typeof OcrTemplateSettings>>()

const draft = reactive({
  name: '',
  provider: 'openai' as ModelProvider,
  baseUrl: getDefaultBaseUrl('openai'),
  apiKey: '',
  modelName: '',
  thinkingLevel: 'medium' as ThinkingLevel
})

const providerMeta = computed(() => getProviderMeta(draft.provider))

const thinkingLevelOptions = computed(() => getThinkingLevelOptions(draft.provider))

const supportsThinking = computed(() => supportsThinkingLevel(draft.provider))

const providerOptions = computed(() => modelProviderOptions())

const usageOptions = computed(() => modelUsageOptions())

const usageOptionGroups = computed(() => {
  const options = getUsageAssignableModelOptions()
  const groups = [
    { key: 'local' as const, label: t('businessRules.model.group.localModel') },
    { key: 'api' as const, label: t('businessRules.model.group.apiConnection') }
  ]
  return groups
    .map((group) => ({
      label: group.label,
      options: options.filter((item) => item.group === group.key)
    }))
    .filter((group) => group.options.length > 0)
})

const hasAssignableModelsAvailable = computed(() => hasAssignableModels())

function resetDraft() {
  draft.name = ''
  draft.provider = 'openai'
  draft.baseUrl = getDefaultBaseUrl('openai')
  draft.apiKey = ''
  draft.modelName = ''
  draft.thinkingLevel = getDefaultThinkingLevel('openai') ?? 'medium'
  editingId.value = null
}

function handleProviderChange(provider: ModelProvider) {
  const defaultLevel = getDefaultThinkingLevel(provider)
  if (defaultLevel) {
    draft.thinkingLevel = defaultLevel
  }
  if (!editingId.value) {
    const meta = getProviderMeta(provider)
    draft.baseUrl = meta.defaultBaseUrl
    draft.modelName = meta.modelPlaceholder
  }
}

function openCreateDialog() {
  resetDraft()
  draft.modelName = providerMeta.value.modelPlaceholder
  editDialogVisible.value = true
}

function openEditDialog(connection: ModelApiConnection) {
  editingId.value = connection.id
  draft.name = connection.name
  draft.provider = connection.provider
  draft.baseUrl = connection.baseUrl
  draft.apiKey = ''
  draft.modelName = connection.modelName
  draft.thinkingLevel =
    connection.thinkingLevel ?? getDefaultThinkingLevel(connection.provider) ?? 'medium'
  editDialogVisible.value = true
}

function validateDraft(): boolean {
  if (!draft.name.trim()) {
    ElMessage.warning(t('businessRules.model.message.nameRequired'))
    return false
  }
  if (!draft.baseUrl.trim()) {
    ElMessage.warning(t('businessRules.model.message.baseUrlRequired'))
    return false
  }
  if (!editingId.value && !draft.apiKey.trim()) {
    ElMessage.warning(t('businessRules.model.message.apiKeyRequired'))
    return false
  }
  if (!draft.modelName.trim()) {
    ElMessage.warning(t('businessRules.model.message.modelNameRequired'))
    return false
  }
  if (supportsThinkingLevel(draft.provider) && !draft.thinkingLevel) {
    ElMessage.warning(t('businessRules.model.message.thinkingLevelRequired'))
    return false
  }
  return true
}

function saveConnection() {
  if (!validateDraft()) return

  const now = new Date().toLocaleString('ja-JP', { hour12: false })
  const payload: Pick<
    ModelApiConnection,
    'name' | 'provider' | 'baseUrl' | 'modelName' | 'updatedAt' | 'thinkingLevel'
  > = {
    name: draft.name.trim(),
    provider: draft.provider,
    baseUrl: draft.baseUrl.trim(),
    modelName: draft.modelName.trim(),
    updatedAt: now
  }

  if (supportsThinkingLevel(draft.provider)) {
    payload.thinkingLevel = draft.thinkingLevel
  }

  if (editingId.value) {
    const target = modelApiConnections.value.find((item) => item.id === editingId.value)
    if (!target) return
    Object.assign(target, payload)
    if (!supportsThinkingLevel(draft.provider)) {
      delete target.thinkingLevel
    }
    if (draft.apiKey.trim()) {
      target.apiKey = draft.apiKey.trim()
    }
    ElMessage.success(t('businessRules.model.message.connectionUpdated'))
  } else {
    modelApiConnections.value.unshift({
      id: createConnectionId(),
      ...payload,
      enabled: false,
      apiKey: draft.apiKey.trim()
    })
    ElMessage.success(t('businessRules.model.message.connectionAdded'))
  }

  editDialogVisible.value = false
  resetDraft()
}

async function removeConnection(connection: ModelApiConnection) {
  const options = modelUsageOptions()
  const usedBy = options
    .filter((item) => isUsageAssigned(modelUsageAssignments.value[item.key], connection.id))
    .map((item) => item.label)

  const usageHint =
    usedBy.length > 0
      ? t('businessRules.model.message.deleteUsageHint', {
          usages: [...new Set(usedBy)].join('、')
        })
      : ''

  await ElMessageBox.confirm(
    t('businessRules.model.message.deleteConfirm', { name: connection.name, usageHint }),
    t('businessRules.model.message.deleteTitle'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'warning'
    }
  )

  modelApiConnections.value = modelApiConnections.value.filter(
    (item) => item.id !== connection.id
  )

  clearUsageAssignment(modelUsageAssignments.value, connection.id)

  ElMessage.success(t('businessRules.model.message.connectionDeleted'))
}

async function testConnection(connection: ModelApiConnection) {
  testingId.value = connection.id
  const success = await simulateModelConnectionTest(connection)
  testingId.value = null

  connection.enabled = success
  connection.updatedAt = new Date().toLocaleString('ja-JP', { hour12: false })

  if (success) {
    ElMessage.success(
      t('businessRules.model.message.testSuccess', {
        name: connection.name,
        provider: formatModelProvider(connection.provider)
      })
    )
    return
  }

  ElMessage.error(
    t('businessRules.model.message.testFailed', {
      name: connection.name,
      provider: formatModelProvider(connection.provider)
    })
  )
}

function saveUsageAssignments() {

  const options = modelUsageOptions()
  const missing = options.filter((item) =>
    isUsageEmpty(modelUsageAssignments.value[item.key])
  )
  if (missing.length) {
    ElMessage.warning(
      t('businessRules.model.message.unassignedUsages', {
        usages: missing.map((item) => item.label).join('、')
      })
    )
    return
  }
  const pool=modelUsageAssignments.value.ocrExtraction
  const ids=new Set(Array.isArray(pool)?pool:pool?[pool]:[])
  const used=ocrTemplates().filter(row=>[row.main,...row.verify].some(id=>!ids.has(id)))
  if(used.length){ElMessage.warning(t('phase3.poolInUse',{names:used.map(row=>row.name).join('、')}));return}
  const valid=new Set(getUsageAssignableModelOptions().filter(o=>!o.disabled).map(o=>o.value))
  if([...ids].some(id=>!valid.has(id))){ElMessage.warning(t('phase3.required'));return}
  p3.ocr.availableModels=[...ids]
  ElMessage.success(t('businessRules.model.message.assignmentSaved'))
}

function saveOcrTemplates(){if(ocrTemplateSettings.value?.save())ElMessage.success(t('phase3.saved'))}

function usageSelectModel(usageKey: ModelUsageKey) {
  return modelUsageAssignments.value[usageKey]
}

function updateUsageSelect(usageKey: ModelUsageKey, value: string | string[] | null) {
  if (isMultiSelectUsage(usageKey)) {
    modelUsageAssignments.value[usageKey] = Array.isArray(value) ? value : value ? [value] : []
    return
  }
  modelUsageAssignments.value[usageKey] = Array.isArray(value) ? (value[0] ?? null) : value
}
</script>

<template>
  <div class="v-content-wrap v-model-settings">
    <header class="v-model-settings__header">
      <h1 class="v-model-settings__title">{{ $t('businessRules.model.title') }}</h1>
    </header>

    <el-tabs v-model="activeTab" class="v-model-settings__tabs">
      <el-tab-pane :label="$t('businessRules.model.tab.api')" name="api">
        <div class="v-model-settings__tab-panel">
          <div class="v-model-settings__toolbar">
            <span class="v-model-settings__toolbar-meta">
              {{ $t('businessRules.model.toolbar.totalCount', { count: modelApiConnections.length }) }}
            </span>
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">
              {{ $t('businessRules.model.action.addConnection') }}
            </el-button>
          </div>

          <el-table :data="modelApiConnections" border class="v-model-settings__table">
            <el-table-column
              prop="name"
              :label="$t('businessRules.model.field.connectionName')"
              min-width="160"
            />
            <el-table-column :label="$t('businessRules.model.field.provider')" min-width="140">
              <template #default="{ row }">
                {{ formatModelProvider(row.provider) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="baseUrl"
              :label="$t('businessRules.model.field.baseUrl')"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column :label="$t('businessRules.model.field.apiKey')" min-width="180">
              <template #default="{ row }">
                <code class="v-model-settings__masked-key">{{ maskApiKey(row.apiKey) }}</code>
              </template>
            </el-table-column>
            <el-table-column
              prop="modelName"
              :label="$t('businessRules.model.field.modelName')"
              min-width="160"
            />
            <el-table-column
              :label="$t('businessRules.model.field.thinkingLevel')"
              min-width="120"
            >
              <template #default="{ row }">
                {{ formatThinkingLevel(row) }}
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('businessRules.model.field.status')"
              width="96"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{
                    row.enabled
                      ? $t('businessRules.model.status.enabled')
                      : $t('businessRules.model.status.disabled')
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="updatedAt"
              :label="$t('businessRules.model.field.updatedAt')"
              min-width="160"
            />
            <el-table-column
              :label="$t('businessRules.model.field.action')"
              width="220"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  :icon="Connection"
                  :loading="testingId === row.id"
                  @click="testConnection(row)"
                >
                  {{ $t('businessRules.model.action.testConnection') }}
                </el-button>
                <el-button link type="primary" :icon="EditPen" @click="openEditDialog(row)">
                  {{ $t('businessRules.model.action.edit') }}
                </el-button>
                <el-button link type="danger" :icon="Delete" @click="removeConnection(row)">
                  {{ $t('businessRules.model.action.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.model.tab.assignment')" name="assignment">
        <div class="v-model-settings__tab-panel">
          <div class="v-model-settings__toolbar v-model-settings__toolbar--end">
            <el-button type="primary" @click="saveUsageAssignments">
              {{ $t('businessRules.model.action.save') }}
            </el-button>
          </div>

          <div class="v-model-settings__usage-grid">
            <div
              v-for="usage in usageOptions"
              :key="usage.key"
              :data-usage="usage.key"
              class="v-model-settings__usage-card"

            >
              <div class="v-model-settings__usage-head">
                <span class="v-model-settings__usage-label">{{ usage.label }}</span>
              </div>
              <el-select
                :model-value="usageSelectModel(usage.key)"
                :multiple="usage.multiple"
                :collapse-tags="usage.multiple"
                :collapse-tags-tooltip="usage.multiple"
                :max-collapse-tags="usage.multiple ? 2 : undefined"
                :placeholder="usage.multiple ? PLACEHOLDER.SELECT_MULTIPLE : PLACEHOLDER.SELECT"
                :clearable="!usage.multiple"
                class="v-model-settings__usage-select"
                @update:model-value="updateUsageSelect(usage.key, $event)"
              >
                <el-option-group
                  v-for="group in usageOptionGroups"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="option in group.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-option-group>
              </el-select>
            </div>
          </div>

          <p v-if="!hasAssignableModelsAvailable" class="v-model-settings__usage-empty">
            {{ $t('businessRules.model.empty.noAssignableModels') }}
          </p>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('phase3.ocrTemplatesTab')" name="ocr-templates">
        <div class="v-model-settings__tab-panel">
          <OcrTemplateSettings ref="ocrTemplateSettings" @save="saveOcrTemplates"/>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="editDialogVisible"
      :title="
        editingId
          ? $t('businessRules.model.action.editConnection')
          : $t('businessRules.model.action.addConnection')
      "
      width="600px"
      destroy-on-close
      @closed="resetDraft"
    >
      <el-form label-position="top" class="v-model-settings__form">
        <AppFormItem :label="$t('businessRules.model.field.connectionName')" required>
          <el-input
            v-model="draft.name"
            :placeholder="
              draft.provider === 'openai_compatible'
                ? $t('businessRules.model.placeholder.nameOpenaiCompatible')
                : $t('businessRules.model.placeholder.nameDefault')
            "
          />
        </AppFormItem>

        <AppFormItem :label="$t('businessRules.model.field.provider')" required>
          <el-select
            v-model="draft.provider"
            class="v-model-settings__full-width"
            @change="handleProviderChange"
          >
            <el-option
              v-for="option in providerOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </AppFormItem>

        <AppFormItem
          v-if="supportsThinking"
          :label="$t('businessRules.model.field.thinkingLevel')"
          required
        >
          <el-select v-model="draft.thinkingLevel" class="v-model-settings__full-width">
            <el-option
              v-for="option in thinkingLevelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </AppFormItem>

        <AppFormItem :label="$t('businessRules.model.field.baseUrl')" required>
          <el-input v-model="draft.baseUrl" :placeholder="providerMeta.defaultBaseUrl" />
        </AppFormItem>

        <AppFormItem :required="!editingId">
          <template #label>
            <span>{{ $t('businessRules.model.field.apiKey') }}</span>
            <span v-if="editingId" class="v-model-settings__field-hint">
              {{ $t('businessRules.model.placeholder.leaveEmptyHint') }}
            </span>
          </template>
          <el-input
            v-model="draft.apiKey"
            type="password"
            show-password
            :placeholder="
              editingId
                ? $t('businessRules.model.placeholder.apiKeyNew')
                : providerMeta.apiKeyPlaceholder
            "
            autocomplete="new-password"
          />
          <p v-if="editingId" class="v-model-settings__masked-preview">
            {{ $t('businessRules.model.placeholder.registered') }}
            <code>{{ maskApiKey(findModelConnection(editingId)?.apiKey ?? '') }}</code>
          </p>
        </AppFormItem>

        <AppFormItem :label="$t('businessRules.model.field.modelName')" required>
          <el-input
            v-model="draft.modelName"
            :placeholder="providerMeta.modelPlaceholder"
          />
        </AppFormItem>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">
          {{ $t('businessRules.model.action.cancel') }}
        </el-button>
        <el-button type="primary" @click="saveConnection">
          {{ $t('businessRules.model.action.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-model-settings {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-page-gap);
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 10px;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
    }
  }

  &__tab-panel {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    flex-wrap: wrap;

    &--end {
      justify-content: flex-end;
    }
  }

  &__toolbar-meta {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__table {
    width: 100%;
  }

  &__masked-key {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 14px;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  &__usage-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--app-section-gap);
    align-items: stretch;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
    }
  }

  &__usage-card {
    padding: 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fafbfc;
  }

  &__usage-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  &__usage-label {
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__usage-select {
    width: 100%;
    :deep(.el-select__wrapper) { min-height:32px; height:32px; }
  }

  &__usage-empty {
    margin: 12px 0 0;
    font-size: var(--app-font-size-base);
    color: var(--el-color-warning);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__full-width {
    width: 100%;
  }

  &__field-hint {
    margin-left: 6px;
    font-size: var(--app-font-size-base);
    font-weight: 400;
    color: var(--text-secondary);
  }

  &__masked-preview {
    margin: 8px 0 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}
</style>


