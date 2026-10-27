import { ref } from 'vue'

export interface ManagedRole {
  id: string
  name: string
  roleId: string
  createdAt: string
  menuKeys: string[]
}

export const managedRoles = ref<ManagedRole[]>([
  {
    id: 'role-001',
    name: 'admin',
    roleId: 'tenant_admin',
    createdAt: '2026-05-05 17:50:00',
    menuKeys: [
      'upload',
      'cases',
      'tasks',
      'business-rules',
      'doc-types',
      'business-scene-settings',
      'master-data',
      'data-mapping',
      'verification-settings',
      'model-settings',
      'api-management',
      'system-settings',
      'user-management',
      'role-management',
      'security-settings',
      'usage-statistics'
    ]
  },
  {
    id: 'role-002',
    name: '操作管理者',
    roleId: 'operator_admin',
    createdAt: '2026-05-05 17:55:12',
    menuKeys: [
      'upload',
      'cases',
      'tasks',
      'business-rules',
      'doc-types',
      'business-scene-settings',
      'master-data',
      'data-mapping',
      'verification-settings'
    ]
  },
  {
    id: 'role-004',
    name: 'オペレーター',
    roleId: 'operator',
    createdAt: '2026-04-28 09:12:33',
    menuKeys: ['upload', 'cases', 'tasks']
  }
])

export function createManagedRoleId(): string {
  return `role-${Date.now().toString(36)}`
}
