import { computed, ref } from 'vue'
import { CURRENT_USER } from '@/constants/currentUser'

export interface SystemMessage {
  id: string
  title: string
  summary: string
  body: string
  caseId: string | null
  recipientUserId: string
  createdAt: string
  read: boolean
  /** ワークフロー通知ノード等の送信元表示 */
  sourceLabel: string
}

export interface SystemMessageToastItem {
  id: string
  messageId: string
  title: string
  summary: string
  createdAt: string
}

const TOAST_DURATION_MS = 5000

export const systemMessages = ref<SystemMessage[]>([
  {
    id: 'msg-001',
    title: '補件依頼が発行されました',
    summary: 'CLAIM-20251024000004 の入院証明書が不足しています。',
    body:
      'AI検証ノードの判定により、本案は補件が必要です。入院証明書をアップロードのうえ、案件一覧から補件手続きを進めてください。',
    caseId: 'CLAIM-20251024000004',
    recipientUserId: CURRENT_USER.id,
    createdAt: '2025-10-24 15:20',
    read: true,
    sourceLabel: 'ワークフロー通知'
  },
  {
    id: 'msg-002',
    title: '処理完了のお知らせ',
    summary: 'CLAIM-20251023000002 のワークフローが完了しました。',
    body:
      'エクスポート待ちの案件が生成されました。マイタスクのエクスポート待办から結果出力を実施してください。',
    caseId: 'CLAIM-20251023000002',
    recipientUserId: CURRENT_USER.id,
    createdAt: '2025-10-24 14:12',
    read: true,
    sourceLabel: 'ワークフロー通知'
  }
])

export const activeToasts = ref<SystemMessageToastItem[]>([])

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const unreadMessageCount = computed(
  () =>
    systemMessages.value.filter(
      (item) => item.recipientUserId === CURRENT_USER.id && !item.read
    ).length
)

export function messagesForCurrentUser(): SystemMessage[] {
  return systemMessages.value.filter((item) => item.recipientUserId === CURRENT_USER.id)
}

function formatNow(): string {
  return new Date().toLocaleString('sv-SE', { hour12: false }).slice(0, 16).replace('T', ' ')
}

function dismissToast(toastId: string) {
  const timer = toastTimers.get(toastId)
  if (timer) {
    clearTimeout(timer)
    toastTimers.delete(toastId)
  }
  activeToasts.value = activeToasts.value.filter((item) => item.id !== toastId)
}

function enqueueToast(message: SystemMessage) {
  const toastId = `toast-${message.id}-${Date.now()}`
  const toast: SystemMessageToastItem = {
    id: toastId,
    messageId: message.id,
    title: message.title,
    summary: message.summary,
    createdAt: message.createdAt
  }
  activeToasts.value.push(toast)

  const timer = setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS)
  toastTimers.set(toastId, timer)
}

/**
 * ワークフロー通知ノードが站内信を配信したときの統一入口（プロトタイプ）
 */
export function publishWorkflowInAppMessage(input: {
  title: string
  summary: string
  body: string
  caseId?: string | null
  recipientUserId?: string
}): SystemMessage {
  const message: SystemMessage = {
    id: `msg-${Date.now()}`,
    title: input.title,
    summary: input.summary,
    body: input.body,
    caseId: input.caseId ?? null,
    recipientUserId: input.recipientUserId ?? CURRENT_USER.id,
    createdAt: formatNow(),
    read: false,
    sourceLabel: 'ワークフロー通知'
  }
  systemMessages.value.unshift(message)
  enqueueToast(message)
  return message
}

export function markMessageRead(messageId: string): void {
  const message = systemMessages.value.find((item) => item.id === messageId)
  if (message) {
    message.read = true
  }
}

export function markAllMessagesRead(): number {
  let count = 0
  systemMessages.value.forEach((message) => {
    if (message.recipientUserId === CURRENT_USER.id && !message.read) {
      message.read = true
      count += 1
    }
  })
  return count
}

export function dismissToastById(toastId: string): void {
  dismissToast(toastId)
}

export const toastDurationMs = TOAST_DURATION_MS
