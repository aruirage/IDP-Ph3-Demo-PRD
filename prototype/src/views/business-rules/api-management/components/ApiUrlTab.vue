<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import { buildOpenApiUrl, openApiEndpoints } from '@/mocks/apiManagement'

const { t } = useI18n()

async function copyUrl(path: string) {
  const url = buildOpenApiUrl(path)
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success(t('businessRules.api.message.urlCopied'))
  } catch {
    ElMessage.error(t('businessRules.api.message.copyFailed'))
  }
}
</script>

<template>
  <div class="v-api-url">
    <div v-for="endpoint in openApiEndpoints" :key="endpoint.id" class="v-api-url__card">
      <h3 class="v-api-url__name">{{ endpoint.name }}</h3>
      <p v-if="endpoint.phase3Note" class="v-api-url__note">{{ endpoint.phase3Note }}</p>
      <div class="v-api-url__row">
        <span class="v-api-url__label">{{ $t('businessRules.api.apiUrl.label') }}</span>
        <div class="v-api-url__input-wrap">
          <span class="v-api-url__value">{{ buildOpenApiUrl(endpoint.path) }}</span>
          <button
            type="button"
            class="v-api-url__copy"
            :aria-label="$t('businessRules.api.apiUrl.copyAria', { name: endpoint.name })"
            @click="copyUrl(endpoint.path)"
          >
            <el-icon :size="18"><DocumentCopy /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-api-url {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);

  &__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
  }

  &__name {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__note {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  &__row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  &__label {
    flex-shrink: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__input-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--app-content-bg-color);
  }

  &__value {
    flex: 1;
    min-width: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__copy {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}
</style>
