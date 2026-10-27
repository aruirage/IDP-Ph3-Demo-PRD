<script setup lang="ts">
import {
  completenessFieldStatusLabel,
  completenessStatusLabel,
  displayStatusLabel,
  displayStatusTagType,
  needsHumanReview,
  requirementLabel,
  type CompletenessFieldRequirement,
  type CompletenessRequirement,
  type HumanVerdict
} from '@/mocks/verificationTask'

defineProps<{
  items: CompletenessRequirement[]
  fieldItems: CompletenessFieldRequirement[]
  selectedId: string | null
  selectedFieldId: string | null
}>()

const emit = defineEmits<{
  selectItem: [id: string]
  selectFieldItem: [id: string]
  updateVerdict: [id: string, verdict: HumanVerdict]
  updateFieldVerdict: [id: string, verdict: HumanVerdict]
}>()
</script>

<template>
  <div class="v-ver-completeness">
    <h4 class="v-ver-completeness__subtitle">{{ $t('tasks.verification.completeness.requiredDocs') }}</h4>
    <div class="v-ver-completeness__table-wrap">
      <table class="v-ver-completeness__table">
        <thead>
          <tr>
            <th>{{ $t('tasks.verification.completeness.columns.docType') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.requirement') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.present') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.verdict') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.confirm') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="v-ver-completeness__row"
            :class="{
              'is-missing': item.status === 'missing',
              'is-selected': selectedId === item.id,
              'is-pending': needsHumanReview(item) && item.humanVerdict === null,
              'is-confirmed': needsHumanReview(item) && item.humanVerdict !== null
            }"
            @click="emit('selectItem', item.id)"
          >
            <td class="v-ver-completeness__doc-type">{{ item.docType }}</td>
            <td>
              <span class="v-ver-completeness__req-tag">{{ requirementLabel(item.requirement) }}</span>
              <p v-if="item.conditionDescription" class="v-ver-completeness__condition">
                {{ item.conditionDescription }}
              </p>
            </td>
            <td>
              <span
                class="v-ver-completeness__status"
                :class="item.status === 'present' ? 'is-present' : 'is-missing'"
              >
                {{ completenessStatusLabel(item) }}
              </span>
            </td>
            <td>
              <el-tag
                :type="displayStatusTagType(item.aiVerdict, item.humanVerdict)"
                size="small"
                effect="plain"
              >
                {{ displayStatusLabel(item.aiVerdict, item.humanVerdict) }}
              </el-tag>
            </td>
            <td @click.stop>
              <template v-if="needsHumanReview(item)">
                <el-radio-group
                  :model-value="item.humanVerdict"
                  size="small"
                  @update:model-value="(v: HumanVerdict) => emit('updateVerdict', item.id, v)"
                >
                  <el-radio-button value="OK">OK</el-radio-button>
                  <el-radio-button value="NG">NG</el-radio-button>
                </el-radio-group>
              </template>
              <span v-else class="v-ver-completeness__auto">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <h4 class="v-ver-completeness__subtitle">{{ $t('tasks.verification.completeness.requiredFields') }}</h4>
    <div class="v-ver-completeness__table-wrap">
      <table class="v-ver-completeness__table">
        <thead>
          <tr>
            <th>{{ $t('tasks.verification.completeness.standardField') }}</th>
            <th>{{ $t('tasks.verification.completeness.targetDocs') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.requirement') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.present') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.verdict') }}</th>
            <th>{{ $t('tasks.verification.completeness.columns.confirm') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in fieldItems"
            :key="item.id"
            class="v-ver-completeness__row"
            :class="{
              'is-missing': item.status === 'missing',
              'is-selected': selectedFieldId === item.id,
              'is-pending': needsHumanReview(item) && item.humanVerdict === null,
              'is-confirmed': needsHumanReview(item) && item.humanVerdict !== null
            }"
            @click="emit('selectFieldItem', item.id)"
          >
            <td class="v-ver-completeness__doc-type">
              {{ item.displayLabel }}
              <code class="v-ver-completeness__code">{{ item.standardField }}</code>
            </td>
            <td class="v-ver-completeness__doc-types">{{ item.targetDocTypes.join('、') }}</td>
            <td>
              <span class="v-ver-completeness__req-tag">{{ requirementLabel(item.requirement) }}</span>
              <p v-if="item.conditionDescription" class="v-ver-completeness__condition">
                {{ item.conditionDescription }}
              </p>
            </td>
            <td>
              <span
                class="v-ver-completeness__status"
                :class="item.status === 'present' ? 'is-present' : 'is-missing'"
              >
                {{ completenessFieldStatusLabel(item) }}
              </span>
            </td>
            <td>
              <el-tag
                :type="displayStatusTagType(item.aiVerdict, item.humanVerdict)"
                size="small"
                effect="plain"
              >
                {{ displayStatusLabel(item.aiVerdict, item.humanVerdict) }}
              </el-tag>
            </td>
            <td @click.stop>
              <template v-if="needsHumanReview(item)">
                <el-radio-group
                  :model-value="item.humanVerdict"
                  size="small"
                  @update:model-value="(v: HumanVerdict) => emit('updateFieldVerdict', item.id, v)"
                >
                  <el-radio-button value="OK">OK</el-radio-button>
                  <el-radio-button value="NG">NG</el-radio-button>
                </el-radio-group>
              </template>
              <span v-else class="v-ver-completeness__auto">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-completeness {
  &__subtitle {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__subtitle:not(:first-child) {
    margin-top: 14px;
  }

  &__table-wrap {
    max-width: 100%;
    overflow-x: auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th,
    td {
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      font-weight: 600;
      color: var(--text-secondary);
      background: #f9fafb;
      white-space: nowrap;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__row {
    cursor: pointer;

    &:hover {
      background: #fafafa;
    }

    &.is-missing {
      background: #fffafb;
    }

    &.is-selected {
      background: var(--el-color-primary-light-9);
    }

    &.is-pending td:first-child {
      box-shadow: inset 3px 0 0 var(--el-color-warning);
    }

    &.is-confirmed td:first-child {
      box-shadow: inset 3px 0 0 var(--el-color-success);
    }
  }

  &__doc-type {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__doc-types {
    font-size: 13px;
    color: var(--text-secondary);
    max-width: 140px;
  }

  &__code {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-color-primary);
    font-family: ui-monospace, monospace;
    font-weight: 400;
  }

  &__req-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    background: #f2f4f7;
  }

  &__condition {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  &__status {
    font-weight: 500;
    font-size: 13px;

    &.is-present {
      color: #067647;
    }

    &.is-missing {
      color: var(--el-color-danger);
    }
  }

  &__auto {
    color: var(--text-secondary);
  }
}
</style>
