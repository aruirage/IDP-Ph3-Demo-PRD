<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <span class="app-required-tag">{{ t('common.required') }}</span>
</template>

<style scoped lang="scss">
.app-required-tag {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9, #fef0f0);
  border-radius: 4px;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
