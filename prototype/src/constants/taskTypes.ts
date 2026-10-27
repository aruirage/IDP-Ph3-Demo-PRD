import { i18n } from '@/i18n'

export type TaskType = 'preprocess-confirmation' | 'ocr-extraction' | 'verification' | 'export'

export function taskTypeOptions() {
  return [
    { value: '', label: i18n.global.t('common.filterAll') },
    { value: 'preprocess-confirmation', label: i18n.global.t('task.type.preprocess-confirmation') },
    { value: 'ocr-extraction', label: i18n.global.t('task.type.ocr-extraction') },
    { value: 'verification', label: i18n.global.t('task.type.verification') },
    { value: 'export', label: i18n.global.t('task.type.export') }
  ] as const
}

/** @deprecated 互換用。新規コードは taskTypeOptions() を使用 */
export const TASK_TYPE_OPTIONS = taskTypeOptions()

export function taskPriorityOptions() {
  return [
    { value: '', label: i18n.global.t('common.filterAll') },
    { value: '高', label: i18n.global.t('tasks.priority.high') },
    { value: '中', label: i18n.global.t('tasks.priority.medium') },
    { value: '低', label: i18n.global.t('tasks.priority.low') }
  ] as const
}

/** @deprecated 互換用。新規コードは taskPriorityOptions() を使用 */
export const TASK_PRIORITY_OPTIONS = taskPriorityOptions()

export function taskTypeLabel(type: TaskType): string {
  return i18n.global.t(`task.type.${type}`)
}

export function taskExecutionPath(
  type: TaskType,
  taskId: string,
  options?: { viewOnly?: boolean }
): string {
  const base = `/tasks/${type}/${taskId}`
  return options?.viewOnly ? `${base}?mode=view` : base
}

export function priorityTagType(
  priority: string
): 'danger' | 'warning' | undefined {
  if (priority === '高') return 'danger'
  if (priority === '中') return 'warning'
  return undefined
}
