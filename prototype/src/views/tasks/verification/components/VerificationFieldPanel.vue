<script setup lang="ts">
import { nextTick, ref, type ComponentPublicInstance } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import type { OcrExtractionField } from '@/mocks/ocrExtractionTask'
import { PLACEHOLDER } from '@/constants/placeholders'

defineProps<{
  docType: string
  displayName?: string
  fields: OcrExtractionField[]
  selectedFieldId: string | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  selectField: [fieldId: string]
  updateValue: [fieldId: string, value: string]
  restoreValue: [fieldId: string]
}>()

const scrollRef = ref<HTMLElement | null>(null)
const rowRefs = ref<Record<string, HTMLElement>>({})

function setRowRef(fieldId: string, el: Element | ComponentPublicInstance | null) {
  const node = el instanceof HTMLElement ? el : (el as ComponentPublicInstance | null)?.$el
  if (node instanceof HTMLElement) {
    rowRefs.value[fieldId] = node
  } else {
    delete rowRefs.value[fieldId]
  }
}

function isRestoreDisabled(field: OcrExtractionField): boolean {
  return field.value === (field.ocrOriginalValue ?? field.value)
}

async function scrollToField(fieldId: string) {
  if (!fieldId) return
  await nextTick()
  rowRefs.value[fieldId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

defineExpose({ scrollToField })
</script>

<template>
  <div class="v-ver-fields">
    <div class="v-ver-fields__header">
      <div>
        <h3 class="v-ver-fields__doc-title">{{ docType }}</h3>
        <p v-if="displayName" class="v-ver-fields__display-name">{{ displayName }}</p>
      </div>
      <span class="v-ver-fields__count">{{ $t('tasks.common.countFields', { count: fields.length }) }}</span>
    </div>

    <div ref="scrollRef" class="v-ver-fields__scroll">
      <div
        v-for="field in fields"
        :key="field.id"
        :ref="(el) => setRowRef(field.id, el)"
        class="v-ver-fields__row"
        :class="{ 'is-selected': selectedFieldId === field.id }"
        @click="emit('selectField', field.id)"
      >
        <div class="v-ver-fields__row-head">
          <span class="v-ver-fields__label">
            {{ field.label }}
            <span v-if="field.required" class="v-ver-fields__required">*</span>
          </span>
          <span class="v-ver-fields__confidence">{{ $t('tasks.common.confidence', { percent: field.confidence }) }}</span>
        </div>

        <div class="v-ver-fields__input-row">
          <el-input
            :model-value="field.value"
            class="v-ver-fields__input"
            :disabled="readonly"
            :placeholder="field.required ? PLACEHOLDER.REQUIRED : PLACEHOLDER.EMPTY"
            @click.stop
            @update:model-value="(value: string) => emit('updateValue', field.id, value)"
          />

          <el-tooltip v-if="!readonly" :content="$t('tasks.common.restoreOcrValue')" placement="top">
            <span class="v-ver-fields__restore-wrap" @click.stop>
              <el-button
                class="v-ver-fields__restore"
                :icon="RefreshLeft"
                :disabled="isRestoreDisabled(field)"
                :aria-label="$t('tasks.common.restoreOcrValue')"
                @click="emit('restoreValue', field.id)"
              />
            </span>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-fields {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  &__doc-title {
    margin: 0;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__display-name {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  &__count {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 13px;
    color: var(--text-secondary);
    background: #f9fafb;
    border: 1px solid var(--border-color);
    white-space: nowrap;
  }

  &__scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--app-panel-padding);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__row {
    padding: 14px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #f9fafb;
    cursor: pointer;
    transition: border-color var(--transition-time-02), background var(--transition-time-02);

    &.is-selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    margin-bottom: 8px;
  }

  &__label {
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__required {
    color: var(--text-secondary);
    margin-left: 2px;
  }

  &__confidence {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: 8px;
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
}
</style>
