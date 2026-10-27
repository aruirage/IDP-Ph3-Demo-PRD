/** セキュリティ設定页 UI 文案（中日对照） */
export const securitySettingsJa = {
  title: 'セキュリティ設定',
  section: {
    dataRetention: {
      title: 'データ保存期限設定',
      description:
        '読取データの自動削除サイクルを設定します。システムは設定に基づき、保持期間を超えた読取記録および関連ファイルを自動的に削除します。'
    },
    idleSession: {
      title: 'アイドルセッション設定',
      description1:
        'ユーザが操作を行わない状態でログインを維持する時間を設定します。閾値を超えると自動的にログアウトされます。',
      description2:
        '設定が有効になると、すべてのオンラインユーザは次回のログイン時に新しいポリシーが適用されます。'
    }
  },
  field: {
    dataRetention: 'データ保存期限',
    autoLogoutTime: '自動ログアウト時間'
  },
  retention: {
    '7d': '7日',
    '14d': '14日',
    '1m': '1ヶ月',
    '2m': '2ヶ月',
    '3m': '3ヶ月',
    '6m': '6ヶ月',
    '12m': '12ヶ月'
  },
  idleTimeout: {
    '15m': '15分',
    '30m': '30分',
    '60m': '60分',
    '2h': '2時間',
    none: '制限なし'
  },
  action: {
    close: '閉じる',
    save: '保存'
  },
  message: {
    saved: 'セキュリティ設定を保存しました'
  }
}

export const securitySettingsZh = {
  title: '安全设定',
  section: {
    dataRetention: {
      title: '数据保存期限设定',
      description:
        '设定读取数据的自动删除周期。系统将根据设定自动删除超过保留期限的读取记录及相关文件。'
    },
    idleSession: {
      title: '空闲会话设定',
      description1:
        '设定用户无操作状态下保持登录的时长。超过阈值后将自动登出。',
      description2:
        '设定生效后，所有在线用户将在下次登录时应用新策略。'
    }
  },
  field: {
    dataRetention: '数据保存期限',
    autoLogoutTime: '自动登出时间'
  },
  retention: {
    '7d': '7 天',
    '14d': '14 天',
    '1m': '1 个月',
    '2m': '2 个月',
    '3m': '3 个月',
    '6m': '6 个月',
    '12m': '12 个月'
  },
  idleTimeout: {
    '15m': '15 分钟',
    '30m': '30 分钟',
    '60m': '60 分钟',
    '2h': '2 小时',
    none: '无限制'
  },
  action: {
    close: '关闭',
    save: '保存'
  },
  message: {
    saved: '已保存安全设定'
  }
}
