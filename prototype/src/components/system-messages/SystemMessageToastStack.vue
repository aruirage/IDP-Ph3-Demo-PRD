<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import {
  activeToasts,
  dismissToastById,
  markMessageRead
} from '@/mocks/systemMessages'

const router = useRouter()

function handleToastClick(messageId: string, toastId: string) {
  markMessageRead(messageId)
  dismissToastById(toastId)
  router.push('/messages')
}
</script>

<template>
  <div class="v-system-message-toasts" aria-live="polite">
    <TransitionGroup name="v-system-message-toast">
      <article
        v-for="toast in activeToasts"
        :key="toast.id"
        class="v-system-message-toast"
        role="status"
        @click="handleToastClick(toast.messageId, toast.id)"
      >
        <div class="v-system-message-toast__body">
          <p class="v-system-message-toast__title">{{ toast.title }}</p>
          <p class="v-system-message-toast__summary">{{ toast.summary }}</p>
          <p class="v-system-message-toast__time">{{ toast.createdAt }}</p>
        </div>
        <button
          type="button"
          class="v-system-message-toast__close"
          :aria-label="$t('common.close')"
          @click.stop="dismissToastById(toast.id)"
        >
          <el-icon :size="14"><Close /></el-icon>
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.v-system-message-toasts {
  position: fixed;
  top: calc(var(--logo-height) + 12px);
  right: 16px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
}

.v-system-message-toast {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 12px 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
  cursor: pointer;
  pointer-events: auto;

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
  }

  &__summary {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__time {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__close {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      background: #f2f4f7;
      color: var(--text-primary);
    }
  }
}

.v-system-message-toast-enter-active,
.v-system-message-toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.v-system-message-toast-enter-from,
.v-system-message-toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
