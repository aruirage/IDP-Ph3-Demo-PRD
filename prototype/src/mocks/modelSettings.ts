import { p3, ocrTemplates, resolveOcrTemplate } from './phase3'
import { ref } from 'vue'
import { t } from '@/i18n/translate'

/** 第1期対応プロバイダ（バックエンドでアダプタ実装） */
export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'openai_compatible'

export type ModelUsageKey =
  | 'aiAssist'
  | 'aiPreprocessing'
  | 'ocrExtraction'
  | 'aiVerification'
  | 'masterMatching'
  | 'caseConsolidation'
  | 'dataMapping'
  | 'coordinatePositioning'

export type LocalPresetModel = {
  id: string
  name: string
  status: 'healthy' | 'unavailable'
}

/** 本期后台预置的本地化大模型 ID */
export const LOCAL_PRESET_MODEL_ID = 'local-neeoseeo'

export function localPresetModelLabelSuffix(): string {
  return t('businessRules.model.label.localModelSuffix')
}

/** @deprecated use localPresetModelLabelSuffix() */
export const LOCAL_PRESET_MODEL_LABEL_SUFFIX = localPresetModelLabelSuffix()

export interface ModelUsageOption {
  key: ModelUsageKey
  label: string
  multiple?: boolean
}

export interface ModelProviderMeta {
  label: string
  defaultBaseUrl: string
  modelPlaceholder: string
  apiKeyPlaceholder: string
}

export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high'

export interface ThinkingLevelOption {
  value: ThinkingLevel
}

export interface ModelApiConnection {
  id: string
  name: string
  provider: ModelProvider
  baseUrl: string
  apiKey: string
  /** リクエスト body に渡すモデル識別子（プロバイダごとに意味が異なる） */
  modelName: string
  /** 思考程度；仅当提供商支持时配置，随请求传入适配器 */
  thinkingLevel?: ThinkingLevel
  enabled: boolean
  updatedAt: string
}

export function modelProviderOptions(): { value: ModelProvider; label: string }[] {
  return [
    { value: 'openai', label: t('businessRules.model.provider.openai') },
    { value: 'anthropic', label: t('businessRules.model.provider.anthropic') },
    { value: 'gemini', label: t('businessRules.model.provider.gemini') },
    {
      value: 'openai_compatible',
      label: t('businessRules.model.provider.openai_compatible')
    }
  ]
}

/** @deprecated use modelProviderOptions() */
export const MODEL_PROVIDER_OPTIONS = modelProviderOptions()

export const MODEL_PROVIDER_META: Record<
  ModelProvider,
  Omit<ModelProviderMeta, 'label'> & { label?: string }
> = {
  openai: {
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelPlaceholder: 'gpt-4.1',
    apiKeyPlaceholder: 'sk-...'
  },
  anthropic: {
    defaultBaseUrl: 'https://api.anthropic.com',
    modelPlaceholder: 'claude-sonnet-4-20250514',
    apiKeyPlaceholder: 'sk-ant-...'
  },
  gemini: {
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelPlaceholder: 'gemini-2.0-flash',
    apiKeyPlaceholder: 'AIza...'
  },
  openai_compatible: {
    defaultBaseUrl: 'https://your-api.example.com/v1',
    modelPlaceholder: 'your-model-id',
    apiKeyPlaceholder: 'sk-...'
  }
}

/** 各提供商支持的思考程度选项（无条目表示该提供商不支持配置） */
export const MODEL_THINKING_LEVEL_OPTIONS: Record<ModelProvider, ThinkingLevelOption[]> = {
  openai: [{ value: 'low' }, { value: 'medium' }, { value: 'high' }],
  anthropic: [{ value: 'low' }, { value: 'medium' }, { value: 'high' }],
  gemini: [{ value: 'minimal' }, { value: 'low' }, { value: 'medium' }, { value: 'high' }],
  openai_compatible: []
}

export function supportsThinkingLevel(provider: ModelProvider): boolean {
  return MODEL_THINKING_LEVEL_OPTIONS[provider].length > 0
}

export function getThinkingLevelOptions(
  provider: ModelProvider
): { value: ThinkingLevel; label: string }[] {
  return MODEL_THINKING_LEVEL_OPTIONS[provider].map((item) => ({
    value: item.value,
    label: t(`businessRules.model.thinkingLevel.${item.value}`)
  }))
}

export function getDefaultThinkingLevel(provider: ModelProvider): ThinkingLevel | null {
  const options = MODEL_THINKING_LEVEL_OPTIONS[provider]
  return options[0]?.value ?? null
}

export function formatThinkingLevel(
  connection: Pick<ModelApiConnection, 'provider' | 'thinkingLevel'>
): string {
  if (!supportsThinkingLevel(connection.provider)) return '—'
  const level = connection.thinkingLevel ?? getDefaultThinkingLevel(connection.provider)
  if (!level) return '—'
  return t(`businessRules.model.thinkingLevel.${level}`)
}

export function modelUsageOptions(): ModelUsageOption[] {
  return [
    { key: 'aiAssist', label: t('businessRules.model.usage.aiAssist') },
    { key: 'aiPreprocessing', label: t('businessRules.model.usage.aiPreprocessing') },
    { key: 'ocrExtraction', label: t('businessRules.model.usage.ocrExtraction'), multiple: true },
    { key: 'coordinatePositioning', label: t('businessRules.model.usage.coordinatePositioning') },
    { key: 'aiVerification', label: t('businessRules.model.usage.aiVerification') },
    { key: 'masterMatching', label: t('businessRules.model.usage.masterMatching') },
    { key: 'caseConsolidation', label: t('businessRules.model.usage.caseConsolidation') },
    { key: 'dataMapping', label: t('businessRules.model.usage.dataMapping') }
  ]
}

/** @deprecated use modelUsageOptions() */
export const MODEL_USAGE_OPTIONS = modelUsageOptions()

/** 后台预置；配置端无独立列表页，仅在用途割当候选项中出现 */
export const localPresetModels = ref<LocalPresetModel[]>([
  {
    id: LOCAL_PRESET_MODEL_ID,
    name: 'Neeoseeo',
    status: 'healthy'
  }
])

export const modelApiConnections = ref<ModelApiConnection[]>([
  {
    id: 'model-conn-001',
    name: '本番 OpenAI',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-proj-8f2a9c1d4e7b6a3f0c8d5e2b1a9f7c6d',
    modelName: 'gpt-4.1',
    thinkingLevel: 'medium',
    enabled: true,
    updatedAt: '2025-09-18 10:24:00'
  },
  {
    id: 'model-conn-002',
    name: '本番 Anthropic',
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKey: 'sk-ant-api03-abcdef1234567890abcdef1234567890',
    modelName: 'claude-sonnet-4-20250514',
    thinkingLevel: 'high',
    enabled: true,
    updatedAt: '2025-09-12 16:05:00'
  },
  {
    id: 'model-conn-003',
    name: '本番 Gemini',
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: 'AIzaSyD-example-key-9x8y7z6w5v4u3t2s1',
    modelName: 'gemini-2.0-flash',
    thinkingLevel: 'low',
    enabled: true,
    updatedAt: '2025-09-10 11:30:00'
  },
  {
    id: 'model-conn-004',
    name: '社内 vLLM',
    provider: 'openai_compatible',
    baseUrl: 'http://llm-gateway.corp.local/v1',
    apiKey: 'internal-key-9f3a2b1c0d8e7f6a',
    modelName: 'qwen2.5-72b-instruct',
    enabled: true,
    updatedAt: '2025-09-08 09:15:00'
  }
])

export type ModelUsageAssignmentValue = string | null | string[]

export const modelUsageAssignments = ref<Record<ModelUsageKey, ModelUsageAssignmentValue>>({
  aiAssist: 'model-conn-001',
  aiPreprocessing: 'model-conn-001',
  ocrExtraction: p3.ocr.availableModels ? [...p3.ocr.availableModels] : [...new Set([LOCAL_PRESET_MODEL_ID, 'model-conn-001', 'model-conn-002', ...ocrTemplates().flatMap(row=>[row.main,...row.verify])])],
  aiVerification: LOCAL_PRESET_MODEL_ID,
  masterMatching: 'model-conn-002',
  caseConsolidation: 'model-conn-002',
  dataMapping: 'model-conn-001',
  coordinatePositioning: 'model-conn-003'
})

export function isMultiSelectUsage(key: ModelUsageKey): boolean {
  return modelUsageOptions().find((item) => item.key === key)?.multiple === true
}

export function getProviderMeta(provider: ModelProvider): ModelProviderMeta {
  const meta = MODEL_PROVIDER_META[provider]
  return {
    label: t(`businessRules.model.provider.${provider}`),
    defaultBaseUrl: meta.defaultBaseUrl,
    modelPlaceholder: meta.modelPlaceholder,
    apiKeyPlaceholder: meta.apiKeyPlaceholder
  }
}

export function getDefaultBaseUrl(provider: ModelProvider): string {
  return MODEL_PROVIDER_META[provider].defaultBaseUrl
}

export function formatModelProvider(provider: ModelProvider): string {
  return t(`businessRules.model.provider.${provider}`)
}

export function isUsageAssigned(
  value: ModelUsageAssignmentValue | undefined,
  connectionId: string
): boolean {
  if (Array.isArray(value)) return value.includes(connectionId)
  return value === connectionId
}

export function clearUsageAssignment(
  assignments: Record<ModelUsageKey, ModelUsageAssignmentValue>,
  connectionId: string
) {
  for (const option of modelUsageOptions()) {
    const current = assignments[option.key]
    if (Array.isArray(current)) {
      assignments[option.key] = current.filter((id) => id !== connectionId)
      continue
    }
    if (current === connectionId) {
      assignments[option.key] = isMultiSelectUsage(option.key) ? [] : null
    }
  }
}

export function isUsageEmpty(value: ModelUsageAssignmentValue | undefined): boolean {
  if (Array.isArray(value)) return value.length === 0
  return !value
}

export function findLocalPresetModel(id: string | null | undefined): LocalPresetModel | null {
  if (!id) return null
  return localPresetModels.value.find((item) => item.id === id) ?? null
}

export function findModelConnection(id: string | null | undefined): ModelApiConnection | null {
  if (!id) return null
  return modelApiConnections.value.find((item) => item.id === id) ?? null
}

export function findModelById(
  id: string | null | undefined
): LocalPresetModel | ModelApiConnection | null {
  if (!id) return null
  return findLocalPresetModel(id) ?? findModelConnection(id)
}

export function isModelAssignable(id: string): boolean {
  const local = findLocalPresetModel(id)
  if (local) return local.status === 'healthy'
  const connection = findModelConnection(id)
  return connection?.enabled ?? false
}

export function modelDisplayName(id: string | null | undefined): string {
  const local = findLocalPresetModel(id)
  if (local) return `${local.name}${localPresetModelLabelSuffix()}`
  const connection = findModelConnection(id)
  if (connection) {
    return connection.enabled
      ? connection.name
      : `${connection.name}${t('businessRules.model.label.disabledSuffix')}`
  }
  return '—'
}

export type ModelOptionGroup = 'local' | 'api'

export function getUsageAssignableModelOptions(): {
  value: string
  label: string
  disabled: boolean
  group: ModelOptionGroup
}[] {
  const localSuffix = localPresetModelLabelSuffix()
  const unavailable = t('businessRules.model.label.unavailable')
  const disabledSuffix = t('businessRules.model.label.disabledSuffix')
  const local = localPresetModels.value.map((item) => ({
    value: item.id,
    label:
      item.status === 'healthy'
        ? `${item.name}${localSuffix}`
        : `${item.name}${localSuffix}${unavailable}`,
    disabled: item.status !== 'healthy',
    group: 'local' as const
  }))
  const api = modelApiConnections.value.map((item) => ({
    value: item.id,
    label: item.enabled ? item.name : `${item.name}${disabledSuffix}`,
    disabled: !item.enabled,
    group: 'api' as const
  }))
  return [...local, ...api]
}

export function hasAssignableModels(): boolean {
  return getUsageAssignableModelOptions().some((item) => !item.disabled)
}

export function connectionName(id: string | null | undefined): string {
  return modelDisplayName(id)
}

export function connectionNames(ids: string[]): string {
  if (!ids.length) return '—'
  return ids.map((id) => connectionName(id)).join('、')
}

/** API キーを一覧表示用にマスク（先頭・末尾のみ露出） */
export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim()
  if (!trimmed) return '—'
  if (trimmed.length <= 8) {
    return '••••••••'
  }
  const head = trimmed.slice(0, 4)
  const tail = trimmed.slice(-4)
  return `${head}${'•'.repeat(Math.min(12, trimmed.length - 8))}${tail}`
}

export function getOcrExtractionModelIds(docTypeId=''): string[] {
  const template=resolveOcrTemplate(docTypeId)
  return template?[template.main,...template.verify].filter(Boolean):[]
}

export function getOcrAvailableModelOptions(){
  const pool=p3.ocr.availableModels||modelUsageAssignments.value.ocrExtraction
  const ids=new Set(Array.isArray(pool)?pool:pool?[pool]:[])
  return getUsageAssignableModelOptions().filter(option=>!option.disabled&&ids.has(option.value))
}

export function getOcrExtractionModelOptions(): { value: string; label: string }[] {
  const assignedIds = getOcrExtractionModelIds()
  return assignedIds
    .filter((id) => isModelAssignable(id))
    .map((id) => ({ value: id, label: modelDisplayName(id) }))
}

export function createConnectionId(): string {
  return `model-conn-${Date.now()}`
}

/** 原型：模拟连接测试；成功则有效，失败则无效 */
export async function simulateModelConnectionTest(
  connection: ModelApiConnection
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  const apiKey = connection.apiKey.trim()
  const baseUrl = connection.baseUrl.trim()
  return apiKey.length >= 8 && /^https?:\/\//i.test(baseUrl)
}
