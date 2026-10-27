export interface TaskAssignee {
  id: string
  name: string
  /** 系统中是否生效（可分配） */
  active: boolean
}

/** 系统生效用户（任务/案件分配候補） */
export const TASK_ASSIGNEES: TaskAssignee[] = [
  { id: 'user-001', name: '山田 太郎', active: true },
  { id: 'user-002', name: '鈴木 花子', active: true },
  { id: 'user-003', name: '佐藤 一郎', active: true },
  { id: 'user-004', name: '田中美咲', active: true },
  { id: 'user-005', name: '高橋 健', active: true }
]

export function activeTaskAssignees(): TaskAssignee[] {
  return TASK_ASSIGNEES.filter((user) => user.active)
}
