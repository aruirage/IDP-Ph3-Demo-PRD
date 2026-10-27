<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  docTypeDefinitions,savePhase3DocSettings,
  type DocTypeReadModelConfig
} from '@/mocks/docTypeSettings'
import { InfoFilled } from '@element-plus/icons-vue'
const { t } = useI18n()
const visible = defineModel<boolean>('visible', { default: false })
const config = defineModel<DocTypeReadModelConfig>('config', { required: true })
const draft=ref({...config.value,manualReviewRules:[...config.value.manualReviewRules]})
watch(visible,open=>{if(open)draft.value={...config.value,masterReviewEnabled:config.value.masterReviewEnabled??true,autoAdoptThreshold:config.value.autoAdoptThreshold??90,manualReviewRules:[...config.value.manualReviewRules]}})
const rules=computed(()=>[{value:'low-confidence' as const,label:t('tasks.ocr.alerts.lowConfidence')},{value:'model-conflict' as const,label:t('tasks.ocr.alerts.modelConflict')},{value:'value-out-of-range' as const,label:t('phase3.rangeReview')},{value:'low-confidence-out-of-range' as const,label:t('phase3.lowRangeReview')}])
function cancel(){visible.value=false}
function confirm(){const value=draft.value.autoAdoptThreshold;if(!Number.isFinite(value)||Number(value)<=75||Number(value)>100){ElMessage.warning(t('phase3.thresholdInvalid'));return}const owner=docTypeDefinitions.value.find(d=>d.readModel===config.value);config.value={...draft.value,manualReviewRules:[...draft.value.manualReviewRules]};if(owner)savePhase3DocSettings(owner);visible.value=false;ElMessage.success(t('businessRules.docType.message.readModelSaved'))}
</script>

<template>
  <el-dialog
    v-model="visible"
    width="720px"
    destroy-on-close
    class="v-doc-type-read-model-dialog"
  >
    <template #header>
      <div class="v-doc-type-read-model-dialog__title">
        <span>{{ $t('phase3.reviewSettings') }}</span>
      </div>
    </template>

    <el-form label-position="top" class="v-doc-type-read-model-dialog__form">

      <AppFormItem :label="$t('businessRules.docType.readModel.manualReviewRules')">
        <div class="v-doc-type-read-model-dialog__rules">
          <el-checkbox-group v-model="draft.manualReviewRules"><el-checkbox v-for="rule in rules.slice(0,2)" :key="rule.value" :value="rule.value">{{rule.label}}</el-checkbox></el-checkbox-group>
          <div class="v-doc-type-read-model-dialog__master-row"><el-checkbox v-model="draft.masterReviewEnabled">{{$t('phase3.masterReview')}}</el-checkbox><div class="v-doc-type-read-model-dialog__threshold"><span>{{$t('phase3.threshold')}}</span><el-tooltip :content="$t('phase3.thresholdTip')"><el-icon tabindex="0"><InfoFilled/></el-icon></el-tooltip><el-input-number v-model="draft.autoAdoptThreshold" :min="75.01" :precision="2" :max="100" size="small" :aria-label="$t('phase3.threshold')"/><span>%</span></div></div>
          <el-checkbox-group v-model="draft.manualReviewRules"><el-checkbox v-for="rule in rules.slice(2)" :key="rule.value" :value="rule.value">{{rule.label}}</el-checkbox></el-checkbox-group>
        </div>
      </AppFormItem>

    </el-form>

    <template #footer>
      <el-button @click="cancel">{{ $t('businessRules.docType.action.cancel') }}</el-button>
      <el-button type="primary" @click="confirm">OK</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.v-doc-type-read-model-dialog {
  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__info {
    color: var(--text-secondary);
    cursor: help;
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 6px;
      line-height: 1.4;
    }
  }

  &__select {
    width: 100%;
  }

  &__master-row { display:flex; align-items:center; justify-content:space-between; gap:20px; width:100%; }
  &__threshold { display:flex; align-items:center; gap:6px; white-space:nowrap; font-size:13px; :deep(.el-input-number){width:100px;} }
  &__rules {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: #f9fafb;
    width: 100%;

    :deep(.el-checkbox-group) { display:flex; flex-direction:column; gap:12px; }

    :deep(.el-checkbox) {
      height: auto;
      cursor: default;
    }

    :deep(.el-checkbox__input.is-disabled + .el-checkbox__label) {
      color: var(--text-primary);
      cursor: default;
    }
  }
}
</style>
