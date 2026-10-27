/** 规则描述类字段（标准化规则、检证规则描述等）字符上限 */
export const RULE_DESCRIPTION_MAX_LENGTH = 2000

/** 检证规则名称字符上限 */
export const RULE_NAME_MAX_LENGTH = 80

export function isRuleDescriptionWithinLimit(text: string): boolean {
  return text.length <= RULE_DESCRIPTION_MAX_LENGTH
}

export function isRuleNameWithinLimit(text: string): boolean {
  return text.length <= RULE_NAME_MAX_LENGTH
}
