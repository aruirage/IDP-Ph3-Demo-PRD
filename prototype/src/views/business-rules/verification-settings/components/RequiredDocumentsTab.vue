<script setup lang="ts">
import { computed, watch } from 'vue'
import { CASE_SCENARIOS } from '@/constants/caseScenarios'
import {
  completenessSummary,
  getSceneConfig,
  syncCompletenessDocsForScenario,
  type CompletenessDocRule
} from '@/mocks/verificationRuleConfig'
import VerificationRuleListHead from './VerificationRuleListHead.vue'

const sceneId = defineModel<string>('sceneId', { default: '' })

const displayScenarios = computed(() =>
  sceneId.value
    ? CASE_SCENARIOS.filter((scene) => scene.id === sceneId.value)
    : CASE_SCENARIOS
)

function syncSceneDocs(sceneId: string, docTypes: string[]): CompletenessDocRule[] {
  const config = getSceneConfig(sceneId)
  const synced = syncCompletenessDocsForScenario(docTypes, config.completenessDocs)
  config.completenessDocs = synced
  config.completenessEnabled = true
  return synced
}

function syncAllScenes() {
  for (const scene of displayScenarios.value) {
    syncSceneDocs(scene.id, scene.docTypes)
  }
}

watch(displayScenarios, syncAllScenes, { immediate: true })

function isRequired(doc: CompletenessDocRule) {
  return doc.requirement === 'required'
}

function setRequired(sceneId: string, docType: string, required: boolean) {
  const config = getSceneConfig(sceneId)
  config.completenessDocs = config.completenessDocs.map((doc) =>
    doc.docType === docType
      ? {
          ...doc,
          requirement: required ? 'required' : 'optional',
          conditionDescription: null
        }
      : doc
  )
}

function sceneSummary(sceneId: string) {
  return completenessSummary(getSceneConfig(sceneId).completenessDocs)
}
</script>

<template>
  <div class="v-req-docs">
    <VerificationRuleListHead
      v-model:scene-id="sceneId"
      :title="$t('businessRules.verification.section.requiredDocs')"
      :show-search="false"
    />

    <section
      v-for="scene in displayScenarios"
      :key="scene.id"
      class="v-req-docs__scene"
    >
      <header class="v-req-docs__scene-head">
        <div>
          <h3 class="v-req-docs__scene-title">{{ scene.name }}</h3>
        </div>
        <span class="v-req-docs__scene-summary">
          {{ $t('businessRules.verification.count.docs', { count: scene.docTypes.length }) }}　{{ sceneSummary(scene.id) }}
        </span>
      </header>

      <div class="v-req-docs__table-wrap">
        <table class="v-req-docs__table">
          <thead>
            <tr>
              <th class="v-req-docs__col-doc">{{ $t('businessRules.verification.field.docType') }}</th>
              <th class="v-req-docs__col-switch">{{ $t('businessRules.verification.field.required') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in getSceneConfig(scene.id).completenessDocs"
              :key="doc.docType"
              class="v-req-docs__row"
            >
              <td class="v-req-docs__col-doc">{{ doc.docType }}</td>
              <td class="v-req-docs__col-switch">
                <div class="v-req-docs__switch-cell">
                  <span
                    class="v-req-docs__switch-label"
                    :class="{ 'is-active': !isRequired(doc) }"
                  >
                    {{ $t('businessRules.verification.field.optional') }}
                  </span>
                  <el-switch
                    :model-value="isRequired(doc)"
                    @update:model-value="setRequired(scene.id, doc.docType, $event)"
                  />
                  <span
                    class="v-req-docs__switch-label"
                    :class="{ 'is-active': isRequired(doc) }"
                  >
                    {{ $t('businessRules.verification.field.required') }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.v-req-docs {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__scene {
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__scene-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    flex-wrap: wrap;
  }

  &__scene-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__scene-summary {
    font-size: 14px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__table-wrap {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th,
    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }

    thead th {
      background: #fafafa;
      font-weight: 600;
      color: var(--text-secondary);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  &__col-doc {
    width: auto;
  }

  &__col-switch {
    width: 200px;
    text-align: center;
  }

  &__switch-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  &__switch-label {
    font-size: 13px;
    color: var(--text-secondary);

    &.is-active {
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}
</style>
