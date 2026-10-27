/** 数据映射设置页 UI 文案（中日对照） */
export const businessRulesDataMappingJa = {
  field: {
    docType: '帳票タイプ',
    field: 'フィールド',
    standardField: '標準変数',
    displayLabel: '表示名',
    standardizationRule: 'マッピングルール',
    consistencyCheck: 'データ整合性検証',
    ocrField: 'OCRフィールド',
    updatedAt: '更新日時'
  },
  action: {
    clear: 'クリア',
    add: '追加',
    reset: 'リセット',
    edit: '編集',
    delete: '削除',
    cancel: 'キャンセル',
    optimizeRule: 'AIルール最適化'
  },
  column: {
    no: 'No.',
    action: '操作'
  },
  placeholder: {
    selectDocTypeFirst: '先に帳票タイプを選択',
    standardFieldExample: '例：insured_name',
    displayLabelExample: '例：被保険者氏名',
    ruleExample: 'フィールド選択で ｛｛帳票タイプ.フィールド名｝｝ を自動挿入。表示名入力後は「AIルール最適化」で標準フォーマットへ整形可能',
    searchSubjects: '標準変数・表示名・OCRフィールド・マッピングルール'
  },
  ruleTemplate: {
    sectionSources: '1. ソースフィールド（優先度順）',
    sectionIdentity: '2. 同一性判定',
    sectionAssign: '3. 値の設定',
    identityMulti: '上記ソースはすべて同一の標準変数を指すこと。',
    identitySingle: '単一ソースのため、ソース間の同一性判定は不要。',
    assignSame:
      '同一と判定：優先度順に最初の非空 OCR 抽出値を当該標準変数へ設定する。',
    assignDiff: '同一でないと判定：当該標準変数は空とする。',
    assignSingle: '当該ソースの OCR 抽出値が非空なら当該標準変数へ設定；空なら留空。'
  },
  status: {
    needsFix: '要修正'
  },
  dialog: {
    editTitle: 'マッピング編集'
  },
  message: {
    standardFieldRequired: '標準変数を入力してください',
    standardFieldFormat: '標準変数は英小文字・アンダースコアのみ使用できます',
    displayLabelRequired: '表示名を入力してください',
    ocrFieldRequired: 'OCRフィールドを1件以上選択してください',
    duplicateStandardField: '同じ標準変数のマッピングが既に存在します',
    ruleMaxLength: 'マッピングルールは{max}文字以内で入力してください',
    updated: 'マッピングを更新しました',
    added: 'マッピングを追加しました',
    ocrFieldsInvalid: 'OCRフィールドがすべて無効になりました。再選択してください',
    deleteConfirm: '標準変数「{name}」のマッピングを削除しますか？',
    deleteTitle: '削除確認',
    deleted: 'マッピングを削除しました',
    optimizeNeedsSources: '表示名と OCR フィールドを選択してください',
    ruleOptimized: '標準フォーマットに最適化しました'
  }
}

export const businessRulesDataMappingZh = {
  field: {
    docType: '账票类型',
    field: '字段',
    standardField: '标准变量',
    displayLabel: '显示名',
    standardizationRule: '映射规则',
    consistencyCheck: '数据一致性检证',
    ocrField: 'OCR 字段',
    updatedAt: '更新时间'
  },
  action: {
    clear: '清空',
    add: '添加',
    reset: '重置',
    edit: '编辑',
    delete: '删除',
    cancel: '取消',
    optimizeRule: 'AI 规则优化'
  },
  column: {
    no: 'No.',
    action: '操作'
  },
  placeholder: {
    selectDocTypeFirst: '请先选择账票类型',
    standardFieldExample: '例：insured_name',
    displayLabelExample: '例：被保险人姓名',
    ruleExample: '选择字段后自动插入 ｛｛账票类型.字段名｝｝；填写显示名后可点「AI 规则优化」生成标准格式',
    searchSubjects: '标准变量、显示名、OCR 字段、映射规则'
  },
  ruleTemplate: {
    sectionSources: '1. 来源字段（优先级从高到低）',
    sectionIdentity: '2. 同一性判定',
    sectionAssign: '3. 赋值',
    identityMulti: '以上来源字段须语义上指代同一标准变量。',
    identitySingle: '仅单一来源，无需跨来源同一性判定。',
    assignSame: '判定为同一：按上述优先级取第一个非空 OCR 抽出值写入该标准变量。',
    assignDiff: '判定不是同一：该标准变量留空。',
    assignSingle: '该来源 OCR 抽出值非空则写入该标准变量；否则留空。'
  },
  status: {
    needsFix: '需修正'
  },
  dialog: {
    editTitle: '编辑映射'
  },
  message: {
    standardFieldRequired: '请输入标准变量',
    standardFieldFormat: '标准变量仅可使用小写英文字母与下划线',
    displayLabelRequired: '请输入显示名',
    ocrFieldRequired: '请至少选择一个 OCR 字段',
    duplicateStandardField: '已存在相同标准变量的映射',
    ruleMaxLength: '映射规则请在 {max} 字以内输入',
    updated: '已更新映射',
    added: '已添加映射',
    ocrFieldsInvalid: 'OCR 字段均已失效，请重新选择',
    deleteConfirm: '确定删除标准变量「{name}」的映射吗？',
    deleteTitle: '删除确认',
    deleted: '已删除映射',
    optimizeNeedsSources: '请先填写显示名并选择 OCR 字段',
    ruleOptimized: '已优化为标准格式'
  }
}
