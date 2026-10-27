<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshRight, Search } from '@element-plus/icons-vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  createManagedRoleId,
  managedRoles,
  type ManagedRole
} from '@/mocks/roles'
import MenuPermissionDialog from './components/MenuPermissionDialog.vue'

const { t } = useI18n()

const page = ref(1)
const pageSize = ref(10)
const formDialogVisible = ref(false)
const menuPermissionVisible = ref(false)
const editingId = ref<string | null>(null)
const menuPermissionRole = ref<ManagedRole | null>(null)

const filters = reactive({
  roleName: '',
  roleId: ''
})

const draft = reactive({
  name: '',
  roleId: ''
})

const filteredRoles = computed(() => {
  return managedRoles.value.filter((role) => {
    if (
      filters.roleName &&
      !role.name.toLowerCase().includes(filters.roleName.trim().toLowerCase())
    ) {
      return false
    }
    if (
      filters.roleId &&
      !role.roleId.toLowerCase().includes(filters.roleId.trim().toLowerCase())
    ) {
      return false
    }
    return true
  })
})

const pagedRoles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRoles.value.slice(start, start + pageSize.value)
})

function rowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1
}

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.roleName = ''
  filters.roleId = ''
  page.value = 1
}

function resetDraft() {
  draft.name = ''
  draft.roleId = ''
  editingId.value = null
}

function openCreateDialog() {
  resetDraft()
  formDialogVisible.value = true
}

function openEditDialog(role: ManagedRole) {
  editingId.value = role.id
  draft.name = role.name
  draft.roleId = role.roleId
  formDialogVisible.value = true
}

function openMenuPermissionDialog(role: ManagedRole) {
  menuPermissionRole.value = role
  menuPermissionVisible.value = true
}

function validateDraft(): boolean {
  if (!draft.name.trim()) {
    ElMessage.warning(t('roleManagement.message.roleNameRequired'))
    return false
  }
  if (!draft.roleId.trim()) {
    ElMessage.warning(t('roleManagement.message.roleIdRequired'))
    return false
  }
  const duplicate = managedRoles.value.some(
    (role) =>
      role.roleId === draft.roleId.trim() &&
      role.id !== editingId.value
  )
  if (duplicate) {
    ElMessage.warning(t('roleManagement.message.roleIdDuplicate'))
    return false
  }
  return true
}

function formatNow(): string {
  return new Date().toLocaleString('ja-JP', { hour12: false }).replace(/\//g, '-')
}

function saveRole() {
  if (!validateDraft()) return

  const payload = {
    name: draft.name.trim(),
    roleId: draft.roleId.trim()
  }

  if (editingId.value) {
    const target = managedRoles.value.find((item) => item.id === editingId.value)
    if (!target) return
    Object.assign(target, payload)
    ElMessage.success(t('roleManagement.message.roleUpdated'))
  } else {
    managedRoles.value.unshift({
      id: createManagedRoleId(),
      ...payload,
      createdAt: formatNow(),
      menuKeys: []
    })
    ElMessage.success(t('roleManagement.message.roleAdded'))
  }

  formDialogVisible.value = false
  resetDraft()
}

function saveMenuPermission(menuKeys: string[]) {
  if (!menuPermissionRole.value) return
  const target = managedRoles.value.find((item) => item.id === menuPermissionRole.value?.id)
  if (!target) return
  target.menuKeys = [...menuKeys]
  ElMessage.success(t('roleManagement.message.menuPermissionSaved'))
}

async function removeRole(role: ManagedRole) {
  await ElMessageBox.confirm(
    t('roleManagement.message.deleteConfirm', { name: role.name }),
    t('roleManagement.message.deleteTitle'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )

  managedRoles.value = managedRoles.value.filter((item) => item.id !== role.id)
  ElMessage.success(t('roleManagement.message.roleDeleted'))
}
</script>

<template>
  <div class="v-content-wrap v-role-mgmt">
    <header class="v-role-mgmt__header">
      <h1 class="v-role-mgmt__title">{{ $t('roleManagement.title') }}</h1>
    </header>

    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--2">
            <el-input
              v-model="filters.roleName"
              clearable
              :placeholder="$t('roleManagement.field.roleName')"
            />
            <el-input
              v-model="filters.roleId"
              clearable
              :placeholder="$t('roleManagement.field.roleId')"
            />
          </div>
          <div class="v-list-search__actions">
            <el-button type="primary" :icon="Search" native-type="submit" />
            <el-button :icon="RefreshRight" @click="handleReset" />
          </div>
        </div>
      </el-form>
    </section>

    <section class="v-role-mgmt__table-section">
      <el-card shadow="never" class="v-role-mgmt__table-card">
        <div class="v-role-mgmt__toolbar">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            {{ $t('roleManagement.action.addRole') }}
          </el-button>
        </div>

        <el-table
          :data="pagedRoles"
          border
          style="width: 100%"
          :empty-text="$t('common.noData')"
        >
          <el-table-column
            :label="$t('common.index')"
            width="80"
            align="center"
            :index="rowIndex"
            type="index"
            header-class-name="v-list-table__index-col"
            class-name="v-list-table__index-col"
          />
          <el-table-column
            prop="name"
            :label="$t('roleManagement.field.roleName')"
            min-width="112"
            show-overflow-tooltip
          />
          <el-table-column
            prop="roleId"
            :label="$t('roleManagement.field.roleId')"
            min-width="112"
            show-overflow-tooltip
          />
          <el-table-column
            prop="createdAt"
            :label="$t('roleManagement.field.createdAt')"
            min-width="112"
            show-overflow-tooltip
          />
          <el-table-column
            :label="$t('common.action')"
            width="256"
            header-class-name="v-list-table__actions-col"
            class-name="v-list-table__actions-col"
          >
            <template #default="{ row }">
              <div class="v-list-table__actions">
                <el-button link type="primary" @click="openMenuPermissionDialog(row)">
                  {{ $t('roleManagement.action.menuPermission') }}
                </el-button>
                <el-button link type="primary" @click="openEditDialog(row)">
                  {{ $t('roleManagement.action.edit') }}
                </el-button>
                <el-button link type="danger" @click="removeRole(row)">
                  {{ $t('roleManagement.action.delete') }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="v-role-mgmt__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredRoles.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </section>

    <el-dialog
      v-model="formDialogVisible"
      :title="
        editingId
          ? $t('roleManagement.action.editDialogTitle')
          : $t('roleManagement.action.addDialogTitle')
      "
      width="480px"
      destroy-on-close
      @closed="resetDraft"
    >
      <el-form label-position="top" class="v-role-mgmt__form">
        <AppFormItem :label="$t('roleManagement.field.roleName')" required>
          <el-input v-model="draft.name" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>
        <AppFormItem :label="$t('roleManagement.field.roleId')" required>
          <el-input v-model="draft.roleId" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveRole">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>

    <MenuPermissionDialog
      v-model="menuPermissionVisible"
      :role="menuPermissionRole"
      @save="saveMenuPermission"
    />
  </div>
</template>

<style scoped lang="scss">
.v-role-mgmt {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-page-gap);
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__table-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__table-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;

    :deep(.el-card__body) {
      padding: var(--app-panel-padding);
    }

    :deep(.el-table) {
      font-size: var(--app-font-size-base);
      --el-table-header-bg-color: #f9fafb;
    }

    :deep(.el-table .el-table__cell) {
      padding: 12px 10px;
    }

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: var(--app-section-gap);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
