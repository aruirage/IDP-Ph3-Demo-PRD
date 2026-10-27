import { ref } from 'vue'

/** 对外 Open API 基址（原型 mock） */
export const OPEN_API_BASE_URL = 'http://172.16.60.123:48081/admin-api/ai/open/v1/idp'

export interface NotificationSettings {
  notifyUrl: string
  signatureKey: string
}

export interface ApiKeyRecord {
  id: string
  name: string
  apiKey: string
  createdAt: string
  validFrom: string
  validTo: string
  enabled: boolean
}

export interface OpenApiEndpoint {
  id: string
  name: string
  path: string
  /** 三期增量说明（原型展示用） */
  phase3Note?: string
}

export const notificationSettings = ref<NotificationSettings>({
  notifyUrl: '',
  signatureKey: ''
})

export const apiKeyRecords = ref<ApiKeyRecord[]>([
  {
    id: 'key-2',
    name: '2',
    apiKey: 'SK-8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c',
    createdAt: '2026-05-05 18:03:00',
    validFrom: '2026-05-05',
    validTo: '2029-05-01',
    enabled: true
  },
  {
    id: 'key-1',
    name: '1',
    apiKey: 'SK-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    createdAt: '2026-05-05 17:59:10',
    validFrom: '2026-05-05',
    validTo: '2026-05-12',
    enabled: true
  }
])

export const openApiEndpoints: OpenApiEndpoint[] = [
  {
    id: 'file-upload',
    name: 'ファイルアップロード',
    path: '/files/upload',
    phase3Note:
      'P3: aiCaseLinkEnabled（bool, default false）— ON=集約ルール紐付け、OFF=Web ファイル名 or 同一 PDF 1 案件'
  },
  { id: 'case-list', name: '案件一覧照会', path: '/cases' },
  { id: 'batch-cases', name: 'バッチ別案件照会', path: '/batches/{batchNo}/cases' },
  { id: 'supplement-upload', name: '補件アップロード', path: '/cases/{caseNo}/files/supplement' },
  { id: 'batch-export', name: '一括エクスポート', path: '/exports' },
  { id: 'export-task-query', name: 'エクスポートタスク照会', path: '/exports/{exportTaskId}' },
  { id: 'ai-classification', name: 'AI分類', path: '/classification' },
  {
    id: 'ai-classification-query',
    name: 'AI分類タスク照会',
    path: '/classification/{classificationTaskId}'
  }
]

export function buildOpenApiUrl(path: string): string {
  return `${OPEN_API_BASE_URL}${path}`
}

export function maskApiKey(value: string): string {
  if (!value) return '—'
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}${'•'.repeat(16)}${value.slice(-4)}`
}

export function createApiKeyId(): string {
  return `key-${Date.now().toString(36)}`
}

export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let suffix = ''
  for (let i = 0; i < 32; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `SK-${suffix}`
}

export function generateSignatureKey(): string {
  const chars = '0123456789ABCDEF'
  let suffix = ''
  for (let i = 0; i < 32; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `SK-${suffix}`
}
