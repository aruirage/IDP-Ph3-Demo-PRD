<script setup lang="ts">
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import {
  caseListDisplayStatusLabel,
  caseListStatusBadgeVariant,
  caseListStatusShowsSpinner,
  type CaseListDisplayStatus
} from '@/constants/caseStatus'

const props = defineProps<{
  status: CaseListDisplayStatus
}>()

const label = computed(() => caseListDisplayStatusLabel(props.status))
const variantClass = computed(() => caseListStatusBadgeVariant(props.status))
const showSpinner = computed(() => caseListStatusShowsSpinner(props.status))
</script>

<template>
  <span class="v-case-list-status-badge" :class="variantClass">
    <el-icon v-if="showSpinner" class="v-case-list-status-badge__spinner">
      <Loading />
    </el-icon>
    <span v-else class="v-case-list-status-badge__dot" aria-hidden="true" />
    <span class="v-case-list-status-badge__label">{{ label }}</span>
  </span>
</template>

<style scoped lang="scss">
.v-case-list-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  min-height: 28px;
  padding: 4px 12px 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  font-size: var(--app-font-size-base);
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  background: #fff;
  box-sizing: border-box;

  &__dot {
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }

  &__spinner {
    flex-shrink: 0;
    font-size: var(--app-font-size-base);
    animation: v-case-list-status-badge-spin 1.2s linear infinite;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.is-neutral {
    color: #6b7280;
  }

  &.is-success {
    color: #16a34a;
  }

  &.is-danger {
    color: #dc2626;
  }
}

@keyframes v-case-list-status-badge-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
