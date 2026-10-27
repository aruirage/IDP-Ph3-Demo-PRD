import { ref } from 'vue'

export type UserStatus = 'enabled' | 'disabled'

export type AuthAppStatus = 'unset' | 'registered'

export interface ManagedUser {
  id: string
  username: string
  email: string
  roles: string[]
  createdAt: string
  status: UserStatus
  authAppStatus: AuthAppStatus
}

export const USER_ACCOUNT_LIMIT = 50

export const USER_ROLE_OPTIONS = [
  'admin',
  '操作管理者',
  'オペレーター'
] as const

export const managedUsers = ref<ManagedUser[]>([
  {
    id: 'user-mgmt-001',
    username: 'admin',
    email: 'test1@neosai.jp',
    roles: ['admin', '操作管理者'],
    createdAt: '2026-05-05 18:07:56',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-002',
    username: 'testuser2',
    email: 'test2@neosai.jp',
    roles: ['オペレーター'],
    createdAt: '2026-05-05 18:05:39',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-003',
    username: 'testuser1',
    email: 'test1@neosai.jp',
    roles: ['admin'],
    createdAt: '2026-05-05 17:59:19',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-004',
    username: '山田 太郎',
    email: 'yamada@neosai.jp',
    roles: ['オペレーター'],
    createdAt: '2026-04-28 10:12:00',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-005',
    username: '鈴木 花子',
    email: 'suzuki@neosai.jp',
    roles: ['オペレーター'],
    createdAt: '2026-04-28 10:15:22',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-006',
    username: '佐藤 一郎',
    email: 'sato@neosai.jp',
    roles: ['オペレーター'],
    createdAt: '2026-04-25 09:30:11',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-007',
    username: '田中美咲',
    email: 'tanaka@neosai.jp',
    roles: ['オペレーター'],
    createdAt: '2026-04-20 14:08:45',
    status: 'enabled',
    authAppStatus: 'unset'
  },
  {
    id: 'user-mgmt-008',
    username: '高橋 健',
    email: 'takahashi@neosai.jp',
    roles: ['オペレーター'],
    createdAt: '2026-04-18 16:22:33',
    status: 'enabled',
    authAppStatus: 'unset'
  }
])

export function activeUserCount(): number {
  return managedUsers.value.filter((user) => user.status === 'enabled').length
}

export function createManagedUserId(): string {
  return `user-mgmt-${Date.now().toString(36)}`
}

export function formatUserRoles(roles: string[]): string {
  return roles.join(', ')
}
