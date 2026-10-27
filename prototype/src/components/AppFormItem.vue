<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import RequiredTag from './RequiredTag.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    required?: boolean
  }>(),
  {
    required: false
  }
)

const attrs = useAttrs()
const slots = useSlots()

const formItemAttrs = computed(() => {
  const { label: _label, required: _required, ...rest } = attrs as Record<string, unknown>
  return rest
})

const resolvedLabel = computed(() => props.label ?? (attrs.label as string | undefined))
const showLabel = computed(() => Boolean(resolvedLabel.value || slots.label))
</script>

<template>
  <el-form-item
    v-bind="formItemAttrs"
    :label="showLabel ? undefined : resolvedLabel"
    :required="false"
  >
    <template v-if="showLabel" #label>
      <span class="app-form-item__label-row">
        <slot name="label">
          <span class="app-form-item__label-text">{{ resolvedLabel }}</span>
        </slot>
        <RequiredTag v-if="required" />
      </span>
    </template>
    <slot />
  </el-form-item>
</template>
