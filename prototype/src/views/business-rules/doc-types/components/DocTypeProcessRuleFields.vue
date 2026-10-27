<script setup lang="ts">
import { computed, watch } from 'vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  MASTER_MATCH_CASCADER_OPTIONS,
  processRuleOptions,
  isMasterMatchRule,
  syncMasterMatchRuleFields,
  type DocTypeProcessRuleFields
} from '@/mocks/docTypeSettings'

defineProps<{multipleQrEnabled?:boolean}>()
const rule = defineModel<DocTypeProcessRuleFields>({ required: true })

const processRuleOptionList = computed(() => processRuleOptions())

const isMasterMatch = computed(() => isMasterMatchRule(rule.value.ruleType))

watch(
  () => rule.value.ruleType,
  () => {
    syncMasterMatchRuleFields(rule.value)
    if(rule.value.ruleType==='qrcode'){rule.value.qrMode||='full';rule.value.qrDelimiter??='_';rule.value.qrIndex??=1}
  },
  { immediate: true }
)
</script>

<template>
  <div
    class="v-doc-type-process-rule-fields"
    :class="{ 'is-master-match': isMasterMatch, 'is-qrcode': rule.ruleType==='qrcode' }"
  >
    <el-select
      v-model="rule.ruleType"
      clearable
      :placeholder="$t('businessRules.docType.rule.selectProcessRule')"
      class="v-doc-type-process-rule-fields__rule-type"
    >
      <el-option
        v-for="option in processRuleOptionList"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <template v-if="rule.ruleType==='qrcode'&&!multipleQrEnabled"><div class="p3-qr"><el-select :model-value="rule.qrMode||'full'" @update:model-value="(v:'full'|'split')=>rule.qrMode=v" :aria-label="$t('phase3.qrMode')"><el-option value="full" :label="$t('phase3.qrFull')"/><el-option value="split" :label="$t('phase3.qrSplit')"/></el-select><template v-if="rule.qrMode==='split'"><el-input v-model="rule.qrDelimiter" :placeholder="$t('phase3.delimiter')" :aria-label="$t('phase3.delimiter')"/><el-input-number v-model="rule.qrIndex" :min="1" :step="1" step-strictly :aria-label="$t('phase3.ordinal')"/></template></div></template>
    <p v-if="rule.ruleType==='qrcode'&&multipleQrEnabled" class="p3-qr-priority">{{$t('phase3.qrPriorityTip')}}</p>
    <template v-if="isMasterMatch">
      <el-cascader
        v-model="rule.masterMatchRef"
        :options="MASTER_MATCH_CASCADER_OPTIONS"
        :props="{ expandTrigger: 'hover', emitPath: true }"
        clearable
        filterable
        :placeholder="PLACEHOLDER.SELECT"
        class="v-doc-type-process-rule-fields__master"
      />

      <el-input
        v-model="rule.matchGroup"
        class="v-doc-type-process-rule-fields__group"
        :placeholder="$t('businessRules.docType.rule.matchGroupPlaceholder')"
        :title="$t('businessRules.docType.rule.matchGroup')"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.v-doc-type-process-rule-fields {
  width: 100%;
  max-width: 300px;

  &__rule-type {
    width: 100%;
    max-width: 100%;
  }

  &.is-master-match {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    min-width: 0;

    .v-doc-type-process-rule-fields__rule-type {
      grid-column: 1 / -1;
      grid-row: 1;
      width: 100%;
    }

    .v-doc-type-process-rule-fields__master {
      grid-column: 1;
      grid-row: 2;
      width: 100%;
      min-width: 0;
    }

    .v-doc-type-process-rule-fields__group {
      grid-column: 2;
      grid-row: 2;
      width: 100%;
      min-width: 0;
    }

    :deep(.el-select),
    :deep(.el-cascader),
    :deep(.el-input) {
      width: 100%;
    }
  }
}
</style>

<style scoped>
.v-doc-type-process-rule-fields.is-qrcode{display:flex;flex-direction:column;align-items:stretch;gap:8px;width:100%;max-width:300px}
.v-doc-type-process-rule-fields.is-qrcode .v-doc-type-process-rule-fields__rule-type{width:100%;max-width:none}
.p3-qr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr);gap:8px;width:100%;margin:0}
.p3-qr .el-select,.p3-qr .el-input,.p3-qr .el-input-number{width:100%;min-width:0}
</style>

<style scoped>.p3-qr-priority{font-size:15px;line-height:1.6;margin:8px 0;color:var(--el-text-color-secondary)}</style>
