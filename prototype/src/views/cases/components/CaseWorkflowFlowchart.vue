<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  type CaseWorkflowFlowchart,
  type FlowchartNodeView,
  type FlowEdgeState,
  type FlowNodeVisualStatus,
  SIMPLE_FLOWCHART_MAIN_LINE
} from '@/constants/caseWorkflow'

const { t } = useI18n()

const props = defineProps<{
  flowchart: CaseWorkflowFlowchart
}>()

const edgeMap = computed(() =>
  Object.fromEntries(props.flowchart.edges.map((edge) => [edge.id, edge]))
)

function node(id: string): FlowchartNodeView | undefined {
  return props.flowchart.nodes[id]
}

function edgeState(id: string): FlowEdgeState {
  return edgeMap.value[id]?.state ?? 'unused'
}

function edgeClass(id: string): string {
  return `is-${edgeState(id)}`
}

function statusLabel(status: FlowNodeVisualStatus): string | null {
  if (status === 'branch-skip') return t('case.workflow.visual.branchSkip')
  return null
}

const simpleNodes = computed(() =>
  SIMPLE_FLOWCHART_MAIN_LINE.map((id) => props.flowchart.nodes[id]).filter(Boolean)
)

function nodeClass(id: string) {
  const item = node(id)
  if (!item) return []
  return [`is-kind-${item.kind}`, `is-status-${item.status}`]
}

function showStatusDot(status: FlowNodeVisualStatus): boolean {
  return status === 'done' || status === 'active'
}

function workflowStarted(): boolean {
  const status = node('preprocess')?.status
  return status === 'done' || status === 'active'
}

function edgeToEndState(): string {
  const output = node('output')?.status
  if (output === 'done' || output === 'active') return 'is-taken'
  return 'is-unused'
}

</script>

<template>
  <div class="v-flowchart" :class="`v-flowchart--${flowchart.layout}`">
    <template v-if="flowchart.layout === 'claim'">
      <div class="v-flowchart__scroll">
        <div
          class="v-flowchart__canvas v-flowchart__canvas--claim"
          role="img"
          :aria-label="$t('case.panel.flowchartAria')"
        >
          <div class="v-flowchart__line v-flowchart__line--claim">
            <div class="v-flowchart__lead">
              <div class="v-flowchart__terminal is-start">
                {{ $t('case.workflow.terminal.start') }}
              </div>
              <span
                class="v-flowchart__edge v-flowchart__edge--h"
                :class="workflowStarted() ? 'is-taken' : 'is-unused'"
                aria-hidden="true"
              />
              <template v-for="(id, index) in ['preprocess', 'ocr']" :key="id">
                <div v-if="node(id)" class="v-flowchart__node" :class="nodeClass(id)">
                  <span v-if="showStatusDot(node(id)!.status)" class="v-flowchart__dot" aria-hidden="true" />
                  <span class="v-flowchart__label">{{ node(id)!.label }}</span>
                </div>
                <span
                  v-if="index < 1"
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeClass('preprocess-ocr')"
                  aria-hidden="true"
                />
              </template>
            </div>

            <!-- 分叉 1：OCR 後 条件判断 → 人工確認 → 合流 -->
            <div class="v-flowchart__split v-flowchart__split--ocr">
              <div class="v-flowchart__line v-flowchart__line--main">
                <span
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeClass('ocr-ocr_gate')"
                  aria-hidden="true"
                />
                <div
                  v-if="node('ocr_gate')"
                  class="v-flowchart__node v-flowchart__node--gate"
                  :class="nodeClass('ocr_gate')"
                >
                  <span
                    v-if="showStatusDot(node('ocr_gate')!.status)"
                    class="v-flowchart__dot"
                    aria-hidden="true"
                  />
                  <span class="v-flowchart__label">{{ node('ocr_gate')!.label }}</span>
                </div>
                <span
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeClass('ocr_gate-contract_api')"
                  aria-hidden="true"
                />
                <div v-if="node('contract_api')" class="v-flowchart__node" :class="nodeClass('contract_api')">
                  <span
                    v-if="showStatusDot(node('contract_api')!.status)"
                    class="v-flowchart__dot"
                    aria-hidden="true"
                  />
                  <span class="v-flowchart__label">{{ node('contract_api')!.label }}</span>
                </div>
                <span
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeClass('contract_api-benefit_check')"
                  aria-hidden="true"
                />
                <div v-if="node('benefit_check')" class="v-flowchart__node" :class="nodeClass('benefit_check')">
                  <span
                    v-if="showStatusDot(node('benefit_check')!.status)"
                    class="v-flowchart__dot"
                    aria-hidden="true"
                  />
                  <span class="v-flowchart__label">{{ node('benefit_check')!.label }}</span>
                </div>
              </div>

              <div class="v-flowchart__branch v-flowchart__branch--ocr">
                <div class="v-flowchart__branch-pad v-flowchart__branch-pad--ocr" aria-hidden="true" />
                <div class="v-flowchart__branch-stack">
                  <span
                    class="v-flowchart__edge v-flowchart__edge--v"
                    :class="edgeClass('ocr_gate-ocr_review')"
                    aria-hidden="true"
                  />
                  <div
                    v-if="node('ocr_review')"
                    class="v-flowchart__node"
                    :class="nodeClass('ocr_review')"
                  >
                    <span
                      v-if="showStatusDot(node('ocr_review')!.status)"
                      class="v-flowchart__dot"
                      aria-hidden="true"
                    />
                    <span class="v-flowchart__label">{{ node('ocr_review')!.label }}</span>
                    <span
                      v-if="statusLabel(node('ocr_review')!.status)"
                      class="v-flowchart__skip-tag"
                    >
                      {{ statusLabel(node('ocr_review')!.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分叉 2：検証 条件判断 -->
            <div class="v-flowchart__split v-flowchart__split--verify">
              <div class="v-flowchart__line v-flowchart__line--main">
                <span
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeClass('benefit_check-verify_gate')"
                  aria-hidden="true"
                />
                <div
                  v-if="node('verify_gate')"
                  class="v-flowchart__node v-flowchart__node--gate"
                  :class="nodeClass('verify_gate')"
                >
                  <span
                    v-if="showStatusDot(node('verify_gate')!.status)"
                    class="v-flowchart__dot"
                    aria-hidden="true"
                  />
                  <span class="v-flowchart__label">{{ node('verify_gate')!.label }}</span>
                </div>
                <span
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeClass('verify_gate-output')"
                  aria-hidden="true"
                />
                <div v-if="node('output')" class="v-flowchart__node" :class="nodeClass('output')">
                  <span
                    v-if="showStatusDot(node('output')!.status)"
                    class="v-flowchart__dot"
                    aria-hidden="true"
                  />
                  <span class="v-flowchart__label">{{ node('output')!.label }}</span>
                </div>
                <span
                  class="v-flowchart__edge v-flowchart__edge--h"
                  :class="edgeToEndState()"
                  aria-hidden="true"
                />
                <div class="v-flowchart__terminal is-end">
                  {{ $t('case.workflow.terminal.end') }}
                </div>
              </div>

              <div class="v-flowchart__branch v-flowchart__branch--verify">
                <div class="v-flowchart__branch-pad v-flowchart__branch-pad--verify" aria-hidden="true" />
                <div class="v-flowchart__branch-stack">
                  <span
                    class="v-flowchart__edge v-flowchart__edge--v"
                    :class="edgeClass('verify_gate-verify_review')"
                    aria-hidden="true"
                  />
                  <div
                    v-if="node('verify_review')"
                    class="v-flowchart__node"
                    :class="nodeClass('verify_review')"
                  >
                    <span
                      v-if="showStatusDot(node('verify_review')!.status)"
                      class="v-flowchart__dot"
                      aria-hidden="true"
                    />
                    <span class="v-flowchart__label">{{ node('verify_review')!.label }}</span>
                    <span
                      v-if="statusLabel(node('verify_review')!.status)"
                      class="v-flowchart__skip-tag"
                    >
                      {{ statusLabel(node('verify_review')!.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="v-flowchart__legend">
        <span class="v-flowchart__legend-item is-taken">{{ $t('case.workflow.legend.taken') }}</span>
        <span class="v-flowchart__legend-item is-unused">{{ $t('case.workflow.legend.unused') }}</span>
        <span class="v-flowchart__legend-item is-skip-node">{{ $t('case.workflow.legend.skipNode') }}</span>
      </p>
    </template>

    <template v-else>
      <div class="v-flowchart__scroll">
        <div
          class="v-flowchart__canvas v-flowchart__canvas--simple"
          role="img"
          :aria-label="$t('case.panel.flowchartAria')"
        >
          <div class="v-flowchart__line">
            <div class="v-flowchart__terminal is-start">
              {{ $t('case.workflow.terminal.start') }}
            </div>
            <span
              class="v-flowchart__edge v-flowchart__edge--h"
              :class="simpleNodes[0]?.status !== 'unreached' ? 'is-taken' : 'is-unused'"
              aria-hidden="true"
            />
            <template v-for="(item, index) in simpleNodes" :key="item.id">
              <div class="v-flowchart__node" :class="[`is-kind-${item.kind}`, `is-status-${item.status}`]">
                <span v-if="showStatusDot(item.status)" class="v-flowchart__dot" aria-hidden="true" />
                <span class="v-flowchart__label">{{ item.label }}</span>
              </div>
              <span
                v-if="index < simpleNodes.length - 1"
                class="v-flowchart__edge v-flowchart__edge--h"
                :class="edgeClass(`${item.id}-${simpleNodes[index + 1].id}`)"
                aria-hidden="true"
              />
            </template>
            <span
              class="v-flowchart__edge v-flowchart__edge--h"
              :class="simpleNodes.at(-1)?.status === 'done' ? 'is-taken' : 'is-unused'"
              aria-hidden="true"
            />
            <div class="v-flowchart__terminal is-end">
              {{ $t('case.workflow.terminal.end') }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.v-flowchart {
  padding: var(--app-panel-padding);
  max-width: 100%;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 12px;

  &__scroll {
    overflow-x: auto;
    max-width: 100%;
    padding-bottom: 8px;
  }

  &__canvas {
    padding: 16px 12px 12px;

    &--claim {
      min-width: 1120px;
    }
  }

  &__line {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    flex-shrink: 0;

    &--claim {
      align-items: flex-start;
      padding-bottom: 8px;
    }
  }

  &__lead {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    flex-shrink: 0;
    min-height: 72px;
  }

  &__canvas--simple .v-flowchart__line {
    align-items: center;
  }

  &__split {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    &--ocr {
      margin-top: 0;
    }

    &--verify {
      margin-top: 0;
    }
  }

  &__line--main {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    min-height: 72px;
  }

  &__branch {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    min-height: 88px;
    margin-top: 0;

    &--ocr {
      padding-left: 0;
    }

    &--verify {
      padding-left: 0;
    }
  }

  &__branch-pad {
    flex-shrink: 0;

    &--ocr {
      width: 32px;
    }

    &--verify {
      width: 32px;
    }
  }

  &__branch-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 108px;
  }

  &__terminal {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 6px 18px;
    border: 1px solid #52c41a;
    border-radius: 999px;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: #389e0d;
    background: #fff;
    white-space: nowrap;
  }

  &__node {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
    width: 108px;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
    text-align: center;
    box-sizing: border-box;

    &--gate {
      width: 72px;
      min-height: 72px;
      max-height: 72px;
      padding: 4px;
      border-radius: 4px;
      transform: rotate(45deg);
      margin: 0 8px;

      .v-flowchart__label {
        transform: rotate(-45deg);
        font-size: 12px;
        line-height: 1.2;
        max-width: 58px;
      }

      .v-flowchart__dot {
        display: none;
      }
    }

    &.is-status-active,
    &.is-status-done {
      border-color: var(--el-color-primary);

      .v-flowchart__label {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    &.is-status-branch-skip {
      border-style: dashed;
      border-color: #d9d9d9;
      opacity: 0.55;
      box-shadow: none;
    }

    &.is-status-unreached {
      border-color: #e8e8e8;
      box-shadow: none;

      .v-flowchart__label {
        color: #bfbfbf;
      }
    }
  }

  &__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-primary);
  }

  &__label {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.35;
    word-break: break-word;
  }

  &__skip-tag {
    position: absolute;
    top: -10px;
    right: -4px;
    padding: 0 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-secondary);
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    white-space: nowrap;
  }

  &__edge {
    flex-shrink: 0;
    position: relative;

    &--h {
      width: 32px;
      height: 2px;
      align-self: center;
      background: #8c8c8c;

      &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        margin-top: -3px;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        border-left: 6px solid #8c8c8c;
      }

      &.is-unused {
        background: transparent;
        border-top: 2px dashed #d9d9d9;
        height: 0;

        &::after {
          border-left-color: #d9d9d9;
        }
      }
    }

    &--v {
      width: 2px;
      height: 24px;
      background: #8c8c8c;

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 0;
        margin-left: -3px;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #8c8c8c;
      }

      &.is-unused {
        width: 0;
        border-left: 2px dashed #d9d9d9;
        background: transparent;

        &::after {
          border-top-color: #d9d9d9;
        }
      }
    }
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-page-gap);
    margin: 12px 0 0;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      display: inline-block;
      width: 24px;
      border-top: 2px solid #8c8c8c;
    }

    &.is-unused::before {
      border-top-style: dashed;
      border-top-color: #d9d9d9;
    }

    &.is-skip-node::before {
      width: 16px;
      height: 16px;
      border: 1px dashed #d9d9d9;
      border-radius: 4px;
    }
  }
}

/* 条件节点菱形：与 --gate 类一致 */
.v-flowchart__node.is-kind-condition {
  width: 72px;
  min-height: 72px;
  max-height: 72px;
  padding: 4px;
  border-radius: 4px;
  transform: rotate(45deg);
  margin: 0 8px;

  .v-flowchart__label {
    transform: rotate(-45deg);
    font-size: 12px;
    line-height: 1.2;
    max-width: 58px;
  }

  .v-flowchart__dot {
    display: none;
  }
}
</style>
