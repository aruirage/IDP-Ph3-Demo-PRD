/** 用量统计页 UI 文案（中日对照） */
export const usageStatisticsJa = {
  title: '利用量統計',
  tab: {
    billing: '利用量一覧',
    execution: '実行履歴',
    modelCall: 'モデル呼び出し明細'
  },
  chart: {
    title: '処理ノード別 帳票枚数合計',
    unit: '枚',
    empty: '表示するデータがありません'
  },
  field: {
    caseId: '案件ID',
    fileName: 'ファイル名',
    businessScene: '業務シーン',
    pageCount: '帳票枚数',
    billingNode: '処理ノード',
    startedAt: '処理開始日時',
    completedAt: '処理完了日時',
    status: '実行結果',
    isBillable: '集計対象',
    invokedModel: '使用モデル',
    tokenConsumed: 'トークン消費',
    usageType: 'ノード種別',
    caller: '呼び出し元',
    callStartedAt: '呼び出し開始日時',
    modelRespondedAt: 'モデル応答日時',
    inputTokens: '入力トークン',
    outputTokens: '出力トークン'
  },
  caller: {
    system: 'システム自動'
  },
  modelCall: {
    noCase: '—'
  },
  filter: {
    completedFrom: '処理完了日時（開始）',
    completedTo: '処理完了日時（終了）',
    billingNodes: '処理ノード',
    usageTypes: 'ノード種別'
  },
  status: {
    success: '成功',
    failure: '失敗'
  },
  billable: {
    yes: '対象',
    no: '対象外'
  },
  export: {
    button: 'エクスポート',
    empty: 'エクスポートするデータがありません',
    success: '{count} 件を CSV にエクスポートしました'
  }
}

export const usageStatisticsZh = {
  title: '用量统计',
  tab: {
    billing: '用量列表',
    execution: '执行履历',
    modelCall: '模型调用明细'
  },
  chart: {
    title: '各处理节点账票张数合计',
    unit: '张',
    empty: '暂无数据'
  },
  field: {
    caseId: '案件ID',
    fileName: '文件名',
    businessScene: '业务场景',
    pageCount: '账票张数',
    billingNode: '处理节点',
    startedAt: '处理发起时间',
    completedAt: '处理完成时间',
    status: '执行结果',
    isBillable: '是否纳入统计',
    invokedModel: '调用模型',
    tokenConsumed: 'Token 消耗',
    usageType: '节点类型',
    caller: '调用人',
    callStartedAt: '发起调用时间',
    modelRespondedAt: '模型返回时间',
    inputTokens: '输入 Token',
    outputTokens: '输出 Token'
  },
  caller: {
    system: '系统自动'
  },
  modelCall: {
    noCase: '—'
  },
  filter: {
    completedFrom: '处理完成时间（开始）',
    completedTo: '处理完成时间（结束）',
    billingNodes: '处理节点',
    usageTypes: '节点类型'
  },
  status: {
    success: '成功',
    failure: '失败'
  },
  billable: {
    yes: '纳入',
    no: '不纳入'
  },
  export: {
    button: '导出',
    empty: '没有可导出的数据',
    success: '已导出 {count} 条记录为 CSV'
  }
}
