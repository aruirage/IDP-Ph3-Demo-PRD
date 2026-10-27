/**
 * 业务场景设置 · 案件关联字段（按账票类型配置，演示用）
 * 手动校准弹窗根据所选账票类型展示对应关联键，字段名只读、仅可编辑字段值。
 */
export const DOC_TYPE_ASSOCIATION_KEYS: Record<string, readonly string[]> = {
  保険金請求書: ['請求番号', '被保険者氏名'],
  診断書: ['請求番号', '被保険者氏名'],
  '領収書・診療明細書': ['請求番号', '被保険者氏名'],
  本人確認書類: ['被保険者氏名'],
  入院証明書: ['請求番号', '被保険者氏名', '入院日'],
  その他: ['請求番号']
}

export function getDocTypeAssociationKeys(docType: string | null | undefined): string[] {
  if (!docType) return []
  return [...(DOC_TYPE_ASSOCIATION_KEYS[docType] ?? ['請求番号'])]
}
