import { t } from '@/i18n/translate'

export const BUSINESS_SCENARIO_VALUES = [
  'CLAIM',
  'PRESERVATION',
  'NEW_BUSINESS',
  'POLICY_CHANGE',
  'CANCELLATION',
  'UNDERWRITING',
  'BENEFICIARY_CHANGE',
  'ADDRESS_CHANGE'
] as const

export type BusinessScenarioValue = (typeof BUSINESS_SCENARIO_VALUES)[number]

export function businessScenarioOptions() {
  return BUSINESS_SCENARIO_VALUES.map((value) => ({
    value,
    label: t(`case.scenario.${value}`)
  }))
}

/** @deprecated 互換用。新規は businessScenarioOptions() を使用 */
export const BUSINESS_SCENARIO_OPTIONS = businessScenarioOptions()

export function businessScenarioLabel(value: BusinessScenarioValue | ''): string {
  if (!value) return t('common.empty')
  return t(`case.scenario.${value}`)
}
