/** 主数据设置页 UI 文案（中日对照） */
export const businessRulesMasterDataJa = {
  list: {
    title: 'マスタ一覧',
    searchSubject: 'マスタ名',
    add: 'マスタ追加',
    empty: '該当するマスタがありません',
    selectHint: 'マスタを追加してください'
  },
  menu: {
    rename: '名称変更',
    history: '変更履歴',
    delete: '削除'
  },
  action: {
    save: '保存',
    cancel: 'キャンセル',
    add: '追加',
    delete: '削除',
    edit: '編集',
    columnSettings: '列設定',
    addData: '項目追加',
    batchImport: '一括インポート',
    batchDelete: '一括削除',
    retryVectorization: 'ベクトル化再実行',
    retry: '再ベクトル化',
    close: '閉じる',
    refresh: '更新',
    addColumn: '列を追加',
    downloadTemplate: 'テンプレートをダウンロード',
    selectFile: 'ファイル選択'
  },
  field: {
    masterName: 'マスタ名',
    queryCode: '照会コード',
    updatedAt: '更新日時'
  },
  column: {
    index: '番号',
    aiAnalysis: 'AI分析',
    vectorizationStatus: 'ベクトル化状態',
    action: '操作',
    actionProcess: '操作・処理',
    defaultName: '列{index}',
    defaultCode: 'コード',
    defaultNameLabel: '名称',
    count: '{current} / {max} 列'
  },
  placeholder: {
    masterNameExample: '例：傷病名マスタ',
    searchData: 'マスタ名'
  },
  pagination: {
    resultTotal: '検索結果 {count} 件中'
  },
  empty: {
    noData: 'データがありません。データ追加または一括インポートしてください'
  },
  history: {
    titleSuffix: 'の変更履歴',
    occurredAt: '日時',
    action: '操作',
    operator: '操作者',
    detail: '内容'
  },
  vectorization: {
    pending: '未処理',
    processing: '処理中',
    completed: '完了',
    failed: '失敗'
  },
  import: {
    title: '一括インポート',
    templateSection: 'テンプレートをダウンロード',
    templateDesc: '標準テンプレートファイルをダウンロードし、サンプルに沿ってデータを記入してください',
    uploadSection: 'マスタファイルをアップロード',
    dropzone: 'ここにファイルをドラッグ/ドロップ',
    dropzoneHint:
      '最大10MB。ファイル形式は、xlsx、xls、csv です。1回のインポートは最大{maxRows}行、列数は最大{maxColumns}列です',
    updateMode: 'データ更新の方式を選択',
    append: '追加更新',
    overwrite: '上書更新'
  },
  message: {
    nameRequired: 'マスタ名を入力してください',
    masterAdded: 'マスタを追加しました',
    renamed: '名称を変更しました',
    deleteConfirm: 'マスタ「{name}」を削除しますか？',
    deleteTitle: '削除確認',
    masterDeleted: 'マスタを削除しました',
    columnMax: '列は最大 {max} 列までです',
    columnMin: '列は最低 1 列必要です',
    columnNameRequired: '列名を入力してください',
    columnNameDuplicate: '列名が重複しています',
    columnSettingsSaved: '列設定を保存しました',
    fieldRequired: '「{name}」を入力してください',
    rowAdded: '行を追加しました',
    rowUpdated: '行を更新しました',
    rowsDeleteConfirm: '選択した {count} 件を削除しますか？',
    deleted: '削除しました',
    vectorizationCompleted: 'ベクトル化が完了しました',
    vectorizationFailed: 'ベクトル化に失敗しました',
    selectFailedRows: '失敗した行を選択してください',
    noRetryableRows: '再ベクトル化対象のデータがありません',
    vectorizationRetrying: '再ベクトル化を実行しています',
    vectorizationRetryingCount: '{count} 件の再ベクトル化を実行しています',
    importFileTypeInvalid: 'xlsx、xls、csv 形式のファイルを選択してください',
    importFileSizeMax: 'ファイルサイズは最大 10MB です',
    uploadFileRequired: 'ファイルをアップロードしてください',
    importRowMax: '1回のインポートは最大{max}行です',
    imported: 'インポートしました。ベクトル化を開始しています',
    listRefreshed: '一覧を更新しました'
  }
}

export const businessRulesMasterDataZh = {
  list: {
    title: '主数据列表',
    searchSubject: '主数据名',
    add: '添加主数据',
    empty: '没有匹配的主数据',
    selectHint: '请添加主数据'
  },
  menu: {
    rename: '重命名',
    history: '变更历史',
    delete: '删除'
  },
  action: {
    save: '保存',
    cancel: '取消',
    add: '添加',
    delete: '删除',
    edit: '编辑',
    columnSettings: '列设置',
    addData: '添加项',
    batchImport: '批量导入',
    batchDelete: '批量删除',
    retryVectorization: '重新向量化',
    retry: '再向量化',
    close: '关闭',
    refresh: '刷新',
    addColumn: '添加列',
    downloadTemplate: '下载模板',
    selectFile: '选择文件'
  },
  field: {
    masterName: '主数据名',
    queryCode: '查询代码',
    updatedAt: '更新时间'
  },
  column: {
    index: '序号',
    aiAnalysis: 'AI 分析',
    vectorizationStatus: '向量化状态',
    action: '操作',
    actionProcess: '操作/处理',
    defaultName: '列{index}',
    defaultCode: '代码',
    defaultNameLabel: '名称',
    count: '{current} / {max} 列'
  },
  placeholder: {
    masterNameExample: '例：伤病名主数据',
    searchData: '主数据名'
  },
  pagination: {
    resultTotal: '检索结果 {count} 条'
  },
  empty: {
    noData: '没有数据。请添加数据或批量导入'
  },
  history: {
    titleSuffix: '的变更历史',
    occurredAt: '时间',
    action: '操作',
    operator: '操作者',
    detail: '内容'
  },
  vectorization: {
    pending: '未处理',
    processing: '处理中',
    completed: '完成',
    failed: '失败'
  },
  import: {
    title: '批量导入',
    templateSection: '下载模板',
    templateDesc: '下载标准模板文件，并按示例填写数据',
    uploadSection: '上传主数据文件',
    dropzone: '将文件拖放到此处',
    dropzoneHint:
      '最大 10MB。支持 xlsx、xls、csv。单次导入最多 {maxRows} 行，列数最多 {maxColumns} 列',
    updateMode: '选择数据更新方式',
    append: '追加更新',
    overwrite: '覆盖更新'
  },
  message: {
    nameRequired: '请输入主数据名',
    masterAdded: '已添加主数据',
    renamed: '已修改名称',
    deleteConfirm: '确定删除主数据「{name}」吗？',
    deleteTitle: '删除确认',
    masterDeleted: '已删除主数据',
    columnMax: '列最多 {max} 列',
    columnMin: '至少需要 1 列',
    columnNameRequired: '请输入列名',
    columnNameDuplicate: '列名重复',
    columnSettingsSaved: '已保存列设置',
    fieldRequired: '请输入「{name}」',
    rowAdded: '已添加行',
    rowUpdated: '已更新行',
    rowsDeleteConfirm: '确定删除选中的 {count} 项吗？',
    deleted: '已删除',
    vectorizationCompleted: '向量化已完成',
    vectorizationFailed: '向量化失败',
    selectFailedRows: '请选择失败的行',
    noRetryableRows: '没有可再向量化的数据',
    vectorizationRetrying: '正在执行再向量化',
    vectorizationRetryingCount: '正在对 {count} 条数据执行再向量化',
    importFileTypeInvalid: '请选择 xlsx、xls、csv 格式文件',
    importFileSizeMax: '文件大小最大 10MB',
    uploadFileRequired: '请上传文件',
    importRowMax: '单次导入最多 {max} 行',
    imported: '已导入，正在开始向量化',
    listRefreshed: '已刷新列表'
  }
}
