import { BUSINESS_SCENARIO_VALUES, businessScenarioLabel } from './businessScenarios'
import { t } from '@/i18n/translate'

/** 業務シーン：業務大类配置；各シーンに紐づく帳票タイプ */
export interface CaseScenario {
  id: string
  name: string
  description: string
  docTypes: string[]
}

const SCENARIO_META: Record<
  string,
  { descriptionKey?: string; docTypes: string[] }
> = {
  CLAIM: {
    docTypes: ['保険金請求書', '診断書', '領収書・診療明細書', '入院証明書', '調剤明細書']
  },
  NEW_BUSINESS: {
    docTypes: ['申込書', '本人確認書類', '健康告知書']
  },
  PRESERVATION: {
    docTypes: ['保全変更届', '本人確認書類']
  },
  POLICY_CHANGE: {
    docTypes: ['契約異動届', '本人確認書類']
  },
  CANCELLATION: {
    docTypes: ['解約届', '本人確認書類']
  },
  UNDERWRITING: {
    docTypes: ['申込書', '診断書', '本人確認書類']
  },
  BENEFICIARY_CHANGE: {
    docTypes: ['受取人変更届', '本人確認書類']
  },
  ADDRESS_CHANGE: {
    docTypes: ['住所変更届', '本人確認書類']
  }
}

export function caseScenarios(): CaseScenario[] {
  return BUSINESS_SCENARIO_VALUES.map((id) => {
    const meta = SCENARIO_META[id]
    const name = businessScenarioLabel(id)
    return {
      id,
      name,
      description: t('case.scenario.descSuffix', { name }),
      docTypes: meta?.docTypes ?? []
    }
  })
}

/** @deprecated 互換用。新規は caseScenarios() を使用 */
export const CASE_SCENARIOS = caseScenarios()

export function getCaseScenarioById(id: string): CaseScenario | undefined {
  return caseScenarios().find((s) => s.id === id)
}

export function getDocTypesForScenario(scenarioId: string): string[] {
  return getCaseScenarioById(scenarioId)?.docTypes ?? []
}

/** 全業務シーンに登場する帳票タイプ（重複除去・ソート） */
export function getAllDocTypes(): string[] {
  const types = new Set<string>()
  for (const scene of caseScenarios()) {
    for (const docType of scene.docTypes) types.add(docType)
  }
  return [...types].sort((a, b) => a.localeCompare(b, 'ja'))
}

export function getDocTypesForScenarioFilter(scenarioId: string): string[] {
  return scenarioId ? getDocTypesForScenario(scenarioId) : getAllDocTypes()
}

/** 多个业务场景关联账票类型的交集（排序） */
export function getDocTypesIntersectionForScenes(sceneIds: string[]): string[] {
  if (!sceneIds.length) return []

  const docTypeLists = sceneIds.map((id) => getDocTypesForScenario(id))
  if (docTypeLists.some((list) => !list.length)) return []

  let intersection = new Set(docTypeLists[0])
  for (let i = 1; i < docTypeLists.length; i++) {
    const next = new Set(docTypeLists[i])
    intersection = new Set([...intersection].filter((docType) => next.has(docType)))
  }
  return [...intersection].sort((a, b) => a.localeCompare(b, 'ja'))
}

/** 规则「适用业务场景」范围对应的账票类型候选项（各场景关联账票类型的交集） */
export function getDocTypesForRuleScope(
  scope: 'all_scenes' | 'selected_scenes',
  sceneIds: string[]
): string[] {
  if (scope === 'all_scenes') {
    return getDocTypesIntersectionForScenes(caseScenarios().map((scene) => scene.id))
  }
  return getDocTypesIntersectionForScenes(sceneIds)
}

export function isDocTypeInScenario(scenarioId: string, docType: string): boolean {
  return getDocTypesForScenario(scenarioId).includes(docType)
}
