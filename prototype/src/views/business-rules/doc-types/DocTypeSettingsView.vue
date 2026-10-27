<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, FullScreen, FolderOpened, Upload } from '@element-plus/icons-vue'
import ConfigListAside from '@/components/ConfigListAside.vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { PLACEHOLDER, searchPlaceholder } from '@/constants/placeholders'
import {
  docTypeWizardSteps,
  savePhase3DocSettings,
  appendDocTypeChangeLog,
  cloneDocTypeDefinition,
  createDocTypeDefinition,
  docTypeDefinitions,
  getDocTypeChangeLogs,
  type DocTypeDefinition,
  type DocTypeWizardStep
} from '@/mocks/docTypeSettings'
import DocTypeClassifyStep from './components/DocTypeClassifyStep.vue'
import DocTypeOcrStep from './components/DocTypeOcrStep.vue'
import DocTypeRuleStep from './components/DocTypeRuleStep.vue'
import DocTypeImageProcessStep from './components/DocTypeImageProcessStep.vue'
import DocTypeTestStep from './components/DocTypeTestStep.vue'

const { t } = useI18n()

const selectedTypeId = ref(docTypeDefinitions.value[0]?.id ?? '')
const listKeyword = ref('')
const currentStep = ref<DocTypeWizardStep>('classify')
const isFullscreen = ref(false)

const addDialogVisible = ref(false)
const newTypeName = ref('')
const renamingTypeId = ref<string | null>(null)
const renameDraft = ref('')
const historyDialogVisible = ref(false)
const historyTypeId = ref('')
const classifyStepRef = ref<InstanceType<typeof DocTypeClassifyStep> | null>(null)
const testStepRef = ref<InstanceType<typeof DocTypeTestStep> | null>(null)
const testFileInputRef = ref<HTMLInputElement | null>(null)

const selectedType = computed({
  get: () => docTypeDefinitions.value.find((item) => item.id === selectedTypeId.value),
  set: (value) => {
    if (!value) return
    const index = docTypeDefinitions.value.findIndex((item) => item.id === value.id)
    if (index >= 0) {
      docTypeDefinitions.value[index] = value
    }
  }
})

const filteredTypes = computed(() => {
  const kw = listKeyword.value.trim().toLowerCase()
  if (!kw) return docTypeDefinitions.value
  return docTypeDefinitions.value.filter((item) => item.name.toLowerCase().includes(kw))
})

const wizardSteps = computed(() => docTypeWizardSteps())

const currentStepIndex = computed(() =>
  wizardSteps.value.findIndex((step) => step.key === currentStep.value)
)

function selectType(type: DocTypeDefinition) {
  selectedTypeId.value = type.id
}

function openAddDialog() {
  newTypeName.value = ''
  addDialogVisible.value = true
}

function confirmAddType() {
  const name = newTypeName.value.trim()
  if (!name) {
    ElMessage.warning(t('businessRules.docType.message.nameRequired'))
    return
  }
  const created = createDocTypeDefinition(name)
  docTypeDefinitions.value.unshift(created)
  appendDocTypeChangeLog(created.id, 'タイプ追加', name)
  selectedTypeId.value = created.id
  currentStep.value = 'classify'
  addDialogVisible.value = false
  ElMessage.success(t('businessRules.docType.message.typeAdded'))
}

async function removeType(type: DocTypeDefinition) {
  await ElMessageBox.confirm(
    t('businessRules.docType.message.deleteConfirm', { name: type.name }),
    t('businessRules.docType.message.deleteTitle'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'warning'
    }
  )
  docTypeDefinitions.value = docTypeDefinitions.value.filter((item) => item.id !== type.id)
  appendDocTypeChangeLog(type.id, '削除', type.name)
  if (selectedTypeId.value === type.id) {
    selectedTypeId.value = docTypeDefinitions.value[0]?.id ?? ''
  }
  ElMessage.success(t('businessRules.docType.message.typeDeleted'))
}

function copyType(type: DocTypeDefinition) {
  const existingNames = docTypeDefinitions.value.map((item) => item.name)
  const copied = cloneDocTypeDefinition(type, existingNames)
  const sourceIndex = docTypeDefinitions.value.findIndex((item) => item.id === type.id)
  docTypeDefinitions.value.splice(sourceIndex + 1, 0, copied)
  appendDocTypeChangeLog(copied.id, 'コピー', `${type.name} から複製`)
  selectedTypeId.value = copied.id
  ElMessage.success(t('businessRules.docType.message.typeCopied'))
}

function startInlineRename(type: DocTypeDefinition) {
  selectedTypeId.value = type.id
  renamingTypeId.value = type.id
  renameDraft.value = type.name
}

function cancelInlineRename() {
  renamingTypeId.value = null
  renameDraft.value = ''
}

function saveInlineRename() {
  const type = docTypeDefinitions.value.find((item) => item.id === renamingTypeId.value)
  if (!type) return

  const nextName = renameDraft.value.trim()
  if (!nextName) {
    ElMessage.warning(t('businessRules.docType.message.nameRequired'))
    return
  }

  const previous = type.name
  if (previous !== nextName) {
    type.name = nextName
    appendDocTypeChangeLog(type.id, '名称変更', `${previous} → ${nextName}`)
    ElMessage.success(t('businessRules.docType.message.renamed'))
  }

  cancelInlineRename()
}

function openHistoryDialog(type: DocTypeDefinition) {
  historyTypeId.value = type.id
  historyDialogVisible.value = true
}

const historyType = computed(() =>
  docTypeDefinitions.value.find((item) => item.id === historyTypeId.value)
)

const historyLogs = computed(() => getDocTypeChangeLogs(historyTypeId.value))

async function handleTypeMenu(command: string, type: DocTypeDefinition) {
  selectedTypeId.value = type.id
  if (command === 'copy') {
    copyType(type)
    return
  }
  if (command === 'rename') {
    startInlineRename(type)
    return
  }
  if (command === 'history') {
    openHistoryDialog(type)
    return
  }
  if (command === 'delete') {
    await removeType(type)
  }
}

function onListItemClick(type: DocTypeDefinition) {
  if (renamingTypeId.value) return
  selectType(type)
}

function validateCurrentType(): boolean {
  if (!selectedType.value?.name.trim()) {
    ElMessage.warning(t('businessRules.docType.message.nameRequired'))
    return false
  }
  const qrRules=[...(selectedType.value.ocrRead.multipleQrEnabled?[]:selectedType.value.processRules.textFields),...selectedType.value.processRules.tableColumns]
  if(qrRules.some(r=>r.ruleType==='qrcode'&&r.qrMode==='split'&&(!r.qrDelimiter||!Number.isInteger(r.qrIndex)||Number(r.qrIndex)<1))){ElMessage.warning(t('phase3.qrInvalid'));return false}
  if (!selectedType.value.description.trim()) {
    ElMessage.warning(t('businessRules.docType.message.descriptionRequired'))
    return false
  }
  return true
}

function saveCurrentStep() {
  if (!validateCurrentType()) return
  if(selectedType.value)savePhase3DocSettings(selectedType.value)
  ElMessage.success(t('businessRules.docType.message.saved'))
}

function goNextStep() {
  if (!validateCurrentType()) return
  const next = wizardSteps.value[currentStepIndex.value + 1]
  if (!next) {
    ElMessage.info(t('businessRules.docType.message.lastStep'))
    return
  }
  currentStep.value = next.key
}

function goPrevStep() {
  const prev = wizardSteps.value[currentStepIndex.value - 1]
  if (!prev) return
  currentStep.value = prev.key
}

const showPrevStep = computed(() => currentStepIndex.value > 0)
const isLastStep = computed(
  () => currentStepIndex.value === wizardSteps.value.length - 1
)

function closeWizard() {
  selectedTypeId.value = ''
  currentStep.value = 'classify'
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function onStepClick(step: DocTypeWizardStep) {
  currentStep.value = step
}

function triggerReupload() {
  classifyStepRef.value?.triggerReupload()
}

function triggerTestFilePicker() {
  testFileInputRef.value?.click()
}

function onTestFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  testStepRef.value?.setTestFile(file)
  input.value = ''
}

function runEffectTest() {
  testStepRef.value?.runTest()
}
</script>

<template>
  <div
    class="v-content-wrap v-doc-types"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <header class="v-doc-types__header">
      <h1 class="v-doc-types__title">{{ $t('businessRules.docType.title') }}</h1>
    </header>

    <div class="v-doc-types__layout">
      <ConfigListAside
        v-model:keyword="listKeyword"
        :title="$t('businessRules.docType.list.title')"
        :search-placeholder="searchPlaceholder($t('businessRules.docType.list.searchSubject'))"
        :add-label="$t('businessRules.docType.list.add')"
        :empty-text="$t('businessRules.docType.list.empty')"
        :is-empty="filteredTypes.length === 0"
        @add="openAddDialog"
      >
        <li
          v-for="type in filteredTypes"
          :key="type.id"
          class="v-config-list-aside__list-item"
          :class="{
            'is-active': selectedTypeId === type.id,
            'is-renaming': renamingTypeId === type.id
          }"
          @click="onListItemClick(type)"
        >
          <el-input
            v-if="renamingTypeId === type.id"
            v-model="renameDraft"
            class="v-config-list-aside__list-rename-input"
            size="small"
            :placeholder="PLACEHOLDER.INPUT"
            @click.stop
            @keyup.enter="saveInlineRename"
          />
          <span v-else class="v-config-list-aside__list-name">{{ type.name }}</span>

          <div
            v-if="renamingTypeId === type.id"
            class="v-config-list-aside__list-rename-actions"
            @click.stop
          >
            <button type="button" class="v-config-list-aside__list-rename-btn" @click="saveInlineRename">
              {{ $t('businessRules.docType.action.save') }}
            </button>
            <button
              type="button"
              class="v-config-list-aside__list-rename-btn is-cancel"
              @click="cancelInlineRename"
            >
              {{ $t('businessRules.docType.action.cancel') }}
            </button>
          </div>
          <el-dropdown
            v-else
            trigger="click"
            :disabled="!!renamingTypeId"
            @command="handleTypeMenu($event, type)"
          >
            <button
              type="button"
              class="v-config-list-aside__list-menu"
              :aria-label="$t('businessRules.docType.menu.aria')"
              @click.stop
            >
              <el-icon :size="16"><MoreFilled /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="copy">{{ $t('businessRules.docType.menu.copy') }}</el-dropdown-item>
                <el-dropdown-item command="rename">{{ $t('businessRules.docType.menu.rename') }}</el-dropdown-item>
                <el-dropdown-item command="delete" class="v-doc-types__menu-danger">
                  {{ $t('businessRules.docType.menu.delete') }}
                </el-dropdown-item>
                <el-dropdown-item command="history">{{ $t('businessRules.docType.menu.history') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </ConfigListAside>

      <section v-if="selectedType" class="v-doc-types__main">
        <header class="v-doc-types__stepper">
          <nav class="v-doc-types__step-nav" :aria-label="$t('businessRules.docType.nav.stepAria')">
            <button
              v-for="(step, index) in wizardSteps"
              :key="step.key"
              type="button"
              class="v-doc-types__step-btn"
              :class="{
                'is-active': currentStep === step.key,
                'is-done': index < currentStepIndex
              }"
              @click="onStepClick(step.key)"
            >
              <span class="v-doc-types__step-no">{{ index + 1 }}</span>
              <span class="v-doc-types__step-label">{{ step.label }}</span>
            </button>
          </nav>
          <button
            type="button"
            class="v-doc-types__fullscreen"
            :title="isFullscreen ? $t('businessRules.docType.nav.exitFullscreen') : $t('businessRules.docType.nav.fullscreen')"
            @click="toggleFullscreen"
          >
            <el-icon :size="18"><FullScreen /></el-icon>
          </button>
        </header>

        <div class="v-doc-types__workspace">
          <DocTypeClassifyStep
            v-if="currentStep === 'classify' && selectedType"
            ref="classifyStepRef"
            v-model="selectedType"
          />
          <DocTypeOcrStep
            v-else-if="currentStep === 'ocr' && selectedType"
            v-model="selectedType"
          />
          <DocTypeRuleStep
            v-else-if="currentStep === 'rule' && selectedType"
            v-model="selectedType"
          />
          <DocTypeImageProcessStep
            v-else-if="currentStep === 'image' && selectedType"
            v-model="selectedType"
          />
          <DocTypeTestStep
            v-else-if="currentStep === 'test' && selectedType"
            ref="testStepRef"
            v-model="selectedType"
          />
        </div>

        <footer
          class="v-doc-types__footer"
          :class="{ 'is-test-step': currentStep === 'test' }"
        >
          <template v-if="currentStep === 'test'">
            <div class="v-doc-types__footer-test-zone">
              <el-button type="primary" :icon="FolderOpened" @click="triggerTestFilePicker">
                {{ $t('businessRules.docType.action.selectFile') }}
              </el-button>
              <el-button type="primary" @click="runEffectTest">{{ $t('businessRules.docType.action.test') }}</el-button>
              <input
                ref="testFileInputRef"
                type="file"
                class="v-doc-types__file-input"
                accept="image/*,.pdf"
                @change="onTestFileChange"
              />
            </div>
            <div class="v-doc-types__footer-actions">
              <el-button @click="closeWizard">{{ $t('businessRules.docType.action.close') }}</el-button>
              <el-button v-if="showPrevStep" @click="goPrevStep">{{ $t('businessRules.docType.action.prev') }}</el-button>
              <el-button v-if="!isLastStep" @click="goNextStep">{{ $t('businessRules.docType.action.next') }}</el-button>
              <el-button type="primary" @click="saveCurrentStep">{{ $t('businessRules.docType.action.save') }}</el-button>
            </div>
          </template>

          <template v-else>
            <div class="v-doc-types__footer-left">
              <el-button
                v-if="currentStep === 'classify'"
                type="primary"
                :icon="Upload"
                @click="triggerReupload"
              >
                {{ $t('businessRules.docType.action.reupload') }}
              </el-button>
            </div>

            <div class="v-doc-types__footer-actions">
              <el-button @click="closeWizard">{{ $t('businessRules.docType.action.close') }}</el-button>
              <el-button v-if="showPrevStep" @click="goPrevStep">{{ $t('businessRules.docType.action.prev') }}</el-button>
              <el-button v-if="!isLastStep" @click="goNextStep">{{ $t('businessRules.docType.action.next') }}</el-button>
              <el-button type="primary" @click="saveCurrentStep">{{ $t('businessRules.docType.action.save') }}</el-button>
            </div>
          </template>
        </footer>
      </section>

      <section v-else class="v-doc-types__main v-doc-types__main--empty">
        <el-empty :description="$t('businessRules.docType.list.selectHint')" />
      </section>
    </div>

    <el-dialog v-model="addDialogVisible" :title="$t('businessRules.docType.list.add')" width="480px" destroy-on-close>
      <el-form label-width="100px">
        <AppFormItem :label="$t('businessRules.docType.classify.name')" required>
          <el-input v-model="newTypeName" :placeholder="PLACEHOLDER.INPUT" />
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ $t('businessRules.docType.action.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAddType">{{ $t('businessRules.docType.action.add') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyDialogVisible"
      :title="`${historyType?.name ?? ''}${$t('businessRules.docType.history.titleSuffix')}`"
      width="720px"
      destroy-on-close
    >
      <el-table :data="historyLogs" border max-height="420">
        <el-table-column prop="occurredAt" :label="$t('businessRules.docType.history.occurredAt')" width="168" />
        <el-table-column prop="action" :label="$t('businessRules.docType.history.action')" width="120" />
        <el-table-column prop="operator" :label="$t('businessRules.docType.history.operator')" width="120" />
        <el-table-column prop="detail" :label="$t('businessRules.docType.history.detail')" min-width="220" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-doc-types {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--top-header-total-height));
  min-height: unset;
  max-height: calc(100vh - var(--top-header-total-height));
  overflow: hidden;
  box-sizing: border-box;
  padding: var(--app-content-padding) !important;

  &.v-content-wrap {
    min-height: unset;
  }

  &.is-fullscreen {
    position: fixed;
    inset: var(--top-header-total-height) 0 0 0;
    z-index: 2000;
    height: calc(100vh - var(--top-header-total-height));
    max-height: none;
    background: var(--app-content-bg-color);
    padding: var(--app-page-gap) !important;
  }

  &__header {
    flex-shrink: 0;
    margin-bottom: var(--app-page-gap);
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__layout {
    flex: 1;
    display: flex;
    gap: var(--app-page-gap);
    min-height: 0;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    overflow: hidden;

    &--empty {
      align-items: center;
      justify-content: center;
    }
  }

  &__stepper {
    position: relative;
    flex-shrink: 0;
    padding: 16px 56px 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  &__step-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  &__step-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    border: none;
    background: transparent;
    font-family: inherit;
    cursor: pointer;
    color: var(--text-secondary);

    &.is-active {
      color: var(--el-color-primary);

      .v-doc-types__step-no {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary);
        color: #fff;
      }

      .v-doc-types__step-label {
        font-weight: 600;
      }
    }

    &.is-done:not(.is-active) {
      color: var(--text-primary);
    }
  }

  &__step-no {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    font-size: 14px;
    line-height: 1;
    flex-shrink: 0;
  }

  &__step-label {
    font-size: var(--app-font-size-base);
    white-space: nowrap;
  }

  &__fullscreen {
    position: absolute;
    top: 16px;
    right: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-7);
    }
  }

  &__workspace {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: var(--app-panel-padding);
    overflow: hidden;
  }

  &__footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px var(--app-panel-padding);
    border-top: 1px solid var(--border-color);

    &.is-test-step {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      gap: var(--app-section-gap);
      align-items: center;
    }
  }

  &__footer-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-width: 0;
  }

  &__footer-test-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  &__file-input {
    display: none;
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;

    .is-test-step & {
      margin-left: 0;
    }
  }
}

:deep(.v-doc-types__menu-danger) {
  color: var(--el-color-danger);
}
</style>
