<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshRight, Search } from '@element-plus/icons-vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  activeUserCount,
  createManagedUserId,
  formatUserRoles,
  managedUsers,
  USER_ACCOUNT_LIMIT,
  USER_ROLE_OPTIONS,
  type ManagedUser,
  type UserStatus
} from '@/mocks/users'

const { t } = useI18n()

const page = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

const filters = reactive({
  username: '',
  email: '',
  role: '',
  status: '' as '' | UserStatus
})

const draft = reactive({
  username: '',
  email: '',
  roles: [] as string[],
  password: ''
})

const roleOptions = USER_ROLE_OPTIONS

const activeCount = computed(() => activeUserCount())

const filteredUsers = computed(() => {
  return managedUsers.value.filter((user) => {
    if (
      filters.username &&
      !user.username.toLowerCase().includes(filters.username.trim().toLowerCase())
    ) {
      return false
    }
    if (
      filters.email &&
      !user.email.toLowerCase().includes(filters.email.trim().toLowerCase())
    ) {
      return false
    }
    if (filters.role && !user.roles.includes(filters.role)) {
      return false
    }
    if (filters.status && user.status !== filters.status) {
      return false
    }
    return true
  })
})

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

function rowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1
}

function statusLabel(status: UserStatus) {
  return status === 'enabled'
    ? t('userManagement.status.enabled')
    : t('userManagement.status.disabled')
}

function handleSearch() {
  page.value = 1
}

function handleReset() {
  filters.username = ''
  filters.email = ''
  filters.role = ''
  filters.status = ''
  page.value = 1
}

function resetDraft() {
  draft.username = ''
  draft.email = ''
  draft.roles = []
  draft.password = ''
  editingId.value = null
}

function openCreateDialog() {
  resetDraft()
  dialogVisible.value = true
}

function openEditDialog(user: ManagedUser) {
  editingId.value = user.id
  draft.username = user.username
  draft.email = user.email
  draft.roles = [...user.roles]
  draft.password = ''
  dialogVisible.value = true
}

function validateDraft(): boolean {
  if (!draft.username.trim()) {
    ElMessage.warning(t('userManagement.message.usernameRequired'))
    return false
  }
  if (!draft.email.trim()) {
    ElMessage.warning(t('userManagement.message.emailRequired'))
    return false
  }
  if (!draft.roles.length) {
    ElMessage.warning(t('userManagement.message.rolesRequired'))
    return false
  }
  if (!editingId.value && !draft.password.trim()) {
    ElMessage.warning(t('userManagement.message.passwordRequired'))
    return false
  }
  return true
}

function formatNow(): string {
  return new Date().toLocaleString('ja-JP', { hour12: false }).replace(/\//g, '-')
}

function saveUser() {
  if (!validateDraft()) return

  const payload = {
    username: draft.username.trim(),
    email: draft.email.trim(),
    roles: [...draft.roles]
  }

  if (editingId.value) {
    const target = managedUsers.value.find((item) => item.id === editingId.value)
    if (!target) return
    Object.assign(target, payload)
    ElMessage.success(t('userManagement.message.userUpdated'))
  } else {
    managedUsers.value.unshift({
      id: createManagedUserId(),
      ...payload,
      createdAt: formatNow(),
      status: 'enabled',
      authAppStatus: 'unset'
    })
    ElMessage.success(t('userManagement.message.userAdded'))
  }

  dialogVisible.value = false
  resetDraft()
}

async function toggleUserStatus(user: ManagedUser) {
  if (user.status === 'enabled') {
    user.status = 'disabled'
    ElMessage.success(t('userManagement.message.userDisabled'))
    return
  }

  if (activeUserCount() >= USER_ACCOUNT_LIMIT) {
    ElMessage.warning(
      t('userManagement.message.accountLimit', { max: USER_ACCOUNT_LIMIT })
    )
    return
  }

  user.status = 'enabled'
  ElMessage.success(t('userManagement.message.userEnabled'))
}

async function removeUser(user: ManagedUser) {
  await ElMessageBox.confirm(
    t('userManagement.message.deleteConfirm', { name: user.username }),
    t('userManagement.message.deleteTitle'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )

  managedUsers.value = managedUsers.value.filter((item) => item.id !== user.id)
  ElMessage.success(t('userManagement.message.userDeleted'))
}
</script>

<template>
  <div class="v-content-wrap v-user-mgmt">
    <header class="v-user-mgmt__header">
      <h1 class="v-user-mgmt__title">{{ $t('userManagement.title') }}</h1>
    </header>

    <section class="v-list-search">
      <el-form :model="filters" class="v-list-search__form" @submit.prevent="handleSearch">
        <div class="v-list-search__body">
          <div class="v-list-search__grid v-list-search__grid--4">
            <el-input
              v-model="filters.username"
              clearable
              :placeholder="$t('userManagement.field.username')"
            />
            <el-input
              v-model="filters.email"
              clearable
              :placeholder="$t('userManagement.field.email')"
            />
            <el-select
              v-model="filters.role"
              clearable
              :placeholder="$t('userManagement.field.roles')"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role"
                :label="role"
                :value="role"
              />
            </el-select>
            <el-select
              v-model="filters.status"
              clearable
              :placeholder="$t('userManagement.field.status')"
            >
              <el-option
                :label="$t('userManagement.status.enabled')"
                value="enabled"
              />
              <el-option
                :label="$t('userManagement.status.disabled')"
                value="disabled"
              />
            </el-select>
          </div>
          <div class="v-list-search__actions">
            <el-button type="primary" :icon="Search" native-type="submit" />
            <el-button :icon="RefreshRight" @click="handleReset" />
          </div>
        </div>
      </el-form>
    </section>

    <section class="v-user-mgmt__table-section">
      <el-card shadow="never" class="v-user-mgmt__table-card">
        <div class="v-user-mgmt__toolbar">
          <span class="v-user-mgmt__active-count">
            {{
              $t('userManagement.activeCount', {
                active: activeCount,
                max: USER_ACCOUNT_LIMIT
              })
            }}
          </span>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            {{ $t('userManagement.action.addUser') }}
          </el-button>
        </div>

        <el-table
          :data="pagedUsers"
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
            prop="username"
            :label="$t('userManagement.field.username')"
            min-width="132"
            show-overflow-tooltip
          />
          <el-table-column
            prop="email"
            :label="$t('userManagement.field.email')"
            min-width="152"
            show-overflow-tooltip
          />
          <el-table-column
            :label="$t('userManagement.field.roles')"
            min-width="96"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ formatUserRoles(row.roles) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="createdAt"
            :label="$t('userManagement.field.createdAt')"
            min-width="112"
            show-overflow-tooltip
          />
          <el-table-column
            :label="$t('userManagement.field.status')"
            min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'primary' : 'info'" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.action')"
            width="220"
            header-class-name="v-list-table__actions-col"
            class-name="v-list-table__actions-col"
          >
            <template #default="{ row }">
              <div class="v-list-table__actions">
                <el-button link type="primary" @click="toggleUserStatus(row)">
                  {{
                    row.status === 'enabled'
                      ? $t('userManagement.action.disable')
                      : $t('userManagement.action.enable')
                  }}
                </el-button>
                <el-button link type="primary" @click="openEditDialog(row)">
                  {{ $t('userManagement.action.edit') }}
                </el-button>
                <el-button link type="danger" @click="removeUser(row)">
                  {{ $t('userManagement.action.delete') }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="v-user-mgmt__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredUsers.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="
        editingId
          ? $t('userManagement.action.editDialogTitle')
          : $t('userManagement.action.addDialogTitle')
      "
      width="520px"
      destroy-on-close
      @closed="resetDraft"
    >
      <el-form label-position="top" class="v-user-mgmt__form">
        <AppFormItem :label="$t('userManagement.field.username')" required>
          <el-input v-model="draft.username" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>
        <AppFormItem :label="$t('userManagement.field.email')" required>
          <el-input v-model="draft.email" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>
        <AppFormItem :label="$t('userManagement.field.roles')" required>
          <el-select
            v-model="draft.roles"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="PLACEHOLDER.SELECT_MULTIPLE"
            class="v-user-mgmt__full-width"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role"
              :label="role"
              :value="role"
            />
          </el-select>
        </AppFormItem>
        <AppFormItem v-if="!editingId" :label="$t('userManagement.field.password')" required>
          <el-input
            v-model="draft.password"
            type="password"
            show-password
            :placeholder="PLACEHOLDER.INPUT"
            autocomplete="new-password"
          />
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveUser">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-user-mgmt {
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
    gap: 16px;
    margin-bottom: var(--app-section-gap);
    flex-wrap: wrap;
  }

  &__active-count {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__muted {
    color: var(--text-secondary);
    font-size: var(--app-font-size-base);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
  }

  &__full-width {
    width: 100%;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
