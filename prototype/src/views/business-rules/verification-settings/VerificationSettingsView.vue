<script setup lang="ts">
import { computed, ref } from 'vue'
import { getDocTypesForScenarioFilter } from '@/constants/caseScenarios'
import { verificationRuleConfig } from '@/mocks/verificationRuleConfig'
import NaturalLanguageRuleTab from './components/NaturalLanguageRuleTab.vue'
import RequiredDocumentsTab from './components/RequiredDocumentsTab.vue'
import RequiredFieldLibraryTab from './components/RequiredFieldLibraryTab.vue'
import SealSignatureLibraryTab from './components/SealSignatureLibraryTab.vue'
import DataConsistencyRulesTab from './components/DataConsistencyRulesTab.vue'

const activeTab = ref('required_field')
const selectedSceneId = ref('')
const availableDocTypes = computed(() => getDocTypesForScenarioFilter(selectedSceneId.value))
</script>

<template>
  <div class="v-ver-settings v-content-wrap">
    <header class="v-ver-settings__header">
      <h1 class="v-ver-settings__title">{{ $t('businessRules.verification.title') }}</h1>
    </header>

    <el-tabs v-model="activeTab" class="v-ver-settings__tabs">
      <el-tab-pane :label="$t('businessRules.verification.tabRequiredField')" name="required_field">
        <RequiredFieldLibraryTab
          v-model:rules="verificationRuleConfig.requiredFieldRules"
          v-model:scene-id="selectedSceneId"
        />
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.verification.tabRequiredDoc')" name="required_documents">
        <RequiredDocumentsTab v-model:scene-id="selectedSceneId" />
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.verification.tabConsistency')" name="data_consistency">
        <DataConsistencyRulesTab />
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.verification.tabText')" name="text">
        <NaturalLanguageRuleTab
          v-model:rules="verificationRuleConfig.textRules"
          kind="text"
          v-model:scene-id="selectedSceneId"
        />
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.verification.tabData')" name="data">
        <NaturalLanguageRuleTab
          v-model:rules="verificationRuleConfig.dataRules"
          kind="data"
          v-model:scene-id="selectedSceneId"
        />
      </el-tab-pane>

      <el-tab-pane :label="$t('businessRules.verification.tabSeal')" name="seal">
        <SealSignatureLibraryTab
          v-model:rules="verificationRuleConfig.sealRules"
          v-model:scene-id="selectedSceneId"
          :available-doc-types="availableDocTypes"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.v-ver-settings {
  display: flex;
  flex-direction: column;
  gap: var(--app-page-gap);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-page-gap);
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 10px;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
    }
  }
}
</style>
