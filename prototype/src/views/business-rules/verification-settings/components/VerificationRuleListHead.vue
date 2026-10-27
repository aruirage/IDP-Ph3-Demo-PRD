<script setup lang="ts">
import { computed } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'
import VerificationSceneFilter from './VerificationSceneFilter.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    /** searchPlaceholder() 用の対象キーワード（showSearch 時） */
    searchSubject?: string
    showSceneFilter?: boolean
    showSearch?: boolean
  }>(),
  {
    showSceneFilter: true,
    showSearch: true
  }
)

const sceneId = defineModel<string>('sceneId', { default: '' })
const keyword = defineModel<string>('keyword', { default: '' })

const emit = defineEmits<{
  reset: []
}>()

const searchPlaceholderText = computed(() => props.searchSubject ?? '')

const canReset = computed(() => {
  if (props.showSceneFilter && sceneId.value) return true
  if (props.showSearch && keyword.value.trim()) return true
  return false
})

function handleReset() {
  if (props.showSceneFilter) sceneId.value = ''
  if (props.showSearch) keyword.value = ''
  emit('reset')
}
</script>

<template>
  <div class="v-ver-rule-list-head">
    <h3 v-if="title" class="v-ver-rule-list-head__title">{{ title }}</h3>
    <div class="v-ver-rule-list-head__toolbar">
      <VerificationSceneFilter v-if="showSceneFilter" v-model="sceneId" />
      <el-input
        v-if="showSearch"
        v-model="keyword"
        :placeholder="searchPlaceholderText"
        clearable
        class="v-ver-rule-list-head__search"
      />
      <el-button :icon="RefreshRight" :disabled="!canReset" @click="handleReset" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-rule-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  &__search {
    width: 200px;
    max-width: 200px;
  }
}
</style>
