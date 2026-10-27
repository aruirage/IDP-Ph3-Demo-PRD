<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Document,
  FolderOpened,
  MagicStick,
  Plus,
  Setting,
  UploadFilled
} from '@element-plus/icons-vue'
import { PLACEHOLDER } from '@/constants/placeholders'
import {
  OCR_FIELD_MAX_COUNT,
  OCR_GLOBAL_PROMPT_MAX_LENGTH,
  createOcrFieldId,
  createOcrTableColumnId,
  type DocTypeDefinition,
  type DocTypeOcrField
} from '@/mocks/docTypeSettings'
import DocTypeSamplePreview from './DocTypeSamplePreview.vue'
import DocTypeOcrTableConfig from './DocTypeOcrTableConfig.vue'
import DocTypeReadModelDialog from './DocTypeReadModelDialog.vue'

const { t } = useI18n()

const docType = defineModel<DocTypeDefinition>({ required: true })

const activeTab = ref<'text' | 'table'>('text')
const readModelDialogVisible = ref(false)
const importDialogVisible = ref(false)
const importFile = ref<File | null>(null)
const importFileInputRef = ref<HTMLInputElement | null>(null)
const importUpdateMode = ref<'append' | 'overwrite'>('append')

const globalPromptLength = computed(() => docType.value.ocrRead.globalPrompt.length)

const textFields = computed({
  get: () => docType.value.ocrRead.textFields,
  set: (fields: DocTypeOcrField[]) => {
    docType.value.ocrRead.textFields = fields
  }
})

const textFieldCountLabel = computed(() =>
  t('businessRules.docType.ocr.fieldCount', {
    count: textFields.value.length,
    max: OCR_FIELD_MAX_COUNT
  })
)

function addTextField() {
  if (textFields.value.length >= OCR_FIELD_MAX_COUNT) {
    ElMessage.warning(t('businessRules.docType.message.fieldMax', { max: OCR_FIELD_MAX_COUNT }))
    return
  }
  textFields.value = [
    ...textFields.value,
    {
      id: createOcrFieldId(),
      itemName: '',
      prompt: '',
      correctSample: '',
      required: false
    }
  ]
}

function removeTextField(fieldId: string) {
  textFields.value = textFields.value.filter((field) => field.id !== fieldId)
}

function generateGlobalPrompt() {
  const name = docType.value.name.trim() || '帳票'
  docType.value.ocrRead.globalPrompt =
    `本帳票は${name}です。記載形式の揺れを許容しつつ、欄名に対応する値のみを抽出してください。`.slice(
      0,
      OCR_GLOBAL_PROMPT_MAX_LENGTH
    )
  ElMessage.success(t('businessRules.docType.message.globalPromptGenerated'))
}

function clearGlobalPrompt() {
  docType.value.ocrRead.globalPrompt = ''
}

function autoGenerate() {
  if (activeTab.value === 'text') {
    const targets = textFields.value.filter((field) => field.itemName.trim())
    if (!targets.length) {
      ElMessage.warning(t('businessRules.docType.message.noItemNameRows'))
      return
    }
    targets.forEach((field) => {
      if (!field.prompt.trim()) {
        field.prompt = `「${field.itemName}」欄の記載内容を抽出してください`
      }
    })
    ElMessage.success(t('businessRules.docType.message.aiGenerateDone'))
    return
  }

  const tables = docType.value.ocrRead.tables
  if (!tables.length) {
    ElMessage.warning(t('businessRules.docType.message.noTables'))
    return
  }
  let generated = 0
  tables.forEach((table) => {
    table.columns
      .filter((column) => column.columnKey.trim())
      .forEach((column) => {
        if (!column.prompt.trim()) {
          column.prompt = `「${column.columnKey}」列の値を抽出してください`
          generated += 1
        }
      })
  })
  if (!generated) {
    ElMessage.warning(t('businessRules.docType.message.noColumnKeyRows'))
    return
  }
  ElMessage.success(t('businessRules.docType.message.aiGenerateDone'))
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadBlob(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadTextTemplate() {
  const headers = ['項目名', 'プロンプト', '正解サンプル', '必須項目']
  const sample = ['申込年月日', '帳票右上の申込日を抽出', '2025年4月1日', 'はい']
  const csv = `${headers.join(',')}\n${sample.map(escapeCsvCell).join(',')}\n`
  const name = docType.value.name.trim() || '帳票'
  downloadBlob(`${name}_text_read_template.csv`, csv)
  ElMessage.success(t('businessRules.docType.message.templateDownloaded'))
}

function downloadTableTemplate() {
  const headers = ['テーブル名', 'テーブル抽出条件', '列キー名', '列プロンプト', '正解サンプル', '必須']
  const sample = ['テーブル1', '', '列キー', '', '', 'いいえ']
  const csv = `${headers.join(',')}\n${sample.map(escapeCsvCell).join(',')}\n`
  const name = docType.value.name.trim() || '帳票'
  downloadBlob(`${name}_table_read_template.csv`, csv)
  ElMessage.success(t('businessRules.docType.message.templateDownloaded'))
}

function downloadTemplate() {
  if (activeTab.value === 'text') {
    downloadTextTemplate()
    return
  }
  downloadTableTemplate()
}

function downloadTextBatch() {
  const headers = ['項目名', 'プロンプト', '正解サンプル', '必須項目']
  const rows = textFields.value.map((field) =>
    [
      field.itemName,
      field.prompt,
      field.correctSample,
      field.required ? 'はい' : 'いいえ'
    ]
      .map(escapeCsvCell)
      .join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const name = docType.value.name.trim() || '帳票'
  downloadBlob(`${name}_text_read_export.csv`, `${csv}\n`)
  ElMessage.success(t('businessRules.docType.message.batchDownloadDone'))
}

function downloadTableBatch() {
  const headers = ['テーブル名', 'テーブル抽出条件', '列キー名', '列プロンプト', '正解サンプル', '必須']
  const rows: string[] = []
  docType.value.ocrRead.tables.forEach((table) => {
    table.columns.forEach((column) => {
      rows.push(
        [
          table.name,
          table.extractionCondition,
          column.columnKey,
          column.prompt,
          column.correctSample,
          column.required ? 'はい' : 'いいえ'
        ]
          .map(escapeCsvCell)
          .join(',')
      )
    })
  })
  const csv = [headers.join(','), ...rows].join('\n')
  const name = docType.value.name.trim() || '帳票'
  downloadBlob(`${name}_table_read_export.csv`, `${csv}\n`)
  ElMessage.success(t('businessRules.docType.message.batchDownloadDone'))
}

function batchDownload() {
  if (activeTab.value === 'text') {
    if (!textFields.value.length) {
      ElMessage.warning(t('businessRules.docType.message.noDownloadTextItems'))
      return
    }
    downloadTextBatch()
    return
  }
  if (!docType.value.ocrRead.tables.length) {
    ElMessage.warning(t('businessRules.docType.message.noDownloadTables'))
    return
  }
  downloadTableBatch()
}

function openImportDialog() {
  importFile.value = null
  importUpdateMode.value = 'append'
  importDialogVisible.value = true
}

function openImportFilePicker() {
  importFileInputRef.value?.click()
}

function setImportFile(file: File | null) {
  if (!file) return
  const allowed = ['.xlsx', '.xls', '.csv']
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowed.includes(ext)) {
    ElMessage.warning(t('businessRules.docType.message.importFileTypeInvalid'))
    return
  }
  importFile.value = file
}

function onImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  setImportFile(input.files?.[0] ?? null)
  input.value = ''
}

function executeTextImport() {
  const samples = [
    { itemName: 'インポート項目A', prompt: 'A欄を抽出', correctSample: 'サンプルA', required: true },
    { itemName: 'インポート項目B', prompt: 'B欄を抽出', correctSample: 'サンプルB', required: false }
  ]
  if (importUpdateMode.value === 'overwrite') {
    textFields.value = []
  }
  const remaining = OCR_FIELD_MAX_COUNT - textFields.value.length
  const imported = samples.slice(0, remaining).map((item) => ({
    id: createOcrFieldId(),
    ...item
  }))
  textFields.value = [...textFields.value, ...imported]
  return imported.length
}

function executeTableImport() {
  if (importUpdateMode.value === 'overwrite') {
    docType.value.ocrRead.tables = []
  }
  const table = docType.value.ocrRead.tables[0]
  if (table) {
    table.columns.push({
      id: createOcrTableColumnId(),
      columnKey: 'インポート列',
      prompt: 'インポート列を抽出',
      correctSample: 'サンプル',
      required: false
    })
    return 1
  }
  docType.value.ocrRead.tables.push({
    id: `table-${Date.now()}`,
    name: 'テーブル1',
    extractionCondition: '',
    collapsed: false,
    columns: [
      {
        id: createOcrTableColumnId(),
        columnKey: 'インポート列',
        prompt: 'インポート列を抽出',
        correctSample: 'サンプル',
        required: false
      }
    ]
  })
  return 1
}

function confirmImport() {
  if (!importFile.value) {
    ElMessage.warning(t('businessRules.docType.message.uploadFileRequired'))
    return
  }
  const count = activeTab.value === 'text' ? executeTextImport() : executeTableImport()
  importDialogVisible.value = false
  ElMessage.success(t('businessRules.docType.message.imported', { count }))
}

function handleSaveMenu(command: string) {
  if (command === 'template') {
    downloadTemplate()
    return
  }
  if (command === 'batch-download') {
    batchDownload()
    return
  }
  if (command === 'batch-import') {
    openImportDialog()
  }
}
</script>

<template>
  <div class="v-doc-type-ocr v-doc-type-workspace v-doc-type-workspace--2-3">
    <DocTypeSamplePreview :image-url="docType.sampleImageUrl" />

    <div class="v-doc-type-ocr__panel">
      <div class="v-doc-type-ocr__head">
        <el-tabs v-model="activeTab" class="v-doc-type-ocr__tabs">
          <el-tab-pane :label="$t('businessRules.docType.tab.textRead')" name="text" />
          <el-tab-pane :label="$t('businessRules.docType.tab.tableRead')" name="table" />
        </el-tabs>

        <div class="v-doc-type-ocr__head-actions">
          <el-button type="primary" :icon="MagicStick" @click="autoGenerate">
            {{ $t('businessRules.docType.ocr.aiAutoGenerate') }}
          </el-button>
          <button
            type="button"
            class="v-doc-type-ocr__icon-btn v-doc-type-ocr__icon-btn--primary"
            :title="$t('phase3.reviewSettings')"
            @click="readModelDialogVisible = true"
          >
            <el-icon :size="18"><Setting /></el-icon>
          </button>
          <el-dropdown trigger="click" @command="handleSaveMenu">
            <button
              type="button"
              class="v-doc-type-ocr__icon-btn v-doc-type-ocr__icon-btn--primary"
              :title="$t('businessRules.docType.ocr.saveExport')"
            >
              <el-icon :size="18"><Document /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="template">{{ $t('businessRules.docType.ocr.templateDownload') }}</el-dropdown-item>
                <el-dropdown-item command="batch-download">{{ $t('businessRules.docType.ocr.batchDownload') }}</el-dropdown-item>
                <el-dropdown-item command="batch-import">{{ $t('businessRules.docType.ocr.batchImport') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="v-doc-type-ocr__body">
        <div class="v-doc-type-ocr__prompt-wrap">
          <el-input
            v-model="docType.ocrRead.globalPrompt"
            type="textarea"
            :rows="4"
            :maxlength="OCR_GLOBAL_PROMPT_MAX_LENGTH"
            resize="none"
            :placeholder="PLACEHOLDER.INPUT"
          />
          <div class="v-doc-type-ocr__prompt-actions">
            <button
              type="button"
              class="v-doc-type-ocr__icon-action"
              :title="$t('businessRules.docType.ocr.generateGlobalPrompt')"
              @click="generateGlobalPrompt"
            >
              <el-icon :size="18"><MagicStick /></el-icon>
            </button>
            <button
              type="button"
              class="v-doc-type-ocr__icon-action"
              :title="$t('businessRules.docType.ocr.clearGlobalPrompt')"
              @click="clearGlobalPrompt"
            >
              <el-icon :size="18"><Delete /></el-icon>
            </button>
            <span class="v-doc-type-ocr__char-count">
              {{ globalPromptLength }}/{{ OCR_GLOBAL_PROMPT_MAX_LENGTH }}
            </span>
          </div>
        </div>

        <template v-if="activeTab === 'text'">
          <div class="p3-multiple-qr"><el-switch v-model="docType.ocrRead.multipleQrEnabled" :aria-label="$t('phase3.multipleQr')"/><span>{{$t('phase3.multipleQr')}}</span><el-tooltip :content="$t('phase3.qrPriorityTip')"><el-icon><Setting/></el-icon></el-tooltip></div>
          <div class="v-doc-type-ocr__content-scroll">
            <el-table :data="textFields" border class="v-doc-type-ocr__table v-doc-type-table">
            <el-table-column
              type="index"
              :label="$t('common.index')"
              width="80"
              align="center"
              header-class-name="v-list-table__index-col"
              class-name="v-list-table__index-col"
            />
            <el-table-column min-width="140">
              <template #header>
                <span>{{ $t('businessRules.docType.column.itemName') }}</span>
                <RequiredTag />
              </template>
              <template #default="{ row }">
                <el-input v-model="row.itemName" :placeholder="PLACEHOLDER.INPUT" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.prompt')" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.prompt" :placeholder="PLACEHOLDER.INPUT" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.correctSample')" min-width="160">
              <template #default="{ row }">
                <el-input v-model="row.correctSample" :placeholder="PLACEHOLDER.INPUT" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.requiredField')" width="96" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('businessRules.docType.column.action')" width="64" align="center" fixed="right" class-name="v-list-table__actions-col">
              <template #default="{ row }">
                <el-button link type="danger" @click="removeTextField(row.id)">{{ $t('businessRules.docType.action.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="v-doc-type-sticky-add-bar">
          <el-button
            :icon="Plus"
            :disabled="textFields.length >= OCR_FIELD_MAX_COUNT"
            @click="addTextField"
          >
            {{ $t('businessRules.docType.ocr.addFieldWithCount', { count: textFieldCountLabel }) }}
          </el-button>
        </div>
        </template>

        <DocTypeOcrTableConfig
          v-else
          v-model="docType.ocrRead.tables"
          class="v-doc-type-ocr__table-config"
        />
      </div>
    </div>
  </div>

  <DocTypeReadModelDialog
    v-model:visible="readModelDialogVisible"
    v-model:config="docType.readModel"
  />

  <el-dialog
    v-model="importDialogVisible"
    :title="$t('businessRules.docType.ocr.importTitle')"
    width="560px"
    destroy-on-close
    class="v-doc-type-ocr__import-dialog"
  >
    <div class="v-doc-type-ocr__import">
      <section class="v-doc-type-ocr__import-section">
        <h3 class="v-doc-type-ocr__import-title">{{ $t('businessRules.docType.ocr.importTemplateSection') }}</h3>
        <p class="v-doc-type-ocr__import-desc">
          {{ $t('businessRules.docType.ocr.importTemplateDesc') }}
        </p>
        <el-button @click="downloadTemplate">{{ $t('businessRules.docType.ocr.templateDownload') }}</el-button>
      </section>

      <section class="v-doc-type-ocr__import-section">
        <h3 class="v-doc-type-ocr__import-title">
          {{ $t('businessRules.docType.ocr.importUploadSection') }}
          <span class="v-doc-type-ocr__import-required">*</span>
        </h3>
        <div
          class="v-doc-type-ocr__import-dropzone"
          :class="{ 'has-file': !!importFile }"
        >
          <el-icon class="v-doc-type-ocr__import-dropzone-icon" :size="36">
            <UploadFilled />
          </el-icon>
          <p class="v-doc-type-ocr__import-dropzone-text">{{ $t('businessRules.docType.ocr.importDropzone') }}</p>
          <p class="v-doc-type-ocr__import-dropzone-hint">
            {{ $t('businessRules.docType.ocr.importDropzoneHint') }}
          </p>
          <el-button type="primary" :icon="FolderOpened" @click="openImportFilePicker">
            {{ $t('businessRules.docType.ocr.selectFileToImport') }}
          </el-button>
          <p v-if="importFile" class="v-doc-type-ocr__import-file-name">{{ importFile.name }}</p>
          <input
            ref="importFileInputRef"
            type="file"
            class="v-doc-type-ocr__import-file-input"
            accept=".xlsx,.xls,.csv"
            @change="onImportFileChange"
          />
        </div>
      </section>

      <section class="v-doc-type-ocr__import-section">
        <h3 class="v-doc-type-ocr__import-title">{{ $t('businessRules.docType.ocr.importUpdateMode') }}</h3>
        <el-radio-group v-model="importUpdateMode" class="v-doc-type-ocr__import-mode">
          <el-radio value="append">{{ $t('businessRules.docType.ocr.importAppend') }}</el-radio>
          <el-radio value="overwrite">{{ $t('businessRules.docType.ocr.importOverwrite') }}</el-radio>
        </el-radio-group>
      </section>
    </div>

    <template #footer>
      <el-button @click="importDialogVisible = false">{{ $t('businessRules.docType.action.cancel') }}</el-button>
      <el-button type="primary" @click="confirmImport">OK</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-ocr {
  &__panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
    padding: var(--app-panel-padding);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
    overflow: hidden;
  }

  &__content-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__table-config {
    flex: 1;
    min-height: 0;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--app-section-gap);
    flex-shrink: 0;
  }

  &__tabs {
    flex: 1;
    min-width: 0;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__item) {
      font-size: var(--app-font-size-base);
      height: 40px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--border-color);
    }
  }

  &__head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  &__icon-btn {
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

    &--primary {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  &__import {
    display: flex;
    flex-direction: column;
    gap: var(--app-section-gap);
  }

  &__import-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__import-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__import-desc {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__import-required {
    margin-left: 4px;
    color: var(--el-color-danger);
  }

  &__import-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 16px;
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    background: #fafafa;
    text-align: center;

    &.has-file {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
  }

  &__import-dropzone-icon {
    color: var(--text-secondary);
  }

  &__import-dropzone-text {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
  }

  &__import-dropzone-hint {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__import-file-name {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--el-color-primary);
  }

  &__import-file-input {
    display: none;
  }

  &__import-mode {
    display: flex;
    gap: var(--app-section-gap);
  }

  &__prompt-wrap {
    position: relative;
    flex-shrink: 0;

    :deep(.el-textarea__inner) {
      padding-bottom: 36px;
    }
  }

  &__prompt-actions {
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
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__table-wrap,
  &__table {
    width: 100%;
  }
}
</style>

<style scoped>.p3-multiple-qr{display:flex;align-items:center;gap:10px;margin:0 0 16px;font-size:15px}</style>
