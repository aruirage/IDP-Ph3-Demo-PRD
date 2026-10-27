export function insertTokenAtCursor(
  current: string,
  token: string,
  textarea?: HTMLTextAreaElement | null
): string {
  if (!textarea) {
    return current ? `${current}${current.endsWith(' ') ? '' : ' '}${token}` : token
  }
  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  const before = current.slice(0, start)
  const after = current.slice(end)
  const spacerBefore = before && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
  const spacerAfter = after && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : ''
  return `${before}${spacerBefore}${token}${spacerAfter}${after}`
}

export function formatStandardFieldToken(displayLabel: string): string {
  return `{{標準.${displayLabel}}}`
}

export function formatDocFieldToken(docType: string, fieldLabel: string): string {
  return `{{${docType}.${fieldLabel}}}`
}

/** 数据检证：将自然语言描述优化为带占位符的公式（原型 mock） */
export function buildOptimizedDataRuleFormula(raw: string): string {
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  if (!trimmed) return trimmed

  if (/\{\{[^{}]+\}\}/.test(trimmed)) {
    return trimmed
      .replace(/\s*([=＝+\-−×*/÷≥≤<>])\s*/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (/合計点数|合计点数/.test(trimmed) && /初・再診|医学管理|手術/.test(trimmed)) {
    return '{{領収書・診療明細書.合計点数}} = {{領収書・診療明細書.初・再診料点数}} + {{領収書・診療明細書.医学管理等点数}} + {{領収書・診療明細書.手術点数}}'
  }

  if (/入院日数|住院天数/.test(trimmed)) {
    return '{{保険金請求書.入院日数}} = {{保険金請求書.退院日}} − {{保険金請求書.入院日}} + 1'
  }

  if (/退院日/.test(trimmed) && /入院日/.test(trimmed) && (/≥|>=|以上/.test(trimmed) || /手術|手术/.test(trimmed))) {
    return '{{診断書.退院日}} ≥ {{診断書.入院日}}'
  }

  if (/点数/.test(trimmed) && /合計|合计/.test(trimmed)) {
    return '{{領収書.保険点数合計}} = SUM({{調剤明細書.点数}})'
  }

  if (/請求金額|请求金额/.test(trimmed) && /保険点数|保险点数/.test(trimmed)) {
    return '{{領収書.請求金額}} = {{領収書.保険点数合計}} × 10 × {{領収書.負担割合}}'
  }

  return trimmed
}
