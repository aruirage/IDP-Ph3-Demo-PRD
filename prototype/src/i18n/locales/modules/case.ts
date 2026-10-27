export const caseJa = {
  column: {
    caseStatus: 'ステータス',
    fileStatus: 'ファイルステータス',
    linkStatus: '集約ステータス',
    linkReason: '集約失敗理由'
  },
  listStatus: {
    WAITING: '待機中',
    PROCESSING: '処理中',
    MANUAL_REVIEW: '確認中',
    SUPPLEMENT: '補件',
    EXCEPTION: '異常対応',
    ABORTED: '処理中止',
    COMPLETED: '処理完了',
    EXPORTED: '出力済'
  },
  processStatus: {
    UPLOADED: 'アップロード済',
    QUALITY_REJECTED: '画質不合格',
    PREPROCESSING: '前処理中',
    OCR_EXTRACTING: 'OCR抽出中',
    VERIFYING: 'AI検証中',
    PENDING_SUPPLEMENT: '補件待ち',
    READY_EXPORT: 'エクスポート待ち',
    EXPORTED: 'エクスポート済'
  },
  fileStatus: {
    PREPROCESSING: 'AI前処理中',
    PREPROCESS_REVIEW: '前処理確認中',
    PREPROCESS_DONE: 'AI前処理完了',
    PREPROCESS_FAILED: 'AI前処理失敗',
    OCR_EXTRACTING: 'OCR抽出中',
    OCR_REVIEW: 'OCR抽出確認中',
    OCR_SUCCESS: 'OCR抽出完了',
    OCR_FAILED: 'OCR抽出失敗'
  },
  linkStatus: {
    LINKING: '紐づけ中',
    FAILED: '紐づけエラー',
    SUCCESS: '紐づけ成功'
  },
  linkReason: {
    CLASSIFY_FAILED: '分類エラー',
    CANDIDATE_CONFLICT: '複数案件が候補として表示',
    NO_MATCH: '該当案件なし',
    PROCESSING_TIMEOUT: '処理タイムアウト'
  },
  judgment: {
    needsReview: '要確認',
    none: '未判定'
  },
  stage: {
    input: '入力',
    preprocess: '前処理',
    ocr: 'OCR抽出',
    verification: 'AI検証',
    export: '出力'
  },
  routing: {
    supplement: '補件',
    exportable: 'エクスポート可'
  },
  scenario: {
    CLAIM: '保険金請求',
    PRESERVATION: '保全',
    NEW_BUSINESS: '新規契約',
    POLICY_CHANGE: '契約異動',
    CANCELLATION: '解約',
    UNDERWRITING: '契約査定',
    BENEFICIARY_CHANGE: '受取人変更',
    ADDRESS_CHANGE: '住所変更',
    descSuffix: '{name}で使用する帳票'
  },
  action: {
    preview: 'プレビュー',
    delete: '削除',
    bulkDelete: '一括削除',
    reprocess: '再実行',
    changeCase: '案件変更',
    manualLink: '手動紐付け',
    bulkManualLink: '一括手動紐付け',
    reconsolidate: '案件集約を再実行',
    runCaseLinking: '案件集約を実行',
    expandAll: 'すべて展開',
    collapseAll: 'すべて折りたたむ',
    deleteGroup: 'この元ファイルを削除',
    showInCase: '案件で表示',
    goPending: '未集約ファイルへ',
    supplement: '補件',
    terminate: '処理中止',
    retry: '再試行',
    rerun: '再実行',
    assignCase: '案件割当',
    assignDocType: '帳票タイプ指定',
    close: '閉じる',
    detail: '詳細'
  },
  message: {
    noPendingFiles: '未集約のファイルはありません',
    noReviewFiles: '要確認のファイルはありません',
    noIgnoreFiles: '無視可能なファイルはありません',
    noFiles: 'ファイルなし',
    selectLinkTarget: '紐付け先案件を選択してください',
    selectDocType: '帳票タイプを選択してください',
    fillAssociationValues: 'すべての関連キー値を入力してください',
    editSaved: '保存しました',
    assignDocTypeSuccess: '帳票タイプを指定し、後続処理を開始しました',
    associationKeyModule: '関連キー',
    addAssociationKey: '関連キーを追加',
    manualLinkTitle: '手動紐付け',
    manualLinkConfirm: '「{fileName}」を案件 {caseId} に紐付けます。',
    manualLinkSuccess: '「{fileName}」を案件 {caseId} に紐付けました',
    manualLinkCopySuccess: '「{fileName}」を {count} 件の案件に複製して紐付けました',
    manualLinkDone: '手動紐付けが完了しました',
    bulkManualLinkTitle: '一括手動紐付け',
    bulkManualLinkSelected: '選択 {count} 件',
    bulkManualLinkSuccess: '{count} 件のファイルを案件 {caseId} に紐付けました',
    bulkManualLinkNoEligible: '紐付け可能なファイルが選択されていません',
    bulkManualLinkSelectRequired: '1件以上のファイルを選択してください',
    caseAssignSuccess: '{name} に割当しました{taskHint}',
    taskTakeover: '（未対応タスク {count} 件を引き継ぎ）',
    notFound: '案件が見つかりません',
    reconsolidateNoEligible: '案件集約を再実行できるファイルがありません',
    reconsolidateConfirm:
      '選択した {count} 件のファイルに対して案件集約を再実行します。{skipHint}',
    reconsolidateSkipHint: '（選択 {selected} 件のうち {count} 件を実行）',
    reconsolidateSuccess: '案件集約を再実行しました（{count} 件）',
    caseLinkingNoEligible: '案件集約を実行できるファイルがありません',
    caseLinkingConfirm: '{count} 件のファイルについて案件集約を実行します。',
    caseLinkingSkipHint: '（選択 {selected} 件のうち {count} 件を実行）',
    caseLinkingScopeSelection: '選択ファイル',
    caseLinkingScopePool: '紐付け待ちプール全体',
    caseLinkingStarted: '案件集約を開始しました',
    retrySourceConsolidationTitle: '案件集約を再実行',
    retrySourceConsolidationStarted: '案件集約を開始しました',
    retrySourceConsolidationSuccess:
      '処理が完了しました（{count} 件、新規案件 {created}、既存案件 {linked}）',
    retrySourceConsolidationPartial: '一部のファイルは未集約のままです',
    retrySourceConsolidationNoEligible: '再実行できるファイルがありません',
    bulkDeleteConfirm: '選択した {count} 件のファイルを削除します。',
    bulkDeleteSuccess: '{count} 件を削除しました',
    deleteGroupConfirm: '元ファイル「{fileName}」配下の未集約ファイル {count} 件を削除します。',
    deleteFileConfirm: '「{fileName}」を削除します。',
    terminateConfirm:
      '案件 {caseId} の処理を中止します。ワークフローインスタンスを終了し、未完了タスクは無効になります。',
    terminateSuccess: '処理を中止しました',
    retryCaseConfirm:
      '案件 {caseId} の失敗ノードから再試行します。ワークフロー入口からの再実行ではありません。',
    retrySuccess: '再試行を開始しました',
    rerunCaseConfirm:
      '案件 {caseId} のワークフローを再実行します。現在有効なワークフロー定義に基づき、入口から処理を開始します。',
    rerunSuccess: '再実行を開始しました',
    deleteFileWithImpactConfirm:
      '「{fileName}」を削除します。案件の書類構成に影響する場合があります。',
    changeCaseConfirm: '「{fileName}」を案件 {caseId} へ移動します。',
    changeCaseSuccess: '案件を変更しました',
    selectChangeTarget: '変更先案件を選択してください',
    assigneeDialogTitle: '担当者割当'
  },
  panel: {
    pendingSummary: '未集約のファイル',
    reviewSummary: '要確認',
    ignoreSummary: '無視可',
    pendingCountSuffix: '件',
    ignoreTtlHint:
      '分類失敗のファイルは既定で本リストへ入ります。{days} 日未処理の場合、自動的に論理削除されます。',
    remainingDays: '残り {days} 日',
    remainingDaysColumn: '残日数',
    expiresToday: '間もなく削除',
    autoDeleteHint: '{days} 日を超えると自動削除',
    sourceGroupSummary: '元ファイル {groups} ・ファイル {files}',
    failedFileCount: '失敗ファイル数',
    workflow: '処理フロー',
    fileDetails: 'ファイル処理明細',
    workflowAria: '案件処理フロー',
    flowchartAria: '案件処理フロー図'
  },
  detail: {
    title: '案件詳細',
    backToPendingList: '未集約ファイル一覧へ戻る',
    currentNode: '現在のノード：',
    fileProgress: 'ファイル処理：{completed} / {total} 件完了',
    traversedNodes: 'ノード進捗',
    tabOverview: 'ワークフロー明細',
    tabAllFiles: 'ファイル一覧',
    filesTreeTitle: 'ファイル一覧'
  },
  workflow: {
    node: {
      intake: '請求書類受付',
      preprocess: '書類前処理',
      ocr: '項目抽出',
      ocr_gate: 'OCR確認要否判定',
      ocr_review: 'OCR結果確認',
      readiness: '案件就緒判定',
      contract_api: '契約情報照会',
      benefit_check: '給付条件検証',
      verify_gate: '検証結果判定',
      verify_review: '検証確認',
      deficiency: '不備通知',
      output: '査定連携'
    },
    record: {
      done: '処理完了',
      processing: '処理中',
      failed: '処理失敗',
      waiting: '待機',
      skipped: 'スキップ'
    },
    kind: {
      condition: '条件',
      hitl: '確認'
    },
    visual: {
      branchSkip: '未経由'
    },
    terminal: {
      start: '開始',
      end: '終了'
    },
    canvasNode: {
      preprocess: '前処理',
      ocr: 'OCR抽出',
      condition: '条件判断',
      hitl: '人工確認',
      dataMapping: 'データマッピング',
      aiVerify: 'AI検証',
      customFunction: 'カスタム関数'
    },
    table: {
      node: 'ノード'
    },
    legend: {
      taken: '実線：本案件の経路',
      unused: '点線：未採用の分岐',
      skipNode: '未経由：条件によりスキップ'
    },
    branch: {
      required: '必要',
      notRequired: '不要',
      deficiency: '書類不備'
    },
    pathNote: {
      ocrRequired: '条件判断：人工確認へ',
      ocrSkipped: '条件判断：人工確認をスキップ',
      verifyDeficiency: '条件判断：書類不備（前処理へ戻る）',
      verifyRequired: '条件判断：人工確認へ',
      verifySkipped: '条件判断：カスタム関数へ直行'
    },
    pendingReview: '確認待ち'
  }
}

export const caseZh = {
  column: {
    caseStatus: '案件状态',
    fileStatus: '文件状态',
    linkStatus: '集约状态',
    linkReason: '集约失败原因'
  },
  listStatus: {
    WAITING: '等待中',
    PROCESSING: '处理中',
    MANUAL_REVIEW: '人工确认',
    SUPPLEMENT: '补件',
    EXCEPTION: '异常处理',
    ABORTED: '处理中止',
    COMPLETED: '处理完成',
    EXPORTED: '已输出'
  },
  processStatus: {
    UPLOADED: '已上传',
    QUALITY_REJECTED: '画质不合格',
    PREPROCESSING: '预处理中',
    OCR_EXTRACTING: 'OCR 抽出中',
    VERIFYING: 'AI 检证中',
    PENDING_SUPPLEMENT: '待补件',
    READY_EXPORT: '待导出',
    EXPORTED: '已导出'
  },
  fileStatus: {
    PREPROCESSING: 'AI 前处理中',
    PREPROCESS_REVIEW: '前处理确认中',
    PREPROCESS_DONE: 'AI 前处理完成',
    PREPROCESS_FAILED: 'AI 前处理失败',
    OCR_EXTRACTING: 'OCR 抽出中',
    OCR_REVIEW: 'OCR 抽出确认中',
    OCR_SUCCESS: 'OCR 抽出完成',
    OCR_FAILED: 'OCR 抽出失败'
  },
  linkStatus: {
    LINKING: '关联中',
    FAILED: '关联失败',
    SUCCESS: '关联成功'
  },
  linkReason: {
    CLASSIFY_FAILED: '分类失败',
    CANDIDATE_CONFLICT: '多案件候选冲突',
    NO_MATCH: '无匹配案件',
    PROCESSING_TIMEOUT: '处理超时'
  },
  judgment: {
    needsReview: '需确认',
    none: '未判定'
  },
  stage: {
    input: '输入',
    preprocess: '预处理',
    ocr: 'OCR 抽出',
    verification: 'AI 检证',
    export: '输出'
  },
  routing: {
    supplement: '补件',
    exportable: '可导出'
  },
  scenario: {
    CLAIM: '保险金请求',
    PRESERVATION: '保全',
    NEW_BUSINESS: '新契约',
    POLICY_CHANGE: '契约异动',
    CANCELLATION: '解约',
    UNDERWRITING: '契约查定',
    BENEFICIARY_CHANGE: '受取人变更',
    ADDRESS_CHANGE: '地址变更',
    descSuffix: '{name}使用的账票'
  },
  action: {
    preview: '预览',
    delete: '删除',
    bulkDelete: '批量删除',
    reprocess: '重新执行',
    changeCase: '变更案件',
    manualLink: '手动关联',
    bulkManualLink: '批量手动关联',
    reconsolidate: '重新执行案件集约',
    runCaseLinking: '执行案件集约',
    expandAll: '全部展开',
    collapseAll: '全部折叠',
    deleteGroup: '删除本组',
    showInCase: '在案件中查看',
    goPending: '前往未集约文件',
    supplement: '补件',
    terminate: '中止处理',
    retry: '重试',
    rerun: '重新执行',
    assignCase: '案件分配',
    assignDocType: '指定账票类型',
    close: '关闭',
    detail: '详情'
  },
  message: {
    noPendingFiles: '暂无未集约文件',
    noReviewFiles: '暂无需复核文件',
    noIgnoreFiles: '暂无可忽略文件',
    noFiles: '暂无文件',
    selectLinkTarget: '请选择关联目标案件',
    selectDocType: '请选择账票类型',
    fillAssociationValues: '请填写全部关联键值',
    editSaved: '已保存',
    assignDocTypeSuccess: '已指定账票类型并触发后续流程',
    associationKeyModule: '关联键',
    addAssociationKey: '添加关联键',
    manualLinkTitle: '手动关联',
    manualLinkConfirm: '将「{fileName}」关联到案件 {caseId}。',
    manualLinkSuccess: '已将「{fileName}」关联到案件 {caseId}',
    manualLinkCopySuccess: '已将「{fileName}」复制关联到 {count} 个案件',
    manualLinkDone: '手动关联已完成',
    bulkManualLinkTitle: '批量手动关联',
    bulkManualLinkSelected: '已选 {count} 个文件',
    bulkManualLinkSuccess: '已将 {count} 个文件关联到案件 {caseId}',
    bulkManualLinkNoEligible: '所选文件均不可关联',
    bulkManualLinkSelectRequired: '请至少勾选一条记录',
    caseAssignSuccess: '已分配给 {name}{taskHint}',
    taskTakeover: '（承接 {count} 条待处理任务）',
    notFound: '未找到案件',
    reconsolidateNoEligible: '没有可重新执行案件集约的文件',
    reconsolidateConfirm: '将对选中的 {count} 个文件重新执行案件集约。{skipHint}',
    reconsolidateSkipHint: '（已选 {selected} 个，将执行 {count} 个）',
    reconsolidateSuccess: '已重新执行案件集约（{count} 个）',
    caseLinkingNoEligible: '没有可执行案件集约的文件',
    caseLinkingConfirm: '将对 {count} 个文件进行案件集约。',
    caseLinkingSkipHint: '（已选 {selected} 个，将执行 {count} 个）',
    caseLinkingScopeSelection: '所选文件',
    caseLinkingScopePool: '待关联池全部',
    caseLinkingStarted: '已开始案件集约',
    retrySourceConsolidationTitle: '重新执行案件集约',
    retrySourceConsolidationStarted: '已开始案件集约',
    retrySourceConsolidationSuccess:
      '处理完成（{count} 个文件，新建案件 {created}，归入已有案 {linked}）',
    retrySourceConsolidationPartial: '部分文件仍留在未集约列表',
    retrySourceConsolidationNoEligible: '没有可重新执行的文件',
    bulkDeleteConfirm: '将删除选中的 {count} 个文件。',
    bulkDeleteSuccess: '已删除 {count} 个',
    deleteGroupConfirm: '将删除源文件「{fileName}」下的 {count} 个未集约文件。',
    deleteFileConfirm: '将删除「{fileName}」。',
    terminateConfirm:
      '将中止案件 {caseId} 的处理。工作流实例将结束，未完成任务将失效。',
    terminateSuccess: '已中止处理',
    retryCaseConfirm:
      '将从案件 {caseId} 的失败节点重试，不会从工作流入口重新开始。',
    retrySuccess: '已开始重试',
    rerunCaseConfirm:
      '将重新执行案件 {caseId} 的工作流。将基于当前有效的工作流定义从入口开始处理。',
    rerunSuccess: '已开始重新执行',
    deleteFileWithImpactConfirm: '将删除「{fileName}」。可能影响案件的文档构成。',
    changeCaseConfirm: '将「{fileName}」移动到案件 {caseId}。',
    changeCaseSuccess: '已变更案件',
    selectChangeTarget: '请选择变更目标案件',
    assigneeDialogTitle: '负责人分配'
  },
  panel: {
    pendingSummary: '未集约文件',
    reviewSummary: '需复核',
    ignoreSummary: '可忽略',
    pendingCountSuffix: '条',
    ignoreTtlHint: '分类失败文件默认进入本列表。超过 {days} 天未处理将自动从列表逻辑清空。',
    remainingDays: '剩余 {days} 天',
    remainingDaysColumn: '剩余天数',
    expiresToday: '即将清空',
    autoDeleteHint: '超过 {days} 天自动删除',
    sourceGroupSummary: '{groups} 个源文件 · {files} 个文件',
    failedFileCount: '失败文件数',
    workflow: '处理流程',
    fileDetails: '文件处理明细',
    workflowAria: '案件处理流程',
    flowchartAria: '案件处理流程图'
  },
  detail: {
    title: '案件详情',
    backToPendingList: '返回未集约文件列表',
    currentNode: '当前节点：',
    fileProgress: '文件处理：{completed} / {total} 条已完成',
    traversedNodes: '节点进度',
    tabOverview: '工作流明细',
    tabAllFiles: '文件列表',
    filesTreeTitle: '文件列表'
  },
  workflow: {
    node: {
      intake: '请求书类受理',
      preprocess: '书类预处理',
      ocr: '项目抽出',
      ocr_gate: 'OCR 确认判定',
      ocr_review: 'OCR 结果确认',
      readiness: '案件就绪判定',
      contract_api: '契约信息照会',
      benefit_check: '给付条件检证',
      verify_gate: '检证结果判定',
      verify_review: '检证确认',
      deficiency: '不备通知',
      output: '查定联动'
    },
    record: {
      done: '处理完成',
      processing: '处理中',
      failed: '处理失败',
      waiting: '等待',
      skipped: '跳过'
    },
    kind: {
      condition: '条件',
      hitl: '确认'
    },
    visual: {
      branchSkip: '未经过'
    },
    terminal: {
      start: '开始',
      end: '结束'
    },
    canvasNode: {
      preprocess: '前处理',
      ocr: 'OCR 抽出',
      condition: '条件判断',
      hitl: '人工确认',
      dataMapping: '数据映射',
      aiVerify: 'AI 检证',
      customFunction: '自定义函数'
    },
    table: {
      node: '节点'
    },
    legend: {
      taken: '实线：本案路径',
      unused: '虚线：未采用分支',
      skipNode: '未经过：按条件跳过'
    },
    branch: {
      required: '需要',
      notRequired: '不需要',
      deficiency: '书类不备'
    },
    pathNote: {
      ocrRequired: '条件判断：进入人工确认',
      ocrSkipped: '条件判断：跳过人工确认',
      verifyDeficiency: '条件判断：书类不备（回到前处理）',
      verifyRequired: '条件判断：进入人工确认',
      verifySkipped: '条件判断：直达自定义函数'
    },
    pendingReview: '待确认'
  }
}
