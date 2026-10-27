<script setup lang="ts">
import { ArrowDown, UserFilled } from '@element-plus/icons-vue'
import SystemMessageBell from '@/components/system-messages/SystemMessageBell.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
</script>

<template>
  <header class="v-app-header layout-border__bottom">
    <div class="v-app-header__logo">
      <img src="/logo.png" alt="Logo" class="v-app-header__logo-img" />
    </div>

    <div class="v-app-header__spacer" />

    <div class="v-app-header__actions">
      <LanguageSwitcher />
      <SystemMessageBell />

      <div class="v-app-header__user">
        <el-avatar :size="28" class="v-app-header__avatar">
          <el-icon><UserFilled /></el-icon>
        </el-avatar>
        <span class="v-app-header__username">山田 太郎</span>
        <el-icon class="v-app-header__arrow" :size="12"><ArrowDown /></el-icon>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.v-app-header {
  flex-shrink: 0;
  height: var(--logo-height);
  display: flex;
  align-items: center;
  padding: 0 var(--app-content-padding);
  background: var(--top-header-bg-color);

  &__logo {
    display: flex;
    align-items: center;
    padding-left: 8px;
  }

  &__logo-img {
    height: 32px;
    width: auto;
    object-fit: contain;
    object-position: left center;
  }

  &__spacer {
    flex: 1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
  }

  &__avatar {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  &__username {
    font-size: 14px;
    color: var(--text-primary);
  }

  &__arrow {
    color: var(--text-secondary);
  }
}
</style>
