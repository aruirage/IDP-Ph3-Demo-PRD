<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { unreadMessageCount } from '@/mocks/systemMessages'

const router = useRouter()

function openMessages() {
  router.push('/messages')
}
</script>

<template>
  <button
    type="button"
    class="v-system-message-bell"
    :aria-label="$t('common.notifications')"
    @click="openMessages"
  >
    <el-badge
      :value="unreadMessageCount"
      :hidden="unreadMessageCount === 0"
      :max="99"
      class="v-system-message-bell__badge"
    >
      <el-icon :size="20"><Bell /></el-icon>
    </el-badge>
  </button>
</template>

<style scoped lang="scss">
.v-system-message-bell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: 4px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-time-02), color var(--transition-time-02);

  &:hover {
    background: #f2f4f7;
    color: var(--el-color-primary);
  }

  &__badge {
    :deep(.el-badge__content) {
      border: none;
    }
  }
}
</style>
