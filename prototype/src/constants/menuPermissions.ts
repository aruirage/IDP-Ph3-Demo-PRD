import { menuItems, type MenuItem } from './menu'

export interface MenuPermissionTreeNode {
  id: string
  labelKey?: string
  label?: string
  children?: MenuPermissionTreeNode[]
}

export function mapMenuItemToPermissionNode(item: MenuItem): MenuPermissionTreeNode {
  return {
    id: item.key,
    labelKey: item.labelKey,
    children: item.children?.map(mapMenuItemToPermissionNode)
  }
}

export function buildMenuPermissionTree(): MenuPermissionTreeNode[] {
  return [
    {
      id: 'neosai',
      label: 'NeosAI',
      children: menuItems.map(mapMenuItemToPermissionNode)
    }
  ]
}

export function collectMenuPermissionKeys(nodes: MenuPermissionTreeNode[]): string[] {
  const keys: string[] = []

  function walk(node: MenuPermissionTreeNode) {
    if (node.id !== 'neosai') {
      keys.push(node.id)
    }
    node.children?.forEach(walk)
  }

  nodes.forEach(walk)
  return keys
}

export const MENU_PERMISSION_TREE = buildMenuPermissionTree()
export const ALL_MENU_PERMISSION_KEYS = collectMenuPermissionKeys(MENU_PERMISSION_TREE)
