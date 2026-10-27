<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  DATA_RETENTION_OPTIONS,
  IDLE_SESSION_TIMEOUT_OPTIONS,
  securitySettings,
  type DataRetentionPeriod,
  type IdleSessionTimeout
} from '@/mocks/securitySettings'

const { t } = useI18n()

const draft = reactive({
  dataRetention: securitySettings.value.dataRetention,
  idleSessionTimeout: securitySettings.value.idleSessionTimeout
})

function syncDraftFromSaved() {
  draft.dataRetention = securitySettings.value.dataRetention
  draft.idleSessionTimeout = securitySettings.value.idleSessionTimeout
}

function retentionLabel(value: DataRetentionPeriod) {
  return t(`securitySettings.retention.${value}`)
}

function idleTimeoutLabel(value: IdleSessionTimeout) {
  return t(`securitySettings.idleTimeout.${value}`)
}

function handleClose() {
  syncDraftFromSaved()
}

function handleSave() {
  securitySettings.value = {
    dataRetention: draft.dataRetention,
    idleSessionTimeout: draft.idleSessionTimeout
  }
  ElMessage.success(t('securitySettings.message.saved'))
}
</script>

<template>
  <div class="v-content-wrap v-security-settings">
    <header class="v-security-settings__header">
      <h1 class="v-security-settings__title">{{ $t('securitySettings.title') }}</h1>
    </header>

    <el-card shadow="never" class="v-security-settings__card">
      <div class="v-security-settings__block">
        <div class="v-security-settings__block-main">
          <h2 class="v-security-settings__block-title">
            {{ $t('securitySettings.section.dataRetention.title') }}
          </h2>
          <p class="v-security-settings__description">
            {{ $t('securitySettings.section.dataRetention.description') }}
          </p>
        </div>
        <div class="v-security-settings__control">
          <el-select v-model="draft.dataRetention" class="v-security-settings__select">
            <el-option
              v-for="option in DATA_RETENTION_OPTIONS"
              :key="option"
              :label="retentionLabel(option)"
              :value="option"
            />
          </el-select>
        </div>
      </div>

      <div class="v-security-settings__block">
        <div class="v-security-settings__block-main">
          <h2 class="v-security-settings__block-title">
            {{ $t('securitySettings.section.idleSession.title') }}
          </h2>
          <p class="v-security-settings__description">
            {{ $t('securitySettings.section.idleSession.description1') }}
          </p>
          <p class="v-security-settings__description">
            {{ $t('securitySettings.section.idleSession.description2') }}
          </p>
        </div>
        <div class="v-security-settings__control v-security-settings__control--idle">
          <span class="v-security-settings__control-label">
            {{ $t('securitySettings.field.autoLogoutTime') }}
          </span>
          <el-select v-model="draft.idleSessionTimeout" class="v-security-settings__select">
            <el-option
              v-for="option in IDLE_SESSION_TIMEOUT_OPTIONS"
              :key="option"
              :label="idleTimeoutLabel(option)"
              :value="option"
            />
          </el-select>
        </div>
      </div>

      <div class="v-security-settings__footer">
        <el-button @click="handleClose">{{ $t('securitySettings.action.close') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ $t('securitySettings.action.save') }}</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.v-security-settings {
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

  &__card {
    border: 1px solid var(--border-color);
    border-radius: 12px;

    :deep(.el-card__body) {
      padding: var(--app-panel-padding);
      display: flex;
      flex-direction: column;
      gap: 0;
    }
  }

  &__block {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 0;

    &:first-child {
      padding-top: 0;
    }

    & + & {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__block-main {
    flex: 1;
    min-width: 0;
  }

  &__block-title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
  }

  &__description {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    line-height: 1.6;

    & + & {
      margin-top: 4px;
    }
  }

  &__control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 2px;

    &--idle {
      flex-direction: row;
      align-items: center;
    }
  }

  &__control-label {
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__select {
    width: 160px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: var(--app-section-gap);
    margin-top: var(--app-section-gap);
    border-top: 1px solid var(--border-color);
  }
}
</style>
