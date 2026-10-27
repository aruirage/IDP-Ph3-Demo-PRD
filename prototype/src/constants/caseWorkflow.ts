export type WorkflowNodeStatus = 'done' | 'active' | 'pending'

/** 详情节点进度四态（PRD 3.3 B）；スキップ为流程图内部分支标记，不在详情表展示 */
export type WorkflowNodeRecordStatus =
  | '処理完了'
  | '処理中'
  | '処理失敗'
  | '待機'
  | 'スキップ'

export type FlowNodeKind = 'task' | 'condition' | 'hitl'

export type FlowNodeVisualStatus = 'done' | 'active' | 'pending' | 'branch-skip' | 'unreached'

export type FlowEdgeState = 'taken' | 'active' | 'unused'

export interface CaseWorkflowNode {
  id: string
  label: string
  status: WorkflowNodeStatus
}

export interface FlowchartNodeView {
  id: string
  label: string
  kind: FlowNodeKind
  status: FlowNodeVisualStatus
}

export interface FlowchartEdgeView {
  id: string
  from: string
  to: string
  label?: string
  state: FlowEdgeState
}

export interface CaseWorkflowFlowchart {
  layout: 'claim' | 'simple'
  nodes: Record<string, FlowchartNodeView>
  edges: FlowchartEdgeView[]
  pathNotes: string[]
}

export interface CaseWorkflowNodeRecord {
  id: string
  label: string
  stepStatus: WorkflowNodeStatus
  recordStatus: WorkflowNodeRecordStatus
  enteredAt: string | null
  completedAt: string | null
  operator: string | null
  remark: string | null
}

export interface CaseWorkflowState {
  currentNodeId: string
  currentNodeLabel: string
  nodes: CaseWorkflowNode[]
  stepperNodes: CaseWorkflowNode[]
  nodeRecords: CaseWorkflowNodeRecord[]
  traversedNodeRecords: CaseWorkflowNodeRecord[]
  flowchart: CaseWorkflowFlowchart
  fileProgress: { completed: number; total: number } | null
}

export interface WorkflowTemplateNode {
  id: string
  label: string
}

export interface CaseFileProcessRecord {
  id: string
  fileName: string
  fileType: string
  statusLabel: string
  statusClass: string
  enteredAt: string
  updatedAt: string
  operator: string
}

/** 工作流画布节点库名称（流程图仅展示此类文案，见配置端「ノード」） */
export type WorkflowCanvasNodeKey =
  | 'preprocess'
  | 'ocr'
  | 'condition'
  | 'hitl'
  | 'dataMapping'
  | 'aiVerify'
  | 'customFunction'

/** 保险金请求场景：内部节点 ID → 画布节点库名称 */
export const CLAIM_FLOWCHART_CANVAS_KEY: Record<string, WorkflowCanvasNodeKey> = {
  preprocess: 'preprocess',
  ocr: 'ocr',
  ocr_gate: 'condition',
  ocr_review: 'hitl',
  contract_api: 'dataMapping',
  benefit_check: 'aiVerify',
  verify_gate: 'condition',
  verify_review: 'hitl',
  output: 'customFunction'
}

/** 流程图主线顺序（不含开始/结束、不含分支内人工确认） */
export const CLAIM_FLOWCHART_MAIN_LINE = [
  'preprocess',
  'ocr',
  'ocr_gate',
  'contract_api',
  'benefit_check',
  'verify_gate',
  'output'
] as const

export const SIMPLE_FLOWCHART_CANVAS_KEY: Record<string, WorkflowCanvasNodeKey> = {
  preprocess: 'preprocess',
  ocr: 'ocr',
  readiness: 'condition',
  output: 'customFunction'
}

export const SIMPLE_FLOWCHART_MAIN_LINE = ['preprocess', 'ocr', 'readiness', 'output'] as const
