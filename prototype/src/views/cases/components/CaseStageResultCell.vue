<script setup lang="ts">
import { computed } from 'vue'
import { formatStageProcessedAt, type StageOutcome } from '@/constants/caseStageResults'

const props = defineProps<{
  outcome: StageOutcome | null
  pending: boolean
}>()

const display = computed(() => {
  if (props.outcome) {
    return {
      kind: 'done' as const,
      outcome: props.outcome.outcome,
      operator: props.outcome.operator,
      processedAt: formatStageProcessedAt(props.outcome.processedAt)
    }
  }
  if (props.pending) {
    return { kind: 'pending' as const }
  }
  return { kind: 'empty' as const }
})
</script>

<template>
  <div class="v-case-stage-cell" :class="`is-${display.kind}`">
    <template v-if="display.kind === 'done'">
      <span class="v-case-stage-cell__outcome">{{ display.outcome }}</span>
      <span class="v-case-stage-cell__meta">{{ display.operator }}</span>
      <span class="v-case-stage-cell__meta">{{ display.processedAt }}</span>
    </template>
    <span v-else-if="display.kind === 'pending'" class="v-case-stage-cell__pending">
      {{ $t('case.workflow.pendingReview') }}
    </span>
    <span v-else class="v-case-stage-cell__empty">{{ $t('common.empty') }}</span>
  </div>
</template>

<style scoped lang="scss">
.v-case-stage-cell {
  display: grid;
  gap: 2px;
  line-height: 1.35;
  font-size: 12px;

  &__outcome {
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__meta {
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__pending {
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: #b54708;
  }

  &__empty {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }
}
</style>
