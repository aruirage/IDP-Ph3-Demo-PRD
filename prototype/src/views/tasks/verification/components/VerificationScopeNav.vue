<script setup lang="ts">
import type { VerificationDocument, VerificationScope } from '@/mocks/verificationTask'
import { STANDARD_FIELDS_SCOPE } from '@/mocks/verificationTask'
import { formatVerificationScopeTabLabel } from '@/utils/fieldDisplayName'

const props = defineProps<{
  activeScope: VerificationScope
  documents: VerificationDocument[]
}>()

const emit = defineEmits<{
  selectScope: [scope: VerificationScope]
}>()

function scopeTabLabel(doc: VerificationDocument): string {
  return formatVerificationScopeTabLabel(props.documents, doc)
}
</script>

<template>
  <div class="v-ver-scope-nav">
    <button
      type="button"
      class="v-ver-scope-nav__tab"
      :class="{ 'is-active': activeScope === 'summary' }"
      @click="emit('selectScope', 'summary')"
    >
      {{ $t('tasks.verification.scope.summary') }}
    </button>
    <button
      v-for="doc in documents"
      :key="doc.id"
      type="button"
      class="v-ver-scope-nav__tab"
      :class="{ 'is-active': activeScope === doc.id }"
      @click="emit('selectScope', doc.id)"
    >
      {{ scopeTabLabel(doc) }}
    </button>
    <button
      type="button"
      class="v-ver-scope-nav__tab"
      :class="{ 'is-active': activeScope === STANDARD_FIELDS_SCOPE }"
      @click="emit('selectScope', STANDARD_FIELDS_SCOPE)"
    >
      {{ $t('tasks.verification.scope.standardFields') }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.v-ver-scope-nav {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    cursor: pointer;
    font-family: inherit;
    max-width: 100%;

    &.is-active {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }
}
</style>
