<script setup lang="ts">
import { nextTick, ref, type ComponentPublicInstance } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import type {
  StandardFieldSource,
  VerificationDocument,
  VerificationStandardField
} from '@/mocks/verificationTask'
import { formatQualifiedDocField, formatQualifiedStandardField } from '@/utils/fieldDisplayName'
import { PLACEHOLDER } from '@/constants/placeholders'

const props = defineProps<{
  documents: VerificationDocument[]
  fields: VerificationStandardField[]
  selectedFieldId: string | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  selectField: [fieldId: string]
  updateValue: [fieldId: string, value: string]
  restoreValue: [fieldId: string]
}>()

const rowRefs = ref<Record<string, HTMLElement>>({})

function setRowRef(fieldId: string, el: Element | ComponentPublicInstance | null) {
  const node = el instanceof HTMLElement ? el : (el as ComponentPublicInstance | null)?.$el
  if (node instanceof HTMLElement) {
    rowRefs.value[fieldId] = node
  } else {
    delete rowRefs.value[fieldId]
  }
}

function isRestoreDisabled(field: VerificationStandardField): boolean {
  return field.value === field.resolvedValue
}

function sourceFieldLabel(source: StandardFieldSource): string {
  return formatQualifiedDocField(
    props.documents,
    source.docType,
    source.fieldLabel,
    source.fileId
  )
}

async function scrollToField(fieldId: string) {
  if (!fieldId) return
  await nextTick()
  rowRefs.value[fieldId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

defineExpose({ scrollToField })
</script>

<template>
  <div class="v-ver-std-fields">
    <div class="v-ver-std-fields__table-wrap">
      <div class="v-ver-std-fields__table">
        <div class="v-ver-std-fields__head">
          <span>{{ $t('tasks.verification.completeness.standardField') }}</span>
          <span>{{ $t('tasks.verification.scope.standardFieldsValue') }}</span>
          <span>{{ $t('tasks.verification.scope.standardFieldsDataSource') }}</span>
        </div>

        <div
          v-for="field in fields"
          :key="field.id"
          :ref="(el) => setRowRef(field.id, el)"
          class="v-ver-std-fields__row"
          :class="{ 'is-selected': selectedFieldId === field.id }"
          @click="emit('selectField', field.id)"
        >
          <div class="v-ver-std-fields__name">
            <span class="v-ver-std-fields__label">{{ field.displayLabel }}</span>
            <code class="v-ver-std-fields__code">{{ formatQualifiedStandardField(field.displayLabel) }}</code>
          </div>

          <div class="v-ver-std-fields__value-cell" @click.stop>
            <el-input
              :model-value="field.value"
              class="v-ver-std-fields__input"
              :disabled="readonly"
              :placeholder="PLACEHOLDER.EMPTY"
              @update:model-value="(value: string) => emit('updateValue', field.id, value)"
            />
            <el-tooltip v-if="!readonly" :content="$t('tasks.common.restoreResolvedValue')" placement="top">
              <span class="v-ver-std-fields__restore-wrap">
                <el-button
                  class="v-ver-std-fields__restore"
                  :icon="RefreshLeft"
                  :disabled="isRestoreDisabled(field)"
                  :aria-label="$t('tasks.common.restoreResolvedValue')"
                  @click="emit('restoreValue', field.id)"
                />
              </span>
            </el-tooltip>
          </div>

          <div class="v-ver-std-fields__sources">
            <template v-if="field.sources.length">
              <div
                v-for="(source, index) in field.sources"
                :key="`${source.docType}-${source.fieldLabel}-${index}`"
                class="v-ver-std-fields__source-item"
              >
                <span class="v-ver-std-fields__source-field">{{ sourceFieldLabel(source) }}</span>
                <span class="v-ver-std-fields__source-value">{{ source.value || '—' }}</span>
              </div>
            </template>
            <span v-else class="v-ver-std-fields__source-empty">—</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-std-fields {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;

  &__table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--app-panel-padding);
  }

  &__table {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }

  &__head,
  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1.6fr);
    gap: 8px 12px;
    align-items: start;
    text-align: left;
    padding: 8px 12px;
  }

  &__head {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: #f9fafb;
    border-bottom: 1px solid var(--border-color);
    align-items: center;
  }

  &__row {
    font-size: 14px;
    border-top: 1px solid #f2f4f7;
    cursor: pointer;
    transition: background var(--transition-time-02);

    &:first-of-type {
      border-top: none;
    }

    &.is-selected {
      background: var(--el-color-primary-light-9);
    }
  }

  &__name {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__label {
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-all;
    line-height: 1.4;
  }

  &__code {
    display: inline-block;
    width: fit-content;
    max-width: 100%;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: var(--text-secondary);
    background: #f2f4f7;
    word-break: break-all;
  }

  &__value-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__restore-wrap {
    flex-shrink: 0;
  }

  &__restore {
    padding: 8px;
  }

  &__sources {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__source-item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px;
    width: 100%;
  }

  &__source-field {
    color: var(--text-primary);
    font-weight: 500;
    word-break: break-all;
    line-height: 1.4;
  }

  &__source-value {
    color: var(--text-secondary);
    font-size: 13px;
    word-break: break-all;
    line-height: 1.4;
  }

  &__source-empty {
    color: var(--text-secondary);
  }
}
</style>
