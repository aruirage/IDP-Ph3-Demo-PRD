<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { persistLocale, type AppLocale } from '@/i18n'

const { locale } = useI18n()

function setLocale(next: AppLocale) {
  if (locale.value === next) return
  locale.value = next
  persistLocale(next)
}
</script>

<template>
  <div class="v-lang-switch" role="group" :aria-label="$t('common.language')">
    <button
      type="button"
      class="v-lang-switch__btn"
      :class="{ 'is-active': locale === 'zh-CN' }"
      @click="setLocale('zh-CN')"
    >
      中文
    </button>
    <button
      type="button"
      class="v-lang-switch__btn"
      :class="{ 'is-active': locale === 'ja' }"
      @click="setLocale('ja')"
    >
      日本語
    </button>
  </div>
</template>

<style scoped lang="scss">
.v-lang-switch {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 8px;
  background: #f2f4f7;
  gap: 2px;

  &__btn {
    min-width: 52px;
    padding: 5px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition-time-02), color var(--transition-time-02);

    &.is-active {
      background: #fff;
      color: var(--el-color-primary);
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    }

    &:hover:not(.is-active) {
      color: var(--text-primary);
    }
  }
}
</style>
