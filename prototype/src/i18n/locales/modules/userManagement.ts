/** ユーザー管理页 UI 文案（中日对照） */
export const userManagementJa = {
  title: 'ユーザー管理',
  activeCount: '有効なユーザー：{active}/{max}',
  field: {
    username: 'ユーザー名',
    email: 'メールアドレス',
    roles: '権限',
    createdAt: '作成時間',
    status: 'ステータス',
    authAppStatus: '認証アプリ状態',
    password: 'パスワード'
  },
  status: {
    enabled: '有効',
    disabled: '無効'
  },
  authApp: {
    unset: '—',
    registered: '登録済'
  },
  action: {
    addUser: 'ユーザー追加',
    edit: '編集',
    delete: '削除',
    enable: '有効',
    disable: '無効',
    addDialogTitle: 'ユーザーを追加',
    editDialogTitle: 'ユーザーを編集'
  },
  message: {
    usernameRequired: 'ユーザー名を入力してください',
    emailRequired: 'メールアドレスを入力してください',
    rolesRequired: '権限を選択してください',
    passwordRequired: 'パスワードを入力してください',
    userAdded: 'ユーザーを追加しました',
    userUpdated: 'ユーザーを更新しました',
    userDeleted: 'ユーザーを削除しました',
    userEnabled: 'ユーザーを有効にしました',
    userDisabled: 'ユーザーを無効にしました',
    deleteConfirm: 'ユーザー「{name}」を削除しますか？',
    deleteTitle: '削除確認',
    accountLimit: '有効ユーザー数が上限（{max}）に達しています'
  }
}

export const userManagementZh = {
  title: '用户管理',
  activeCount: '有效用户：{active}/{max}',
  field: {
    username: '用户名',
    email: '邮箱地址',
    roles: '权限',
    createdAt: '创建时间',
    status: '状态',
    authAppStatus: '认证应用状态',
    password: '密码'
  },
  status: {
    enabled: '启用',
    disabled: '禁用'
  },
  authApp: {
    unset: '—',
    registered: '已注册'
  },
  action: {
    addUser: '添加用户',
    edit: '编辑',
    delete: '删除',
    enable: '启用',
    disable: '禁用',
    addDialogTitle: '添加用户',
    editDialogTitle: '编辑用户'
  },
  message: {
    usernameRequired: '请输入用户名',
    emailRequired: '请输入邮箱地址',
    rolesRequired: '请选择权限',
    passwordRequired: '请输入密码',
    userAdded: '已添加用户',
    userUpdated: '已更新用户',
    userDeleted: '已删除用户',
    userEnabled: '已启用用户',
    userDisabled: '已禁用用户',
    deleteConfirm: '确定删除用户「{name}」吗？',
    deleteTitle: '删除确认',
    accountLimit: '有效用户数已达上限（{max}）'
  }
}
