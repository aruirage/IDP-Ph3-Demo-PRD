import { phase3Ja } from './modules/phase3'
import { caseJa } from './modules/case'
import { fieldsJa } from './modules/fields'
import { uploadJa } from './modules/upload'
import { tasksJa } from './modules/tasks'
import { businessRulesJa } from './modules/businessRules'
import { miscJa } from './modules/misc'
import { userManagementJa } from './modules/userManagement'
import { roleManagementJa } from './modules/roleManagement'
import { securitySettingsJa } from './modules/securitySettings'
import { usageStatisticsJa } from './modules/usageStatistics'

export default {
  phase3: phase3Ja,
  menu: {
    upload: '新規アップロード',
    cases: '案件一覧',
    tasks: 'マイタスク',
    businessRules: '業務ルール設定',
    docTypes: '帳票タイプ設定',
    businessScene: '業務シーン設定',
    masterData: 'マスタデータ設定',
    dataMapping: 'データマッピング設定',
    verificationSettings: 'AI検証設定',
    modelSettings: 'モデル設定',
    apiManagement: 'API設定',
    systemSettings: 'システム設定',
    userManagement: 'ユーザー管理',
    roleManagement: '権限管理',
    securitySettings: 'セキュリティ設定',
    usageStatistics: '利用量統計'
  },
  common: {
    language: '言語',
    menuToggle: 'メニュー切替',
    notifications: 'お知らせ',
    close: '閉じる',
    ok: 'OK',
    cancel: 'キャンセル',
    search: '検索',
    reset: 'リセット',
    filterAll: 'すべて',
    empty: '—',
    noData: 'データなし',
    required: '必須',
    assign: '割当',
    unassigned: '未割当',
    action: '操作',
    index: '番号'
  },
  placeholder: {
    select: '選択してください',
    selectSearch: '入力して検索',
    selectMultiple: '選択してください（複数可）',
    input: '入力してください',
    selectOrInput: '選択または入力',
    filterAll: 'すべて',
    dateStart: '開始日',
    dateEnd: '終了日',
    required: '必須項目',
    empty: '—',
    notSet: '未設定',
    notDetected: '未検出',
    unclassified: '未分類',
    masterMatchStrategy: '匹配策略',
    masterMatchConfirmRule: '人工确认规则',
    searchBy: '{keyword}で検索',
    selectOrInputSubject: '{subject}を選択または入力'
  },
  task: {
    type: {
      'preprocess-confirmation': 'AI前処理確認',
      'ocr-extraction': 'OCR抽出確認',
      verification: 'AI検証確認',
      export: 'エクスポート'
    },
    status: {
      pending: '未対応',
      completed: '対応済'
    },
    handle: '対応',
    detail: '詳細',
    goCases: '案件一覧',
    assignDialogTitle: 'タスク割当',
    assignSuccess: '{name} に割り当てました',
    fields: {
      taskType: 'タスク種別',
      caseId: '案件キー',
      businessScene: '業務シーン',
      businessKey: '業務キー',
      createdAt: '作成日時',
      updatedAt: '更新日時',
      assignee: '担当者'
    }
  },
  page: {
    cases: {
      title: '案件一覧',
      newUpload: '新規アップロード',
      tabConsolidated: '集約済み案件',
      tabPending: '未集約ファイル',
      tabAll: 'すべてのファイル'
    },
    tasks: {
      title: 'マイタスク'
    },
    upload: {
      title: '新規アップロード',
      supplementTitle: '書類追加アップロード',
      supplementAlert: '案件 {caseId} へ追加書類をアップロードします',
      businessScene: '業務シーン'
    },
    messages: {
      title: 'お知らせ',
      markAllRead: '一括既読',
      testSend: '通知テスト送信',
      markReadSuccess: '{count} 件を既読にしました',
      testSendSuccess: 'ワークフロー通知を送信しました',
      status: '状態',
      read: '既読',
      unread: '未読',
      messageTitle: 'タイトル',
      body: '内容',
      caseId: '案件キー',
      receivedAt: '受信日時'
    },
    businessScene: {
      title: '業務シーン設定',
      timeout1: '読み込みがタイムアウトしました。ネットワーク環境をご確認ください。',
      timeout2: 'しばらく待ってからページを再読み込みしてください。',
      iframeTitle: '業務シーン設定'
    },
    placeholder: {
      comingSoon: '準備中'
    }
  },
  fields: fieldsJa,
  case: caseJa,
  upload: uploadJa,
  tasks: tasksJa,
  businessRules: businessRulesJa,
  imageViewer: miscJa.imageViewer,
  demo: miscJa.demo,
  route: miscJa.route,
  userManagement: userManagementJa,
  roleManagement: roleManagementJa,
  securitySettings: securitySettingsJa,
  usageStatistics: usageStatisticsJa
}
