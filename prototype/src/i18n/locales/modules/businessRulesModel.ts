/** 模型设置页 UI 文案（中日对照） */
export const businessRulesModelJa = {
  tab: {
    api: 'API 接続',
    assignment: '用途割当'
  },
  action: {
    addConnection: '接続を追加',
    editConnection: '接続を編集',
    testConnection: '接続テスト',
    edit: '編集',
    delete: '削除',
    save: '保存',
    cancel: 'キャンセル'
  },
  field: {
    connectionName: '接続名',
    provider: 'プロバイダ',
    thinkingLevel: 'シンキングレベル',
    baseUrl: 'API ベース URL',
    apiKey: 'API キー',
    modelName: 'モデル名',
    status: '状態',
    updatedAt: '更新日時',
    action: '操作'
  },
  status: {
    enabled: '有効',
    disabled: '無効'
  },
  group: {
    localModel: 'ローカルモデル',
    apiConnection: 'API 接続'
  },
  provider: {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google Gemini',
    openai_compatible: 'カスタム（OpenAI 互換）'
  },
  thinkingLevel: {
    minimal: 'Minimal',
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  },
  usage: {
    aiAssist: 'AIアシスト',
    aiPreprocessing: 'AI前処理',
    ocrExtraction: 'OCR抽出',
    aiVerification: 'AI検証',
    masterMatching: 'Master照合',
    caseConsolidation: '案件集約',
    dataMapping: 'データマッピング',
    coordinatePositioning: '座標抽出'
  },
  label: {
    localModelSuffix: '（ローカルモデル）',
    unavailable: '・利用不可',
    disabledSuffix: '（無効）'
  },
  placeholder: {
    nameOpenaiCompatible: '例：社内 vLLM',
    nameDefault: '例：本番 OpenAI',
    apiKeyNew: '新しい API キーを入力',
    registered: '登録済み：',
    leaveEmptyHint: '（変更しない場合は空欄のまま）'
  },
  toolbar: {
    totalCount: '全 {count} 件'
  },
  empty: {
    noAssignableModels:
      '割当可能なモデルがありません。ローカルモデルの状態を確認するか、API 接続を追加してください。'
  },
  message: {
    nameRequired: '接続名を入力してください',
    baseUrlRequired: 'API ベース URL を入力してください',
    apiKeyRequired: 'API キーを入力してください',
    modelNameRequired: 'モデル名を入力してください',
    thinkingLevelRequired: 'シンキングレベルを選択してください',
    connectionUpdated: '接続設定を更新しました',
    connectionAdded: '接続設定を追加しました',
    deleteConfirm: '接続「{name}」を削除しますか？{usageHint}',
    deleteUsageHint: '\n割当中の用途：{usages}',
    deleteTitle: '削除確認',
    connectionDeleted: '接続設定を削除しました',
    testDisabled: '無効な接続はテストできません',
    testSuccess: '「{name}」（{provider}）への接続テストに成功しました。状態を有効に更新しました',
    testFailed: '「{name}」（{provider}）への接続テストに失敗しました。状態を無効に更新しました',
    unassignedUsages: '未割当の用途があります：{usages}',
    assignmentSaved: '用途割当を保存しました'
  }
}

export const businessRulesModelZh = {
  tab: {
    api: 'API 连接',
    assignment: '用途分配'
  },
  action: {
    addConnection: '添加连接',
    editConnection: '编辑连接',
    testConnection: '连接测试',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消'
  },
  field: {
    connectionName: '连接名',
    provider: '提供商',
    thinkingLevel: '思考程度',
    baseUrl: 'API 基础 URL',
    apiKey: 'API 密钥',
    modelName: '模型名',
    status: '状态',
    updatedAt: '更新时间',
    action: '操作'
  },
  status: {
    enabled: '启用',
    disabled: '禁用'
  },
  group: {
    localModel: '本地模型',
    apiConnection: 'API 连接'
  },
  provider: {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google Gemini',
    openai_compatible: '自定义（OpenAI 兼容）'
  },
  thinkingLevel: {
    minimal: 'Minimal',
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  },
  usage: {
    aiAssist: 'AI 助手',
    aiPreprocessing: 'AI 前处理',
    ocrExtraction: 'OCR 抽出',
    aiVerification: 'AI 检证',
    masterMatching: 'Master 照合',
    caseConsolidation: '案件集约',
    dataMapping: '数据映射',
    coordinatePositioning: '坐标定位'
  },
  label: {
    localModelSuffix: '（本地模型）',
    unavailable: '·不可用',
    disabledSuffix: '（禁用）'
  },
  placeholder: {
    nameOpenaiCompatible: '例：内部 vLLM',
    nameDefault: '例：生产 OpenAI',
    apiKeyNew: '输入新的 API 密钥',
    registered: '已注册：',
    leaveEmptyHint: '（不修改请留空）'
  },
  toolbar: {
    totalCount: '共 {count} 项'
  },
  empty: {
    noAssignableModels: '没有可分配的模型。请检查本地模型状态，或添加 API 连接。'
  },
  message: {
    nameRequired: '请输入连接名',
    baseUrlRequired: '请输入 API 基础 URL',
    apiKeyRequired: '请输入 API 密钥',
    modelNameRequired: '请输入模型名',
    thinkingLevelRequired: '请选择思考程度',
    connectionUpdated: '已更新连接设置',
    connectionAdded: '已添加连接设置',
    deleteConfirm: '确定删除连接「{name}」吗？{usageHint}',
    deleteUsageHint: '\n已分配的用途：{usages}',
    deleteTitle: '删除确认',
    connectionDeleted: '已删除连接设置',
    testDisabled: '禁用的连接无法测试',
    testSuccess: '「{name}」（{provider}）连接测试成功，状态已更新为启用',
    testFailed: '「{name}」（{provider}）连接测试失败，状态已更新为禁用',
    unassignedUsages: '存在未分配的用途：{usages}',
    assignmentSaved: '已保存用途分配'
  }
}
