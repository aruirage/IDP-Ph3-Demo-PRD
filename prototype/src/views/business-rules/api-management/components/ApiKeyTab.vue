<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  apiKeyRecords,
  createApiKeyId,
  generateApiKey,
  maskApiKey,
  type ApiKeyRecord
} from '@/mocks/apiManagement'

const { t } = useI18n()

const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

const draft = reactive({
  name: '',
  validFrom: '',
  validTo: '',
  enabled: true
})

function resetDraft() {
  draft.name = ''
  draft.validFrom = ''
  draft.validTo = ''
  draft.enabled = true
  editingId.value = null
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('ja-JP', { hour12: false }).replace(/\//g, '-')
}

function toDateOnly(value: string): string {
  return value ? value.slice(0, 10) : ''
}

function openCreateDialog() {
  resetDraft()
  const now = new Date()
  draft.validFrom = formatDate(now)
  const oneYearLater = new Date(now)
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  draft.validTo = formatDate(oneYearLater)
  dialogVisible.value = true
}

function openEditDialog(record: ApiKeyRecord) {
  editingId.value = record.id
  draft.name = record.name
  draft.validFrom = toDateOnly(record.validFrom)
  draft.validTo = toDateOnly(record.validTo)
  draft.enabled = record.enabled
  dialogVisible.value = true
}

function validateDraft(): boolean {
  if (!draft.name.trim()) {
    ElMessage.warning(t('businessRules.api.message.apiNameRequired'))
    return false
  }
  if (!draft.validFrom || !draft.validTo) {
    ElMessage.warning(t('businessRules.api.message.validPeriodRequired'))
    return false
  }
  return true
}

function saveKey() {
  if (!validateDraft()) return

  const payload = {
    name: draft.name.trim(),
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    enabled: draft.enabled
  }

  if (editingId.value) {
    const target = apiKeyRecords.value.find((item) => item.id === editingId.value)
    if (!target) return
    Object.assign(target, payload)
    ElMessage.success(t('businessRules.api.message.apiKeyUpdated'))
  } else {
    apiKeyRecords.value.unshift({
      id: createApiKeyId(),
      ...payload,
      apiKey: generateApiKey(),
      createdAt: formatDateTime(new Date())
    })
    ElMessage.success(t('businessRules.api.message.apiKeyIssued'))
  }

  dialogVisible.value = false
  resetDraft()
}
</script>

<template>
  <div class="v-api-key">
    <div class="v-api-key__toolbar">
      <span />
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('businessRules.api.apiKey.issue') }}
      </el-button>
    </div>

    <el-table :data="apiKeyRecords" border class="v-api-key__table">
      <el-table-column
        type="index"
        :label="$t('businessRules.api.field.no')"
        width="64"
        align="center"
      />
      <el-table-column prop="name" :label="$t('businessRules.api.field.apiName')" min-width="120" />
      <el-table-column :label="$t('businessRules.api.field.apiKey')" min-width="280">
        <template #default="{ row }">
          <code class="v-api-key__masked">{{ maskApiKey(row.apiKey) }}</code>
        </template>
      </el-table-column>
      <el-table-column
        prop="createdAt"
        :label="$t('businessRules.api.field.createdAt')"
        min-width="170"
      />
      <el-table-column
        prop="validFrom"
        :label="$t('businessRules.api.field.validFrom')"
        min-width="170"
      />
      <el-table-column
        prop="validTo"
        :label="$t('businessRules.api.field.validTo')"
        min-width="170"
      />
      <el-table-column
        :label="$t('businessRules.api.field.status')"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <span :class="row.enabled ? 'v-api-key__status--active' : 'v-api-key__status--inactive'">
            {{
              row.enabled
                ? $t('businessRules.api.status.enabled')
                : $t('businessRules.api.status.disabled')
            }}
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('businessRules.api.field.action')" width="88" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">
            {{ $t('businessRules.api.action.edit') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="
        editingId
          ? $t('businessRules.api.apiKey.editTitle')
          : $t('businessRules.api.apiKey.issueTitle')
      "
      width="520px"
      destroy-on-close
      @closed="resetDraft"
    >
      <el-form label-width="120px">
        <AppFormItem :label="$t('businessRules.api.field.apiName')" required>
          <el-input v-model="draft.name" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>
        <AppFormItem :label="$t('businessRules.api.field.validFrom')" required>
          <el-date-picker
            v-model="draft.validFrom"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="PLACEHOLDER.DATE_START"
            class="w-full"
          />
        </AppFormItem>
        <AppFormItem :label="$t('businessRules.api.field.validTo')" required>
          <el-date-picker
            v-model="draft.validTo"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="PLACEHOLDER.DATE_END"
            class="w-full"
          />
        </AppFormItem>
        <AppFormItem :label="$t('businessRules.api.field.status')">
          <el-switch
            v-model="draft.enabled"
            :active-text="$t('businessRules.api.status.enabled')"
            :inactive-text="$t('businessRules.api.status.disabled')"
          />
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ $t('businessRules.api.action.cancel') }}
        </el-button>
        <el-button type="primary" @click="saveKey">
          {{ $t('businessRules.api.action.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-api-key {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
  }

  &__table {
    width: 100%;
  }

  &__masked {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 14px;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  &__status--active {
    font-size: var(--app-font-size-base);
    color: var(--el-color-success);
  }

  &__status--inactive {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }
}
</style>
