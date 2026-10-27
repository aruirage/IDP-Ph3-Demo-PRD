<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import type { CaseListItem } from '@/mocks/cases'
import {
  canModifyCaseFiles,
  removeFileFromCase
} from '@/utils/caseFileOperations'
import { orderCaseFilesForNavigation } from '@/utils/caseFileNavigation'
import CaseFileExplorerTree from './CaseFileExplorerTree.vue'
import CaseFileImageViewer from './CaseFileImageViewer.vue'

const props = defineProps<{
  caseItem: CaseListItem
}>()

const { t } = useI18n()

const activeFileId = ref<string | null>(null)

const files = computed(() => props.caseItem.files)

const navigableFiles = computed(() => orderCaseFilesForNavigation(files.value))

const activeFile = computed(
  () => navigableFiles.value.find((file) => file.id === activeFileId.value) ?? null
)

const activeIndex = computed(() =>
  navigableFiles.value.findIndex((file) => file.id === activeFileId.value)
)

const canDelete = computed(() => canModifyCaseFiles(props.caseItem))

function syncActiveFile() {
  if (!navigableFiles.value.length) {
    activeFileId.value = null
    return
  }
  const currentExists = navigableFiles.value.some((file) => file.id === activeFileId.value)
  if (activeFileId.value == null || !currentExists) {
    activeFileId.value = navigableFiles.value[0]?.id ?? null
  }
}

watch(navigableFiles, syncActiveFile, { immediate: true })

watch(
  () => props.caseItem.caseId,
  () => {
    activeFileId.value = null
    syncActiveFile()
  }
)

onMounted(() => {
  syncActiveFile()
})

function selectFile(fileId: string) {
  activeFileId.value = fileId
}

function selectPrev() {
  if (activeIndex.value <= 0) return
  activeFileId.value = navigableFiles.value[activeIndex.value - 1]?.id ?? null
}

function selectNext() {
  if (activeIndex.value < 0 || activeIndex.value >= navigableFiles.value.length - 1) return
  activeFileId.value = navigableFiles.value[activeIndex.value + 1]?.id ?? null
}

async function handleDelete() {
  if (!activeFile.value || !canDelete.value) return

  const file = activeFile.value
  await ElMessageBox.confirm(
    t('case.message.deleteFileWithImpactConfirm', { fileName: file.fileName }),
    t('case.action.delete'),
    { ...MESSAGE_BOX_CONFIRM_DEFAULTS, type: 'warning' }
  )

  const deletedId = file.id
  if (removeFileFromCase(props.caseItem.caseId, deletedId)) {
    props.caseItem.fileCount = props.caseItem.files.length
    syncActiveFile()
    ElMessage.success(t('upload.deleteSuccess'))
  }
}
</script>

<template>
  <div class="v-case-detail-files">
    <div v-if="files.length" class="v-case-detail-files__workspace">
      <aside class="v-case-detail-files__tree">
        <CaseFileExplorerTree
          :root-label="caseItem.casePrimaryKey || caseItem.caseId"
          :files="files"
          :active-file-id="activeFileId"
          @select="selectFile"
        />
      </aside>

      <section v-if="activeFile" class="v-case-detail-files__preview">
        <CaseFileImageViewer
          :image-url="activeFile.previewUrl"
          :page-count="activeFile.pageCount"
          :show-navigation="navigableFiles.length > 1"
          :can-go-prev="activeIndex > 0"
          :can-go-next="activeIndex >= 0 && activeIndex < navigableFiles.length - 1"
          @prev="selectPrev"
          @next="selectNext"
        >
          <template v-if="canDelete" #actions>
            <el-button type="danger" plain size="small" @click="handleDelete">
              {{ $t('case.action.delete') }}
            </el-button>
          </template>
        </CaseFileImageViewer>
      </section>
    </div>

    <el-empty v-else :description="$t('case.message.noFiles')" />
  </div>
</template>

<style scoped lang="scss">
.v-case-detail-files {
  height: 100%;
  min-height: 0;

  &__workspace {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--app-page-gap);
    height: 100%;
    min-height: 0;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
  }

  &__tree {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--app-panel-padding);
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__preview {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>
