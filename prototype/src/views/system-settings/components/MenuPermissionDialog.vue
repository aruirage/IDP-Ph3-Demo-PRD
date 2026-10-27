<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ALL_MENU_PERMISSION_KEYS,
  MENU_PERMISSION_TREE,
  type MenuPermissionTreeNode
} from '@/constants/menuPermissions'
import type { ManagedRole } from '@/mocks/roles'

const props = defineProps<{
  role: ManagedRole | null
}>()

const visible = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  save: [menuKeys: string[]]
}>()

const { t } = useI18n()

interface ElTreeNode {
  id: string
  label: string
  children?: ElTreeNode[]
}

const treeRef = ref<{
  setCheckedKeys: (keys: string[]) => void
  getCheckedKeys: () => string[]
  getHalfCheckedKeys: () => string[]
}>()

const checkedKeys = ref<string[]>([])
const selectAllEnabled = ref(false)
const expandAll = ref(false)
const treeRenderKey = ref(0)

function mapTreeNodes(nodes: MenuPermissionTreeNode[]): ElTreeNode[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label ?? (node.labelKey ? t(node.labelKey) : node.id),
    children: node.children ? mapTreeNodes(node.children) : undefined
  }))
}

const treeData = computed(() => mapTreeNodes(MENU_PERMISSION_TREE))

function isAllSelected(keys: string[]) {
  return ALL_MENU_PERMISSION_KEYS.every((key) => keys.includes(key))
}

function applyCheckedKeys(keys: string[]) {
  checkedKeys.value = [...keys]
  nextTick(() => {
    treeRef.value?.setCheckedKeys(keys)
  })
}

function collectCheckedMenuKeys(): string[] {
  if (!treeRef.value) return [...checkedKeys.value]
  const checked = treeRef.value.getCheckedKeys() as string[]
  const half = treeRef.value.getHalfCheckedKeys() as string[]
  return [...new Set([...checked, ...half])].filter((key) => key !== 'neosai')
}

function syncSelectAllFromTree() {
  selectAllEnabled.value = isAllSelected(collectCheckedMenuKeys())
}

function handleTreeCheck() {
  syncSelectAllFromTree()
}

function handleSelectAllToggle(enabled: boolean) {
  if (enabled) {
    applyCheckedKeys([...ALL_MENU_PERMISSION_KEYS])
  } else {
    applyCheckedKeys([])
  }
}

function handleExpandToggle(expanded: boolean) {
  expandAll.value = expanded
  treeRenderKey.value += 1
  nextTick(() => {
    applyCheckedKeys(checkedKeys.value)
  })
}

function openForRole(role: ManagedRole) {
  const keys = role.menuKeys.filter((key) => ALL_MENU_PERMISSION_KEYS.includes(key))
  selectAllEnabled.value = isAllSelected(keys)
  expandAll.value = false
  treeRenderKey.value += 1
  applyCheckedKeys(keys)
}

function handleOk() {
  emit('save', collectCheckedMenuKeys())
  visible.value = false
}

function handleCancel() {
  visible.value = false
}

watch(
  () => [visible.value, props.role?.id] as const,
  ([isVisible, roleId]) => {
    if (isVisible && props.role && roleId) {
      openForRole(props.role)
    }
  }
)
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="$t('roleManagement.action.menuPermissionDialogTitle')"
    width="800px"
    class="v-menu-perm-dialog"
    destroy-on-close
    :align-center="true"
    @closed="checkedKeys = []"
  >
    <template v-if="role">
      <div class="v-menu-perm-dialog__body">
        <div class="v-menu-perm-dialog__row v-menu-perm-dialog__row--meta">
          <span class="v-menu-perm-dialog__label">{{ $t('roleManagement.field.roleName') }}</span>
          <span class="v-menu-perm-dialog__value">{{ role.name }}</span>
        </div>

        <div class="v-menu-perm-dialog__row v-menu-perm-dialog__row--meta">
          <span class="v-menu-perm-dialog__label">{{ $t('roleManagement.field.roleId') }}</span>
          <span class="v-menu-perm-dialog__value">{{ role.roleId }}</span>
        </div>

        <div class="v-menu-perm-dialog__row v-menu-perm-dialog__row--permission">
          <span class="v-menu-perm-dialog__label">{{ $t('roleManagement.field.menuPermission') }}</span>
          <div class="v-menu-perm-dialog__permission-box">
            <div class="v-menu-perm-dialog__toggles">
              <div class="v-menu-perm-dialog__toggle-row">
                <span class="v-menu-perm-dialog__toggle-label">
                  {{ $t('roleManagement.action.selectAllDeselectAllLabel') }}
                </span>
                <el-switch
                  v-model="selectAllEnabled"
                  inline-prompt
                  :active-text="$t('roleManagement.action.switchYes')"
                  :inactive-text="$t('roleManagement.action.switchNo')"
                  @change="handleSelectAllToggle"
                />
              </div>
              <div class="v-menu-perm-dialog__toggle-row">
                <span class="v-menu-perm-dialog__toggle-label">
                  {{ $t('roleManagement.action.expandCollapseLabel') }}
                </span>
                <el-switch
                  v-model="expandAll"
                  inline-prompt
                  class="v-menu-perm-dialog__expand-switch"
                  :active-text="$t('roleManagement.action.expandMore')"
                  :inactive-text="$t('roleManagement.action.collapse')"
                  @change="handleExpandToggle"
                />
              </div>
            </div>

            <div class="v-menu-perm-dialog__tree-wrap">
              <el-tree
                :key="treeRenderKey"
                ref="treeRef"
                class="v-menu-perm-dialog__tree"
                :data="treeData"
                node-key="id"
                show-checkbox
                :default-expand-all="expandAll"
                :default-checked-keys="checkedKeys"
                :expand-on-click-node="false"
                @check="handleTreeCheck"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleOk">{{ $t('common.ok') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.v-menu-perm-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.v-menu-perm-dialog__row {
  &--meta {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &--permission {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    column-gap: 16px;
    align-items: start;
  }
}

.v-menu-perm-dialog__label {
  flex-shrink: 0;
  width: 120px;
  font-size: var(--app-font-size-base);
  color: var(--text-secondary);
  line-height: 1.5;
  text-align: right;
  padding-right: 4px;
}

.v-menu-perm-dialog__row--permission .v-menu-perm-dialog__label {
  padding-top: 10px;
}

.v-menu-perm-dialog__value {
  display: inline-block;
  width: auto;
  max-width: 100%;
  box-sizing: border-box;
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: var(--app-font-size-base);
  line-height: 1.5;
  border: 1px solid var(--el-color-primary-light-7);
}

.v-menu-perm-dialog__permission-box {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #fff;
  min-width: 0;
  overflow: hidden;
}

.v-menu-perm-dialog__toggles {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  background: #fff;
}

.v-menu-perm-dialog__toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.v-menu-perm-dialog__toggle-label {
  font-size: var(--app-font-size-base);
  color: var(--text-primary);
  line-height: 1.5;
  white-space: nowrap;
}

.v-menu-perm-dialog__tree-wrap {
  min-height: 200px;
  max-height: 280px;
  overflow: auto;
  padding: 6px 8px 10px;
  background: #fff;
}

.v-menu-perm-dialog__tree {
  font-size: var(--app-font-size-base);
  background: transparent;

  :deep(.el-tree-node__content) {
    height: 32px;
    border-radius: 4px;
  }

  :deep(.el-tree-node__expand-icon) {
    color: var(--text-secondary);
    font-size: 14px;
  }

  :deep(.el-checkbox__inner) {
    border-radius: 4px;
  }
}
</style>

<style lang="scss">
.v-menu-perm-dialog.el-dialog {
  width: 800px !important;
  max-width: calc(100vw - 32px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);

  .el-dialog__header {
    margin: 0;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border-color);
  }

  .el-dialog__title {
    font-size: var(--app-font-size-section);
    font-weight: 600;
    line-height: 1.5;
    color: var(--text-primary);
  }

  .el-dialog__headerbtn {
    top: 14px;
    right: 14px;
    width: 32px;
    height: 32px;

    .el-dialog__close {
      color: var(--text-secondary);
      font-size: 18px;
    }
  }

  .el-dialog__body {
    padding: 18px 24px 22px;
    color: var(--text-primary);
  }

  .el-dialog__footer {
    padding: 14px 24px;
    border-top: 1px solid var(--border-color);
  }

  .el-dialog__footer .el-button + .el-button {
    margin-left: 8px;
  }

  .el-switch {
    height: 28px;
    flex-shrink: 0;

    .el-switch__core {
      min-width: 64px;
      height: 28px;
      border-radius: 14px;
      border: none;
      background-color: #d5d7da;
    }

    &.v-menu-perm-dialog__expand-switch .el-switch__core {
      min-width: 88px;
    }

    .el-switch__action {
      width: 22px;
      height: 22px;
    }

    .el-switch__inner {
      padding: 0 8px;
      font-size: 13px;
      font-weight: 500;
      color: #fff;
    }

    &.is-checked .el-switch__core {
      background-color: var(--el-color-primary);
    }

    &:not(.is-checked) .el-switch__core .el-switch__inner {
      color: #fff;
    }
  }
}
</style>
