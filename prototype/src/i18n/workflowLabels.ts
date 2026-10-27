import type {
  WorkflowCanvasNodeKey,
  WorkflowNodeRecordStatus
} from '@/constants/caseWorkflow'
import type { CaseFileProcessStatus } from '@/constants/caseFileStatus'
import { t } from '@/i18n/translate'

export function workflowNodeLabel(id: string): string {
  return t(`case.workflow.node.${id}`)
}

/** 案件详情流程图：仅使用工作流画布「ノード」库名称 */
export function workflowCanvasNodeLabel(key: WorkflowCanvasNodeKey): string {
  return t(`case.workflow.canvasNode.${key}`)
}

export function workflowRecordStatusLabel(status: WorkflowNodeRecordStatus): string {
  const keyMap: Record<WorkflowNodeRecordStatus, string> = {
    処理完了: 'case.workflow.record.done',
    処理中: 'case.workflow.record.processing',
    処理失敗: 'case.workflow.record.failed',
    待機: 'case.workflow.record.waiting',
    スキップ: 'case.workflow.record.skipped'
  }
  return t(keyMap[status])
}

export function workflowFileNodeStatusLabel(status: CaseFileProcessStatus): string {
  if (!status) return ''
  return t(`case.fileStatus.${status}`)
}

export function workflowKindLabel(kind: 'condition' | 'hitl'): string {
  return t(`case.workflow.kind.${kind}`)
}

export function workflowBranchLabel(branch: 'required' | 'notRequired' | 'deficiency'): string {
  return t(`case.workflow.branch.${branch}`)
}
