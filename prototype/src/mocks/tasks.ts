import { ref } from 'vue'
import type { TaskType } from '@/constants/taskTypes'
import { taskTypeLabel } from '@/constants/taskTypes'

export type TaskListStatus = 'pending' | 'completed'

/** 自動完了担当者の sentinel（表示時に tasks.common.system へ変換） */
export const TASK_SYSTEM_HANDLER = '__system__'

export interface TaskListItem {
  taskId: string
  taskType: TaskType
  taskTypeLabel: string
  status: TaskListStatus
  caseId: string
  caseOrigin: string | null
  caseType: string
  sourceFolderName: string
  /** OCR抽出確認タスクのみ */
  docType: string | null
  receivedAt: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  /** 未対応：割当担当者 */
  assigneeName: string | null
  /** 対応済：担当者名。自動完了の場合は TASK_SYSTEM_HANDLER */
  handlerName: string | null
}

export const mockTaskList = ref<TaskListItem[]>([
  {
    taskId: 'TASK-PRE-001',
    taskType: 'preprocess-confirmation',
    taskTypeLabel: taskTypeLabel('preprocess-confirmation'),
    status: 'pending',
    caseId: 'CLAIM-20251024000004',
    caseOrigin: 'REQ-2025-0018912',
    caseType: '保険金請求',
    sourceFolderName: '渡辺拓也_入院請求',
    docType: null,
    receivedAt: '2025-10-24 10:00',
    createdAt: '2025-10-24 11:05',
    updatedAt: '2025-10-24 11:05',
    completedAt: null,
    assigneeName: '鈴木 花子',
    handlerName: null
  },
  {
    taskId: 'TASK-OCR-001',
    taskType: 'ocr-extraction',
    taskTypeLabel: taskTypeLabel('ocr-extraction'),
    status: 'pending',
    caseId: 'CLAIM-20251024000003',
    caseOrigin: 'REQ-2025-0018908',
    caseType: '保険金請求',
    sourceFolderName: '田中花子_手術請求',
    docType: '保険金請求書',
    receivedAt: '2025-10-24 09:40',
    createdAt: '2025-10-24 13:15',
    updatedAt: '2025-10-24 13:15',
    completedAt: null,
    assigneeName: '鈴木 花子',
    handlerName: null
  },
  {
    taskId: 'TASK-OCR-002',
    taskType: 'ocr-extraction',
    taskTypeLabel: taskTypeLabel('ocr-extraction'),
    status: 'pending',
    caseId: 'CLAIM-20251022000001',
    caseOrigin: 'REQ-2025-0018865',
    caseType: '保険金請求',
    sourceFolderName: '小林直樹_入院請求',
    docType: '保険金請求書',
    receivedAt: '2025-10-22 10:30',
    createdAt: '2025-10-22 10:50',
    updatedAt: '2025-10-22 10:50',
    completedAt: null,
    assigneeName: null,
    handlerName: null
  },
  {
    taskId: 'TASK-VER-001',
    taskType: 'verification',
    taskTypeLabel: taskTypeLabel('verification'),
    status: 'pending',
    caseId: 'CLAIM-20251024000004',
    caseOrigin: 'REQ-2025-0018912',
    caseType: '保険金請求',
    sourceFolderName: '渡辺拓也_入院請求',
    docType: null,
    receivedAt: '2025-10-24 10:15',
    createdAt: '2025-10-24 16:10',
    updatedAt: '2025-10-24 16:10',
    completedAt: null,
    assigneeName: null,
    handlerName: null
  },
  {
    taskId: 'TASK-VER-002',
    taskType: 'verification',
    taskTypeLabel: taskTypeLabel('verification'),
    status: 'pending',
    caseId: 'CLAIM-20251022000002',
    caseOrigin: 'REQ-2025-0018872',
    caseType: '保険金請求',
    sourceFolderName: '中村恵_手術請求',
    docType: null,
    receivedAt: '2025-10-22 13:45',
    createdAt: '2025-10-23 18:25',
    updatedAt: '2025-10-23 18:25',
    completedAt: null,
    assigneeName: null,
    handlerName: null
  },
  {
    taskId: 'TASK-EXP-001',
    taskType: 'export',
    taskTypeLabel: taskTypeLabel('export'),
    status: 'pending',
    caseId: 'CLAIM-20251023000002',
    caseOrigin: 'REQ-2025-0018890',
    caseType: '保険金請求',
    sourceFolderName: '高橋誠_手術請求',
    docType: null,
    receivedAt: '2025-10-23 16:20',
    createdAt: '2025-10-24 14:10',
    updatedAt: '2025-10-24 14:10',
    completedAt: null,
    assigneeName: null,
    handlerName: null
  },
  {
    taskId: 'TASK-EXP-002',
    taskType: 'export',
    taskTypeLabel: taskTypeLabel('export'),
    status: 'pending',
    caseId: 'CLAIM-20251021000001',
    caseOrigin: 'REQ-2025-0018850',
    caseType: '保険金請求',
    sourceFolderName: '吉田翔太_手術請求',
    docType: null,
    receivedAt: '2025-10-21 11:20',
    createdAt: '2025-10-22 08:35',
    updatedAt: '2025-10-22 08:35',
    completedAt: null,
    assigneeName: null,
    handlerName: null
  },
  {
    taskId: 'TASK-OCR-DONE-001',
    taskType: 'ocr-extraction',
    taskTypeLabel: taskTypeLabel('ocr-extraction'),
    status: 'completed',
    caseId: 'CLAIM-20251023000001',
    caseOrigin: 'REQ-2025-0018885',
    caseType: '保険金請求',
    sourceFolderName: '伊藤由美_入院請求',
    docType: '保険金請求書',
    receivedAt: '2025-10-19 14:00',
    createdAt: '2025-10-19 14:05',
    updatedAt: '2025-10-19 14:02',
    completedAt: '2025-10-19 14:02',
    assigneeName: null,
    handlerName: TASK_SYSTEM_HANDLER
  },
  {
    taskId: 'TASK-VER-DONE-001',
    taskType: 'verification',
    taskTypeLabel: taskTypeLabel('verification'),
    status: 'completed',
    caseId: 'CLAIM-20251020000002',
    caseOrigin: null,
    caseType: '保険金請求',
    sourceFolderName: '松本彩_入院請求',
    docType: null,
    receivedAt: '2025-10-18 15:40',
    createdAt: '2025-10-18 15:42',
    updatedAt: '2025-10-18 15:45',
    completedAt: '2025-10-18 15:45',
    assigneeName: null,
    handlerName: TASK_SYSTEM_HANDLER
  },
  {
    taskId: 'TASK-EXP-DONE-001',
    taskType: 'export',
    taskTypeLabel: taskTypeLabel('export'),
    status: 'completed',
    caseId: 'CLAIM-20251023000001',
    caseOrigin: 'REQ-2025-0018885',
    caseType: '保険金請求',
    sourceFolderName: '伊藤由美_入院請求',
    docType: null,
    receivedAt: '2025-10-17 11:30',
    createdAt: '2025-10-17 11:35',
    updatedAt: '2025-10-17 16:00',
    completedAt: '2025-10-17 16:00',
    assigneeName: null,
    handlerName: '山田 太郎'
  },
  {
    taskId: 'TASK-PRE-002',
    taskType: 'preprocess-confirmation',
    taskTypeLabel: taskTypeLabel('preprocess-confirmation'),
    status: 'completed',
    caseId: 'CLAIM-20251022000001',
    caseOrigin: 'REQ-2025-0018865',
    caseType: '保険金請求',
    sourceFolderName: '小林直樹_入院請求',
    docType: null,
    receivedAt: '2025-10-22 09:10',
    createdAt: '2025-10-22 09:20',
    updatedAt: '2025-10-22 09:45',
    completedAt: '2025-10-22 09:45',
    assigneeName: null,
    handlerName: TASK_SYSTEM_HANDLER
  }
])

export function getTaskById(taskId: string): TaskListItem | undefined {
  return mockTaskList.value.find((item) => item.taskId === taskId)
}

export function assignTask(taskId: string, assigneeName: string): boolean {
  const task = mockTaskList.value.find((item) => item.taskId === taskId)
  if (!task || task.status !== 'pending') return false
  task.assigneeName = assigneeName
  task.updatedAt = new Date().toLocaleString('sv-SE', { hour12: false }).slice(0, 16)
  return true
}

export function findPendingTaskForCase(caseId: string): TaskListItem | undefined {
  return mockTaskList.value.find(
    (item) => item.caseId === caseId && item.status === 'pending'
  )
}

export function reassignPendingTasksForCase(caseId: string, assigneeName: string): number {
  const now = new Date().toLocaleString('sv-SE', { hour12: false }).slice(0, 16)
  let count = 0
  mockTaskList.value.forEach((task) => {
    if (task.caseId === caseId && task.status === 'pending') {
      task.assigneeName = assigneeName
      task.updatedAt = now
      count += 1
    }
  })
  return count
}
