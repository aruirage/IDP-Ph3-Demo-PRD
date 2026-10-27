/** 演示用账票类型列表（数据映射、导出等模块复用） */
export const PREPROCESS_DOC_TYPES = [
  '保険金請求書',
  '診断書',
  '領収書・診療明細書',
  '本人確認書類',
  '入院証明書',
  'その他'
] as const

export type PreprocessDocType = (typeof PREPROCESS_DOC_TYPES)[number]
