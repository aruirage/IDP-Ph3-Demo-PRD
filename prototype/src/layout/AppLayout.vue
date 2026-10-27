<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import SystemMessageToastStack from '@/components/system-messages/SystemMessageToastStack.vue'
import { publishWorkflowInAppMessage } from '@/mocks/systemMessages'

const { t } = useI18n()
const collapsed = ref(false)

const DEMO_TOAST_SESSION_KEY = 'neosai-system-message-demo-toast'

onMounted(() => {
  if (sessionStorage.getItem(DEMO_TOAST_SESSION_KEY)) return
  sessionStorage.setItem(DEMO_TOAST_SESSION_KEY, '1')
  window.setTimeout(() => {
    publishWorkflowInAppMessage({
      title: t('demo.toastTitle'),
      summary: t('demo.toastSummary'),
      body: t('demo.toastBody'),
      caseId: 'CLAIM-20251024000002'
    })
  }, 1200)
})
</script>

<template>
  <div class="v-app-layout wh-full">
    <div class="v-app-layout__scroll">
      <AppHeader />
      <SystemMessageToastStack />

      <div class="v-app-layout__body">
        <AppSidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />

        <main class="v-app-layout__content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-app-layout {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__scroll {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--app-content-bg-color);
  }

  &__body {
    display: flex;
    flex: 1;
    align-items: stretch;
    min-height: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    background: var(--app-content-bg-color);
  }
}
</style>
