<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { caseScenarios, getDocTypesForScenarioFilter } from '@/constants/caseScenarios'

const { t } = useI18n()

const sceneId = defineModel<string>({ default: '' })

const scenarios = computed(() => caseScenarios())
const availableDocTypes = computed(() => getDocTypesForScenarioFilter(sceneId.value))

const targetDocHint = computed(() =>
  sceneId.value
    ? `${t('businessRules.verification.targetDocPrefix')}${availableDocTypes.value.join('、')}`
    : t('businessRules.verification.targetDocAll')
)
</script>

<template>
  <div class="v-ver-scene-filter">
    <el-tooltip placement="top" :show-after="200" :content="targetDocHint">
      <el-select
        v-model="sceneId"
        clearable
        :placeholder="$t('task.fields.businessScene')"
        class="v-ver-scene-filter__select"
      >
        <el-option
          v-for="scene in scenarios"
          :key="scene.id"
          :label="scene.name"
          :value="scene.id"
        />
      </el-select>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.v-ver-scene-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &__select {
    width: 200px;
  }
}
</style>
