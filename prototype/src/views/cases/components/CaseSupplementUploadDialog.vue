<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, InfoFilled, UploadFilled, WarningFilled } from '@element-plus/icons-vue'
import type { CaseListItem } from '@/mocks/cases'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import {
  collectFromDataTransfer,
  extractZipFile,
  type IngestInput
} from '@/utils/uploadIngest'
import {
  canUploadSupplementToCase,
  uploadSupplementFilesToCase
} from '@/utils/caseFileOperations'
import { CASE_FILE_PREVIEW_URL } from '@/mocks/caseFiles'
import DocumentPreviewMedia from '@/components/DocumentPreviewMedia.vue'
import UploadStagedFileRowActions from '@/views/upload/components/UploadStagedFileRowActions.vue'

interface StagedFile {
  id: string
  fileName: string
  size: number
  ext: string
}

const props = defineProps<{
  modelValue: boolean
  caseItem: CaseListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [caseId: string]
}>()

const { t } = useI18n()

const folderInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const zipInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isDropProcessing = ref(false)
const dragDepth = ref(0)
const stagedFiles = ref<StagedFile[]>([])
const selectedFileIds = ref<string[]>([])
const previewDialogVisible = ref(false)
const previewFile = ref<StagedFile | null>(null)

const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'pdf']
const MAX_FILE_MB = 50

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const totalFileCount = computed(() => stagedFiles.value.length)
const hasUploadedFiles = computed(() => stagedFiles.value.length > 0)
const canSubmit = computed(
  () => hasUploadedFiles.value && canUploadSupplementToCase(props.caseItem ?? undefined)
)
const submitBlockReason = computed(() => {
  if (!canUploadSupplementToCase(props.caseItem ?? undefined)) {
    return t('upload.supplementInvalidCase')
  }
  if (!hasUploadedFiles.value) return t('upload.blockUploadFiles')
  return ''
})
const hasSelection = computed(() => selectedFileIds.value.length > 0)

function resetState() {
  stagedFiles.value = []
  selectedFileIds.value = []
  isDragOver.value = false
  isDropProcessing.value = false
  dragDepth.value = 0
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) resetState()
  }
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

  for (const { file } of inputs) {
    const ext = getExt(file.name)

    if (!ACCEPT_EXT.includes(ext)) {
      rejectedFormat = true
      continue
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      rejectedSize = true
      continue
    }

    next.push({
      id: uid(),
      fileName: file.name,
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

function ingestFileList(fileList: FileList) {
  const inputs: IngestInput[] = Array.from(fileList).map((file) => ({
    file,
    relativePath:
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
  }))
  ingestInputs(inputs)
}

function openFolderPicker() {
  folderInputRef.value?.click()
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function openZipPicker() {
  zipInputRef.value?.click()
}

function onFolderChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) ingestFileList(input.files)
  input.value = ''
}

function onFileChange(e: Event) {
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
  if (!props.caseItem || !stagedFiles.value.length) return
  if (!canUploadSupplementToCase(props.caseItem)) {
    ElMessage.warning(t('upload.supplementInvalidCase'))
    return
  }

  const fileCount = stagedFiles.value.length
  const caseId = props.caseItem.caseId

  await ElMessageBox.confirm(
    t('upload.supplementConfirmDetail', { caseId, count: fileCount }),
    t('upload.confirmUpload'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'info'
    }
  )

  const uploaded = uploadSupplementFilesToCase(
    caseId,
    stagedFiles.value.map((file) => ({
      fileName: file.fileName,
      size: file.size,
      ext: file.ext
    }))
  )

  if (!uploaded) {
    ElMessage.warning(t('upload.supplementInvalidCase'))
    return
  }

  ElMessage.success(t('upload.supplementSubmitSuccess', { caseId, count: fileCount }))
  visible.value = false
  emit('success', caseId)
}

function handleClose() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="$t('page.upload.supplementTitle')"
    width="min(920px, 92vw)"
    class="v-case-supplement-upload-dialog"
    destroy-on-close
    @closed="resetState"
  >
    <el-alert
      v-if="caseItem"
      class="v-case-supplement-upload-dialog__alert"
      type="info"
      :closable="false"
      show-icon
    >
      {{ $t('page.upload.supplementAlert', { caseId: caseItem.caseId }) }}
    </el-alert>

    <section class="v-case-supplement-upload-dialog__section">
      <div
        class="v-case-supplement-upload-dialog__dropzone"
        :class="{ 'is-dragover': isDragOver, 'is-processing': isDropProcessing }"
        @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @dragover.prevent="onDragOver"
        @drop.prevent="onDrop"
      >
        <el-icon class="v-case-supplement-upload-dialog__dropzone-icon" :size="36">
          <UploadFilled />
        </el-icon>
        <p class="v-case-supplement-upload-dialog__dropzone-text">
          {{ isDropProcessing ? $t('upload.dropProcessing') : $t('upload.dropHint') }}
        </p>
        <p class="v-case-supplement-upload-dialog__dropzone-hint">
          {{ $t('upload.dropFormats', { maxMb: MAX_FILE_MB }) }}
        </p>
        <div class="v-case-supplement-upload-dialog__dropzone-actions">
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
          class="v-case-supplement-upload-dialog__hidden-input"
          multiple
          accept=".jpg,.jpeg,.png,.tif,.tiff,.pdf"
          @change="onFileChange"
        />
        <input
          ref="folderInputRef"
          type="file"
          class="v-case-supplement-upload-dialog__hidden-input"
          webkitdirectory
          multiple
          @change="onFolderChange"
        />
        <input
          ref="zipInputRef"
          type="file"
          class="v-case-supplement-upload-dialog__hidden-input"
          accept=".zip"
          @change="onZipChange"
        />
      </div>
    </section>

    <section class="v-case-supplement-upload-dialog__section">
      <div class="v-case-supplement-upload-dialog__toolbar">
        <div class="v-case-supplement-upload-dialog__toolbar-actions">
          <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
            {{ $t('upload.confirmUpload') }}
          </el-button>
          <el-button type="danger" plain :disabled="!hasSelection" @click="batchDelete">
            {{ $t('case.action.bulkDelete') }}
          </el-button>
          <p v-if="submitBlockReason" class="v-case-supplement-upload-dialog__submit-hint">
            <el-icon :size="16"><WarningFilled /></el-icon>
            {{ submitBlockReason }}
          </p>
        </div>
        <p class="v-case-supplement-upload-dialog__summary">
          {{ $t('upload.totalFiles', { count: totalFileCount }) }}
        </p>
        <p class="v-case-supplement-upload-dialog__notice">
          <el-icon :size="16"><InfoFilled /></el-icon>
          {{ $t('upload.autoClearNotice') }}
        </p>
      </div>

      <el-table
        :data="stagedFiles"
        class="v-case-supplement-upload-dialog__file-table"
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
    </section>

    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFile?.fileName ?? $t('fields.filePreview')"
      width="min(920px, 92vw)"
      class="v-case-supplement-upload-dialog__preview-dialog"
      destroy-on-close
      append-to-body
      @closed="closePreview"
    >
      <div class="v-case-supplement-upload-dialog__preview-body">
        <DocumentPreviewMedia
          v-if="previewFile"
          :key="previewFile.id"
          fill
          :media-url="CASE_FILE_PREVIEW_URL"
          :title="previewFile.fileName"
        />
      </div>
    </el-dialog>

    <template #footer>
      <el-button @click="handleClose">{{ $t('case.action.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.v-case-supplement-upload-dialog {
  &__alert {
    margin-bottom: var(--app-space-4);
  }

  &__section + &__section {
    margin-top: var(--app-space-4);
  }

  &__dropzone {
    border: 1px dashed var(--border-color);
    border-radius: 12px;
    background: #f9fafb;
    padding: 24px var(--app-panel-padding);
    text-align: center;
    transition: border-color var(--transition-time-02);

    &.is-dragover {
      border-color: var(--el-color-primary);
      background: #f0f7ff;
    }

    &.is-processing {
      opacity: 0.75;
      pointer-events: none;
    }
  }

  &__dropzone-icon {
    color: var(--el-color-primary);
    margin-bottom: 8px;
  }

  &__dropzone-text {
    margin: 0 0 6px;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__dropzone-hint {
    margin: 0 0 16px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__dropzone-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  &__hidden-input {
    display: none;
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__submit-hint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: #b54708;
  }

  &__summary,
  &__notice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__file-table {
    border: 1px solid var(--border-color);
    border-radius: 8px;

    :deep(.el-table__header table),
    :deep(.el-table__body table) {
      table-layout: fixed;
    }

    :deep(.el-table .el-table__cell) {
      padding: 6px 12px;
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
}
</style>
