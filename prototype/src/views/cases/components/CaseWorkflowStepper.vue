<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'
import type { CaseWorkflowNode } from '@/constants/caseWorkflow'

defineProps<{
  nodes: CaseWorkflowNode[]
}>()
</script>

<template>
  <nav class="v-case-workflow" :aria-label="$t('case.panel.workflowAria')">
    <ol class="v-case-workflow__list">
      <li
        v-for="(node, index) in nodes"
        :key="node.id"
        class="v-case-workflow__item"
        :class="{
          'is-active': node.status === 'active',
          'is-done': node.status === 'done'
        }"
      >
        <div class="v-case-workflow__node">
          <span class="v-case-workflow__index">
            <el-icon v-if="node.status === 'done'" :size="14">
              <Check />
            </el-icon>
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="v-case-workflow__label">{{ node.label }}</span>
        </div>
        <span
          v-if="index < nodes.length - 1"
          class="v-case-workflow__line"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.v-case-workflow {
  padding: var(--app-panel-padding);
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 12px;

  &__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    &.is-active {
      .v-case-workflow__index {
        background: var(--el-color-primary);
        border-color: var(--el-color-primary);
        color: #fff;
      }

      .v-case-workflow__label {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    &.is-done {
      .v-case-workflow__index {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }
  }

  &__node {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__label {
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__line {
    width: 24px;
    height: 1px;
    margin: 0 8px;
    background: var(--border-color);
    flex-shrink: 0;
  }
}
</style>
