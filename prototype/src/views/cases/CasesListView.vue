<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getVisiblePendingFiles } from '@/mocks/pendingConsolidation'
import ConsolidatedCasesPanel from './components/ConsolidatedCasesPanel.vue'
import PendingConsolidationPanel from './components/PendingConsolidationPanel.vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref<'consolidated' | 'pending'>('consolidated')
const pendingReviewCount = computed(() => getVisiblePendingFiles('review').length)

function syncTabFromRoute() {
  const tab = route.query.tab
  if (tab === 'pending') activeTab.value = 'pending'
  else activeTab.value = 'consolidated'
}

onMounted(syncTabFromRoute)

watch(
  () => route.query.tab,
  () => syncTabFromRoute()
)

watch(activeTab, (tab) => {
  const nextQuery: Record<string, string> = {}
  if (tab === 'consolidated') {
    if (typeof route.query.caseId === 'string') {
      nextQuery.caseId = route.query.caseId
    }
  } else {
    nextQuery.tab = 'pending'
    if (typeof route.query.queue === 'string') {
      nextQuery.queue = route.query.queue
    }
  }
  const currentTab = route.query.tab
  const currentCaseId = route.query.caseId
  const currentQueue = route.query.queue
  if (
    (currentTab ?? undefined) === (nextQuery.tab ?? undefined) &&
    (currentCaseId ?? undefined) === (nextQuery.caseId ?? undefined) &&
    (currentQueue ?? undefined) === (nextQuery.queue ?? undefined)
  ) {
    return
  }
  router.replace({ path: '/cases', query: nextQuery })
})
</script>

<template>
  <div class="v-content-wrap v-cases">
    <h1 class="v-cases__title">{{ $t('page.cases.title') }}</h1>

    <el-tabs v-model="activeTab" class="v-cases__tabs">
      <el-tab-pane :label="$t('page.cases.tabConsolidated')" name="consolidated">
        <ConsolidatedCasesPanel />
      </el-tab-pane>
      <el-tab-pane name="pending">
        <template #label>
          <el-badge
            :value="pendingReviewCount"
            :hidden="pendingReviewCount === 0"
            type="danger"
            class="v-cases__tab-badge"
          >
            <span class="v-cases__tab-label">{{ $t('page.cases.tabPending') }}</span>
          </el-badge>
        </template>
        <PendingConsolidationPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.v-cases {
  &__title {
    margin: 0 0 var(--app-page-gap);
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: var(--app-page-gap);
    }

    :deep(.el-tabs__item) {
      font-size: var(--app-font-size-base);
      height: 44px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--border-color);
    }
  }

  &__tab-label {
    display: inline-block;
    padding-right: 4px;
  }

  &__tab-badge {
    :deep(.el-badge__content) {
      top: 2px;
      right: 0;
      transform: translateY(-50%) translateX(100%);
      border: none;
    }
  }
}
</style>
