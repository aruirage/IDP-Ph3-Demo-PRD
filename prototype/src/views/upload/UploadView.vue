<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, UploadFilled, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import {
  collectFromDataTransfer,
  extractZipFile,
  type IngestInput
} from '@/utils/uploadIngest'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import { addPendingFilesFromUpload } from '@/mocks/pendingConsolidation'
import {
  businessScenarioLabel,
  businessScenarioOptions,
  type BusinessScenarioValue
} from '@/constants/businessScenarios'
import { findCaseById } from '@/mocks/cases'
import { PLACEHOLDER } from '@/constants/placeholders'
import { CASE_FILE_PREVIEW_URL } from '@/mocks/caseFiles'
import DocumentPreviewMedia from '@/components/DocumentPreviewMedia.vue'
import UploadStagedFileRowActions from './components/UploadStagedFileRowActions.vue'
import { aiCaseLinkEnabled } from '@/mocks/caseConsolidationSettings'

interface StagedFile {
  id: string
  fileName: string
  folderName: string
  size: number
  ext: string
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const folderInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const zipInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isDropProcessing = ref(false)
const dragDepth = ref(0)
const stagedFiles = ref<StagedFile[]>([])
const selectedFileIds = ref<string[]>([])
const businessScenario = ref<BusinessScenarioValue | ''>('')
const previewDialogVisible = ref(false)
const previewFile = ref<StagedFile | null>(null)

const isSupplementMode = computed(() => route.query.mode === 'supplement')
const supplementCaseId = computed(() =>
  typeof route.query.caseId === 'string' ? route.query.caseId : ''
)
const supplementCase = computed(() =>
  supplementCaseId.value ? findCaseById(supplementCaseId.value) : undefined
)

const businessScenarioOptionsList = computed(() => businessScenarioOptions())

const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'pdf']
const MAX_FILE_MB = 50

const totalFileCount = computed(() => stagedFiles.value.length)
const hasUploadedFiles = computed(() => stagedFiles.value.length > 0)
const hasCaseScene = computed(() => Boolean(businessScenario.value))
const canSubmit = computed(() => hasUploadedFiles.value && hasCaseScene.value)
const submitBlockReason = computed(() => {
  if (!hasCaseScene.value) return t('upload.blockSelectScene')
  if (!hasUploadedFiles.value) return t('upload.blockUploadFiles')
  return ''
})
const hasSelection = computed(() => selectedFileIds.value.length > 0)
const selectedScenarioLabel = computed(() => businessScenarioLabel(businessScenario.value))

const consolidationHint = computed(() =>
  aiCaseLinkEnabled.value ? t('upload.aiCaseLinkHintOn') : t('upload.aiCaseLinkHintOff')
)

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getExt(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function ingestInputs(inputs: IngestInput[]) {
  if (!inputs.length) return

  const next: StagedFile[] = []
  let rejectedFormat = false
  let rejectedSize = false

  for (const { file, relativePath } of inputs) {
    const ext = getExt(file.name)

    if (!ACCEPT_EXT.includes(ext)) {
      rejectedFormat = true
      continue
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      rejectedSize = true
      continue
    }

    const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean)
    if (parts.length < 2) continue

    const folderName = parts[0]
    next.push({
      id: uid(),
      fileName: file.name,
      folderName,
      size: file.size,
      ext: ext.toUpperCase()
    })
  }

  if (rejectedFormat) {
    ElMessage.warning(t('upload.formatRejected'))
  }
  if (rejectedSize) {
    ElMessage.warning(t('upload.sizeRejected', { maxMb: MAX_FILE_MB }))
  }
  if (!next.length) return

  stagedFiles.value = [...stagedFiles.value, ...next]
  selectedFileIds.value = []
}

function defaultFolderName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

function ingestFlatFileList(fileList: FileList) {
  const inputs: IngestInput[] = Array.from(fileList).map((file) => ({
    file,
    relativePath: `${defaultFolderName(file.name)}/${file.name}`
  }))
  ingestInputs(inputs)
}

function ingestFileList(fileList: FileList) {
  const inputs: IngestInput[] = Array.from(fileList).map((file) => ({
    file,
    relativePath:
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
  }))

  const rootFolders = new Set(
    inputs
      .map((item) => item.relativePath.replace(/\\/g, '/').split('/').filter(Boolean)[0])
      .filter(Boolean)
  )

  if (rootFolders.size === 1) {
    const rootFolder = [...rootFolders][0]
    for (const item of inputs) {
      const parts = item.relativePath.replace(/\\/g, '/').split('/').filter(Boolean)
      if (parts.length === 1) {
        item.relativePath = `${rootFolder}/${item.file.name}`
      }
    }
  }

  ingestInputs(inputs)
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function openFolderPicker() {
  folderInputRef.value?.click()
}

function openZipPicker() {
  zipInputRef.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) ingestFlatFileList(input.files)
  input.value = ''
}

function onFolderChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) ingestFileList(input.files)
  input.value = ''
}

async function onZipChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  try {
    isDropProcessing.value = true
    const inputs = await extractZipFile(file)
    ingestInputs(inputs)
  } catch {
    ElMessage.error(t('upload.zipReadFail'))
  } finally {
    isDropProcessing.value = false
  }
}

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragDepth.value += 1
  isDragOver.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  if (dragDepth.value === 0) isDragOver.value = false
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  dragDepth.value = 0
  isDragOver.value = false

  const dataTransfer = e.dataTransfer
  if (!dataTransfer) return

  try {
    isDropProcessing.value = true
    const inputs = await collectFromDataTransfer(dataTransfer)
    ingestInputs(inputs)
  } catch {
    ElMessage.error(t('upload.fileReadFail'))
  } finally {
    isDropProcessing.value = false
  }
}

function batchDelete() {
  if (!hasSelection.value) return
  stagedFiles.value = stagedFiles.value.filter((f) => !selectedFileIds.value.includes(f.id))
  selectedFileIds.value = []
}

function openPreview(file: StagedFile) {
  previewFile.value = file
  previewDialogVisible.value = true
}

function closePreview() {
  previewDialogVisible.value = false
  previewFile.value = null
}

async function handleDeleteFile(file: StagedFile) {
  await ElMessageBox.confirm(
    t('case.message.deleteFileConfirm', { fileName: file.fileName }),
    t('case.action.delete'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )
  stagedFiles.value = stagedFiles.value.filter((item) => item.id !== file.id)
  selectedFileIds.value = selectedFileIds.value.filter((id) => id !== file.id)
  ElMessage.success(t('upload.deleteSuccess'))
}

async function handleSubmit() {
  if (!stagedFiles.value.length) return

  if (!businessScenario.value) {
    ElMessage.warning(t('upload.blockSelectScene'))
    return
  }

  const fileCount = stagedFiles.value.length

  await ElMessageBox.confirm(
    t('upload.confirmSubmitDetail', {
      scene: selectedScenarioLabel.value,
      count: fileCount
    }),
    t('upload.runPhase1'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'info',
      dangerouslyUseHTMLString: true
    }
  )

  addPendingFilesFromUpload(
    stagedFiles.value.map((file) => ({
      fileName: file.fileName,
      folderName: file.folderName,
      size: file.size,
      ext: file.ext
    })),
    businessScenario.value as BusinessScenarioValue
  )
  stagedFiles.value = []
  selectedFileIds.value = []
  ElMessage.success(t('upload.submitSuccessPhase1', { count: fileCount }))
  router.push({ path: '/cases', query: { tab: 'pending' } })
}

function goBack() {
  router.push('/cases')
}
</script>

<template>
  <div class="v-content-wrap v-upload v-upload--has-footer">
    <h1 class="v-upload__title">
      {{ isSupplementMode ? $t('page.upload.supplementTitle') : $t('page.upload.title') }}
    </h1>

    <el-alert
      v-if="isSupplementMode && supplementCase"
      class="v-upload__supplement-alert"
      type="info"
      :closable="false"
      show-icon
    >
      {{ $t('page.upload.supplementAlert', { caseId: supplementCase.caseId }) }}
    </el-alert>

    <section class="v-upload__case-type">
      <label class="v-upload__case-type-label" for="upload-case-scene">
        {{ $t('page.upload.businessScene') }}
        <RequiredTag />
      </label>
      <el-select
        id="upload-case-scene"
        v-model="businessScenario"
        class="v-upload__case-type-select"
        :placeholder="PLACEHOLDER.SELECT"
        clearable
      >
        <el-option
          v-for="opt in businessScenarioOptionsList"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <div v-if="!isSupplementMode" class="v-upload__consolidation-inline">
        <el-tooltip :content="consolidationHint" placement="top" :show-after="200">
          <div class="v-upload__consolidation-inline-trigger">
            <span class="v-upload__consolidation-label">{{ $t('upload.aiCaseLinkSwitch') }}</span>
            <el-switch v-model="aiCaseLinkEnabled" />
          </div>
        </el-tooltip>
      </div>
    </section>

    <!-- 取込エリア -->
    <section class="v-upload__section">
      <h2 class="v-upload__section-title">{{ $t('upload.sectionNew') }}</h2>
      <div class="v-upload__card">
      <div
        class="v-upload__dropzone"
        :class="{ 'is-dragover': isDragOver, 'is-processing': isDropProcessing }"
        @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @dragover.prevent="onDragOver"
        @drop.prevent="onDrop"
      >
        <el-icon class="v-upload__dropzone-icon" :size="40"><UploadFilled /></el-icon>
        <p class="v-upload__dropzone-text">
          {{ isDropProcessing ? $t('upload.dropProcessing') : $t('upload.dropHint') }}
        </p>
        <p class="v-upload__dropzone-hint">
          {{ $t('upload.dropFormats', { maxMb: MAX_FILE_MB }) }}
        </p>
        <div class="v-upload__dropzone-actions">
          <el-button type="primary" @click="openFilePicker">
            {{ $t('upload.selectFile') }}
          </el-button>
          <el-button type="primary" :icon="FolderOpened" @click="openFolderPicker">
            {{ $t('upload.selectFolder') }}
          </el-button>
          <el-button type="primary" @click="openZipPicker">{{ $t('upload.selectZip') }}</el-button>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          class="v-upload__hidden-input"
          multiple
          accept=".jpg,.jpeg,.png,.tif,.tiff,.pdf"
          @change="onFileChange"
        />
        <input
          ref="folderInputRef"
          type="file"
          class="v-upload__hidden-input"
          webkitdirectory
          multiple
          @change="onFolderChange"
        />
        <input
          ref="zipInputRef"
          type="file"
          class="v-upload__hidden-input"
          accept=".zip"
          @change="onZipChange"
        />
      </div>
      </div>
    </section>

    <!-- アップロード済ファイル -->
    <section class="v-upload__section">
      <h2 class="v-upload__section-title">{{ $t('upload.sectionStaged') }}</h2>

      <div class="v-upload__toolbar">
        <div class="v-upload__toolbar-actions">
          <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
            {{ $t('upload.runPhase1') }}
          </el-button>
          <el-button type="danger" plain :disabled="!hasSelection" @click="batchDelete">
            {{ $t('case.action.bulkDelete') }}
          </el-button>
          <p v-if="submitBlockReason" class="v-upload__submit-hint">
            <el-icon :size="16"><WarningFilled /></el-icon>
            {{ submitBlockReason }}
          </p>
        </div>
        <p class="v-upload__summary">
          {{ $t('upload.totalFiles', { count: totalFileCount }) }}
        </p>
        <p class="v-upload__notice">
          <el-icon :size="16"><InfoFilled /></el-icon>
          {{ $t('upload.autoClearNotice') }}
        </p>
      </div>

      <el-card shadow="never" class="v-upload__table-card">
        <el-table
          :data="stagedFiles"
          class="v-upload__file-table"
          size="small"
          style="width: 100%"
          :empty-text="$t('common.noData')"
          @selection-change="(rows: StagedFile[]) => (selectedFileIds = rows.map((r) => r.id))"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column
            prop="fileName"
            :label="$t('fields.fileName')"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column :label="$t('fields.fileSize')" width="148" align="right">
            <template #default="{ row }">{{ formatSize(row.size) }}</template>
          </el-table-column>
          <el-table-column prop="ext" :label="$t('fields.format')" width="100" align="center" />
          <el-table-column :label="$t('common.action')" width="100" align="center">
            <template #default="{ row }">
              <UploadStagedFileRowActions
                @preview="openPreview(row)"
                @delete="handleDeleteFile(row)"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>

    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFile?.fileName ?? $t('fields.filePreview')"
      width="min(920px, 92vw)"
      class="v-upload__preview-dialog"
      destroy-on-close
      @closed="closePreview"
    >
      <div class="v-upload__preview-body">
        <DocumentPreviewMedia
          v-if="previewFile"
          :key="previewFile.id"
          fill
          :media-url="CASE_FILE_PREVIEW_URL"
          :title="previewFile.fileName"
        />
      </div>
    </el-dialog>

    <footer class="v-upload__footer">
      <div class="v-upload__footer-actions">
        <el-button @click="goBack">{{ $t('case.action.close') }}</el-button>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.v-upload {
  &--has-footer {
    padding-bottom: var(--app-action-bar-height);
  }

  &__title {
    margin: 0 0 var(--app-page-gap);
    font-size: var(--app-font-size-title);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__supplement-alert {
    margin: -8px 0 var(--app-page-gap);
  }

  &__case-type {
    display: flex;
    align-items: center;
    gap: var(--app-space-3);
    margin-bottom: var(--app-space-4);
    padding: var(--app-space-3) var(--app-space-4);
    border: 1px solid var(--border-color);
    border-radius: var(--app-card-radius);
    background: #fff;
    flex-wrap: wrap;
  }

  &__case-type-label {
    display: inline-flex;
    align-items: center;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__case-type-select {
    width: 280px;
    max-width: 100%;
  }

  &__consolidation-inline {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__consolidation-inline-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--app-space-2);
  }

  &__consolidation-label {
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__submit-hint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: #b54708;
    white-space: nowrap;
  }

  &__card {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--app-panel-padding);
  }

  &__dropzone {
    border: 1px dashed var(--border-color);
    border-radius: 12px;
    background: #f9fafb;
    padding: 32px var(--app-panel-padding);
    text-align: center;
    transition: border-color var(--transition-time-02);

    &.is-dragover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &.is-processing {
      pointer-events: none;
      opacity: 0.72;
    }
  }

  &__dropzone-icon {
    color: var(--el-color-primary);
    margin-bottom: var(--app-section-gap);
  }

  &__dropzone-text {
    margin: 0 0 8px;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__dropzone-hint {
    margin: 0 0 var(--app-page-gap);
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__dropzone-actions {
    display: flex;
    justify-content: center;
    gap: var(--app-section-gap);
    flex-wrap: wrap;
  }

  &__hidden-input {
    display: none;
  }

  &__section {
    margin-bottom: var(--app-section-gap);
  }

  &__section-title {
    margin: 0 0 8px;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: var(--app-space-3);
    margin-bottom: var(--app-space-3);
    flex-wrap: wrap;
  }

  &__toolbar-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--app-space-2);
    flex-shrink: 0;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__summary {
    margin: 0;
    flex-shrink: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
  }

  &__summary-count {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  &__notice {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 0 auto;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__table-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;

    :deep(.el-card__body) {
      padding: 0;
    }

    :deep(.el-table) {
      --el-table-header-bg-color: #f9fafb;
      font-size: var(--app-font-size-base);
    }

    :deep(.el-table th.el-table__cell .cell) {
      white-space: nowrap;
    }
  }

  &__file-table {
    :deep(.el-table__header table),
    :deep(.el-table__body table) {
      table-layout: fixed;
    }

    :deep(.el-table .el-table__cell) {
      padding: 6px 12px;
    }

    :deep(.el-table__body tr) {
      height: 36px;
    }
  }

  &__preview-body {
    height: min(72vh, 820px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  &__preview-dialog {
    :deep(.el-dialog__body) {
      padding-top: 8px;
    }
  }

  &__footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: var(--left-menu-min-width);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    box-sizing: border-box;
    min-height: var(--app-action-bar-height);
    padding: var(--app-action-bar-padding-y) var(--app-action-bar-padding-x);
    border-top: 1px solid var(--border-color);
    background: #fff;
    box-shadow: 0 -4px 12px rgb(0 0 0 / 4%);

    @media (max-width: 768px) {
      left: 0;
    }
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--app-action-bar-gap);
    flex-wrap: wrap;
  }
}
</style>
