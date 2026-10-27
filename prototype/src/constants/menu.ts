export interface MenuItem {
  key: string
  path?: string
  /** 外部リンク（設定時は同一タブで遷移） */
  externalUrl?: string
  labelKey: string
  icon: string
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  { key: 'upload', path: '/upload', labelKey: 'menu.upload', icon: 'UploadFilled' },
  { key: 'cases', path: '/cases', labelKey: 'menu.cases', icon: 'FolderOpened' },
  { key: 'tasks', path: '/tasks', labelKey: 'menu.tasks', icon: 'List' },
  {
    key: 'business-rules',
    labelKey: 'menu.businessRules',
    icon: 'Setting',
    children: [
      {
        key: 'doc-types',
        path: '/business-rules/doc-types',
        labelKey: 'menu.docTypes',
        icon: 'Document'
      },
      {
        key: 'business-scene-settings',
        path: '/business-rules/business-scene',
        labelKey: 'menu.businessScene',
        icon: 'Notebook'
      },
      {
        key: 'master-data',
        path: '/business-rules/master-data',
        labelKey: 'menu.masterData',
        icon: 'Collection'
      },
      {
        key: 'data-mapping',
        path: '/business-rules/data-mapping',
        labelKey: 'menu.dataMapping',
        icon: 'Connection'
      },
      {
        key: 'verification-settings',
        path: '/business-rules/verification-settings',
        labelKey: 'menu.verificationSettings',
        icon: 'CircleCheck'
      },
      {
        key: 'model-settings',
        path: '/business-rules/model-settings',
        labelKey: 'menu.modelSettings',
        icon: 'Cpu'
      },
      {
        key: 'api-management',
        path: '/business-rules/api-management',
        labelKey: 'menu.apiManagement',
        icon: 'Link'
      }
    ]
  },
  {
    key: 'system-settings',
    labelKey: 'menu.systemSettings',
    icon: 'Tools',
    children: [
      {
        key: 'user-management',
        path: '/system-settings/users',
        labelKey: 'menu.userManagement',
        icon: 'User'
      },
      {
        key: 'role-management',
        path: '/system-settings/roles',
        labelKey: 'menu.roleManagement',
        icon: 'Key'
      },
      {
        key: 'security-settings',
        path: '/system-settings/security',
        labelKey: 'menu.securitySettings',
        icon: 'Lock'
      },
      {
        key: 'usage-statistics',
        path: '/system-settings/usage-statistics',
        labelKey: 'menu.usageStatistics',
        icon: 'DataAnalysis'
      }
    ]
  }
]

export function findMenuParentKey(menuKey: string): string | undefined {
  for (const item of menuItems) {
    if (item.children?.some((child) => child.key === menuKey)) {
      return item.key
    }
  }
  return undefined
}
