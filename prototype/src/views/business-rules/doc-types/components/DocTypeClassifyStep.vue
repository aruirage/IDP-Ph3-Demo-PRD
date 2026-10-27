<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { MagicStick, Delete, InfoFilled } from '@element-plus/icons-vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  DESCRIPTION_MAX_LENGTH,
  fileSplitRuleHint,
  FILE_SPLIT_RULE_MAX_LENGTH,
  fileSplitRulePlaceholder,
  type DocTypeDefinition
} from '@/mocks/docTypeSettings'
import DocTypeSamplePreview from './DocTypeSamplePreview.vue'

const { t } = useI18n()

const docType = defineModel<DocTypeDefinition>({ required: true })

const fileInputRef = ref<HTMLInputElement | null>(null)

const descriptionHint = computed(() => t('businessRules.docType.classify.descriptionHint'))
const fileSplitHintText = computed(() => fileSplitRuleHint())
const fileSplitPlaceholderText = computed(() => fileSplitRulePlaceholder())

const descriptionLength = computed(() => docType.value.description.length)
const fileSplitRuleLength = computed(() => docType.value.fileSplitRule.length)

function triggerReupload() {
  fileInputRef.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (docType.value.sampleImageUrl.startsWith('blob:')) {
    URL.revokeObjectURL(docType.value.sampleImageUrl)
  }
  docType.value.sampleImageUrl = URL.createObjectURL(file)
  input.value = ''
  ElMessage.success(t('businessRules.docType.message.sampleReuploaded'))
}

function generateDescription() {
  const name = docType.value.name.trim() || '帳票'
  docType.value.description =
    `${name}の分類用サンプル帳票。レイアウト・記載項目をもとに AI 分類モデルへ学習させます。`.slice(
      0,
      DESCRIPTION_MAX_LENGTH
    )
  ElMessage.success(t('businessRules.docType.message.descriptionGenerated'))
}

function clearDescription() {
  docType.value.description = ''
}

function generateFileSplitRule() {
  const name = docType.value.name.trim() || '帳票'
  docType.value.fileSplitRule =
    `${name}が複数含まれる場合、発注日が変わるページ境界、またはページ番号の連続性が途切れる位置で分割する。`.slice(
      0,
      FILE_SPLIT_RULE_MAX_LENGTH
    )
  ElMessage.success(t('businessRules.docType.message.splitRuleGenerated'))
}

function clearFileSplitRule() {
  docType.value.fileSplitRule = ''
}

defineExpose({
  triggerReupload
})
</script>

<template>
  <div class="v-doc-type-classify v-doc-type-workspace">
    <div class="v-doc-type-classify__preview-slot">
      <DocTypeSamplePreview :image-url="docType.sampleImageUrl" />
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*,.pdf"
        class="v-doc-type-classify__file-input"
        @change="onFileChange"
      />
    </div>

    <div class="v-doc-type-classify__form">
      <el-form label-position="top" class="v-doc-type-classify__form-inner">
        <AppFormItem :label="$t('businessRules.docType.classify.typeId')">
          <div class="v-doc-type-classify__readonly">{{ docType.id }}</div>
        </AppFormItem>

        <AppFormItem required :label="$t('businessRules.docType.classify.name')">
          <el-input v-model="docType.name" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>

        <AppFormItem required>
          <template #label>
            <span class="v-doc-type-classify__label-row">
              <span>{{ $t('businessRules.docType.classify.description') }}</span>
              <el-tooltip
                :content="descriptionHint"
                placement="top"
                effect="dark"
                :show-after="200"
              >
                <button
                  type="button"
                  class="v-doc-type-classify__info-btn"
                  :aria-label="$t('businessRules.docType.classify.descriptionHintAria')"
                >
                  <el-icon :size="14"><InfoFilled /></el-icon>
                </button>
              </el-tooltip>
            </span>
          </template>
          <div class="v-doc-type-classify__textarea-wrap">
            <el-input
              v-model="docType.description"
              type="textarea"
              :rows="5"
              :maxlength="DESCRIPTION_MAX_LENGTH"
              show-word-limit
              resize="none"
              :placeholder="PLACEHOLDER.INPUT"
            />
            <div class="v-doc-type-classify__textarea-actions">
              <button
                type="button"
                class="v-doc-type-classify__icon-action"
                :title="$t('businessRules.docType.classify.generateDescription')"
                @click="generateDescription"
              >
                <el-icon :size="18"><MagicStick /></el-icon>
              </button>
              <button
                type="button"
                class="v-doc-type-classify__icon-action"
                :title="$t('businessRules.docType.classify.clearDescription')"
                @click="clearDescription"
              >
                <el-icon :size="18"><Delete /></el-icon>
              </button>
              <span class="v-doc-type-classify__char-count">
                {{ descriptionLength }}/{{ DESCRIPTION_MAX_LENGTH }}
              </span>
            </div>
          </div>
        </AppFormItem>

        <AppFormItem>
          <template #label>
            <span class="v-doc-type-classify__label-row">
              <span>{{ $t('businessRules.docType.classify.fileSplitRule') }}</span>
              <el-tooltip
                :content="fileSplitHintText"
                placement="top"
                effect="dark"
                :show-after="200"
              >
                <button
                  type="button"
                  class="v-doc-type-classify__info-btn"
                  :aria-label="$t('businessRules.docType.classify.fileSplitRuleHintAria')"
                >
                  <el-icon :size="14"><InfoFilled /></el-icon>
                </button>
              </el-tooltip>
            </span>
          </template>
          <div class="v-doc-type-classify__textarea-wrap">
            <el-input
              v-model="docType.fileSplitRule"
              type="textarea"
              :rows="4"
              :maxlength="FILE_SPLIT_RULE_MAX_LENGTH"
              show-word-limit
              resize="none"
              :placeholder="fileSplitPlaceholderText"
            />
            <div class="v-doc-type-classify__textarea-actions">
              <button
                type="button"
                class="v-doc-type-classify__icon-action"
                :title="$t('businessRules.docType.classify.generateSplitRule')"
                @click="generateFileSplitRule"
              >
                <el-icon :size="18"><MagicStick /></el-icon>
              </button>
              <button
                type="button"
                class="v-doc-type-classify__icon-action"
                :title="$t('businessRules.docType.classify.clearSplitRule')"
                @click="clearFileSplitRule"
              >
                <el-icon :size="18"><Delete /></el-icon>
              </button>
              <span class="v-doc-type-classify__char-count">
                {{ fileSplitRuleLength }}/{{ FILE_SPLIT_RULE_MAX_LENGTH }}
              </span>
            </div>
          </div>
        </AppFormItem>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-classify {
  &__preview-slot {
    position: relative;
    min-height: 0;
    display: flex;
    flex-direction: column;

    :deep(.v-doc-type-preview) {
      flex: 1;
      min-height: 0;
    }
  }

  &__file-input {
    display: none;
  }

  &__form {
    min-height: 0;
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    overflow: auto;
  }

  &__form-inner {
    :deep(.el-form-item__label) {
      font-size: var(--app-font-size-base);
      color: var(--text-secondary);
      padding-bottom: 6px;
    }
  }

  &__readonly {
    min-height: 40px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--app-content-bg-color);
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    word-break: break-all;
  }

  &__label-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__info-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--text-secondary);
    cursor: help;
    line-height: 1;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__textarea-wrap {
    position: relative;
    width: 100%;

    :deep(.el-textarea__inner) {
      padding-bottom: 36px;
    }

    :deep(.el-input__count) {
      display: none;
    }
  }

  &__textarea-actions {
    position: absolute;
    right: 10px;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__char-count {
    margin-left: 4px;
    font-size: 14px;
    color: var(--text-secondary);
  }
}
</style>
