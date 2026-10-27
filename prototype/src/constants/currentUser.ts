export type UserRole = 'admin' | 'operator' | 'assignee'

/** プロトタイプ用ログインユーザー（管理者で改派デモ） */
export const CURRENT_USER = {
  id: 'user-admin',
  name: '管理者',
  role: 'admin' as UserRole
}

export function isAdminUser(): boolean {
  return CURRENT_USER.role === 'admin'
}
