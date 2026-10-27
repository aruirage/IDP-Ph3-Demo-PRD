<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <div class="v-ver-standard-toggle">
    <span class="v-ver-standard-toggle__label">
      {{ $t('businessRules.verification.standardFieldDocType') }}
    </span>
    <div class="v-ver-standard-toggle__control">
      <span
        class="v-ver-standard-toggle__side"
        :class="{ 'is-active': !model }"
      >
        {{ $t('businessRules.verification.toggle.no') }}
      </span>
      <el-switch v-model="model" :disabled="disabled" />
      <span
        class="v-ver-standard-toggle__side"
        :class="{ 'is-active': model }"
      >
        {{ $t('businessRules.verification.toggle.yes') }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-standard-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-section-gap);
  min-height: var(--rule-field-control-height, 32px);

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.3;
  }

  &__control {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__side {
    font-size: 14px;
    line-height: 1.3;
    color: var(--text-secondary);
    transition: color 0.2s;

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }
}
</style>
