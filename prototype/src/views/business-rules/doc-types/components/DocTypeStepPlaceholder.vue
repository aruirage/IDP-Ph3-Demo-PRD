<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <div class="v-doc-type-step-placeholder">
    <h3 class="v-doc-type-step-placeholder__title">{{ title }}</h3>
    <p class="v-doc-type-step-placeholder__message">{{ message }}</p>
  </div>
</template>

<style scoped lang="scss">
.v-doc-type-step-placeholder {
  flex: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: var(--app-panel-padding);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  background: #fff;

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__message {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    text-align: center;
  }
}
</style>
