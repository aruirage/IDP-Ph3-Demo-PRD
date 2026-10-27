<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute()
const { t } = useI18n()

const title = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  if (titleKey) return t(titleKey)
  return (route.meta.title as string) || ''
})

const description = computed(() => `${title.value} — ${t('page.placeholder.comingSoon')}`)
</script>

<template>
  <div class="v-content-wrap">
    <el-empty :description="description" />
  </div>
</template>
