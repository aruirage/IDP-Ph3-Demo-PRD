<script setup lang="ts">
import { ref } from 'vue'
import ExternalDataTab from '@/components/phase3/ExternalDataTab.vue'
import ApiKeyTab from './components/ApiKeyTab.vue'
import ApiUrlTab from './components/ApiUrlTab.vue'

const activeTab = ref('api-url')
</script>

<template>
  <div class="v-content-wrap v-api-settings">
    <header class="v-api-settings__header">
      <h1 class="v-api-settings__title">{{ $t('businessRules.api.title') }}</h1>
    </header>

    <el-tabs v-model="activeTab" class="v-api-settings__tabs">
      <el-tab-pane :label="$t('businessRules.api.tab.apiUrl')" name="api-url">
        <ApiUrlTab />
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.api.tab.apiKey')" name="api-key">
        <ApiKeyTab />
      </el-tab-pane>

      <el-tab-pane :label="$t('phase3.external')" name="external"><ExternalDataTab/></el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.v-api-settings {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__header {
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 10px;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
    }
  }
}
</style>
