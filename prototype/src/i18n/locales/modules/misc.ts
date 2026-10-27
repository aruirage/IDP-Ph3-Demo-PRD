export const miscJa = {
  imageViewer: {
    toolbar: '画像操作',
    prev: '前へ',
    next: '次へ',
    crop: 'トリミング',
    fit: '画面に合わせる',
    rotateLeft: '左回転',
    rotateRight: '右回転',
    zoomIn: '拡大',
    zoomOut: '縮小',
    saveRotation: '回転保存',
    prevPage: '前のページ',
    nextPage: '次のページ'
  },
  demo: {
    toastTitle: '補件依頼が発行されました',
    toastSummary: 'CLAIM-20251024000002 に追加書類の提出が必要です。',
    toastBody:
      '条件分岐ノードの判定により補件が必要です。案件一覧から該当案件を開き、不足書類をアップロードしてください。',
    messageTestTitle: 'AI検証で要確認が発生しました',
    messageTestSummary: 'CLAIM-20251024000004 に未確認の検証項目があります。',
    messageTestBody:
      'マイタスクの AI検証確認から該当案件を開き、要確認項目を確認してください。補件が必要な場合は案件を補件状態にできます。'
  },
  route: {
    taskPreprocess: 'AI前処理確認タスク',
    taskOcr: 'OCR抽出タスク',
    taskVerification: 'AI検証確認タスク',
    taskExport: 'エクスポートタスク'
  }
}

export const miscZh = {
  imageViewer: {
    toolbar: '图像操作',
    prev: '上一张',
    next: '下一张',
    crop: '裁剪',
    fit: '适应屏幕',
    rotateLeft: '向左旋转',
    rotateRight: '向右旋转',
    zoomIn: '放大',
    zoomOut: '缩小',
    saveRotation: '旋转保存',
    prevPage: '上一页',
    nextPage: '下一页'
  },
  demo: {
    toastTitle: '已发出补件请求',
    toastSummary: 'CLAIM-20251024000002 需要提交补充文档。',
    toastBody: '根据条件分支判定需要补件。请从案件列表打开对应案件并上传缺失书类。',
    messageTestTitle: 'AI 检证出现需确认项',
    messageTestSummary: 'CLAIM-20251024000004 存在未确认的检证项目。',
    messageTestBody:
      '请从我的任务的 AI 检证确认打开对应案件并确认需确认项。如需补件可将案件设为补件状态。'
  },
  route: {
    taskPreprocess: 'AI 前处理确认任务',
    taskOcr: 'OCR 抽出任务',
    taskVerification: 'AI 检证确认任务',
    taskExport: '导出任务'
  }
}
