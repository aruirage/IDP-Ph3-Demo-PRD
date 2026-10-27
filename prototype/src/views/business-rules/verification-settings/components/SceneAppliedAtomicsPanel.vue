<script setup lang="ts">
import { computed } from 'vue'
import {
  atomicKindLabels,
  getAtomicRulesForScene,
  getSceneConfig,
  type AtomicRuleKind
} from '@/mocks/verificationRuleConfig'

const props = defineProps<{
  sceneId: string
}>()

const kindLabels = computed(() => atomicKindLabels())

const atomicItems = computed(() => getAtomicRulesForScene(props.sceneId))

const groupedItems = computed(() => {
  const groups: Record<AtomicRuleKind, ReturnType<typeof getAtomicRulesForScene>> = {
    required_field: [],
    text: [],
    data: [],
    seal: []
  }
  for (const item of atomicItems.value) {
    groups[item.kind].push(item)
  }
  return (Object.entries(groups) as [AtomicRuleKind, typeof atomicItems.value][]).filter(
    ([, items]) => items.length > 0
  )
})

function toggleSceneRule(ruleId: string, active: boolean) {
  const scene = getSceneConfig(props.sceneId)
  const disabled = new Set(scene.disabledAtomicRuleIds)
  if (active) {
    disabled.delete(ruleId)
  } else {
    disabled.add(ruleId)
  }
  scene.disabledAtomicRuleIds = [...disabled]
}
</script>

<template>
  <div class="v-scene-atomics">
    <p class="v-scene-atomics__note">
      {{ $t('businessRules.verification.atomic.note') }}
    </p>

    <el-empty v-if="!atomicItems.length" :description="$t('businessRules.verification.atomic.empty')" :image-size="72" />

    <section
      v-for="[kind, items] in groupedItems"
      :key="kind"
      class="v-scene-atomics__section"
    >
      <h3 class="v-scene-atomics__section-title">{{ kindLabels[kind] }}</h3>

      <article v-for="item in items" :key="item.id" class="v-scene-atomics__card">
        <div class="v-scene-atomics__card-main">
          <div class="v-scene-atomics__card-text">
            <span v-if="kind === 'required_field'" class="v-scene-atomics__field-name">
              {{ item.label }}
            </span>
            <span v-else class="v-scene-atomics__field-name">{{ item.label }}</span>
            <p v-if="kind !== 'required_field'" class="v-scene-atomics__desc">{{ item.description }}</p>
            <code v-if="kind === 'required_field'" class="v-scene-atomics__code">
              {{ item.description }}
            </code>
          </div>
          <div class="v-scene-atomics__card-meta">
            <el-tag size="small" effect="plain">{{ item.scopeLabel }}</el-tag>
            <el-switch
              :model-value="item.active"
              size="small"
              @update:model-value="toggleSceneRule(item.id, $event)"
            />
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-scene-atomics {
  padding: var(--app-panel-padding);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: #fff;

  &__note {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__section:not(:last-child) {
    margin-bottom: var(--app-section-gap);
  }

  &__section-title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__card {
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;

    &:not(:last-child) {
      margin-bottom: 6px;
    }
  }

  &__card-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
  }

  &__desc {
    margin: 0;
    font-size: 15px;
    line-height: 1.45;
    color: var(--text-primary);
  }

  &__field-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__code {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-color-primary);
    font-family: ui-monospace, monospace;
  }

  &__card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
}
</style>
