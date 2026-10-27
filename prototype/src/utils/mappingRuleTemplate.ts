import { formatDocFieldToken } from '@/utils/verificationFormula'

export interface MappingRuleTemplateLabels {
  sectionSources: string
  sectionIdentity: string
  sectionAssign: string
  identityMulti: string
  identitySingle: string
  assignSame: string
  assignDiff: string
  assignSingle: string
}

export function mappingRuleTemplateLabelsJa(): MappingRuleTemplateLabels {
  return {
    sectionSources: '1. ソースフィールド（優先度順）',
    sectionIdentity: '2. 同一性判定',
    sectionAssign: '3. 値の設定',
    identityMulti: '上記ソースはすべて同一の標準変数を指すこと。',
    identitySingle: '単一ソースのため、ソース間の同一性判定は不要。',
    assignSame:
      '同一と判定：優先度順に最初の非空 OCR 抽出値を当該標準変数へ設定する。',
    assignDiff: '同一でないと判定：当該標準変数は空とする。',
    assignSingle: '当該ソースの OCR 抽出値が非空なら当該標準変数へ設定；空なら留空。'
  }
}

export function mappingRuleTemplateLabelsZh(): MappingRuleTemplateLabels {
  return {
    sectionSources: '1. 来源字段（优先级从高到低）',
    sectionIdentity: '2. 同一性判定',
    sectionAssign: '3. 赋值',
    identityMulti: '以上来源字段须语义上指代同一标准变量。',
    identitySingle: '仅单一来源，无需跨来源同一性判定。',
    assignSame: '判定为同一：按上述优先级取第一个非空 OCR 抽出值写入该标准变量。',
    assignDiff: '判定不是同一：该标准变量留空。',
    assignSingle: '该来源 OCR 抽出值非空则写入该标准变量；否则留空。'
  }
}

export function buildStandardMappingRuleText(
  _displayLabel: string,
  _standardField: string,
  sources: { docType: string; fieldLabel: string }[],
  labels: MappingRuleTemplateLabels
): string {
  const sourceLines =
    sources.length > 0
      ? sources
          .map((source) => `   - ${formatDocFieldToken(source.docType, source.fieldLabel)}`)
          .join('\n')
      : '   - （ソース未選択）'

  const identityBlock = sources.length <= 1 ? labels.identitySingle : labels.identityMulti

  const assignLines =
    sources.length <= 1 ? [labels.assignSingle] : [labels.assignSame, labels.assignDiff]

  return [
    labels.sectionSources,
    sourceLines,
    '',
    labels.sectionIdentity,
    `   - ${identityBlock}`,
    '',
    labels.sectionAssign,
    ...assignLines.map((line) => `   - ${line}`)
  ].join('\n')
}
