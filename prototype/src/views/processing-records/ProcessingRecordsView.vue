<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExportHistoryPanel from './components/ExportHistoryPanel.vue'
import ApiCallRecordsPanel from './components/ApiCallRecordsPanel.vue'

type ProcessingRecordTab = 'export' | 'api'

const route = useRoute()
const router = useRouter()
const activeTab = ref<ProcessingRecordTab>('export')

const tabs: { key: ProcessingRecordTab; label: string }[] = [
  { key: 'export', label: 'エクスポート履歴' },
  { key: 'api', label: 'API呼び出し履歴' }
]

function switchTab(tab: ProcessingRecordTab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

onMounted(() => {
  const tab = route.query.tab
  if (tab === 'api' || tab === 'export') {
    activeTab.value = tab
  }
})
</script>

<template>
  <div class="v-content-wrap v-processing-records">
    <header class="v-processing-records__header">
      <h1 class="v-processing-records__title">処理記録</h1>
    </header>

    <nav class="v-processing-records__tabs" role="tablist" aria-label="処理記録カテゴリ">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="v-processing-records__tab"
        :class="{ 'is-active': activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="v-processing-records__panel">
      <ExportHistoryPanel v-show="activeTab === 'export'" />
      <ApiCallRecordsPanel v-show="activeTab === 'api'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-processing-records {
  &__header {
    margin-bottom: var(--app-section-gap);
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tabs {
    display: flex;
    align-items: stretch;
    width: 100%;
    margin-bottom: var(--app-page-gap);
    padding: 0 4px;
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    gap: 4px;
  }

  &__tab {
    flex: 1;
    min-width: 0;
    padding: var(--app-section-gap) var(--app-panel-padding);
    border: none;
    border-bottom: 3px solid transparent;
    border-radius: 8px 8px 0 0;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: color var(--transition-time-02), border-color var(--transition-time-02),
      background var(--transition-time-02);
    white-space: nowrap;
    text-align: center;

    &:hover:not(.is-active) {
      color: var(--text-primary);
      background: #f9fafb;
    }

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;
      border-bottom-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__panel {
    min-width: 0;
  }
}
</style>
