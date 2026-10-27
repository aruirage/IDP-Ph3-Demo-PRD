<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  markAllMessagesRead,
  markMessageRead,
  messagesForCurrentUser,
  publishWorkflowInAppMessage,
  unreadMessageCount,
  type SystemMessage
} from '@/mocks/systemMessages'

const { t } = useI18n()

const messages = computed(() => messagesForCurrentUser())

const hasUnread = computed(() => unreadMessageCount.value > 0)

function markRowRead(row: SystemMessage) {
  if (row.read) return
  markMessageRead(row.id)
}

function handleMarkAllRead() {
  const count = markAllMessagesRead()
  if (count > 0) {
    ElMessage.success(t('page.messages.markReadSuccess', { count }))
  }
}

function demoPublish() {
  publishWorkflowInAppMessage({
    title: t('demo.messageTestTitle'),
    summary: t('demo.messageTestSummary'),
    body: t('demo.messageTestBody'),
    caseId: 'CLAIM-20251024000004'
  })
  ElMessage.success(t('page.messages.testSendSuccess'))
}
</script>

<template>
  <div class="v-content-wrap v-system-messages">
    <div class="v-system-messages__header">
      <h1 class="v-system-messages__title">{{ $t('page.messages.title') }}</h1>
      <div class="v-system-messages__header-actions">
        <el-button :disabled="!hasUnread" @click="handleMarkAllRead">
          {{ $t('page.messages.markAllRead') }}
        </el-button>
        <el-button type="primary" plain @click="demoPublish">
          {{ $t('page.messages.testSend') }}
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="v-system-messages__card">
      <el-table
        :data="messages"
        style="width: 100%"
        :empty-text="$t('common.noData')"
        row-class-name="v-system-messages__row"
        @row-click="markRowRead"
      >
        <el-table-column :label="$t('page.messages.status')" width="72" align="center">
          <template #default="{ row }">
            <span
              class="v-system-messages__status"
              :class="{ 'is-unread': !row.read }"
            >
              {{ row.read ? $t('page.messages.read') : $t('page.messages.unread') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('page.messages.messageTitle')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'v-system-messages__title-cell--unread': !row.read }">
              {{ row.title }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('page.messages.body')" min-width="360" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="v-system-messages__body-cell">{{ row.body }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="caseId"
          :label="$t('page.messages.caseId')"
          min-width="148"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.caseId">{{ row.caseId }}</span>
            <span v-else class="v-system-messages__muted">{{ $t('common.empty') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('page.messages.receivedAt')" min-width="136" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.v-system-messages {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-page-gap);
    margin-bottom: var(--app-page-gap);
    flex-wrap: wrap;
  }

  &__header-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__card {
    border: 1px solid var(--border-color);
    border-radius: 12px;

    :deep(.el-card__body) {
      padding: 0;
    }

    :deep(.el-table) {
      --el-table-header-bg-color: #f9fafb;
    }
  }

  &__row {
    cursor: pointer;
  }

  &__status {
    font-size: 12px;
    color: var(--text-secondary);

    &.is-unread {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  &__title-cell--unread {
    font-weight: 600;
    color: var(--text-primary);
  }

  &__body-cell {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary);
    line-height: 1.45;
  }

  &__muted {
    color: var(--text-secondary);
  }
}
</style>
