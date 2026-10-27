<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CASE_SCENARIOS } from '@/constants/caseScenarios'
import { PLACEHOLDER } from '@/constants/placeholders'
import type { RuleScope } from '@/mocks/verificationRuleConfig'

const ALL_SCENES_VALUE = '__all_scenes__'

const scope = defineModel<RuleScope>('scope', { required: true })
const sceneIds = defineModel<string[]>('sceneIds', { required: true })

const { embedded = false } = defineProps<{
  embedded?: boolean
}>()

const emit = defineEmits<{
  'scope-change': []
}>()

const allSceneIds = CASE_SCENARIOS.map((scene) => scene.id)

function scopeSnapshot(currentScope: RuleScope, currentSceneIds: string[]): string {
  if (currentScope === 'all_scenes') return 'all'
  return [...currentSceneIds].sort().join(',')
}

const lastScopeSnapshot = ref<string | null>(null)

watch(
  [scope, sceneIds],
  () => {
    const nextSnapshot = scopeSnapshot(scope.value, sceneIds.value)
    if (lastScopeSnapshot.value === null) {
      lastScopeSnapshot.value = nextSnapshot
      return
    }
    if (lastScopeSnapshot.value === nextSnapshot) return
    lastScopeSnapshot.value = nextSnapshot
    emit('scope-change')
  },
  { deep: true, immediate: true }
)

const selectValues = computed({
  get() {
    if (scope.value === 'all_scenes') return [ALL_SCENES_VALUE]
    return [...sceneIds.value]
  },
  set(values: string[]) {
    const hasAllToken = values.includes(ALL_SCENES_VALUE)
    const sceneValues = values.filter((value) => value !== ALL_SCENES_VALUE)

    if (hasAllToken && sceneValues.length === 0) {
      scope.value = 'all_scenes'
      sceneIds.value = []
      return
    }

    if (hasAllToken && sceneValues.length > 0) {
      scope.value = 'selected_scenes'
      sceneIds.value = sceneValues
      return
    }

    if (!values.length) {
      scope.value = 'selected_scenes'
      sceneIds.value = []
      return
    }

    if (sceneValues.length === allSceneIds.length) {
      scope.value = 'all_scenes'
      sceneIds.value = []
      return
    }

    scope.value = 'selected_scenes'
    sceneIds.value = sceneValues
  }
})
</script>

<template>
  <div class="v-atomic-scope" :class="{ 'is-embedded': embedded }">
    <span v-if="!embedded" class="v-atomic-scope__label">
      {{ $t('businessRules.verification.scope.label') }}
      <RequiredTag />
    </span>
    <el-select
      v-model="selectValues"
      multiple
      :placeholder="PLACEHOLDER.SELECT_MULTIPLE"
      class="v-atomic-scope__select"
    >
      <el-option :label="$t('businessRules.verification.scope.allScenes')" :value="ALL_SCENES_VALUE" />
      <el-option
        v-for="scene in CASE_SCENARIOS"
        :key="scene.id"
        :label="scene.name"
        :value="scene.id"
      />
    </el-select>
    <div v-if="$slots.actions" class="v-atomic-scope__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-atomic-scope {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  padding: 10px 12px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  background: #fafafa;

  &.is-embedded {
    padding: 0;
    border: none;
    background: transparent;
    flex: 1;
    min-width: 0;
    gap: 8px;
    width: 100%;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__select {
    min-width: 280px;
    flex: 1;
    width: 100%;

    :deep(.el-select__tags) {
      flex-wrap: wrap;
      max-width: 100%;
    }
  }

  &__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}
</style>
