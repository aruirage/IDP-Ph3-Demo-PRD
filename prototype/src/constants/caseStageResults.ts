export type PipelineStage = 'preprocess' | 'ocr' | 'verification' | 'export'

import { t } from '@/i18n/translate'

export function pipelineStageLabel(stage: PipelineStage): string {
  const keyMap: Record<PipelineStage, string> = {
    preprocess: 'case.stage.preprocess',
    ocr: 'case.stage.ocr',
    verification: 'case.stage.verification',
    export: 'case.stage.export'
  }
  return t(keyMap[stage])
}

/** 各工程の確定処理結果（一覧・詳細で共通） */
export interface StageOutcome {
  outcome: string
  operator: string
  processedAt: string
}

export function formatStageProcessedAt(value: string): string {
  const match = value.match(/^\d{4}-(\d{2}-\d{2} \d{2}:\d{2})/)
  return match ? match[1] : value
}
