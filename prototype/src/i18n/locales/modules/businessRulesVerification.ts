/** AI 检证设置页 UI 文案（中日对照） */
export const businessRulesVerificationJa = {
  standardFieldDocType: '標準フィールド',
  scope: {
    label: '適用シーン',
    allScenes: '全シーン',
    scenesUnset: '指定シーン（未設定）'
  },
  field: {
    docType: '帳票タイプ',
    field: 'フィールド',
    standardField: '標準変数',
    displayName: '表示名',
    selectedFields: '選択フィールド',
    ruleName: 'ルール名',
    ruleDescription: 'ルール記述',
    ruleType: 'ルール種別',
    targetDoc: '対象帳票',
    detectionTarget: '検出対象',
    compareTarget: '照合先',
    verificationMode: '検証内容',
    required: '必須',
    optional: '任意',
    updatedAt: '更新日時'
  },
  toggle: {
    no: 'いいえ',
    yes: 'はい'
  },
  action: {
    insert: '挿入',
    clear: 'クリア',
    add: '追加',
    reset: 'リセット',
    edit: '編集',
    delete: '削除',
    cancel: 'キャンセル',
    update: '更新',
    saveUpdate: '保存更新',
    optimizeRule: 'AIルール最適化',
    batchAdd: '一括追加',
    batchAddWithCount: '一括追加（{count} 件）',
    save: '保存'
  },
  column: {
    no: 'No.',
    action: '操作',
    status: '状態',
    fieldName: 'フィールド名',
    belongDocType: '帳票タイプ',
    applyScene: '適用業務シーン',
    applySceneShort: '適用シーン',
    ocrField: 'OCRフィールド',
    standardizationRule: '標準化ルール'
  },
  section: {
    batchAdd: 'ルール一括追加',
    ruleAdd: 'ルール追加',
    ruleList: 'ルール一覧',
    requiredDocs: '必要書類',
    editTarget: '編集対象'
  },
  count: {
    selected: '{count} 件選択',
    rules: '{count} 件',
    docs: '帳票 {count} 件'
  },
  placeholder: {
    ruleDescriptionExample: '例：保険金請求書の備考に「不備」が含まれないこと',
    searchFieldRule: 'フィールド名・帳票タイプ・適用シーン',
    searchRuleList: 'ルール名・ルール記述・適用シーン',
    searchSealRule: 'ルール名・対象帳票・照合先・適用シーン'
  },
  options: {
    fieldAdded: '追加済',
    fieldPending: '未追加',
    notSet: '未設定',
    detectionSeal: '印鑑',
    detectionSignature: '署名',
    detectionBoth: '両方',
    presenceOnly: '存在のみ',
    presenceAndContent: '存在と内容照合'
  },
  completeness: {
    requiredCount: '必須 {count}',
    optionalCount: '任意 {count}',
    conditionalCount: '条件付き {count}',
    conditional: '条件付き',
    enabled: '有効'
  },
  atomic: {
    note: 'ライブラリの原子ルールです。内容の編集はルールライブラリで行います。',
    empty: '適用ルールなし'
  },
  dialog: {
    editRule: 'ルール編集'
  },
  kind: {
    text: 'テキスト検証',
    data: 'データ検証'
  },
  message: {
    selectFieldsToAdd: '追加するフィールドを選択してください',
    selectApplyScene: '適用シーンを選択してください',
    batchAdded: '{count} 件を追加しました',
    updated: '更新しました',
    deleted: '削除しました',
    added: '追加しました',
    deleteConfirm: 'このルールを削除しますか？',
    deleteTitle: '削除確認',
    ruleNameRequired: 'ルール名を入力してください',
    ruleNameMaxLength: 'ルール名は{max}文字以内で入力してください',
    ruleDescriptionRequired: 'ルール記述を入力してください',
    ruleDescriptionMaxLength: 'ルール記述は{max}文字以内で入力してください',
    ruleOptimized: 'AIルールを最適化しました',
    selectTargetDoc: '対象帳票を選択してください',
    selectCompareTarget: '照合先を選択してください',
    sceneDocTypeNotLinked:
      '業務シーン{sceneName}は帳票タイプ{docTypeName}と未関連付けのため、ルール設定は無効です',
    sceneStandardFieldNoSource:
      '業務シーン{sceneName}では標準フィールド{displayLabel}に利用可能なマッピング元がありません。ルール設定は無効です',
    emptyRules: '該当するルールがありません',
    saved: '保存しました'
  },
  consistency: {
    empty: '来源が 2 件以上のマッピングルールがありません',
    selectAllAria: 'データ整合性検証をすべて選択または解除'
  }
}

export const businessRulesVerificationZh = {
  standardFieldDocType: '标准字段',
  scope: {
    label: '适用场景',
    allScenes: '全部场景',
    scenesUnset: '指定场景（未设置）'
  },
  field: {
    docType: '账票类型',
    field: '字段',
    standardField: '标准变量',
    displayName: '显示名',
    selectedFields: '已选字段',
    ruleName: '规则名',
    ruleDescription: '规则描述',
    ruleType: '规则类型',
    targetDoc: '对象账票',
    detectionTarget: '检测对象',
    compareTarget: '照合目标',
    verificationMode: '检证内容',
    required: '必填',
    optional: '可选',
    updatedAt: '更新时间'
  },
  toggle: {
    no: '否',
    yes: '是'
  },
  action: {
    insert: '插入',
    clear: '清空',
    add: '添加',
    reset: '重置',
    edit: '编辑',
    delete: '删除',
    cancel: '取消',
    update: '更新',
    saveUpdate: '保存更新',
    optimizeRule: 'AI 规则优化',
    batchAdd: '批量添加',
    batchAddWithCount: '批量添加（{count} 项）',
    save: '保存'
  },
  column: {
    no: 'No.',
    action: '操作',
    status: '状态',
    fieldName: '字段名',
    belongDocType: '账票类型',
    applyScene: '适用业务场景',
    applySceneShort: '适用场景',
    ocrField: 'OCR 字段',
    standardizationRule: '标准化规则'
  },
  section: {
    batchAdd: '批量添加规则',
    ruleAdd: '添加规则',
    ruleList: '规则列表',
    requiredDocs: '必要书类',
    editTarget: '编辑对象'
  },
  count: {
    selected: '已选 {count} 项',
    rules: '{count} 项',
    docs: '账票 {count} 份'
  },
  placeholder: {
    ruleDescriptionExample: '例：保险金请求书备注中不得包含「不备」',
    searchFieldRule: '字段名、账票类型、适用场景',
    searchRuleList: '规则名、规则描述、适用场景',
    searchSealRule: '规则名、对象账票、照合目标、适用场景'
  },
  options: {
    fieldAdded: '已添加',
    fieldPending: '未添加',
    notSet: '未设置',
    detectionSeal: '印章',
    detectionSignature: '签名',
    detectionBoth: '两者',
    presenceOnly: '仅检证存在',
    presenceAndContent: '存在与内容照合'
  },
  completeness: {
    requiredCount: '必填 {count}',
    optionalCount: '可选 {count}',
    conditionalCount: '条件 {count}',
    conditional: '条件',
    enabled: '启用'
  },
  atomic: {
    note: '来自规则库的原子规则。请在规则库中编辑内容。',
    empty: '无适用规则'
  },
  dialog: {
    editRule: '编辑规则'
  },
  kind: {
    text: '文本检证',
    data: '数据检证'
  },
  message: {
    selectFieldsToAdd: '请选择要添加的字段',
    selectApplyScene: '请选择适用业务场景',
    batchAdded: '已添加 {count} 项',
    updated: '已更新',
    deleted: '已删除',
    added: '已添加',
    deleteConfirm: '确定删除此规则吗？',
    deleteTitle: '删除确认',
    ruleNameRequired: '请输入规则名',
    ruleNameMaxLength: '规则名请在 {max} 字以内',
    ruleDescriptionRequired: '请输入规则描述',
    ruleDescriptionMaxLength: '规则描述请在 {max} 字以内',
    ruleOptimized: '已优化 AI 规则',
    selectTargetDoc: '请选择对象账票',
    selectCompareTarget: '请选择照合目标',
    sceneDocTypeNotLinked:
      '业务场景{sceneName}尚未关联账票类型{docTypeName}，规则配置无效',
    sceneStandardFieldNoSource:
      '业务场景{sceneName}下标准字段{displayLabel}无可用映射来源，规则配置无效',
    emptyRules: '没有匹配的规则',
    saved: '已保存'
  },
  consistency: {
    empty: '没有来源 ≥2 的映射规则',
    selectAllAria: '全选或全不选数据一致性检证'
  }
}
