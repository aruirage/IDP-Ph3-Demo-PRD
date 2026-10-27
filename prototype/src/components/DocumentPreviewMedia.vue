<script setup lang="ts">
import { computed } from 'vue'
import { isPdfDocumentUrl, mockDocumentPreviewSrc } from '@/constants/mockSampleMedia'

const props = withDefaults(
  defineProps<{
    mediaUrl: string
    title?: string
    /** 弹窗等全屏预览区 */
    fill?: boolean
  }>(),
  {
    title: '',
    fill: false
  }
)

const emit = defineEmits<{
  load: []
}>()

const isPdf = computed(() => isPdfDocumentUrl(props.mediaUrl))
const iframeSrc = computed(() => mockDocumentPreviewSrc(props.mediaUrl))

function onLoad() {
  emit('load')
}
</script>

<template>
  <div
    class="v-doc-preview-media"
    :class="{ 'v-doc-preview-media--fill': fill }"
  >
    <iframe
      v-if="isPdf"
      class="v-doc-preview-media__pdf"
      :src="iframeSrc"
      :title="title"
      @load="onLoad"
    />
    <img
      v-else
      class="v-doc-preview-media__image"
      :src="mediaUrl"
      :alt="title"
      draggable="false"
      @load="onLoad"
    />
  </div>
</template>

<style scoped lang="scss">
.v-doc-preview-media {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #eceff3;

  &--fill {
    padding: 20px 24px;
  }

  &__pdf {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border: 0;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
  }

  &__image {
    display: block;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
  }

  &--fill &__image {
    max-width: min(100%, 920px);
    max-height: 100%;
  }
}
</style>
