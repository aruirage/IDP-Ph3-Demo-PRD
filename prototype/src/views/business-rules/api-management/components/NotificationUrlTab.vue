<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { PLACEHOLDER } from '@/constants/placeholders'
import { notificationSettings, generateSignatureKey } from '@/mocks/apiManagement'

const { t } = useI18n()

const editing = ref(false)
const draft = reactive({
  notifyUrl: '',
  signatureKey: ''
})

function startEdit() {
  draft.notifyUrl = notificationSettings.value.notifyUrl
  draft.signatureKey = notificationSettings.value.signatureKey || generateSignatureKey()
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function saveEdit() {
  if (!draft.signatureKey.trim()) {
    ElMessage.warning(t('businessRules.api.message.signatureKeyRequired'))
    return
  }
  notificationSettings.value = {
    notifyUrl: draft.notifyUrl.trim(),
    signatureKey: draft.signatureKey.trim()
  }
  editing.value = false
  ElMessage.success(t('businessRules.api.message.notifySaved'))
}

function regenerateSignatureKey() {
  draft.signatureKey = generateSignatureKey()
}

function displayValue(value: string): string {
  return value || '—'
}
</script>

<template>
  <div class="v-api-notify">
    <div class="v-api-notify__head">
      <h2 class="v-api-notify__title">{{ $t('businessRules.api.notify.title') }}</h2>
      <el-button v-if="!editing" type="primary" @click="startEdit">
        {{ $t('businessRules.api.action.edit') }}
      </el-button>
      <div v-else class="v-api-notify__actions">
        <el-button @click="cancelEdit">{{ $t('businessRules.api.action.cancel') }}</el-button>
        <el-button type="primary" @click="saveEdit">{{ $t('businessRules.api.action.save') }}</el-button>
      </div>
    </div>

    <div class="v-api-notify__fields">
      <div class="v-api-notify__field">
        <span class="v-api-notify__label">{{ $t('businessRules.api.field.notifyUrl') }}</span>
        <el-input
          v-if="editing"
          v-model="draft.notifyUrl"
          :placeholder="PLACEHOLDER.INPUT"
        />
        <div v-else class="v-api-notify__value">{{ displayValue(notificationSettings.notifyUrl) }}</div>
      </div>

      <div class="v-api-notify__field">
        <span class="v-api-notify__label">{{ $t('businessRules.api.field.signatureKey') }}</span>
        <div v-if="editing" class="v-api-notify__signature-row">
          <el-input
            v-model="draft.signatureKey"
            readonly
            :placeholder="PLACEHOLDER.INPUT"
            class="v-api-notify__signature-input"
          />
          <el-button type="primary" @click="regenerateSignatureKey">
            {{ $t('businessRules.api.action.generate') }}
          </el-button>
        </div>
        <div v-else class="v-api-notify__value">{{ displayValue(notificationSettings.signatureKey) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-api-notify {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
  padding: var(--app-panel-padding);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__value {
    min-height: 40px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--app-content-bg-color);
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    line-height: 1.5;
    word-break: break-all;
  }

  &__signature-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__signature-input {
    flex: 1;
    min-width: 0;
  }
}
</style>
