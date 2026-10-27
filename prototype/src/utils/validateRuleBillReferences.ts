import { caseScenarios, getCaseScenarioById } from '@/constants/caseScenarios'
import { dataMappingRules } from '@/mocks/dataMapping'
import {
  STANDARD_FIELD_BELONG_DOC_TYPE,
  type RuleScope
} from '@/mocks/verificationRuleConfig'

export interface RuleParameterRef {
  docType: string
  isStandard: boolean
  standardField?: string
  displayLabel?: string
  fieldLabel?: string
}

export interface RuleBillValidationError {
  messageKey: string
  params: Record<string, string>
}

export function isRuleScopeConfigured(scope: RuleScope, sceneIds: string[]): boolean {
  if (scope === 'all_scenes') return true
  return scope === 'selected_scenes' && sceneIds.length > 0
}

export function getScenesForRuleScope(scope: RuleScope, sceneIds: string[]): string[] {
  if (scope === 'all_scenes') {
    return caseScenarios().map((scene) => scene.id)
  }
  return sceneIds
}

export function validateDocTypesInScope(
  scope: RuleScope,
  sceneIds: string[],
  docTypes: string[]
): RuleBillValidationError | null {
  const scenes = getScenesForRuleScope(scope, sceneIds)
  const uniqueDocTypes = [
    ...new Set(
      docTypes.filter((docType) => docType && docType !== STANDARD_FIELD_BELONG_DOC_TYPE)
    )
  ]

  for (const sceneId of scenes) {
    const scene = getCaseScenarioById(sceneId)
    if (!scene) continue

    for (const docType of uniqueDocTypes) {
      if (!scene.docTypes.includes(docType)) {
        return {
          messageKey: 'businessRules.verification.message.sceneDocTypeNotLinked',
          params: { sceneName: scene.name, docTypeName: docType }
        }
      }
    }
  }

  return null
}

export function validateStandardFieldsInScope(
  scope: RuleScope,
  sceneIds: string[],
  fields: { standardField: string; displayLabel: string }[]
): RuleBillValidationError | null {
  const scenes = getScenesForRuleScope(scope, sceneIds)
  const uniqueFields = new Map<string, { standardField: string; displayLabel: string }>()
  for (const field of fields) {
    if (!field.standardField) continue
    uniqueFields.set(field.standardField, field)
  }

  for (const sceneId of scenes) {
    const scene = getCaseScenarioById(sceneId)
    if (!scene) continue

    const sceneDocTypes = new Set(scene.docTypes)

    for (const field of uniqueFields.values()) {
      const mappingRule = dataMappingRules.value.find(
        (rule) => rule.standardField === field.standardField
      )
      if (!mappingRule) continue

      const hasSourceInScene = mappingRule.sources.some((source) =>
        sceneDocTypes.has(source.docType)
      )
      if (!hasSourceInScene) {
        return {
          messageKey: 'businessRules.verification.message.sceneStandardFieldNoSource',
          params: { sceneName: scene.name, displayLabel: field.displayLabel }
        }
      }
    }
  }

  return null
}

export function validateRuleBillReferences(input: {
  scope: RuleScope
  sceneIds: string[]
  docTypes?: string[]
  standardFields?: { standardField: string; displayLabel: string }[]
}): RuleBillValidationError | null {
  if (!isRuleScopeConfigured(input.scope, input.sceneIds)) {
    return { messageKey: 'businessRules.verification.message.selectApplyScene', params: {} }
  }

  const docError = validateDocTypesInScope(
    input.scope,
    input.sceneIds,
    input.docTypes ?? []
  )
  if (docError) return docError

  return validateStandardFieldsInScope(
    input.scope,
    input.sceneIds,
    input.standardFields ?? []
  )
}

export function parseParameterRefsFromDescription(description: string): RuleParameterRef[] {
  const results: RuleParameterRef[] = []
  const seen = new Set<string>()

  for (const match of description.matchAll(/\{\{([^{}]+)\}\}/g)) {
    const inner = match[1].trim()
    const dot = inner.indexOf('.')
    if (dot < 0) continue

    const prefix = inner.slice(0, dot)
    const label = inner.slice(dot + 1)

    if (prefix === '標準') {
      const rule = dataMappingRules.value.find((item) => item.displayLabel === label)
      if (!rule) continue

      const key = `std:${rule.standardField}`
      if (seen.has(key)) continue
      seen.add(key)

      results.push({
        docType: STANDARD_FIELD_BELONG_DOC_TYPE,
        isStandard: true,
        standardField: rule.standardField,
        displayLabel: rule.displayLabel
      })
      continue
    }

    const key = `doc:${prefix}:${label}`
    if (seen.has(key)) continue
    seen.add(key)

    results.push({
      docType: prefix,
      isStandard: false,
      fieldLabel: label
    })
  }

  return results
}

export function refsToValidationInput(refs: RuleParameterRef[]): {
  docTypes: string[]
  standardFields: { standardField: string; displayLabel: string }[]
} {
  const docTypes: string[] = []
  const standardFields: { standardField: string; displayLabel: string }[] = []

  for (const ref of refs) {
    if (ref.isStandard && ref.standardField && ref.displayLabel) {
      standardFields.push({
        standardField: ref.standardField,
        displayLabel: ref.displayLabel
      })
    } else if (!ref.isStandard && ref.docType) {
      docTypes.push(ref.docType)
    }
  }

  return { docTypes, standardFields }
}
