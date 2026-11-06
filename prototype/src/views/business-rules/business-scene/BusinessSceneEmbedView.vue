<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { BUSINESS_SCENE_WORKFLOW_URL } from '@/constants/businessSceneWorkflow'

const { locale } = useI18n()
const router = useRouter()
const frame = ref<HTMLIFrameElement>()
const initialLocale = locale.value
const workflowUrl = BUSINESS_SCENE_WORKFLOW_URL + '?lang=' + (initialLocale === 'zh-CN' ? 'zh' : 'ja')
function handleMessage(event: MessageEvent) {
  if(event.origin !== location.origin || event.source !== frame.value?.contentWindow)return
  if(event.data?.type === 'neosai:open-doc-types')router.push('/business-rules/doc-types')
}
const loadTimedOut = ref(false)

let loadTimer: ReturnType<typeof setTimeout> | null = null

function clearLoadTimer() {
  if (loadTimer) {
    clearTimeout(loadTimer)
    loadTimer = null
  }
}

function startLoadTimer() {
  clearLoadTimer()
  loadTimedOut.value = false
  loadTimer = setTimeout(() => {
    loadTimedOut.value = true
  }, 12000)
}

function handleIframeLoad() {
  clearLoadTimer()
  loadTimedOut.value = false
  frame.value?.contentWindow?.postMessage({type:'neosai:scene-language',locale:locale.value},location.origin)
}

watch(locale, value => frame.value?.contentWindow?.postMessage({type:'neosai:scene-language',locale:value},location.origin))
onMounted(() => { startLoadTimer(); window.addEventListener('message',handleMessage) })
onBeforeUnmount(() => { clearLoadTimer(); window.removeEventListener('message',handleMessage) })
</script>

<template>
  <div class="v-business-scene-embed">
    <header class="v-business-scene-embed__toolbar">
      <h1 class="v-business-scene-embed__title">{{ $t('page.businessScene.title') }}</h1>
    </header>

    <div v-if="loadTimedOut" class="v-business-scene-embed__alert" role="alert">
      <p>{{ $t('page.businessScene.timeout1') }}</p>
      <p>{{ $t('page.businessScene.timeout2') }}</p>
    </div>

    <iframe
      ref="frame"
      class="v-business-scene-embed__frame"
      :src="workflowUrl"
      :title="$t('page.businessScene.iframeTitle')"
      referrerpolicy="no-referrer-when-downgrade"
      @load="handleIframeLoad"
    />
  </div>
</template>

<style scoped lang="scss">
.v-business-scene-embed {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--top-header-total-height));
  min-height: 0;
  background: var(--app-content-bg-color);

  &__toolbar {
    flex-shrink: 0;
    padding: var(--app-page-gap) var(--app-content-padding);
    background: #fff;
    border-bottom: 1px solid var(--border-color);
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__alert {
    flex-shrink: 0;
    margin: 0 var(--app-content-padding);
    margin-top: var(--app-section-gap);
    padding: 12px 14px;
    border: 1px solid #fde68a;
    border-radius: 10px;
    background: #fffbeb;
    color: #92400e;
    font-size: 13px;
    line-height: 1.5;

    p {
      margin: 0;
    }

    p + p {
      margin-top: 6px;
    }
  }

  &__frame {
    flex: 1;
    width: 100%;
    min-height: 0;
    border: none;
    background: #fff;
  }
}
</style>
