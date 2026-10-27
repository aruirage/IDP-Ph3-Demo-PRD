import type { StageOutcome } from '@/constants/caseStageResults'
import { workflowCanvasNodeLabel, workflowNodeLabel } from '@/i18n/workflowLabels'
import { t } from '@/i18n/translate'
import {
  type CaseWorkflowNode,
  type CaseWorkflowNodeRecord,
  type CaseWorkflowState,
  type CaseFileProcessRecord,
  type CaseWorkflowFlowchart,
  type FlowchartNodeView,
  type FlowNodeKind,
  type FlowchartEdgeView,
  type FlowEdgeState,
  type FlowNodeVisualStatus,
  type WorkflowNodeRecordStatus,
  type WorkflowCanvasNodeKey,
  type WorkflowTemplateNode,
  CLAIM_FLOWCHART_CANVAS_KEY,
  SIMPLE_FLOWCHART_CANVAS_KEY
} from '@/constants/caseWorkflow'
import type { CaseFileProcessStatus } from '@/constants/caseFileStatus'
import {
  caseFileProcessStatusClass,
  caseFileProcessStatusLabel
} from '@/constants/caseFileStatus'
import type { CaseListItem } from '@/mocks/cases'

const AUTO = 'システム（自動）'
const OP = '山田 太郎'

/** 工作流节点层面视为系统自动执行的步骤（人工确认体现在独立 HITL 节点） */
const WORKFLOW_AUTO_NODES = new Set([
  'intake',
  'preprocess',
  'ocr',
  'ocr_gate',
  'readiness',
  'contract_api',
  'benefit_check',
  'verify_gate'
])

const CLAIM_WORKFLOW_NODE_IDS = [
  'intake',
  'preprocess',
  'ocr',
  'ocr_gate',
  'ocr_review',
  'readiness',
  'contract_api',
  'benefit_check',
  'verify_gate',
  'verify_review',
  'deficiency',
  'output'
] as const

const PRESERVATION_WORKFLOW_NODE_IDS = [
  'intake',
  'preprocess',
  'ocr',
  'readiness',
  'output'
] as const

function buildWorkflowTemplate(nodeIds: readonly string[]): WorkflowTemplateNode[] {
  return nodeIds.map((id) => ({ id, label: workflowNodeLabel(id) }))
}

function getWorkflowTemplate(caseType: string): WorkflowTemplateNode[] {
  if (caseType === '保全') return buildWorkflowTemplate(PRESERVATION_WORKFLOW_NODE_IDS)
  return buildWorkflowTemplate(CLAIM_WORKFLOW_NODE_IDS)
}

function offsetTime(base: string, minutes: number): string {
  const [datePart, timePart] = base.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  const date = new Date(y, m - 1, d, hh, mm + minutes)
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function resolveActiveNodeId(item: CaseListItem, template: WorkflowTemplateNode[]): string {
  const lastId = template[template.length - 1].id

  if (item.listStatus === 'ABORTED') return resolveActiveNodeId({ ...item, listStatus: 'PROCESSING' }, template)
  if (item.listStatus === 'EXPORTED' || item.export) return lastId
  if (item.status === 'QUALITY_REJECTED') return 'intake'
  if (item.listStatus === 'SUPPLEMENT') return 'deficiency'
  if (item.pendingStage === 'export' || item.listStatus === 'COMPLETED') return 'output'
  if (item.pendingStage === 'verification' || item.status === 'VERIFYING') {
    return item.pendingStage === 'verification' ? 'verify_review' : 'benefit_check'
  }
  if (item.pendingStage === 'ocr' || item.status === 'OCR_EXTRACTING') {
    return item.pendingStage === 'ocr' ? 'ocr_review' : 'ocr'
  }
  if (item.pendingStage === 'preprocess' || item.status === 'PREPROCESSING') return 'preprocess'
  if (item.listStatus === 'PROCESSING') {
    if (!item.preprocess) return 'preprocess'
    if (!item.ocr) return 'ocr'
    return template.some((node) => node.id === 'readiness') ? 'readiness' : 'benefit_check'
  }
  if (item.listStatus === 'WAITING') return 'intake'
  return 'intake'
}

function buildNodeStatuses(
  template: WorkflowTemplateNode[],
  activeNodeId: string,
  item: CaseListItem
): CaseWorkflowNode[] {
  const activeIndex = template.findIndex((node) => node.id === activeNodeId)
  const isArchived = item.listStatus === 'EXPORTED' || Boolean(item.export)

  return template.map((node, index) => {
    if (isArchived) return { ...node, status: 'done' as const }
    if (index < activeIndex) return { ...node, status: 'done' as const }
    if (index === activeIndex) return { ...node, status: 'active' as const }
    return { ...node, status: 'pending' as const }
  })
}

function stageOutcomeForNode(nodeId: string, item: CaseListItem): StageOutcome | null {
  switch (nodeId) {
    case 'preprocess':
      return item.preprocess
    case 'ocr':
    case 'ocr_review':
      return item.ocr
    case 'benefit_check':
    case 'verify_review':
      return item.verification
    case 'output':
      return item.export
    default:
      return null
  }
}

function isManualReviewNode(nodeId: string, item: CaseListItem): boolean {
  if (nodeId === 'ocr_review') return item.listStatus === 'MANUAL_REVIEW' && item.pendingStage === 'ocr'
  if (nodeId === 'verify_review') {
    return item.listStatus === 'MANUAL_REVIEW' && item.pendingStage === 'verification'
  }
  return false
}

function ocrReviewPathTaken(item: CaseListItem): boolean {
  if (item.pendingStage === 'ocr') return true
  if (item.ocr?.operator && item.ocr.operator !== AUTO) return true
  return false
}

function deficiencyPathTaken(item: CaseListItem): boolean {
  return item.listStatus === 'SUPPLEMENT' || item.status === 'PENDING_SUPPLEMENT'
}

function verifyReviewPathTaken(item: CaseListItem): boolean {
  if (deficiencyPathTaken(item)) return false
  if (item.pendingStage === 'verification') return true
  if (item.verification?.operator && item.verification.operator !== AUTO) return true
  return false
}

function verifyDirectPathTaken(item: CaseListItem): boolean {
  if (deficiencyPathTaken(item)) return false
  if (verifyReviewPathTaken(item)) return false
  return Boolean(item.verification || item.export || item.listStatus === 'COMPLETED' || item.listStatus === 'EXPORTED')
}

const NODE_KIND: Record<string, FlowNodeKind> = {
  intake: 'task',
  preprocess: 'task',
  ocr: 'task',
  ocr_gate: 'condition',
  ocr_review: 'hitl',
  readiness: 'condition',
  contract_api: 'task',
  benefit_check: 'task',
  verify_gate: 'condition',
  verify_review: 'hitl',
  deficiency: 'task',
  output: 'task'
}

function flowchartNodeLabel(nodeId: string, map: Record<string, WorkflowCanvasNodeKey>): string {
  const key = map[nodeId]
  return key ? workflowCanvasNodeLabel(key) : workflowNodeLabel(nodeId)
}

function canvasKeyMapForCase(caseType: string): Record<string, WorkflowCanvasNodeKey> {
  return caseType === '保全' ? SIMPLE_FLOWCHART_CANVAS_KEY : CLAIM_FLOWCHART_CANVAS_KEY
}

function canvasRecordLabel(nodeId: string, caseType: string): string | null {
  const map = canvasKeyMapForCase(caseType)
  const key = map[nodeId]
  return key ? workflowCanvasNodeLabel(key) : null
}

function visualStatusForNode(
  nodeId: string,
  item: CaseListItem,
  record: CaseWorkflowNodeRecord | undefined,
  activeNodeId: string
): FlowNodeVisualStatus {
  if (nodeId === 'ocr_review' && !ocrReviewPathTaken(item)) return 'branch-skip'
  if (nodeId === 'verify_review' && !verifyReviewPathTaken(item)) return 'branch-skip'
  if (nodeId === 'deficiency' && !deficiencyPathTaken(item)) return 'branch-skip'

  if (nodeId === activeNodeId) return 'active'
  if (record?.recordStatus === '処理完了' || record?.recordStatus === 'スキップ') return 'done'
  if (record?.recordStatus === '処理中' || record?.recordStatus === '処理失敗') return 'active'
  return 'unreached'
}

function buildClaimFlowchart(
  item: CaseListItem,
  nodeRecords: CaseWorkflowNodeRecord[],
  activeNodeId: string
): CaseWorkflowFlowchart {
  const recordMap = new Map(nodeRecords.map((r) => [r.id, r]))
  const nodeIds = [
    'preprocess',
    'ocr',
    'ocr_gate',
    'ocr_review',
    'contract_api',
    'benefit_check',
    'verify_gate',
    'verify_review',
    'output'
  ]

  const nodes = Object.fromEntries(
    nodeIds.map((id) => {
      const record = recordMap.get(id)
      return [
        id,
        {
          id,
          label: flowchartNodeLabel(id, CLAIM_FLOWCHART_CANVAS_KEY),
          kind: NODE_KIND[id] ?? 'task',
          status: visualStatusForNode(id, item, record, activeNodeId)
        } satisfies FlowchartNodeView
      ]
    })
  ) as Record<string, FlowchartNodeView>

  const pathNotes: string[] = []
  pathNotes.push(
    ocrReviewPathTaken(item)
      ? t('case.workflow.pathNote.ocrRequired')
      : t('case.workflow.pathNote.ocrSkipped')
  )
  if (deficiencyPathTaken(item)) {
    pathNotes.push(t('case.workflow.pathNote.verifyDeficiency'))
  } else if (verifyReviewPathTaken(item)) {
    pathNotes.push(t('case.workflow.pathNote.verifyRequired'))
  } else if (verifyDirectPathTaken(item)) {
    pathNotes.push(t('case.workflow.pathNote.verifySkipped'))
  }

  return {
    layout: 'claim',
    nodes,
    edges: buildClaimEdges(item, nodes, activeNodeId, recordMap),
    pathNotes
  }
}

function edgeInvolvesActive(from: string, to: string, activeNodeId: string): boolean {
  return from === activeNodeId || to === activeNodeId
}

function edgeStateForPath(
  taken: boolean,
  from: string,
  to: string,
  activeNodeId: string
): FlowEdgeState {
  if (edgeInvolvesActive(from, to, activeNodeId)) return 'active'
  return taken ? 'taken' : 'unused'
}

function nodeReached(status: FlowNodeVisualStatus): boolean {
  return status === 'done' || status === 'active'
}

function buildClaimEdges(
  item: CaseListItem,
  nodes: Record<string, FlowchartNodeView>,
  activeNodeId: string,
  _recordMap: Map<string, CaseWorkflowNodeRecord>
): FlowchartEdgeView[] {
  const ocrTaken = ocrReviewPathTaken(item)
  const verifyTaken = verifyReviewPathTaken(item)
  const directTaken = verifyDirectPathTaken(item)

  const trunkTaken = (from: string, to: string) =>
    nodeReached(nodes[from]?.status ?? 'unreached') && nodeReached(nodes[to]?.status ?? 'unreached')

  return [
    {
      id: 'preprocess-ocr',
      from: 'preprocess',
      to: 'ocr',
      state: edgeStateForPath(trunkTaken('preprocess', 'ocr'), 'preprocess', 'ocr', activeNodeId)
    },
    {
      id: 'ocr-ocr_gate',
      from: 'ocr',
      to: 'ocr_gate',
      state: edgeStateForPath(trunkTaken('ocr', 'ocr_gate'), 'ocr', 'ocr_gate', activeNodeId)
    },
    {
      id: 'ocr_gate-ocr_review',
      from: 'ocr_gate',
      to: 'ocr_review',
      state: edgeStateForPath(ocrTaken, 'ocr_gate', 'ocr_review', activeNodeId)
    },
    {
      id: 'ocr_gate-contract_api',
      from: 'ocr_gate',
      to: 'contract_api',
      state: edgeStateForPath(!ocrTaken, 'ocr_gate', 'contract_api', activeNodeId)
    },
    {
      id: 'ocr_review-contract_api',
      from: 'ocr_review',
      to: 'contract_api',
      state: edgeStateForPath(ocrTaken, 'ocr_review', 'contract_api', activeNodeId)
    },
    {
      id: 'contract_api-benefit_check',
      from: 'contract_api',
      to: 'benefit_check',
      state: edgeStateForPath(
        trunkTaken('contract_api', 'benefit_check'),
        'contract_api',
        'benefit_check',
        activeNodeId
      )
    },
    {
      id: 'benefit_check-verify_gate',
      from: 'benefit_check',
      to: 'verify_gate',
      state: edgeStateForPath(
        trunkTaken('benefit_check', 'verify_gate'),
        'benefit_check',
        'verify_gate',
        activeNodeId
      )
    },
    {
      id: 'verify_gate-verify_review',
      from: 'verify_gate',
      to: 'verify_review',
      state: edgeStateForPath(verifyTaken, 'verify_gate', 'verify_review', activeNodeId)
    },
    {
      id: 'verify_gate-output',
      from: 'verify_gate',
      to: 'output',
      state: edgeStateForPath(directTaken, 'verify_gate', 'output', activeNodeId)
    },
    {
      id: 'verify_review-output',
      from: 'verify_review',
      to: 'output',
      state: edgeStateForPath(verifyTaken, 'verify_review', 'output', activeNodeId)
    },
  ]
}

function buildSimpleEdges(
  nodeRecords: CaseWorkflowNodeRecord[],
  activeNodeId: string
): FlowchartEdgeView[] {
  const edges: FlowchartEdgeView[] = []
  for (let i = 0; i < nodeRecords.length - 1; i++) {
    const from = nodeRecords[i]
    const to = nodeRecords[i + 1]
    const taken =
      from.recordStatus !== 'スキップ' &&
      to.recordStatus !== 'スキップ' &&
      (from.recordStatus === '処理完了' || from.id === activeNodeId)
    edges.push({
      id: `${from.id}-${to.id}`,
      from: from.id,
      to: to.id,
      state: edgeStateForPath(taken, from.id, to.id, activeNodeId)
    })
  }
  return edges
}

function buildSimpleFlowchart(
  item: CaseListItem,
  nodeRecords: CaseWorkflowNodeRecord[],
  activeNodeId: string
): CaseWorkflowFlowchart {
  const simpleIds = nodeRecords
    .map((record) => record.id)
    .filter((id) => SIMPLE_FLOWCHART_CANVAS_KEY[id])

  const nodes = Object.fromEntries(
    simpleIds.map((id) => {
      const record = nodeRecords.find((r) => r.id === id)
      return [
        id,
        {
          id,
          label: flowchartNodeLabel(id, SIMPLE_FLOWCHART_CANVAS_KEY),
          kind: NODE_KIND[id] ?? 'task',
          status: visualStatusForNode(id, item, record, activeNodeId)
        } satisfies FlowchartNodeView
      ]
    })
  ) as Record<string, FlowchartNodeView>

  const filteredRecords = nodeRecords.filter((r) => simpleIds.includes(r.id))
  return {
    layout: 'simple',
    nodes,
    edges: buildSimpleEdges(filteredRecords, activeNodeId),
    pathNotes: []
  }
}

function buildWorkflowFlowchart(
  item: CaseListItem,
  nodeRecords: CaseWorkflowNodeRecord[],
  activeNodeId: string,
  template: WorkflowTemplateNode[]
): CaseWorkflowFlowchart {
  if (template.some((n) => n.id === 'ocr_gate')) {
    return buildClaimFlowchart(item, nodeRecords, activeNodeId)
  }
  return buildSimpleFlowchart(item, nodeRecords, activeNodeId)
}

function shouldSkipNode(nodeId: string, item: CaseListItem, activeIndex: number, index: number): boolean {
  if (index >= activeIndex) return false

  if (nodeId === 'ocr_review') {
    return item.ocr?.operator === AUTO && item.pendingStage !== 'ocr'
  }
  if (nodeId === 'verify_review') {
    return Boolean(item.verification?.operator === AUTO && item.pendingStage !== 'verification')
  }
  if (nodeId === 'deficiency') {
    return item.listStatus !== 'SUPPLEMENT' && item.status !== 'PENDING_SUPPLEMENT'
  }
  return false
}

function enteredAtForNode(
  index: number,
  item: CaseListItem,
  nodeRecords: CaseWorkflowNodeRecord[]
): string | null {
  if (index === 0) return item.receivedAt
  const prev = nodeRecords[index - 1]
  if (prev?.completedAt) return prev.completedAt
  return offsetTime(item.receivedAt, index * 12)
}

function nodeHasFileFailure(nodeId: string, item: CaseListItem): boolean {
  if (nodeId !== 'preprocess' && nodeId !== 'ocr') return false
  return item.files.some(
    (file) =>
      file.processStatus === 'PREPROCESS_FAILED' || file.processStatus === 'OCR_FAILED'
  )
}

function buildNodeRecords(
  template: WorkflowTemplateNode[],
  nodes: CaseWorkflowNode[],
  item: CaseListItem,
  activeNodeId: string
): CaseWorkflowNodeRecord[] {
  const activeIndex = template.findIndex((node) => node.id === activeNodeId)
  const records: CaseWorkflowNodeRecord[] = []

  template.forEach((node, index) => {
    const stepStatus = nodes[index]?.status ?? 'pending'
    const outcome = stageOutcomeForNode(node.id, item)
    const skipped = shouldSkipNode(node.id, item, activeIndex, index)

    let recordStatus: WorkflowNodeRecordStatus = '待機'
    let enteredAt: string | null = null
    let completedAt: string | null = null
    let operator: string | null = null

    if (skipped) {
      recordStatus = 'スキップ'
      enteredAt = enteredAtForNode(index, item, records)
      completedAt = enteredAt ? offsetTime(enteredAt, 1) : null
      operator = AUTO
    } else if (stepStatus === 'done') {
      recordStatus = '処理完了'
      enteredAt = enteredAtForNode(index, item, records)
      if (node.id === 'intake') {
        completedAt = enteredAt ? offsetTime(enteredAt, 2) : null
        operator = AUTO
      } else if (WORKFLOW_AUTO_NODES.has(node.id)) {
        completedAt = enteredAt ? offsetTime(enteredAt, node.id === 'preprocess' ? 8 : 1) : null
        operator = AUTO
      } else if (outcome) {
        completedAt = outcome.processedAt
        operator = outcome.operator
      } else {
        completedAt = enteredAt ? offsetTime(enteredAt, 15) : null
        operator = AUTO
      }
    } else if (stepStatus === 'active') {
      enteredAt = enteredAtForNode(index, item, records)
      if (item.status === 'QUALITY_REJECTED' && node.id === 'intake') {
        recordStatus = '処理失敗'
      } else if (nodeHasFileFailure(node.id, item)) {
        recordStatus = '処理失敗'
      } else if (isManualReviewNode(node.id, item)) {
        recordStatus = '処理中'
        operator = item.pendingStage === 'preprocess' || item.pendingStage === 'ocr' ? OP : AUTO
      } else if (item.listStatus === 'COMPLETED' && node.id === 'output') {
        recordStatus = '処理中'
      } else if (item.listStatus === 'SUPPLEMENT' && node.id === 'deficiency') {
        recordStatus = '処理中'
        operator = AUTO
      } else {
        recordStatus = '処理中'
        operator = AUTO
      }
    }

    records.push({
      id: node.id,
      label: node.label,
      stepStatus: skipped ? 'done' : stepStatus,
      recordStatus,
      enteredAt,
      completedAt,
      operator,
      remark: item.nodeRemarks?.[node.id] ?? null
    })
  })

  return records
}

function buildTraversedNodeRecords(
  nodeRecords: CaseWorkflowNodeRecord[],
  item: CaseListItem
): CaseWorkflowNodeRecord[] {
  const canvasMap = canvasKeyMapForCase(item.caseType)

  return nodeRecords
    .filter((record) => {
      if (record.recordStatus === 'スキップ' || record.recordStatus === '待機') {
        return false
      }
      if (record.id === 'ocr_review' && !ocrReviewPathTaken(item)) return false
      if (record.id === 'verify_review' && !verifyReviewPathTaken(item)) return false
      if (record.id === 'deficiency' && !deficiencyPathTaken(item)) return false
      return Boolean(canvasMap[record.id])
    })
    .map((record) => ({
      ...record,
      label: flowchartNodeLabel(record.id, canvasMap)
    }))
}

function buildFileProgress(
  item: CaseListItem,
  activeNodeId: string
): CaseWorkflowState['fileProgress'] {
  if (item.listStatus !== 'PROCESSING' || !item.files.length) return null
  if (!['preprocess', 'ocr', 'readiness'].includes(activeNodeId)) return null

  const total = item.files.length
  const completed = item.files.filter(
    (file) =>
      file.processStatus &&
      !['PREPROCESSING', 'PREPROCESS_REVIEW', 'OCR_EXTRACTING'].includes(file.processStatus)
  ).length
  if (completed <= 0 || completed >= total) return null
  return { completed, total }
}

/** ファイル処理明細：担当者 */
function fileOperator(status: CaseFileProcessStatus): string {
  if (!status) return '—'
  if (status === 'PREPROCESS_REVIEW' || status === 'OCR_REVIEW') return OP
  if (status === 'PREPROCESS_FAILED' || status === 'OCR_FAILED') {
    return '—'
  }
  return AUTO
}

export function buildCaseFileRecords(item: CaseListItem): CaseFileProcessRecord[] {
  return item.files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileType: file.fileType,
    statusLabel: caseFileProcessStatusLabel(file.processStatus),
    statusClass: caseFileProcessStatusClass(file.processStatus),
    enteredAt: file.uploadedAt,
    updatedAt: file.updatedAt,
    operator: fileOperator(file.processStatus)
  }))
}

export function workflowNodeRecordStatusClass(status: WorkflowNodeRecordStatus): string {
  if (status === '処理完了') return 'is-positive'
  if (status === '処理失敗') return 'is-negative'
  if (status === '処理中') return 'is-attention'
  return 'is-muted'
}

export function buildCaseWorkflow(item: CaseListItem): CaseWorkflowState {
  const template = getWorkflowTemplate(item.caseType)
  const currentNodeId = resolveActiveNodeId(item, template)
  const nodes = buildNodeStatuses(template, currentNodeId, item)
  const nodeRecords = buildNodeRecords(template, nodes, item, currentNodeId)
  const stepperNodes = nodes.filter((_, index) => nodeRecords[index]?.recordStatus !== 'スキップ')
  const traversedNodeRecords = buildTraversedNodeRecords(nodeRecords, item)
  const flowchart = buildWorkflowFlowchart(item, nodeRecords, currentNodeId, template)
  const currentNode = nodes.find((node) => node.id === currentNodeId)
  const currentCanvasLabel = canvasRecordLabel(currentNodeId, item.caseType)

  return {
    currentNodeId,
    currentNodeLabel: currentCanvasLabel ?? currentNode?.label ?? '—',
    nodes,
    stepperNodes,
    nodeRecords,
    traversedNodeRecords,
    flowchart,
    fileProgress: buildFileProgress(item, currentNodeId)
  }
}
